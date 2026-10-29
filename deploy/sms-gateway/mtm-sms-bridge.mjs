#!/usr/bin/env node
// MakeTheMenu SMS Gateway Bridge — kendi SMS altyapımızın cihaz tarafı.
// Sürücüler:
//   modem    : USB GSM modem / SIM800 / Huawei vb. (AT komutları, PDU modu, Türkçe + çok parçalı SMS)
//   termux   : Android telefon (Termux + Termux:API uygulaması, termux-sms-send / termux-sms-list)
//   simulate : Gerçek SMS göndermez; uçtan uca test içindir.
//
// Kullanım:
//   node mtm-sms-bridge.mjs --url https://www.makethemenu.com --pair 123456 --driver modem --port /dev/ttyUSB0
//   node mtm-sms-bridge.mjs --driver termux            (ilk eşleştirmeden sonra jeton durum dosyasındadır)
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFile } from "node:child_process";
import { encodeSubmitPdus, decodeDeliverPdu } from "./pdu.mjs";

const VERSION = "1.0.0";

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const key = a.slice(2);
    const next = argv[i + 1];
    if (next === undefined || next.startsWith("--")) out[key] = "true";
    else out[key] = argv[++i];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const opt = (k, env, def) => args[k] ?? process.env[env] ?? def;
const STATE_FILE = opt("state", "MTM_STATE_FILE", path.join(os.homedir(), ".mtm-sms-bridge.json"));
const DRIVER = opt("driver", "MTM_DRIVER", "simulate");
const SEND_GAP_MS = Number(opt("gap", "MTM_SEND_GAP_MS", "1500"));
const ONCE = args.once === "true";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...m) => console.log(new Date().toISOString(), ...m);

function loadState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, "utf8")); } catch { return {}; }
}
function saveState(s) {
  fs.writeFileSync(STATE_FILE, JSON.stringify(s, null, 2), { mode: 0o600 });
}

const state = loadState();
const BASE_URL = (opt("url", "MTM_BASE_URL", state.baseUrl || "https://www.makethemenu.com")).replace(/\/$/, "");

async function api(method, p, body, token = state.deviceToken) {
  const res = await fetch(BASE_URL + p, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { "X-Device-Token": token } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text.slice(0, 200) }; }
  if (res.status === 401) {
    const err = new Error("Jeton geçersiz veya cihaz iptal edildi. Panelden yeni eşleştirme kodu alıp --pair ile yeniden eşleştirin.");
    err.fatal = true;
    throw err;
  }
  if (!res.ok) throw new Error(`${method} ${p} -> ${res.status} ${data.message ?? ""}`);
  return data;
}

// ── Sürücüler ───────────────────────────────────────────────────────────────
function simulateDriver() {
  return {
    async init() { log("[simulate] Gerçek SMS gönderilmeyecek."); },
    async info() { return { operator: "SIMULATE", battery: 100, signal: 100 }; },
    async send(to, text) {
      if (/^\+?0+$/.test(to.replace(/\s/g, ""))) throw Object.assign(new Error("Geçersiz numara"), { permanent: true });
      log(`[simulate] -> ${to}: ${text.slice(0, 60)}`);
    },
    async readInbound() { return []; },
  };
}

function run(cmd, cmdArgs, timeout = 60000) {
  return new Promise((resolve, reject) => {
    execFile(cmd, cmdArgs, { timeout }, (err, stdout, stderr) => {
      if (err) reject(new Error((stderr || err.message).toString().trim().slice(0, 200)));
      else resolve(stdout.toString());
    });
  });
}

function termuxDriver() {
  const seen = new Set(state.termuxSeen ?? []);
  let primed = Boolean(state.termuxSeen);
  const keyOf = (m) => String(m._id ?? `${m.number}|${m.received}|${m.body}`);
  return {
    async init() {
      await run("termux-sms-list", ["-l", "1"]).catch((e) => {
        throw new Error(`termux-api erişilemiyor (Termux:API uygulaması ve 'pkg install termux-api' gerekli; SMS izni verilmeli): ${e.message}`);
      });
    },
    async info() {
      const out = {};
      try { out.battery = JSON.parse(await run("termux-battery-status", [], 10000)).percentage; } catch {}
      try {
        const d = JSON.parse(await run("termux-telephony-deviceinfo", [], 10000));
        out.operator = d.network_operator_name || d.sim_operator_name;
      } catch {}
      return out;
    },
    async send(to, text) {
      await run("termux-sms-send", ["-n", to, text]);
    },
    async readInbound() {
      const list = JSON.parse(await run("termux-sms-list", ["-t", "inbox", "-l", "50"]));
      const fresh = [];
      for (const m of list) {
        const k = keyOf(m);
        if (seen.has(k)) continue;
        seen.add(k);
        if (primed) fresh.push({ from: m.number, text: m.body, externalId: `termux-${k}`.slice(0, 64) });
      }
      primed = true;
      state.termuxSeen = [...seen].slice(-500);
      saveState(state);
      return fresh;
    },
  };
}

