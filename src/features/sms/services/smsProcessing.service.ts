/**
 * SMS processing service.
 * Orchestrates parsing → fingerprinting → dedup → persistence → categorization.
 */

import { parseTransactionSms } from '../parsers/genericBank.parser';
import { generateFingerprint, hashMessage } from './transactionFingerprint.service';
import { insertTransaction, transactionExistsByFingerprint } from '../../../database/repositories/transactionRepository';
import { matchMerchant } from '../../../database/repositories/merchantRuleRepository';
import type { SmsMessage } from '../types';
import { SmsDirection, SmsParseStatus } from '../types';
import type { TransactionInsert } from '../../../types/transaction.types';
import { TransactionType, CategorizationStatus, TransactionSource } from '../../../types/transaction.types';
import { parseRupeesToPaise } from '../../../utils/currency';

export interface ProcessingResult {
  success: boolean;
  transactionId: string | null;
  reason: string;
}

export async function processSmsMessage(msg: SmsMessage): Promise<ProcessingResult> {
  try {
    const parsed = parseTransactionSms(msg);

    // Reject non-financial or OTP messages
    if (parsed.status === SmsParseStatus.REJECTED || parsed.status === SmsParseStatus.OTP) {
      return { success: false, transactionId: null, reason: 'Non-financial message' };
    }

    // Need at least an amount
    if (parsed.amount === null || parsed.amount <= 0) {
      return { success: false, transactionId: null, reason: 'No valid amount extracted' };
    }

    // Skip failed transactions
    if (parsed.isFailed) {
      return { success: false, transactionId: null, reason: 'Failed transaction' };
    }

    // Convert to paise
    const amountMinor = parseRupeesToPaise(parsed.amount.toString());
    if (amountMinor === null) {
      return { success: false, transactionId: null, reason: 'Amount conversion failed' };
    }

    // Determine transaction type
    let transactionType: TransactionType;
    if (parsed.isRefund) {
      transactionType = TransactionType.REFUND;
    } else if (parsed.isReversal) {
      transactionType = TransactionType.REVERSAL;
    } else if (parsed.direction === SmsDirection.CREDIT) {
      transactionType = TransactionType.INCOME;
    } else if (parsed.direction === SmsDirection.DEBIT) {
      transactionType = TransactionType.EXPENSE;
    } else {
      transactionType = TransactionType.UNKNOWN;
    }

    // Build fingerprint
    const now = new Date().toISOString();
    const transactionDate = parsed.transactionDate ?? new Date(msg.timestamp).toISOString();
    const fingerprint = generateFingerprint({
      amountMinor,
      direction: parsed.direction,
      merchant: parsed.merchant,
      reference: parsed.reference,
      accountAlias: parsed.bankSender,
      transactionDate,
    });

    // Dedup check
    const exists = await transactionExistsByFingerprint(fingerprint);
    if (exists) {
      return { success: false, transactionId: null, reason: 'Duplicate transaction' };
    }

    // Auto-categorize via merchant rules
    let categoryId: string | null = null;
    let categorizationStatus: CategorizationStatus = CategorizationStatus.PENDING;

    if (parsed.merchant) {
      const matchedCategory = await matchMerchant(parsed.merchant);
      if (matchedCategory) {
        categoryId = matchedCategory;
        categorizationStatus = CategorizationStatus.AUTO;
      }
    }

    const id = generateId();
    const txn: TransactionInsert = {
      id,
      amountMinor,
      currency: parsed.currency,
      transactionType,
      categoryId,
      merchantName: parsed.merchant,
      transactionReference: parsed.reference,
      transactionDate,
      receivedAt: now,
      source: TransactionSource.SMS,
      categorizationStatus,
      confidence: parsed.confidence,
      fingerprint,
      originalMessageHash: hashMessage(msg.body),
      accountAlias: parsed.bankSender,
    };

    await insertTransaction(txn);

    return { success: true, transactionId: id, reason: 'Transaction saved' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown processing error';
    return { success: false, transactionId: null, reason: message };
  }
}

function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `txn_${timestamp}_${random}`;
}
