import crypto from 'node:crypto';
import qs from 'qs';
import dotenv from 'dotenv';
dotenv.config();

export interface VNPayConfig {
  tmnCode: string;
  hashSecret: string;
  url: string;
  returnUrl: string;
}

export function getVNPayConfig(): VNPayConfig {
  return {
    tmnCode: process.env.VNP_TMN_CODE || 'ABCDEFGH',
    hashSecret: process.env.VNP_HASH_SECRET || 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNP_RETURN_URL || 'http://localhost:3000/payments/vnpay/return',
  };
}

export function sortObject(obj: Record<string, any>): Record<string, string> {
  const sorted: Record<string, string> = {};
  const str = [];
  let key;
  for (key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
  }
  return sorted;
}

export function generateVNPaySignature(signData: string, secretKey: string): string {
  const hmac = crypto.createHmac('sha512', secretKey);
  const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
  return signed;
}

export function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  };
  const formatter = new Intl.DateTimeFormat('en-US', options);
  const parts = formatter.formatToParts(date);

  const getPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const yyyy = getPart('year');
  const MM = getPart('month');
  const dd = getPart('day');
  const HH = getPart('hour');
  const mm = getPart('minute');
  const ss = getPart('second');

  return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
}
