export interface PaymentProvider {
  id: string;
  name: string;
  enabled: boolean;
  testMode: boolean;
  merchantId?: string;
  merchantKey?: string;
  merchantSalt?: string;
  apiKey?: string;
  secretKey?: string;
  publicKey?: string;
  privateKey?: string;
  callbackUrl?: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  orderId: string;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  returnUrl: string;
  cancelUrl: string;
  paymentType: 'license' | 'integration';
  items: PaymentItem[];
}

export interface PaymentItem {
  name: string;
  price: number;
  quantity: number;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentUrl?: string;
  token?: string;
  error?: string;
  message?: string;
}

export interface PaymentCallbackResponse {
  success: boolean;
  transactionId: string;
  orderId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'cancelled';
  message?: string;
}

export class PaymentService {
  private static instance: PaymentService;
  private providers: PaymentProvider[] = [];

  private constructor() {}

  static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  async initializeProviders(): Promise<void> {
    try {
      const response = await fetch('/api/payment/providers');
      if (response.ok) {
        const data = await response.json();
        this.providers = data.providers || [];
      }
    } catch (error) {
      console.error('Failed to initialize payment providers:', error);
    }
  }

  getActiveProviders(): PaymentProvider[] {
    return this.providers.filter(provider => provider.enabled);
  }

  async createPayment(providerId: string, request: PaymentRequest): Promise<PaymentResponse> {
    const provider = this.providers.find(p => p.id === providerId && p.enabled);
    if (!provider) {
      return {
        success: false,
        error: 'Ödeme sağlayıcı bulunamadı veya devre dışı'
      };
    }

    if (!request || !request.orderId || request.amount <= 0 || !['TRY', 'USD', 'EUR'].includes(request.currency)) {
      return { success: false, error: 'Geçersiz ödeme isteği' };
    }

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          paymentRequest: request
        }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Payment creation failed');
      }
    } catch (error) {
      console.error('Payment creation error:', error);
      return {
        success: false,
        error: 'Ödeme oluşturulurken hata oluştu'
      };
    }
  }

  async handlePaymentCallback(providerId: string, callbackData: any): Promise<PaymentCallbackResponse> {
    try {
      const response = await fetch('/api/payment/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          providerId,
          callbackData
        }),
      });

      if (response.ok) {
        return await response.json();
      } else {
        throw new Error('Payment callback failed');
      }
    } catch (error) {
      console.error('Payment callback error:', error);
      return {
        success: false,
        transactionId: '',
        orderId: '',
        amount: 0,
        currency: 'TRY',
        status: 'failed',
        message: 'Ödeme doğrulaması başarısız oldu'
      };
    }
  }

}

export const paymentService = PaymentService.getInstance();
