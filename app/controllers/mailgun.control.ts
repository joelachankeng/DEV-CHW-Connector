import axios from "axios";
import type { iMailGunTemplateMessage } from "~/models/mailgun.model";
import { APP_KEYS } from "~/session.server";

type iMailGunTemplate_Recipient = {
  to: string;
  bcc?: string;
  firstname: string;
  lastname: string;
  profileLink: string;
};

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
      bcc: template.bcc || "",
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
    recipient: iMailGunTemplate_Recipient,
    code: string,
    resetLink: string,
  ): Promise<void | Error> {
    const { to, bcc, firstname, lastname, profileLink } = recipient;
    return this.sendTemplate({
      from: APP_KEYS.PUBLIC.MAILGUN_FROM,
      to,
      bcc,
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
    recipient: iMailGunTemplate_Recipient,
    confirm_link: string,
  ): Promise<void | Error> {
    const { to, bcc, firstname, lastname, profileLink } = recipient;
    return this.sendTemplate({
      from: APP_KEYS.PUBLIC.MAILGUN_FROM,
      to,
      bcc,
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

  public static async sendPublicHealthAlertTemplate(
    recipient: iMailGunTemplate_Recipient,
    alert_title: string,
    alert_content: string,
    alert_link: string,
  ): Promise<void | Error> {
    const { to, bcc, firstname, lastname, profileLink } = recipient;
    return this.sendTemplate({
      from: APP_KEYS.PUBLIC.MAILGUN_FROM,
      to,
      bcc,
      subject: "New Public Health Alert",
      template: "chw connector default template",
      "h:X-Mailgun-Variables": {
        firstname,
        lastname,
        profileLink,
        year: new Date().getFullYear().toString(),
        alert_title,
        alert_content,
        alert_link,
      },
      "h:X-Mailgun-Template-Version": "notification - public health alert",
    });
  }

  public static async sendNewPostTemplate(
    recipient: iMailGunTemplate_Recipient,
    post_title: string,
    post_content: string,
    post_link: string,
    group_name: string,
    author_name: string,
  ): Promise<void | Error> {
    const { to, bcc, firstname, lastname, profileLink } = recipient;
    return this.sendTemplate({
      from: APP_KEYS.PUBLIC.MAILGUN_FROM,
      to,
      bcc,
      subject: `New Post in ${group_name}`,
      template: "chw connector default template",
      "h:X-Mailgun-Variables": {
        firstname,
        lastname,
        profileLink,
        year: new Date().getFullYear().toString(),
        post_title,
        post_content,
        post_link,
        group_name,
        author_name,
      },
      "h:X-Mailgun-Template-Version": "notification - new post alert",
    });
  }

  public static async sendNewMessageTemplate(
    recipient: iMailGunTemplate_Recipient,
    sender_full_name: string,
    message_content: string,
    message_link: string,
  ): Promise<void | Error> {
    const { to, bcc, firstname, lastname, profileLink } = recipient;
    return this.sendTemplate({
      from: APP_KEYS.PUBLIC.MAILGUN_FROM,
      to,
      bcc,
      subject: `New Message from ${sender_full_name}`,
      template: "chw connector default template",
      "h:X-Mailgun-Variables": {
        firstname,
        lastname,
        profileLink,
        year: new Date().getFullYear().toString(),
        sender_full_name,
        message_content,
        message_link,
      },
      "h:X-Mailgun-Template-Version": "notification - message",
    });
  }

  public static async sendNewPostReactionTemplate(
    recipient: iMailGunTemplate_Recipient,
    reactor_full_name: string,
    emoji: string,
    post_content: string,
    post_link: string,
  ): Promise<void | Error> {
    const { to, bcc, firstname, lastname, profileLink } = recipient;
    return this.sendTemplate({
      from: APP_KEYS.PUBLIC.MAILGUN_FROM,
      to,
      bcc,
      subject: `New Reaction from ${reactor_full_name}`,
      template: "chw connector default template",
      "h:X-Mailgun-Variables": {
        firstname,
        lastname,
        profileLink,
        year: new Date().getFullYear().toString(),
        reactor_full_name,
        emoji,
        post_content,
        post_link,
      },
      "h:X-Mailgun-Template-Version": "notification - post reaction",
    });
  }
}
