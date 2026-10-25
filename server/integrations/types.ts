/**
 * Entegrasyon Merkezi — ortak adapter arayüzü.
 *
 * KURAL (prompt-2 §12/§15): Bir yetenek (capability) bir sağlayıcıda bulunmuyorsa
 * asla uydurulmaz. Adapter yalnızca gerçekten uyguladığı fonksiyonları implement eder
 * ve getCapabilities() ile bildirir. Gerçek API erişimi olmayan sağlayıcılar
 * `implemented: false` ile kayıt defterinde "Henüz geliştirilmedi" durumundadır.
 */

export interface AdapterCredentials {
  [key: string]: string | undefined;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  /** Sağlayıcıdan dönen ham özet (hassas alanlar temizlenmiş) */
  detail?: Record<string, unknown>;
}

export interface InternalOrder {
  externalOrderId: string;
  status: string; // received | accepted | preparing | ready | out_for_delivery | delivered | cancelled
  items: Array<{ name: string; quantity: number; price?: number; variants?: string[] }>;
  total?: number;
  currency?: string; // default TRY
  paymentStatus?: string;
  deliveryMethod?: string;
  customerName?: string;
  customerPhone?: string;
  note?: string;
  providerMetadata?: Record<string, unknown>;
}

export type IntegrationEventType =
  | "order.created"
  | "order.updated"
  | "order.accepted"
  | "order.ready"
  | "order.delivered"
  | "payment.completed"
  | "payment.refunded"
  | "customer.created"
  | "invoice.created"
  | "inventory.updated"
  | "integration.sync.completed"
  | "integration.connection.tested";

export const ALL_EVENT_TYPES: IntegrationEventType[] = [
  "order.created",
  "order.updated",
  "order.accepted",
  "order.ready",
  "order.delivered",
  "payment.completed",
  "payment.refunded",
  "customer.created",
  "invoice.created",
  "inventory.updated",
  "integration.sync.completed",
  "integration.connection.tested",
];

export type AdapterCapability =
  | "testConnection"
  | "getCapabilities"
  | "fetchOrders"
  | "acknowledgeOrder"
  | "updateOrderStatus"
  | "fetchCustomers"
  | "syncPayments"
  | "createInvoice"
  | "syncInventory"
  | "registerWebhook"
  | "healthCheck"
  | "receiveWebhook";

export interface IntegrationAdapter {
  /** Bu adapter gerçekten geliştirildi mi? false ise yalnızca katalog iskeleti. */
  implemented: boolean;
  capabilities: AdapterCapability[];
  /** Bağlantı için gereken credential alanları (form şeması) */
  credentialFields: Array<{
    key: string;
    label: string;
    type: "text" | "password" | "select";
    required: boolean;
    options?: string[];
    help?: string;
  }>;
  /** Sağlayıcı API dokümantasyonu / erişim gereksinimleri (prompt-2 §15) */
  docs: {
    apiDocsUrl?: string;
    sandboxAvailable: boolean;
    requiresPartnerAgreement: boolean;
    notes: string;
  };
  testConnection?(restaurantId: number, creds: AdapterCredentials): Promise<ConnectionTestResult>;
  fetchOrders?(restaurantId: number, creds: AdapterCredentials): Promise<InternalOrder[]>;
  acknowledgeOrder?(restaurantId: number, creds: AdapterCredentials, externalOrderId: string): Promise<void>;
  updateOrderStatus?(restaurantId: number, creds: AdapterCredentials, externalOrderId: string, status: string): Promise<void>;
  syncInventory?(restaurantId: number, creds: AdapterCredentials): Promise<Record<string, unknown>>;
  createInvoice?(restaurantId: number, creds: AdapterCredentials, payload: Record<string, unknown>): Promise<Record<string, unknown>>;
  registerWebhook?(restaurantId: number, creds: AdapterCredentials, callbackUrl: string): Promise<void>;
  /** Gelen webhook doğrulaması: imza geçersizse exception atar */
  verifyIncomingWebhook?(req: { headers: Record<string, string | string[] | undefined>; rawBody: string }, restaurantId: number, creds: AdapterCredentials): { valid: boolean; reason?: string };
}

export class NotImplemented extends Error {
  constructor(capability: string, providerKey: string) {
    super(`Bu sağlayıcı "${capability}" yeteneğini desteklemiyor veya henüz geliştirilmedi (${providerKey}).`);
    this.name = "NotImplemented";
  }
}