function modemDriver() {
  const portPath = opt("port", "MTM_MODEM_PORT", process.platform === "win32" ? "COM3" : "/dev/ttyUSB0");
  const baudRate = Number(opt("baud", "MTM_MODEM_BAUD", "115200"));
  const pin = opt("pin", "MTM_SIM_PIN", "");
  let port;
  let buffer = "";
  let chain = Promise.resolve();
  const partial = new Map();

  const waitFor = (re, timeout) => new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      const m = buffer.match(re);
      if (m) return resolve(m);
      if (/\r\n(ERROR|\+CM[SE] ERROR:[^\r]*)\r\n/.test(buffer)) return reject(new Error(buffer.match(/(ERROR|\+CM[SE] ERROR:[^\r]*)/)[0]));
      if (Date.now() - start > timeout) return reject(new Error(`Modem zaman aşımı: ${buffer.trim().slice(-120)}`));
      setTimeout(tick, 50);
    };
    tick();
  });

  const at = (cmd, timeout = 10000) => {
    const job = chain.then(async () => {
      buffer = "";
      port.write(cmd + "\r");
      await waitFor(/\r\nOK\r\n/, timeout);
      return buffer;
    });
    chain = job.catch(() => {});
    return job;
  };

  const sendPdu = (pdu, tpduLength) => {
    const job = chain.then(async () => {
      buffer = "";
      port.write(`AT+CMGS=${tpduLength}\r`);
      await waitFor(/>\s?$/, 10000);
      buffer = "";
      port.write(pdu + "\x1a");
      await waitFor(/\+CMGS:\s*\d+[\s\S]*\r\nOK\r\n/, 90000);
    });
    chain = job.catch(() => {});
    return job;
  };

  return {
    async init() {
      let SerialPort;
      try {
        ({ SerialPort } = await import("serialport"));
      } catch {
        throw new Error("'serialport' paketi gerekli: bu klasörde 'npm install serialport' çalıştırın.");
      }
      port = new SerialPort({ path: portPath, baudRate });
      await new Promise((resolve, reject) => port.once("open", resolve).once("error", reject));
      port.on("data", (d) => { buffer += d.toString("latin1"); });
      await at("ATE0");
      const cpin = await at("AT+CPIN?");
      if (/SIM PIN/.test(cpin)) {
        if (!pin) throw new Error("SIM PIN istiyor: --pin ile verin.");
        await at(`AT+CPIN="${pin}"`, 20000);
        await sleep(5000);
      }
      await at("AT+CMGF=0");
      await at("AT+CPMS=\"SM\",\"SM\",\"SM\"").catch(() => {});
      log(`[modem] ${portPath} hazır (${baudRate} baud).`);
    },
    async info() {
      const out = {};
      try {
        const csq = (await at("AT+CSQ")).match(/\+CSQ:\s*(\d+)/);
        if (csq && Number(csq[1]) !== 99) out.signal = Math.round((Number(csq[1]) / 31) * 100);
      } catch {}
      try {
        const cops = (await at("AT+COPS?")).match(/\+COPS:\s*\d+,\d+,"([^"]+)"/);
        if (cops) out.operator = cops[1];
      } catch {}
      try {
        const cnum = (await at("AT+CNUM")).match(/\+CNUM:\s*"[^"]*","([^"]+)"/);
        if (cnum) out.simNumber = cnum[1];
      } catch {}
      return out;
    },
    async send(to, text) {
      const pdus = encodeSubmitPdus(to, text);
      for (const { pdu, tpduLength } of pdus) {
        try {
          await sendPdu(pdu, tpduLength);
        } catch (e) {
          const code = Number((e.message.match(/CMS ERROR:\s*(\d+)/) ?? [])[1]);
          throw Object.assign(e, { permanent: [1, 21, 28, 38, 96, 304, 305].includes(code) });
        }
      }
    },
    async readInbound() {
      const out = await at("AT+CMGL=4", 20000);
      const re = /\+CMGL:\s*(\d+),[^\r\n]*\r\n([0-9A-Fa-f]+)/g;
      const ready = [];
      let m;
      while ((m = re.exec(out))) {
        const idx = m[1];
        try {
          const d = decodeDeliverPdu(m[2]);
          if (d.concat && d.concat.total > 1) {
            const key = `${d.from}|${d.concat.ref}`;
            const entry = partial.get(key) ?? { from: d.from, total: d.concat.total, parts: {} };
            entry.parts[d.concat.seq] = d.text;
            partial.set(key, entry);
            if (Object.keys(entry.parts).length === entry.total) {
              partial.delete(key);
              ready.push({ from: entry.from, text: Array.from({ length: entry.total }, (_, i) => entry.parts[i + 1]).join("") });
            }
          } else {
            ready.push({ from: d.from, text: d.text });
          }
        } catch (e) {
          log(`[modem] PDU çözülemedi (#${idx}): ${e.message}`);
        }
        await at(`AT+CMGD=${idx}`).catch(() => {});
      }
      return ready;
    },
  };
}

