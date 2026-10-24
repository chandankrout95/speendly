import { parseTransactionSms } from '../genericBank.parser';
import { SmsDirection, SmsParseStatus } from '../../types';

describe('genericBank.parser', () => {
  it('parses standard HDFC UPI debit message', () => {
    const res = parseTransactionSms({
      sender: 'HDFCBK',
      body: 'Rs 450.00 debited from HDFC Bank A/c **1234 to VPA swiggy@icici on 10-OCT-26 Ref 629472910. Not you? Call 18002583838',
      timestamp: Date.now(),
    });

    expect(res.status).toBe(SmsParseStatus.SUCCESS);
    expect(res.amount).toBe(450.0);
    expect(res.direction).toBe(SmsDirection.DEBIT);
    expect(res.merchant?.toLowerCase()).toContain('swiggy');
    expect(res.reference).toBe('629472910');
  });

  it('parses SBI UPI debit message', () => {
    const res = parseTransactionSms({
      sender: 'SBIPAY',
      body: 'Dear SBI User, A/C 9876 debited by Rs 1,250.00 on 10Oct26 transfer to Uber Ref NO 529183028. Bal: Rs 14,200',
      timestamp: Date.now(),
    });

    expect(res.status).toBe(SmsParseStatus.SUCCESS);
    expect(res.amount).toBe(1250.0);
    expect(res.direction).toBe(SmsDirection.DEBIT);
    expect(res.merchant?.toLowerCase()).toContain('uber');
  });

  it('parses ICICI credit card spent alert', () => {
    const res = parseTransactionSms({
      sender: 'ICICIB',
      body: 'INR 2,499.00 spent on ICICI Bank Card XX4012 at AMAZON INDIA on 09-OCT-26. Avl Lmt: INR 85,000.00.',
      timestamp: Date.now(),
    });

    expect(res.status).toBe(SmsParseStatus.SUCCESS);
    expect(res.amount).toBe(2499.0);
    expect(res.direction).toBe(SmsDirection.DEBIT);
    expect(res.merchant?.toLowerCase()).toContain('amazon');
  });

  it('parses Axis Bank POS swipe', () => {
    const res = parseTransactionSms({
      sender: 'AXISBK',
      body: 'Alert: Rs. 380.00 spent on your Axis Bank Card ending 5678 at STARBUCKS on 08-10-2026. Avail Bal: Rs 28,450.00.',
      timestamp: Date.now(),
    });

    expect(res.status).toBe(SmsParseStatus.SUCCESS);
    expect(res.amount).toBe(380.0);
    expect(res.direction).toBe(SmsDirection.DEBIT);
    expect(res.merchant?.toLowerCase()).toContain('starbucks');
  });

  it('rejects OTP messages as non-financial', () => {
    const res = parseTransactionSms({
      sender: 'HDFCBK',
      body: '492019 is your Secret OTP for NetBanking Login. Do not share OTP with anyone.',
      timestamp: Date.now(),
    });

    expect(res.status).toBe(SmsParseStatus.OTP);
    expect(res.amount).toBeNull();
  });

  it('detects credit / income transactions', () => {
    const res = parseTransactionSms({
      sender: 'HDFCBK',
      body: 'Dear Customer, your A/C **1234 is credited with Rs 85,000.00 on 01-OCT-26 by SALARY. Avl Bal: Rs 92,400.00',
      timestamp: Date.now(),
    });

    expect(res.direction).toBe(SmsDirection.CREDIT);
    expect(res.amount).toBe(85000.0);
  });

  it('triggers on financial SMS body regardless of contact/sender name', () => {
    const res = parseTransactionSms({
      sender: 'Bhai ❤️',
      body: 'Rs 500.00 debited from A/c **1234 to Swiggy on 10-Oct Ref 92839182',
      timestamp: Date.now(),
    });

    expect(res.status).toBe(SmsParseStatus.SUCCESS);
    expect(res.amount).toBe(500.0);
    expect(res.direction).toBe(SmsDirection.DEBIT);
  });
});
