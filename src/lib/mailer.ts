import 'server-only';

type SendMailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

type SendMailResult =
  | { ok: true; mode: 'console' }
  | { ok: true; mode: 'smtp' }
  | { ok: false; mode: 'smtp'; error: string };

const URL_PATTERN = /https?:\/\/[^\s"'<>]+/gi;

function extractUrls(content?: string): string[] {
  if (!content) return [];
  const matches = content.match(URL_PATTERN);
  return matches ? Array.from(new Set(matches)) : [];
}

function hasSmtpConfig(): boolean {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

export async function sendMail({
  to,
  subject,
  html,
  text,
}: SendMailInput): Promise<SendMailResult> {
  if (!hasSmtpConfig()) {
    const urls = Array.from(new Set([...extractUrls(text), ...extractUrls(html)]));

    console.log('================ DEV MAIL FALLBACK ================');
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);

    if (text) {
      console.log('TEXT:');
      console.log(text);
    }

    if (urls.length > 0) {
      console.log('URLS:');
      for (const url of urls) {
        console.log(`- ${url}`);
      }
    }

    console.log('===================================================');

    return { ok: true, mode: 'console' };
  }

  try {
    const nodemailerName = 'nodemailer';
    const nodemailerModule = (await import(nodemailerName)) as {
      default?: {
        createTransport: (config: {
          host: string;
          port: number;
          secure: boolean;
          auth: { user: string; pass: string };
        }) => {
          sendMail: (message: {
            from: string;
            to: string;
            subject: string;
            html?: string;
            text?: string;
          }) => Promise<unknown>;
        };
      };
      createTransport?: (config: {
        host: string;
        port: number;
        secure: boolean;
        auth: { user: string; pass: string };
      }) => {
        sendMail: (message: {
          from: string;
          to: string;
          subject: string;
          html?: string;
          text?: string;
        }) => Promise<unknown>;
      };
    };

    const createTransport =
      nodemailerModule.default?.createTransport ?? nodemailerModule.createTransport;

    if (!createTransport) {
      return { ok: false, mode: 'smtp', error: 'nodemailer is unavailable' };
    }

    const transport = createTransport({
      host: process.env.SMTP_HOST!,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASS!,
      },
    });

    await transport.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER!,
      to,
      subject,
      html,
      text,
    });

    return { ok: true, mode: 'smtp' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SMTP send failed';
    console.error('Failed to send mail via SMTP:', error);
    return { ok: false, mode: 'smtp', error: message };
  }
}
