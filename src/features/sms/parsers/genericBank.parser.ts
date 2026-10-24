import type { SmsMessage, ParsedSms } from '../types';
import { SmsDirection, SmsParseStatus } from '../types';

// ─── Amount extraction ─────────────────────────────────────────────────────────

const AMOUNT_RE =
  /(?:Rs\.?|INR|₹)\s*([\d,]+(?:\.\d{1,2})?)|(?:(?:debited|credited|paid|received|sent|withdrawn|transferred|deducted)\b.*?(?:Rs\.?|INR|₹)?\s*([\d,]+(?:\.\d{1,2})?))/gi;

function extractAmounts(body: string): number[] {
  const amounts: number[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(AMOUNT_RE.source, AMOUNT_RE.flags);
  while ((match = re.exec(body)) !== null) {
    const raw = (match[1] || match[2] || '').replace(/,/g, '');
    const num = parseFloat(raw);
    if (!isNaN(num) && num > 0 && num < 1_000_000_000) {
      amounts.push(num);
    }
  }
  // De-dup while preserving order
  return [...new Set(amounts)];
}

// ─── Direction detection ───────────────────────────────────────────────────────

const DEBIT_KEYWORDS =
  /\b(debit(?:ed)?|spent|paid|purchase|withdrawn|sent|deducted|payment|transferred|txn\b)/i;
const CREDIT_KEYWORDS =
  /\b(credit(?:ed)?|received|refund(?:ed)?|cashback|reversed|deposited)\b/i;

function detectDirection(body: string): SmsDirection {
  const hasDebit = DEBIT_KEYWORDS.test(body);
  const hasCredit = CREDIT_KEYWORDS.test(body);
  if (hasDebit && !hasCredit) return SmsDirection.DEBIT;
  if (hasCredit && !hasDebit) return SmsDirection.CREDIT;
  if (hasDebit && hasCredit) {
    // "debited...refund" → check which appears first
    const debitIdx = body.search(DEBIT_KEYWORDS);
    const creditIdx = body.search(CREDIT_KEYWORDS);
    return debitIdx < creditIdx ? SmsDirection.DEBIT : SmsDirection.CREDIT;
  }
  return SmsDirection.UNKNOWN;
}

// ─── Status detection ──────────────────────────────────────────────────────────

const FAILED_RE = /\b(fail(?:ed|ure)?|declined|unsuccessful|not\s+completed|rejected)\b/i;
const REVERSAL_RE = /\b(revers(?:ed|al))\b/i;
const REFUND_RE = /\b(refund(?:ed)?)\b/i;
const OTP_RE = /\b(OTP|one[- ]?time[- ]?password|verification\s*code)\b/i;

// ─── Merchant extraction ───────────────────────────────────────────────────────

const MERCHANT_PATTERNS = [
  /([A-Z][A-Za-z0-9\s&'.,-]{2,25})\s+credited/i,
  /transfer\s+(?:from|to)\s+([A-Za-z0-9\s&'.,-]{2,25})/i,
  /(?:at|to|towards|@)\s+([A-Z][A-Za-z0-9\s&'.,-]{2,30}?)(?:\s+on|\s+ref|\s+UPI|\.|\s*$)/,
  /UPI\/\d+\/([A-Za-z0-9\s&'.,-]+?)(?:\/|$)/,
  /(?:VPA|to)\s+([a-z0-9._-]+@[a-z]+)/i,
  /(?:Info:\s*)([A-Za-z\s&'.,-]{3,30})/,
];

function extractMerchant(body: string): string | null {
  for (const pattern of MERCHANT_PATTERNS) {
    const match = pattern.exec(body);
    if (match?.[1]) {
      return normalizeMerchant(match[1]);
    }
  }
  return null;
}

function normalizeMerchant(raw: string): string {
  return raw
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[,.]$/, '')
    .split(' ')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

// ─── Reference extraction ──────────────────────────────────────────────────────

const REF_PATTERNS = [
  /\bRef\.?\s*(?:No\.?)?\s*[:.]?\s*(\w{6,20})/i,
  /\bUPI\s*Ref\.?\s*[:.]?\s*(\d{6,14})/i,
  /\btxn\s*(?:id|no)?\s*[:.]?\s*(\w{6,20})/i,
];

function extractReference(body: string): string | null {
  for (const pattern of REF_PATTERNS) {
    const match = pattern.exec(body);
    if (match?.[1]) return match[1];
  }
  return null;
}

// ─── Bank sender detection ─────────────────────────────────────────────────────

const BANK_SENDER_RE =
  /^(?:(?:[A-Z]{2}-)?(HDFCBK|SBIBNK|ICICIB|AXISBK|KOTAKB|PNBSMS|BOIIND|CANBNK|IDBIBK|YESBNK|INDBNK|SCBANK|CITIBK|UBINES|BOBIPH|UNIONB|FEDBNK|RBLBNK|PAYTMB|AIRBNK|JUPBNK))/i;

function detectBankSender(sender: string): string | null {
  const match = BANK_SENDER_RE.exec(sender);
  return match ? match[1].toUpperCase() : null;
}

// ─── Non-financial filter ──────────────────────────────────────────────────────

const NON_FINANCIAL_RE =
  /\b(offer|promo|discount|sale|coupon|exclusive|limited\s+period|congratulations|reward)\b/i;

function isLikelyNonFinancial(body: string, sender: string): boolean {
  if (OTP_RE.test(body)) return true;

  if (!DEBIT_KEYWORDS.test(body) && !CREDIT_KEYWORDS.test(body)) {
    return true;
  }
  // Pure promotional
  if (NON_FINANCIAL_RE.test(body) && !DEBIT_KEYWORDS.test(body) && !CREDIT_KEYWORDS.test(body)) {
    return true;
  }
  return false;
}

// ─── Main parser ───────────────────────────────────────────────────────────────

export function parseTransactionSms(msg: SmsMessage): ParsedSms {
  const { sender, body } = msg;

  // Quick rejection
  if (OTP_RE.test(body)) {
    return emptyResult(SmsParseStatus.OTP);
  }

  if (isLikelyNonFinancial(body, sender)) {
    return emptyResult(SmsParseStatus.REJECTED);
  }

  const direction = detectDirection(body);
  const amounts = extractAmounts(body);
  const isFailed = FAILED_RE.test(body);
  const isReversal = REVERSAL_RE.test(body);
  const isRefund = REFUND_RE.test(body);
  const merchant = extractMerchant(body);
  const reference = extractReference(body);
  const bankSender = detectBankSender(sender);

  if (amounts.length === 0) {
    return emptyResult(SmsParseStatus.REJECTED);
  }

  // Primary amount is the first one (most messages lead with the transaction amount)
  const primaryAmount = amounts[0];

  // Confidence scoring
  let confidence = 0.5;
  if (bankSender) confidence += 0.15;
  if (direction !== SmsDirection.UNKNOWN) confidence += 0.15;
  if (reference) confidence += 0.1;
  if (merchant) confidence += 0.05;
  if (amounts.length === 1) confidence += 0.05;
  if (isFailed) confidence -= 0.2;
  if (amounts.length > 2) confidence -= 0.1;
  confidence = Math.max(0, Math.min(1, confidence));

  const status =
    direction === SmsDirection.UNKNOWN || amounts.length > 2
      ? SmsParseStatus.PARTIAL
      : SmsParseStatus.SUCCESS;

  return {
    amount: primaryAmount,
    currency: 'INR',
    direction,
    merchant,
    reference,
    transactionDate: null, // Could be extended with date extraction
    bankSender,
    confidence,
    status,
    isFailed,
    isReversal,
    isRefund,
    rawAmounts: amounts,
  };
}

function emptyResult(status: SmsParseStatus): ParsedSms {
  return {
    amount: null,
    currency: 'INR',
    direction: SmsDirection.UNKNOWN,
    merchant: null,
    reference: null,
    transactionDate: null,
    bankSender: null,
    confidence: 0,
    status,
    isFailed: false,
    isReversal: false,
    isRefund: false,
    rawAmounts: [],
  };
}
