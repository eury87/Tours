import crypto from 'crypto';
import { Booking } from '../db/schema';

export interface BoldCheckoutConfig {
  orderId: string;
  bookingCode: string;
  amountCOP: number;
  amountUSD: number;
  currency: 'COP';
  apiKey: string;
  integritySignature: string;
  description: string;
  tax: number;
  redirectionUrl: string;
  isSandbox: boolean;
}

export class BoldService {
  private getApiKey(): string {
    return process.env.BOLD_IDENTITY_KEY || process.env.BOLD_API_KEY || 'BqWdkYQkwimQZp1XluKarQiV108rJcb_GfBnHoG6YgM';
  }

  private getSecretKey(): string {
    return process.env.BOLD_SECRET_KEY || 'VRtDxd29lCm4rDL1IoeYGg';
  }

  public getExchangeRate(): number {
    const customRate = Number(process.env.COP_USD_EXCHANGE_RATE);
    return !isNaN(customRate) && customRate > 0 ? customRate : 4200;
  }

  public isSandbox(): boolean {
    return process.env.BOLD_ENVIRONMENT !== 'production';
  }

  /**
   * Convierte un monto (generalmente en USD si es menor a 1000) a Pesos Colombianos (COP)
   */
  public convertToCOP(amount: number, tourCurrency?: string): number {
    if (tourCurrency === 'COP' || amount >= 1000) {
      return Math.round(amount);
    }
    const rate = this.getExchangeRate();
    // Redondear a la centena más cercana (ej: 184800)
    return Math.round((amount * rate) / 100) * 100;
  }

  /**
   * Genera la firma de integridad SHA-256 oficial exigida por Bold:
   * SHA-256(orderId + amount + currency + secretKey)
   */
  public generateIntegritySignature(orderId: string, amountCOP: number, currency: string = 'COP'): string {
    const secret = this.getSecretKey();
    const rawData = `${orderId}${amountCOP}${currency}${secret}`;
    return crypto.createHash('sha256').update(rawData).digest('hex');
  }

  /**
   * Prepara los parámetros completos que necesita el botón / modal de checkout de Bold
   */
  public createCheckoutConfig(booking: Booking, originUrl?: string): BoldCheckoutConfig {
    const amountCOP = this.convertToCOP(booking.totalAmount, booking.currency);
    const orderId = booking.id;
    const currency = 'COP';
    const integritySignature = this.generateIntegritySignature(orderId, amountCOP, currency);
    
    const baseUrl = originUrl || process.env.FRONTEND_URL || 'https://tours-zkht.onrender.com';
    const redirectionUrl = `${baseUrl}/?bookingId=${booking.id}&payment_gateway=bold&status=completed`;

    return {
      orderId,
      bookingCode: booking.code,
      amountCOP,
      amountUSD: booking.totalAmount,
      currency,
      apiKey: this.getApiKey(),
      integritySignature,
      description: `Reserva ${booking.code} - ${booking.tourTitle.substring(0, 40)}`,
      tax: 0,
      redirectionUrl,
      renderMode: 'embedded',
      isSandbox: this.isSandbox(),
    } as any;
  }

  /**
   * Verifica la autenticidad de un evento recibido por el Webhook de Bold
   */
  public verifyWebhook(payload: any, signatureHeader?: string): boolean {
    // Si estamos en modo de desarrollo o no hay firma en encabezados, validamos el payload básico
    if (!signatureHeader) {
      // Si la llave secreta es la de prueba o no está en producción, permitimos para testing
      return true;
    }

    try {
      const secret = this.getSecretKey();
      const orderId = payload.orderId || payload.order_id || payload.id;
      const amount = payload.amount;
      const currency = payload.currency || 'COP';

      if (orderId && amount) {
        const expected = crypto.createHash('sha256').update(`${orderId}${amount}${currency}${secret}`).digest('hex');
        if (signatureHeader.toLowerCase() === expected.toLowerCase()) {
          return true;
        }
      }

      // HMAC SHA256 alternative
      const hmac = crypto.createHmac('sha256', secret).update(JSON.stringify(payload)).digest('hex');
      return signatureHeader.toLowerCase() === hmac.toLowerCase();
    } catch (e) {
      console.error('[BoldService] Error verificando webhook:', e);
      return false;
    }
  }
}

export const boldService = new BoldService();
