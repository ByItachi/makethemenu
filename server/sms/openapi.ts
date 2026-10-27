// /api/v1 genel SMS API'si için statik OpenAPI 3.0 belgesi.
// Swagger UI bu nesneyi /api/v1/docs altında sunar; API anahtarları yönetim panelinden alınır
// (/su, /hali → "SMS API" sekmesi) ve Authorization: Bearer <api-key> başlığıyla kullanılır.
export const smsOpenApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Makethemenu SMS API",
    version: "1.0.0",
    description:
      "İşletmelerin kendi uygulamalarından (WHMCS, e-ticaret, özel yazılım) SMS gönderip OTP doğrulaması yapabileceği genel API. " +
      "Bir API anahtarı gerektirir; panelden (Toplu SMS → SMS API ve Bakiye) oluşturulur.",
  },
  servers: [{ url: "/api/v1", description: "Bu sunucu" }],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: "http",
        scheme: "bearer",
        description: "Panelden oluşturulan SMS API anahtarı (Authorization: Bearer <key>).",
      },
    },
    schemas: {
      SendRequest: {
        type: "object",
        required: ["to", "text"],
        properties: {
          to: { type: "string", example: "05551234567" },
          text: { type: "string", example: "Siparişiniz hazırlanıyor." },
          scheduledAt: { type: "string", format: "date-time", description: "Belirtilirse gelecekte bir tarih olmalı; mesaj o ana kadar beklemeye alınır." },
        },
      },
      BulkSendRequest: {
        type: "object",
        required: ["messages"],
        properties: {
          messages: { type: "array", items: { $ref: "#/components/schemas/SendRequest" }, maxItems: 1000 },
          scheduledAt: { type: "string", format: "date-time" },
        },
      },
      OtpRequest: {
        type: "object",
        required: ["phone"],
        properties: {
          phone: { type: "string", example: "05551234567" },
          purpose: { type: "string", default: "generic", example: "login" },
          template: { type: "string", description: "{{verification_code}} değişkenini içermelidir." },
        },
      },
      OtpVerify: {
        type: "object",
        required: ["phone", "code"],
        properties: {
          phone: { type: "string" },
          purpose: { type: "string", default: "generic" },
          code: { type: "string", example: "123456" },
        },
      },
      ErrorResponse: {
        type: "object",
        properties: { error: { type: "string" }, message: { type: "string" } },
      },
    },
  },
  security: [{ ApiKeyAuth: [] }],
  paths: {
    "/health": {
      get: {
        summary: "Servis durumu",
        security: [],
        responses: { "200": { description: "OK" } },
      },
    },
    "/sms/send": {
      post: {
        summary: "Tekli SMS gönder",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/SendRequest" } } } },
        responses: {
          "202": { description: "Kuyruğa alındı veya zamanlandı" },
          "400": { description: "Geçersiz istek" },
          "401": { description: "Geçersiz API anahtarı" },
          "402": { description: "Yetersiz kontör bakiyesi" },
        },
      },
    },
    "/sms/bulk": {
      post: {
        summary: "Toplu SMS gönder",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/BulkSendRequest" } } } },
        responses: {
          "202": { description: "Kuyruğa alındı veya zamanlandı" },
          "400": { description: "Geçersiz istek" },
          "402": { description: "Yetersiz kontör bakiyesi" },
        },
      },
    },
    "/sms/messages": {
      get: {
        summary: "Gönderilen mesajları listele",
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", maximum: 200, default: 50 } }],
        responses: { "200": { description: "Mesaj listesi" } },
      },
    },
    "/sms/messages/{id}": {
      get: {
        summary: "Tek bir mesajın durumunu getir",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "integer" } }],
        responses: { "200": { description: "Mesaj" }, "404": { description: "Bulunamadı" } },
      },
    },
    "/sms/inbound": {
      get: {
        summary: "Gelen SMS'leri listele (webhook ile alınan)",
        parameters: [{ name: "limit", in: "query", schema: { type: "integer", maximum: 200, default: 50 } }],
        responses: { "200": { description: "Gelen mesaj listesi" } },
      },
    },
    "/otp/request": {
      post: {
        summary: "Tek kullanımlık doğrulama kodu gönder",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OtpRequest" } } } },
        responses: { "202": { description: "Kod gönderildi" }, "429": { description: "Çok sık istek" }, "402": { description: "Yetersiz kontör" } },
      },
    },
    "/otp/verify": {
      post: {
        summary: "Doğrulama kodunu kontrol et",
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OtpVerify" } } } },
        responses: { "200": { description: "Doğrulandı veya hata nedeni" } },
      },
    },
    "/account/balance": {
      get: { summary: "Kontör bakiyesini getir", responses: { "200": { description: "Bakiye" } } },
    },
    "/account/usage": {
      get: { summary: "Gönderim istatistikleri", responses: { "200": { description: "Durum bazlı sayım" } } },
    },
  },
} as const;
