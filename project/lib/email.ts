import nodemailer from 'nodemailer';

type EmailNotification = {
  sent: boolean;
  message?: string;
};

export async function sendEmail(
  to: string,
  subject: string,
  text: string,
): Promise<EmailNotification> {
  const user = process.env.SMTP_USER;
  const appPassword = process.env.SMTP_APP_PASSWORD;

  if (!user || !appPassword) {
    return {
      sent: false,
      message: 'Gmail SMTP is not configured yet.',
    };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass: appPassword.replace(/\s/g, ''),
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM_NAME
      ? `"${process.env.SMTP_FROM_NAME}" <${user}>`
      : user,
    to,
    subject,
    text,
  });

  return { sent: true };
}

export async function sendBusinessEmail(subject: string, text: string) {
  return sendEmail(
    process.env.BUSINESS_EMAIL || 'soham7surgical@gmail.com',
    subject,
    text,
  );
}
