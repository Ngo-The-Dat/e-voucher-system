/**
 * @file registration-otp.service.ts
 * @description Service quản lý toàn bộ vòng đời của mã OTP xác thực email khi đăng ký Đối tác:
 * sinh mã 6 số ngẫu nhiên, băm mật mã lưu trong bộ nhớ (in-memory Map), giới hạn tốc độ (Rate Limiting),
 * kiểm soát số lần thử sai tối đa (Anti Brute-Force), và quản lý phiên challenge trước khi tạo tài khoản.
 */

import { randomInt, randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import {
  sendPartnerRegistrationOtp,
  type OtpEmailSender,
} from '../email/otp-email.service.js';

/** Thời gian hiệu lực của mã OTP nhập vào: 5 phút */
const OTP_EXPIRES_IN_MS = 5 * 60 * 1000;

/** Thời gian hiệu lực của phiên đăng ký sau khi đã xác thực OTP thành công: 10 phút */
const OTP_REGISTRATION_EXPIRES_IN_MS = 10 * 60 * 1000;

/** Thời gian giãn cách tối thiểu giữa 2 lần gửi lại OTP: 60 giây (Rate Limit) */
const OTP_RESEND_AFTER_MS = 60 * 1000;

/** Số lần nhập sai OTP tối đa trước khi vô hiệu hóa challenge: 5 lần */
const OTP_MAX_ATTEMPTS = 5;

/** Số lượng challenge tối đa đồng thời lưu trong bộ nhớ để phòng ngừa tràn RAM */
const MAX_ACTIVE_CHALLENGES = 10_000;

/**
 * Cấu trúc thông tin một phiên Challenge OTP
 */
interface OtpChallenge {
  id: string;                          // Mã định danh duy nhất của challenge (UUID)
  email: string;                       // Email đăng ký (đã chuẩn hóa lowercase)
  codeHash: string;                    // Mật mã OTP đã băm bằng bcrypt
  expiresAt: number;                   // Timestamp hết hạn nhập OTP (5 phút)
  resendAt: number;                    // Timestamp cho phép bấm gửi lại (60s)
  failedAttempts: number;              // Số lần người dùng đã nhập sai
  verifiedAt: number | null;           // Timestamp thời điểm xác thực OTP thành công
  registrationExpiresAt: number | null;// Timestamp hết hạn phiên hoàn tất đăng ký (10 phút)
  consuming: boolean;                  // Đang trong quá trình ghi database đăng ký (chống trùng lặp request)
}

/** Bộ nhớ in-memory lưu trữ các challenge theo email */
const challenges = new Map<string, OtpChallenge>();

/** Tập hợp các email đang trong tiến trình gửi email (chống gửi trùng đồng thời) */
const pendingSends = new Set<string>();

/** Chuẩn hóa địa chỉ email về dạng chữ thường và cắt khoảng trắng thừa */
const normalizeEmail = (email: string) => email.trim().toLowerCase();

/**
 * Dọn dẹp các challenge đã hết hạn khỏi bộ nhớ để giải phóng tài nguyên.
 * 
 * @param now Timestamp hiện tại
 */
const cleanupExpiredChallenges = (now = Date.now()): void => {
  for (const [email, challenge] of challenges) {
    const expiresAt = challenge.registrationExpiresAt ?? challenge.expiresAt;
    if (expiresAt <= now && !challenge.consuming) challenges.delete(email);
  }
};

/** Chạy tác vụ dọn dẹp định kỳ mỗi 60 giây một lần */
const cleanupTimer = setInterval(cleanupExpiredChallenges, 60_000);
cleanupTimer.unref();

/**
 * Yêu cầu phát hành và gửi mã OTP xác thực email cho đối tác đăng ký.
 * 
 * @description
 * 1. Dọn dẹp các challenge cũ đã hết hạn.
 * 2. Kiểm tra Rate Limit: nếu chưa qua 60s kể từ lần gửi trước, từ chối với mã HTTP 429 kèm `retry_after`.
 * 3. Sinh chuỗi ngẫu nhiên 6 chữ số (`000000` - `999999`) và băm với bcrypt.
 * 4. Gửi email chứa mã OTP và thời gian hiệu lực.
 * 5. Lưu challenge mới vào `Map` và trả về `challenge_id`.
 * 
 * @param rawEmail Email người nhận
 * @param sendEmail Hàm gửi email thực tế (mặc định gửi qua SMTP / Resend / SES)
 * @returns Thông tin challenge_id, thời gian hết hạn (giây) và thời gian chờ gửi lại (giây)
 */
export const requestRegistrationOtp = async (
  rawEmail: string,
  sendEmail: OtpEmailSender = sendPartnerRegistrationOtp,
) => {
  const email = normalizeEmail(rawEmail);
  const now = Date.now();
  cleanupExpiredChallenges(now);

  const current = challenges.get(email);
  if (current && current.resendAt > now) {
    throw {
      status: 429,
      message: 'Vui lòng chờ trước khi yêu cầu gửi lại OTP.',
      retry_after: Math.ceil((current.resendAt - now) / 1000),
    };
  }
  if (pendingSends.has(email)) {
    throw { status: 429, message: 'Yêu cầu gửi OTP đang được xử lý.', retry_after: 1 };
  }
  if (!current && challenges.size >= MAX_ACTIVE_CHALLENGES) {
    throw { status: 503, message: 'Dịch vụ OTP đang bận. Vui lòng thử lại sau.' };
  }

  pendingSends.add(email);
  try {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await bcrypt.hash(code, 10);
    await sendEmail(email, code, OTP_EXPIRES_IN_MS / 60_000);

    const challenge: OtpChallenge = {
      id: randomUUID(),
      email,
      codeHash,
      expiresAt: Date.now() + OTP_EXPIRES_IN_MS,
      resendAt: Date.now() + OTP_RESEND_AFTER_MS,
      failedAttempts: 0,
      verifiedAt: null,
      registrationExpiresAt: null,
      consuming: false,
    };
    challenges.set(email, challenge);

    return {
      challenge_id: challenge.id,
      expires_in: OTP_EXPIRES_IN_MS / 1000,
      resend_after: OTP_RESEND_AFTER_MS / 1000,
    };
  } finally {
    pendingSends.delete(email);
  }
};

/**
 * Xác thực mã OTP người dùng nhập vào.
 * 
 * @description
 * 1. Kiểm tra tồn tại của challenge và so khớp `challenge_id`.
 * 2. Kiểm tra thời hạn hiệu lực (5 phút). Nếu quá hạn, xóa challenge và trả về HTTP 410 Gone.
 * 3. Kiểm tra số lần nhập sai. Nếu quá 5 lần, hủy challenge và trả về HTTP 429 Too Many Requests.
 * 4. So sánh mã với `codeHash` qua `bcrypt.compare`.
 * 5. Nếu chính xác, cấp trạng thái `verifiedAt` và gia hạn phiên hoàn tất đăng ký thêm 10 phút.
 * 
 * @param rawEmail Email người dùng
 * @param challengeId ID của challenge đã nhận khi gửi OTP
 * @param code Mã OTP 6 số do người dùng nhập
 * @returns { verified: true, challenge_id: string }
 */
export const verifyRegistrationOtp = async (rawEmail: string, challengeId: string, code: string) => {
  const email = normalizeEmail(rawEmail);
  const challenge = challenges.get(email);
  const now = Date.now();

  if (!challenge || challenge.id !== challengeId) {
    throw { status: 400, message: 'Yêu cầu xác thực OTP không hợp lệ.' };
  }
  if (challenge.expiresAt <= now) {
    challenges.delete(email);
    throw { status: 410, message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' };
  }
  if (challenge.verifiedAt) {
    return { verified: true, challenge_id: challenge.id };
  }
  if (challenge.failedAttempts >= OTP_MAX_ATTEMPTS) {
    challenges.delete(email);
    throw { status: 429, message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng gửi lại mã.' };
  }

  const isValid = await bcrypt.compare(code, challenge.codeHash);
  if (!isValid) {
    challenge.failedAttempts += 1;
    if (challenge.failedAttempts >= OTP_MAX_ATTEMPTS) {
      challenges.delete(email);
      throw { status: 429, message: 'Bạn đã nhập sai OTP quá số lần cho phép. Vui lòng gửi lại mã.' };
    }
    throw {
      status: 400,
      message: `Mã OTP không đúng. Bạn còn ${OTP_MAX_ATTEMPTS - challenge.failedAttempts} lần thử.`,
    };
  }

  challenge.verifiedAt = now;
  challenge.registrationExpiresAt = now + OTP_REGISTRATION_EXPIRES_IN_MS;
  return { verified: true, challenge_id: challenge.id };
};

/**
 * Bắt đầu tiêu thụ phiên challenge OTP khi bắt đầu thực hiện đăng ký đối tác (bước gọi `register`).
 * Khóa cờ `consuming = true` để ngăn ngừa 2 request đăng ký đồng thời cùng dùng 1 challenge.
 * 
 * @param rawEmail Email đăng ký
 * @param challengeId ID challenge
 */
export const beginOtpConsumption = (rawEmail: string, challengeId: string): void => {
  const email = normalizeEmail(rawEmail);
  const challenge = challenges.get(email);
  const now = Date.now();

  if (!challenge || challenge.id !== challengeId || !challenge.verifiedAt) {
    throw { status: 400, message: 'Email chưa được xác thực bằng OTP.' };
  }
  if (!challenge.registrationExpiresAt || challenge.registrationExpiresAt <= now) {
    challenges.delete(email);
    throw { status: 410, message: 'Phiên xác thực OTP đã hết hạn. Vui lòng xác thực lại.' };
  }
  if (challenge.consuming) {
    throw { status: 409, message: 'Yêu cầu đăng ký này đang được xử lý.' };
  }

  challenge.consuming = true;
};

/**
 * Nhả lại cờ `consuming = false` nếu quá trình ghi database gặp lỗi (Rollback).
 * 
 * @param rawEmail Email đăng ký
 * @param challengeId ID challenge
 */
export const releaseOtpConsumption = (rawEmail: string, challengeId: string): void => {
  const challenge = challenges.get(normalizeEmail(rawEmail));
  if (challenge?.id === challengeId) challenge.consuming = false;
};

/**
 * Hoàn tất và hủy bỏ challenge OTP sau khi tài khoản đối tác đã được ghi thành công vào database.
 * 
 * @param rawEmail Email đăng ký
 * @param challengeId ID challenge
 */
export const completeOtpConsumption = (rawEmail: string, challengeId: string): void => {
  const email = normalizeEmail(rawEmail);
  const challenge = challenges.get(email);
  if (challenge?.id === challengeId) challenges.delete(email);
};
