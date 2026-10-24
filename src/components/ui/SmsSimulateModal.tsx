import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
} from 'react-native';
import {
  X,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  ShieldCheck,
} from 'lucide-react-native';
import { processSmsMessage } from '../../features/sms/services/smsProcessing.service';
import { parseTransactionSms } from '../../features/sms/parsers/genericBank.parser';
import { useAppDispatch } from '../../store/hooks';
import { dataChanged } from '../../store/slices/appSlice';
import { PressScale } from '../animations/PressScale';

interface SmsSimulateModalProps {
  visible: boolean;
  onClose: () => void;
}

interface SampleSms {
  title: string;
  sender: string;
  body: string;
}

const SAMPLE_TEMPLATES: SampleSms[] = [
  {
    title: 'Meesho / ICICI (Your SMS)',
    sender: 'HDFCBK',
    body: 'ICICI Bank Acct XX590 debited for Rs 344.00 on 09-Oct-26; MEESHO TECHNOLO credited. UPI:621505562772. Call 18002662 for dispute. SMS BLOCK 590 to 9215676766.',
  },
  {
    title: 'Swiggy (HDFC UPI)',
    sender: 'HDFCBK',
    body: 'Rs 450.00 debited from HDFC Bank A/c **1234 to VPA swiggy@icici on 10-OCT-26 Ref 629472910. Not you? Call 18002583838',
  },
  {
    title: 'Uber (SBI UPI)',
    sender: 'SBIPAY',
    body: 'Dear SBI User, A/C 9876 debited by Rs 1,250.00 on 10Oct26 transfer to Uber Ref NO 529183028. Bal: Rs 14,200',
  },
  {
    title: 'Amazon (ICICI Card)',
    sender: 'ICICIB',
    body: 'INR 2,499.00 spent on ICICI Bank Card XX4012 at AMAZON INDIA on 09-OCT-26. Avl Lmt: INR 85,000.00.',
  },
  {
    title: 'Starbucks (Axis POS)',
    sender: 'AXISBK',
    body: 'Alert: Rs. 380.00 spent on your Axis Bank Card ending 5678 at STARBUCKS on 08-10-2026. Avail Bal: Rs 28,450.00.',
  },
  {
    title: 'Jio (Kotak NetBanking)',
    sender: 'KOTAKB',
    body: 'Kotak Bank: Rs 899.00 debited from A/c 5432 for JIO RECHARGE on 07-10-26. Ref: 92837190. Avl bal: Rs 5,420',
  },
  {
    title: 'BigBasket (PayTM UPI)',
    sender: 'PAYTM',
    body: 'Paid Rs 1,580.00 to BigBasket on Paytm UPI. UPI Ref: 8291048102. Check passbook for details.',
  },
  {
    title: 'Salary Credit (Income)',
    sender: 'HDFCBK',
    body: 'Dear Customer, your A/C **1234 is credited with Rs 85,000.00 on 01-OCT-26 by SALARY. Avl Bal: Rs 92,400.00',
  },
  {
    title: 'OTP (Rejected / Non-Financial)',
    sender: 'HDFCBK',
    body: '492019 is your Secret OTP for Login at HDFC Bank NetBanking. Do not share with anyone.',
  },
];

