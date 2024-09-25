import axios from "axios";
import type { iMailGunTemplateMessage } from "~/models/mailgun.model";
import { APP_KEYS } from "~/session.server";

const mailgunAuth = btoa(`api:${APP_KEYS.PRIVATE.MAILGUN_API_KEY}`);

export abstract class MailGun {
  public static async sendTemplate(
    template: iMailGunTemplateMessage,
  ): Promise<void | Error> {
    if (process.env.NODE_ENV === "development") {
      console.log(
        "Email not sent in development mode. To send emails, set NODE_ENV to 'production' in .env file.",
        template,
      );
      return;
    }
    const params = new URLSearchParams({
      from: template.from,
      to: template.to,
      subject: template.subject,
      template: template.template,
      "h:X-Mailgun-Variables": JSON.stringify(
        template["h:X-Mailgun-Variables"],
      ),
    });
    if (template["h:X-Mailgun-Template-Version"]) {
      params.append(
        "h:X-Mailgun-Template-Version",
        template["h:X-Mailgun-Template-Version"],
      );
    }

    try {
      const response = await axios.post(
        `https://api.mailgun.net/v3/${APP_KEYS.PUBLIC.MAILGUN_DOMAIN}/messages`,
        params.toString(),
        {
          headers: {
            Authorization: `Basic ${mailgunAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      if (response.status == 200) return;
    } catch (error) {
      console.log(error);
    }
    return new Error("Failed to send email");
  }

  public static async sendResetPasswordTemplate(
    to: string,
    firstname: string,
    lastname: string,
    profileLink: string,
    code: string,
    resetLink: string,
  ): Promise<void | Error> {
    return this.sendTemplate({
      from: APP_KEYS.PUBLIC.MAILGUN_FROM,
      to,
      subject: `${firstname}, reset your password`,
      template: "chw connector default template",
      "h:X-Mailgun-Variables": {
        firstname,
        lastname,
        profileLink,
        code,
        resetLink,
        year: new Date().getFullYear().toString(),
      },
      "h:X-Mailgun-Template-Version": "reset password",
    });
  }

  public static async sendEmailConfirmationTemplate(
    to: string,
    firstname: string,
    lastname: string,
    profileLink: string,
    confirm_link: string,
  ): Promise<void | Error> {
    return this.sendTemplate({
      from: APP_KEYS.PUBLIC.MAILGUN_FROM,
      to,
      subject: `${firstname}`,
      template: "chw connector default template",
      "h:X-Mailgun-Variables": {
        firstname,
        lastname,
        profileLink,
        confirm_link,
        year: new Date().getFullYear().toString(),
      },
      "h:X-Mailgun-Template-Version": "email change confirmation",
    });
  }
}
