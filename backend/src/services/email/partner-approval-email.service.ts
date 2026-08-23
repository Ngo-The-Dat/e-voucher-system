import nodemailer from 'nodemailer';

interface SendPartnerApprovalEmailParams {
  email: string;
  fullName: string;
  businessName: string;
}

export async function sendPartnerApprovalEmail({
  email,
  fullName,
  businessName,
}: SendPartnerApprovalEmailParams): Promise<void> {
  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, '');

  if (!user || !pass) {
    console.warn('[EmailService] GMAIL_USER hoặc GMAIL_APP_PASSWORD chưa được cấu hình. Bỏ qua việc gửi email phê duyệt.');
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
        
        <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
          Hồ sơ đăng ký tài khoản đối tác của bạn đã được phê duyệt thành công. Vui lòng truy cập hệ thống và đăng nhập để bắt đầu sử dụng.
        </p>

        <p style="font-size: 13px; color: #64748b; margin: 0; line-height: 1.5;">
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
    subject: `[Vouchify Partner] Tài khoản đối tác của bạn đã được phê duyệt - ${businessName}`,
    text: `Kính gửi ${fullName} (Đại diện ${businessName}),\n\nHồ sơ đăng ký tài khoản đối tác của bạn đã được phê duyệt thành công. Vui lòng truy cập hệ thống và đăng nhập để bắt đầu sử dụng.\n\nTrân trọng,\nĐội ngũ Vouchify Marketplace`,
    html,
  });
}
