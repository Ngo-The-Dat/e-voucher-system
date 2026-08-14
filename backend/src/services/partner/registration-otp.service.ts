import { randomInt, randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import {
  sendPartnerRegistrationOtp,
  type OtpEmailSender,
} from '../email/otp-email.service.js';

const OTP_EXPIRES_IN_MS = 5 * 60 * 1000;
const OTP_REGISTRATION_EXPIRES_IN_MS = 10 * 60 * 1000;
const OTP_RESEND_AFTER_MS = 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;
const MAX_ACTIVE_CHALLENGES = 10_000;

interface OtpChallenge {
  id: string;
  email: string;
  codeHash: string;
  expiresAt: number;
  resendAt: number;
  failedAttempts: number;
  verifiedAt: number | null;
  registrationExpiresAt: number | null;
  consuming: boolean;
}

const challenges = new Map<string, OtpChallenge>();
const pendingSends = new Set<string>();

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const cleanupExpiredChallenges = (now = Date.now()): void => {
  for (const [email, challenge] of challenges) {
    const expiresAt = challenge.registrationExpiresAt ?? challenge.expiresAt;
    if (expiresAt <= now && !challenge.consuming) challenges.delete(email);
  }
};

const cleanupTimer = setInterval(cleanupExpiredChallenges, 60_000);
cleanupTimer.unref();

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

export const releaseOtpConsumption = (rawEmail: string, challengeId: string): void => {
  const challenge = challenges.get(normalizeEmail(rawEmail));
  if (challenge?.id === challengeId) challenge.consuming = false;
};

export const completeOtpConsumption = (rawEmail: string, challengeId: string): void => {
  const email = normalizeEmail(rawEmail);
  const challenge = challenges.get(email);
  if (challenge?.id === challengeId) challenges.delete(email);
};