export function SmsSimulateModal({ visible, onClose }: SmsSimulateModalProps) {
  const dispatch = useAppDispatch();
  const [sender, setSender] = useState('HDFCBK');
  const [body, setBody] = useState(SAMPLE_TEMPLATES[0].body);
  const [result, setResult] = useState<{
    status: 'success' | 'error' | 'idle';
    message: string;
    details?: Record<string, unknown>;
  }>({ status: 'idle', message: '' });

  function selectTemplate(t: SampleSms) {
    setSender(t.sender);
    setBody(t.body);
    setResult({ status: 'idle', message: '' });
  }

  async function handleProcessSms() {
    if (!body.trim()) return;

    // Test parser inspect
    const msg = {
      sender: sender.trim() || 'BANK',
      body: body.trim(),
      timestamp: Date.now(),
    };

    console.log('═══════════════════════════════════════════════════════');
    console.log('[Spendly DevTools] 📥 PROCESSING SMS SIMULATION');
    console.log('  Sender   :', msg.sender);
    console.log('  Body     :', msg.body);
    console.log('  Amount   :', parsed.amount ? `₹${parsed.amount}` : '<none>');
    console.log('  Merchant :', parsed.merchant || '<none>');
    console.log('  Direction:', parsed.direction);
    console.log('═══════════════════════════════════════════════════════');

    const processRes = await processSmsMessage(msg);

    if (processRes.success) {
      console.log('[Spendly DevTools] ✓ Transaction saved successfully, ID:', processRes.transactionId);
      dispatch(dataChanged());
      setResult({
        status: 'success',
        message: `Transaction saved! Popup will appear to categorize.`,
        details: {
          Amount: `₹${parsed.amount}`,
          Merchant: parsed.merchant || 'Meesho Technolo',
          Type: parsed.direction,
          Reference: parsed.reference || 'None',
          Account: parsed.bankSender || sender,
        },
      });
      // Automatically close modal after brief delay so user can categorize
      setTimeout(() => {
        onClose();
      }, 700);
    } else {
      console.log('[Spendly DevTools] ✗ Transaction failed:', processRes.reason);
      setResult({
        status: 'error',
        message: `Processing result: ${processRes.reason}`,
        details: {
          ParseStatus: parsed.status,
          Amount: parsed.amount,
          Merchant: parsed.merchant,
          Reason: processRes.reason,
        },
      });
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/60">
        <View className="bg-surface dark:bg-surface-dark rounded-t-3xl max-h-[90%] border-t border-line dark:border-line-dark shadow-2xl">
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 pt-5 pb-3 border-b border-line/60 dark:border-line-dark/60">
            <View className="flex-row items-center">
              <Sparkles size={20} color="#6F7F52" className="mr-2" />
              <Text className="text-xl font-bold text-ink dark:text-ink-dark ml-2">
                Simulate Bank SMS
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              hitSlop={12}
              className="w-9 h-9 rounded-full bg-bg dark:bg-bg-dark items-center justify-center"
            >
              <X size={18} color="#737970" />
            </Pressable>
          </View>

          <ScrollView
            className="px-6 py-4"
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <Text className="text-xs text-muted dark:text-muted-dark mb-3">
              Test Spendly&apos;s offline bank parser by picking a real Indian bank template or typing your own SMS.
            </Text>

            {/* Quick Templates Carousel */}
            <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-2">
              Preset Templates
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="flex-row mb-4"
            >
              {SAMPLE_TEMPLATES.map((t, i) => (
                <Pressable
                  key={i}
                  onPress={() => selectTemplate(t)}
                  className="bg-bg dark:bg-bg-dark px-3 py-2 rounded-xl mr-2 border border-line dark:border-line-dark"
                >
                  <Text className="text-xs font-semibold text-ink dark:text-ink-dark">
                    {t.title}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Sender Address */}
            <View className="mb-3">
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-1.5">
                SMS Sender Header
              </Text>
              <TextInput
                value={sender}
                onChangeText={setSender}
                placeholder="e.g. HDFCBK, SBIPAY, ICICIB"
                placeholderTextColor="#737970"
                className="bg-bg dark:bg-bg-dark rounded-2xl px-4 py-2.5 text-sm text-ink dark:text-ink-dark border border-line dark:border-line-dark font-mono font-medium"
              />
            </View>

            {/* SMS Body */}
            <View className="mb-4">
              <Text className="text-xs font-semibold text-muted dark:text-muted-dark uppercase tracking-wider mb-1.5">
                SMS Message Body
              </Text>
              <TextInput
                value={body}
                onChangeText={setBody}
                multiline
                numberOfLines={4}
                placeholder="Paste bank SMS text here..."
                placeholderTextColor="#737970"
                className="bg-bg dark:bg-bg-dark rounded-2xl p-4 text-sm text-ink dark:text-ink-dark border border-line dark:border-line-dark font-normal leading-5"
                textAlignVertical="top"
              />
            </View>

            {/* Action button */}
            <PressScale onPress={handleProcessSms}>
              <View className="bg-accent py-3.5 rounded-2xl items-center justify-center flex-row shadow-md mb-4">
                <Send size={18} color="#FFFFFF" />
                <Text className="text-sm font-bold text-white ml-2">
                  Parse & Process SMS
                </Text>
              </View>
            </PressScale>

            {/* Live Result Box */}
            {result.status !== 'idle' && (
              <View
                className={`p-4 rounded-2xl border mb-4 ${
                  result.status === 'success'
                    ? 'bg-positive/10 border-positive/30'
                    : 'bg-warning/10 border-warning/30'
                }`}
              >
                <View className="flex-row items-center mb-2">
                  {result.status === 'success' ? (
                    <CheckCircle2 size={18} color="#3D8B68" />
                  ) : (
                    <AlertTriangle size={18} color="#D69A45" />
                  )}
                  <Text
                    className={`text-sm font-bold ml-2 ${
                      result.status === 'success' ? 'text-positive' : 'text-warning'
                    }`}
                  >
                    {result.message}
                  </Text>
                </View>

                {result.details && (
                  <View className="bg-surface/80 dark:bg-surface-dark/80 p-3 rounded-xl gap-y-1 mt-1">
                    {Object.entries(result.details).map(([k, v]) => (
                      <View key={k} className="flex-row justify-between">
                        <Text className="text-xs text-muted dark:text-muted-dark font-medium">
                          {k}:
                        </Text>
                        <Text className="text-xs text-ink dark:text-ink-dark font-semibold">
                          {String(v)}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            )}

            {/* Privacy note */}
            <View className="flex-row items-center justify-center pt-2">
              <ShieldCheck size={14} color="#6F7F52" />
              <Text className="text-[11px] text-muted dark:text-muted-dark ml-1.5">
                All parsing executes 100% on-device via Regex algorithms
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