const drivers = { simulate: simulateDriver, termux: termuxDriver, modem: modemDriver };

// ── Ana döngü ───────────────────────────────────────────────────────────────
async function pairIfNeeded(driver) {
  const code = opt("pair", "MTM_PAIRING_CODE", "");
  if (state.deviceToken && !code) return;
  if (!code) throw new Error("İlk çalıştırmada --pair <6 haneli kod> gerekli (Admin > SMS > SMS Gateway Cihazları).");
  const info = await driver.info().catch(() => ({}));
  const res = await api("POST", "/api/sms-gateway/pair", { pairingCode: String(code), appVersion: `bridge-${VERSION}-${DRIVER}`, ...info }, null);
  state.deviceToken = res.deviceToken;
  state.deviceId = res.deviceId;
  state.baseUrl = BASE_URL;
  saveState(state);
  log(`Eşleştirildi: cihaz #${res.deviceId} (${res.name}). Jeton ${STATE_FILE} dosyasına kaydedildi.`);
}

async function heartbeat(driver) {
  const info = await driver.info().catch(() => ({}));
  return api("POST", "/api/sms-gateway/heartbeat", { appVersion: `bridge-${VERSION}-${DRIVER}`, ...info });
}

async function processBatch(driver) {
  const { jobs, pollAfterMs } = await api("POST", "/api/sms-gateway/jobs/claim", { max: 5 });
  for (const job of jobs) {
    try {
      await driver.send(job.to, job.text);
      await api("POST", `/api/sms-gateway/jobs/${job.id}/result`, { status: "sent" });
      log(`#${job.id} gönderildi -> ${job.to}`);
    } catch (e) {
      if (e.fatal) throw e;
      log(`#${job.id} başarısız: ${e.message}`);
      await api("POST", `/api/sms-gateway/jobs/${job.id}/result`, { status: "failed", error: e.message.slice(0, 250), permanent: Boolean(e.permanent) }).catch(() => {});
    }
    await sleep(SEND_GAP_MS);
  }
  return { count: jobs.length, pollAfterMs: pollAfterMs ?? 5000 };
}

async function forwardInbound(driver) {
  const msgs = await driver.readInbound();
  for (const m of msgs) {
    await api("POST", "/api/sms-gateway/inbound", { from: m.from, text: m.text, externalId: m.externalId });
    log(`Gelen SMS iletildi: ${m.from}`);
  }
}

async function main() {
  const factory = drivers[DRIVER];
  if (!factory) throw new Error(`Bilinmeyen sürücü: ${DRIVER} (modem | termux | simulate)`);
  const driver = factory();
  await driver.init();
  await pairIfNeeded(driver);
  await heartbeat(driver);
  log(`Bridge çalışıyor: ${BASE_URL} (sürücü: ${DRIVER})`);

  let lastBeat = Date.now();
  let lastInbound = 0;
  let backoff = 1000;
  for (;;) {
    try {
      const { count, pollAfterMs } = await processBatch(driver);
      if (Date.now() - lastBeat > 60000) { await heartbeat(driver); lastBeat = Date.now(); }
      if (Date.now() - lastInbound > 15000) { await forwardInbound(driver); lastInbound = Date.now(); }
      backoff = 1000;
      if (ONCE) return;
      await sleep(count ? Math.min(pollAfterMs, 1000) : pollAfterMs);
    } catch (e) {
      if (e.fatal) throw e;
      log(`Hata: ${e.message} — ${Math.round(backoff / 1000)} sn sonra tekrar denenecek`);
      if (ONCE) throw e;
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 60000);
    }
  }
}

main().catch((e) => {
  console.error(new Date().toISOString(), "Durduruldu:", e.message);
  process.exitCode = 1;
});
