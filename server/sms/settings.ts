import { eq } from "drizzle-orm";
import { db } from "../db";
import { platformSettings } from "@shared/schema";
import { encryptJson, decryptJson } from "../integrations/crypto";
import { setDynamicSmsConfig, type SmsProviderConfig } from "./transport";
import { resetSmsTransportCache } from "./index";

const KEY = "sms_provider_config";

export async function hydrateSmsConfig(): Promise<void> {
  try {
    const [row] = await db.select().from(platformSettings).where(eq(platformSettings.settingKey, KEY)).limit(1);
    const config = decryptJson<SmsProviderConfig>(row?.value);
    if (config?.provider) {
      setDynamicSmsConfig(config);
      resetSmsTransportCache();
      console.log(`[sms] Kayıtlı sağlayıcı yapılandırması yüklendi: ${config.provider}`);
    }
  } catch (e: any) {
    console.warn("[sms] Kayıtlı sağlayıcı yapılandırması okunamadı:", e?.code ?? e?.message);
  }
}

export async function persistSmsConfig(config: SmsProviderConfig): Promise<void> {
  const value = encryptJson(config);
  await db
    .insert(platformSettings)
    .values({ settingKey: KEY, value, updatedAt: new Date() })
    .onDuplicateKeyUpdate({ set: { value, updatedAt: new Date() } });
  setDynamicSmsConfig(config);
  resetSmsTransportCache();
}
