declare module 'nodemailer' {
  export type TransportConfig = {
    host: string;
    port: number;
    secure: boolean;
    auth: { user: string; pass: string };
  };

  export type MailMessage = {
    from: string;
    to: string;
    subject: string;
    html?: string;
    text?: string;
  };

  export type Transport = {
    sendMail: (message: MailMessage) => Promise<unknown>;
  };

  export function createTransport(config: TransportConfig): Transport;

  const nodemailer: {
    createTransport: typeof createTransport;
  };

  export default nodemailer;
}
