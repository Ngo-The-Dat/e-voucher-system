import nodemailer, { type Transporter } from 'nodemailer';

let transporter: Transporter | null = null;

const getTransporter = (): Transporter => {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!user || !pass) {
    throw {
      status: 503,
      message: 'Dịch vụ gửi email chưa được cấu hình. Vui lòng thử lại sau.',
    };
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
  const user = process.env.GMAIL_USER!.trim();
  const fromName = process.env.GMAIL_FROM_NAME?.trim() || 'Lumina Partner';

  try {
    await mailTransporter.sendMail({
      from: { name: fromName, address: user },
      to: email,
      subject: 'Mã xác thực đăng ký đối tác Lumina',
      text: [
        `Mã OTP đăng ký tài khoản đối tác của bạn là: ${otp}`,
        `Mã có hiệu lực trong ${expiresInMinutes} phút.`,
        'Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.',
      ].join('\n\n'),
      html: `
        <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#1f2937">
          <h2 style="color:#6750a4">Xác thực đăng ký Lumina Partner</h2>
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
