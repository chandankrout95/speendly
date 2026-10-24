/** SMS parser types shared across TS and native parity tests. */

export const SmsDirection = {
  DEBIT: 'debit',
  CREDIT: 'credit',
  UNKNOWN: 'unknown',
} as const;
export type SmsDirection = (typeof SmsDirection)[keyof typeof SmsDirection];

export const SmsParseStatus = {
  SUCCESS: 'success',
  PARTIAL: 'partial',
  REJECTED: 'rejected',
  FAILED: 'failed',
  OTP: 'otp',
} as const;
export type SmsParseStatus = (typeof SmsParseStatus)[keyof typeof SmsParseStatus];

export interface ParsedSms {
  amount: number | null; // rupees as float — convert to paise at boundary
  currency: string;
  direction: SmsDirection;
  merchant: string | null;
  reference: string | null;
  transactionDate: string | null; // ISO date if extracted, otherwise null
  bankSender: string | null;
  confidence: number; // 0.0 – 1.0
  status: SmsParseStatus;
  isFailed: boolean;
  isReversal: boolean;
  isRefund: boolean;
  rawAmounts: number[]; // all amounts found — helps flag ambiguity
}

export interface SmsMessage {
  sender: string;
  body: string;
  timestamp: number; // epoch ms
}
