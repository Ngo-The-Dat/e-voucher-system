import nodemailer from 'nodemailer';

interface SendPartnerRejectionEmailParams {
  email: string;
  fullName: string;
  businessName: string;
  reason: string;
}

export async function sendPartnerRejectionEmail({
  email,
  fullName,
  businessName,
  reason,
}: SendPartnerRejectionEmailParams): Promise<void> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!user || !pass) {
    console.warn('[EmailService] GMAIL_USER hoặc GMAIL_APP_PASSWORD chưa được cấu hình. Bỏ qua việc gửi email từ chối.');
    return;
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });

  const fromName = process.env.GMAIL_FROM_NAME?.trim() || 'Vouchify Partner';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #1e293b;">
      <!-- Header -->
      <div style="background-color: #0f2c59; padding: 24px 32px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700;">Vouchify Marketplace</h1>
        <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 13px;">Kênh Đối tác Doanh nghiệp</p>
      </div>

      <!-- Body -->
      <div style="padding: 32px;">
        <p style="font-size: 15px; margin: 0 0 16px 0;">Kính gửi <strong>${fullName}</strong> (Đại diện <strong>${businessName}</strong>),</p>
        
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 16px 0;">
          Ban Quản trị <strong>Vouchify Marketplace</strong> xin thông báo hồ sơ đăng ký tài khoản đối tác của Quý đối tác <strong>chưa được phê duyệt</strong>.
        </p>

        <!-- Lý do từ chối -->
        <div style="background-color: #fff1f2; border: 1px solid #fecdd3; border-left: 4px solid #e11d48; border-radius: 8px; padding: 16px 20px; margin: 20px 0;">
          <p style="margin: 0 0 6px 0; font-size: 12px; text-transform: uppercase; font-weight: 700; color: #9f1239; letter-spacing: 0.5px;">
            Lý do từ chối:
          </p>
          <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #881337; font-weight: 500;">
            ${reason}
          </p>
        </div>

        <p style="font-size: 13px; color: #64748b; margin: 24px 0 0 0; line-height: 1.5;">
          Trân trọng,<br />
          <strong>Đội ngũ Vouchify Marketplace</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f8fafc; padding: 16px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
        <p style="font-size: 12px; color: #94a3b8; margin: 0;">
          © ${new Date().getFullYear()} Vouchify Marketplace. Mọi quyền được bảo lưu.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: { name: fromName, address: user },
    to: email,
    subject: `[Vouchify Partner] Thông báo kết quả xét duyệt hồ sơ đối tác - ${businessName}`,
    text: `Kính gửi ${fullName} (Đại diện ${businessName}),\n\nHồ sơ đăng ký đối tác của bạn chưa được phê duyệt.\nLý do từ chối: ${reason}\n\nTrân trọng,\nĐội ngũ Vouchify Marketplace`,
    html,
  });
}
