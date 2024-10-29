export type iMailGunTemplateMessage = {
  from: string;
  to: string;
  bcc?: string;
  subject: string;
  template: string;
  "h:X-Mailgun-Variables": {
    [key: string]: string;
  };
  "h:X-Mailgun-Template-Version"?: string;
};
