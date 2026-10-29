const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXT = { "\f": 0x0a, "^": 0x14, "{": 0x28, "}": 0x29, "\\": 0x2f, "[": 0x3c, "~": 0x3d, "]": 0x3e, "|": 0x40, "€": 0x65 };
const GSM7_EXT_REV = Object.fromEntries(Object.entries(GSM7_EXT).map(([k, v]) => [v, k]));

const hex2 = (n) => n.toString(16).toUpperCase().padStart(2, "0");

export function gsm7Septets(text) {
  const out = [];
  for (const ch of text) {
    const i = GSM7_BASIC.indexOf(ch);
    if (i >= 0 && i !== 27) out.push([i]);
    else if (ch in GSM7_EXT) out.push([27, GSM7_EXT[ch]]);
    else return null;
  }
  return out;
}

function packSeptets(septets) {
  const bytes = [];
  let acc = 0;
  let bits = 0;
  for (const s of septets) {
    acc |= (s & 0x7f) << bits;
    bits += 7;
    while (bits >= 8) {
      bytes.push(acc & 0xff);
      acc >>= 8;
      bits -= 8;
    }
  }
  if (bits > 0) bytes.push(acc & 0xff);
  return bytes;
}

function unpackSeptets(bytes, count) {
  const out = [];
  let acc = 0;
  let bits = 0;
  for (const b of bytes) {
    acc |= b << bits;
    bits += 8;
    while (bits >= 7 && out.length < count) {
      out.push(acc & 0x7f);
      acc >>= 7;
      bits -= 7;
    }
  }
  return out;
}

function encodeAddress(number) {
  const intl = number.trim().startsWith("+");
  const digits = number.replace(/\D/g, "");
  const padded = digits.length % 2 ? digits + "F" : digits;
  let swapped = "";
  for (let i = 0; i < padded.length; i += 2) swapped += padded[i + 1] + padded[i];
  return hex2(digits.length) + (intl ? "91" : "81") + swapped;
}

function splitGsm7(chars, perPart) {
  const parts = [];
  let cur = [];
  let len = 0;
  for (const c of chars) {
    if (len + c.length > perPart) {
      parts.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(...c);
    len += c.length;
  }
  if (cur.length) parts.push(cur);
  return parts;
}

function splitUcs2(text, perPart) {
  const units = [];
  for (const ch of text) units.push(ch);
  const parts = [];
  let cur = "";
  for (const ch of units) {
    if (cur.length + ch.length > perPart) {
      parts.push(cur);
      cur = "";
    }
    cur += ch;
  }
  if (cur) parts.push(cur);
  return parts;
}

/** SMS-SUBMIT PDU'ları üretir (gerekirse çok parçalı/concatenated). Dönüş: [{ pdu, tpduLength }] */
export function encodeSubmitPdus(number, text, ref = Math.floor(Math.random() * 256)) {
  const chars = gsm7Septets(text);
  const da = encodeAddress(number);
  const build = (udhi, dcs, udl, ud) => {
    const tpdu = hex2(udhi ? 0x41 : 0x01) + "00" + da + "00" + hex2(dcs) + hex2(udl) + ud;
    return { pdu: "00" + tpdu, tpduLength: tpdu.length / 2 };
  };
  const udh = (total, seq) => [0x05, 0x00, 0x03, ref & 0xff, total, seq];

  if (chars) {
    const flat = chars.flat();
    if (flat.length <= 160) return [build(false, 0x00, flat.length, packSeptets(flat).map(hex2).join(""))];
    const parts = splitGsm7(chars, 153);
    return parts.map((septets, i) => {
      const bytes = packSeptets([0, 0, 0, 0, 0, 0, 0, ...septets]);
      udh(parts.length, i + 1).forEach((b, j) => (bytes[j] = b));
      return build(true, 0x00, 7 + septets.length, bytes.map(hex2).join(""));
    });
  }

  const ucs2Hex = (s) => Array.from({ length: s.length }, (_, i) => s.charCodeAt(i).toString(16).toUpperCase().padStart(4, "0")).join("");
  if (text.length <= 70) return [build(false, 0x08, text.length * 2, ucs2Hex(text))];
  const parts = splitUcs2(text, 67);
  return parts.map((p, i) => build(true, 0x08, 6 + p.length * 2, udh(parts.length, i + 1).map(hex2).join("") + ucs2Hex(p)));
}

/** SMS-DELIVER PDU'sunu çözer. Dönüş: { from, text, concat?: { ref, total, seq } } */
export function decodeDeliverPdu(hex) {
  const b = hex.match(/../g).map((h) => parseInt(h, 16));
  let i = 1 + b[0];
  const first = b[i++];
  const udhi = (first & 0x40) !== 0;
  const oaLen = b[i++];
  const oaType = b[i++];
  const oaBytes = b.slice(i, i + Math.ceil(oaLen / 2));
  i += Math.ceil(oaLen / 2);
  let from;
  if ((oaType & 0x70) === 0x50) {
    from = unpackSeptets(oaBytes, Math.floor((oaLen * 4) / 7)).map((s) => GSM7_BASIC[s] ?? "?").join("");
  } else {
    from = oaBytes.map((x) => (x & 0x0f).toString() + (x >> 4 === 0x0f ? "" : (x >> 4).toString())).join("").slice(0, oaLen);
    if ((oaType & 0x70) === 0x10) from = "+" + from;
  }
  i++;
  const dcs = b[i++];
  i += 7;
  const udl = b[i++];
  const ud = b.slice(i);
  let concat;
  let udhLen = 0;
  if (udhi) {
    udhLen = ud[0] + 1;
    let j = 1;
    while (j < udhLen) {
      const iei = ud[j];
      const len = ud[j + 1];
      if (iei === 0x00) concat = { ref: ud[j + 2], total: ud[j + 3], seq: ud[j + 4] };
      if (iei === 0x08) concat = { ref: (ud[j + 2] << 8) | ud[j + 3], total: ud[j + 4], seq: ud[j + 5] };
      j += 2 + len;
    }
  }
  const alphabet = (dcs & 0xc0) === 0 ? (dcs >> 2) & 0x03 : (dcs & 0xf0) === 0xf0 ? (dcs >> 2) & 0x01 : 0;
  let text = "";
  if (alphabet === 2) {
    const body = ud.slice(udhLen, udl);
    for (let k = 0; k + 1 < body.length; k += 2) text += String.fromCharCode((body[k] << 8) | body[k + 1]);
  } else if (alphabet === 0) {
    const skip = udhi ? Math.ceil((udhLen * 8) / 7) : 0;
    const septets = unpackSeptets(ud, udl).slice(skip);
    for (let k = 0; k < septets.length; k++) {
      if (septets[k] === 27 && k + 1 < septets.length) text += GSM7_EXT_REV[septets[++k]] ?? "";
      else text += GSM7_BASIC[septets[k]];
    }
  } else {
    text = Buffer.from(ud.slice(udhLen, udl)).toString("latin1");
  }
  return { from, text, concat };
}
