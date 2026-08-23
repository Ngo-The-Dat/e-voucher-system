import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!user || !pass) {
    console.warn('⚠️ CẢNH BÁO: GMAIL_USER hoặc GMAIL_APP_PASSWORD chưa được cấu hình. Hệ thống sẽ log mã OTP ra màn hình console thay vì gửi email.');
    return null;
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }

  return transporter;
};

export type OtpEmailSender = (email: string, otp: string, expiresInMinutes: number) => Promise<void>;

export const sendPartnerRegistrationOtp: OtpEmailSender = async (email, otp, expiresInMinutes) => {
  const mailTransporter = getTransporter();
  
  if (!mailTransporter) {
    console.log(`\n==========================================`);
    console.log(`📨 [MÔ PHỎNG GỬI EMAIL OTP - ĐĂNG KÝ ĐỐI TÁC]`);
    console.log(`Tới: ${email}`);
    console.log(`Mã OTP của bạn là: ${otp} (Hiệu lực: ${expiresInMinutes} phút)`);
    console.log(`==========================================\n`);
    return;
  }

  const user = process.env.GMAIL_USER!.trim();
  const fromName = process.env.GMAIL_FROM_NAME?.trim() || 'Vouchify Partner';

  try {
    await mailTransporter.sendMail({
      from: { name: fromName, address: user },
      to: email,
      subject: 'Mã xác thực đăng ký đối tác Vouchify',
      text: [
        `Mã OTP đăng ký tài khoản đối tác của bạn là: ${otp}`,
        `Mã có hiệu lực trong ${expiresInMinutes} phút.`,
        'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.',
      ].join('\n\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
          <h2 style="color:#6750a4">Xác thực đăng ký Vouchify Partner</h2>
          <p>Mã OTP đăng ký tài khoản đối tác của bạn là:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 20px;background:#f3f0ff;border-radius:12px;text-align:center">${otp}</div>
          <p>Mã có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.</p>
          <p style="color:#6b7280;font-size:13px">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        </div>
      `,
    });
  } catch (error) {
    if ((error as { status?: number }).status === 503) throw error;
    console.error('Không thể gửi email OTP:', error instanceof Error ? error.message : error);
    throw {
      status: 503,
      message: 'Không thể gửi email OTP. Vui lòng thử lại sau.',
    };
  }
};

export const sendForgotPasswordOtp: OtpEmailSender = async (email, otp, expiresInMinutes) => {
  const mailTransporter = getTransporter();

  console.log(`\n==========================================`);
  console.log(`📨 [MÔ PHỎNG/TEST GỬI EMAIL OTP - KHÔI PHỤC MẬT KHẨU]`);
  console.log(`Tới: ${email}`);
  console.log(`Mã OTP của bạn là: ${otp} (Hiệu lực: ${expiresInMinutes} phút)`);
  console.log(`==========================================\n`);

  if (!mailTransporter) {
    return;
  }

  const user = process.env.GMAIL_USER!.trim();
  const fromName = process.env.GMAIL_FROM_NAME?.trim() || 'Vouchify Marketplace';

  try {
    await mailTransporter.sendMail({
      from: { name: fromName, address: user },
      to: email,
      subject: 'Mã xác thực khôi phục mật khẩu Vouchify',
      text: [
        `Mã OTP khôi phục mật khẩu tài khoản Vouchify của bạn là: ${otp}`,
        `Mã có hiệu lực trong ${expiresInMinutes} phút.`,
        'Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này để đảm bảo an toàn cho tài khoản.',
      ].join('\n\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
          <h2 style="color:#0f2c59">Khôi phục mật khẩu Vouchify</h2>
          <p>Mã OTP khôi phục mật khẩu của bạn là:</p>
          <div style="font-size:32px;font-weight:700;letter-spacing:8px;padding:16px 20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;text-align:center">${otp}</div>
          <p>Mã có hiệu lực trong <strong>${expiresInMinutes} phút</strong>.</p>
          <p style="color:#6b7280;font-size:13px">Nếu bạn không yêu cầu khôi phục mật khẩu, vui lòng bỏ qua email này để đảm bảo an toàn cho tài khoản.</p>
        </div>
      `,
    });
  } catch (error) {
    if ((error as { status?: number }).status === 503) throw error;
    console.error('Không thể gửi email OTP khôi phục:', error instanceof Error ? error.message : error);
    throw {
      status: 503,
      message: 'Không thể gửi email OTP. Vui lòng thử lại sau.',
    };
  }
};
