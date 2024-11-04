import type { Context } from "@netlify/functions";
import invariant from "tiny-invariant";
import { APP_ROUTES } from "~/constants";
import { MailGun } from "~/controllers/mailgun.control";
import { OneSignal } from "~/controllers/OneSignal.control";
import { PublicHealthAlert } from "~/controllers/publicHealthAlert.control";
import { User } from "~/controllers/user.control";
import { excerpts } from "~/utilities/excerpts";
import { getRequestDomain } from "~/utilities/main";
import { filterUserByNotificationSettings, isDevMode } from "../notifications";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

export default async function publicHealthAlertHandler(
  request: Request,
  context: Context,
) {
  if (request.method !== "POST") return;

  const authorization = request.headers.get("authorization") as string;
  const postId = request.headers.get("postId") as string;

  if (!postId) return console.error("Invalid post ID", postId);
  if (authorization !== process.env.SESSION_SECRET) {
    return console.error("Invalid authorization", authorization);
  }

  const alert = await PublicHealthAlert.API.getAlert(parseInt(postId));
  if (!alert || alert instanceof Error)
    return console.error("Invalid alert", alert);

  let allUsers = await User.API.getNotificationSettings("ALL USERS");

  if (!allUsers || allUsers instanceof Error)
    return console.error("Unable to get all users", allUsers);

  //DEV MODE ===================================
  if (isDevMode(request)) {
    allUsers = allUsers.filter((u) => u.admin === true);
  }
  //=================================================

  const emailUsers = filterUserByNotificationSettings(
    allUsers,
    (settings) =>
      settings["Mobilization Alerts"]["Public Health Alerts"]
        .emailNotifications === true,
  );
  const pushUsers = filterUserByNotificationSettings(
    allUsers,
    (settings) =>
      settings["Mobilization Alerts"]["Public Health Alerts"]
        .pushNotifications === true,
  );

  if (emailUsers.length > 0) {
    const bcc = emailUsers.map((m) => m.user_email).join(", ");
    console.log("Sending email notifications to", bcc);

    const result = await MailGun.sendPublicHealthAlertTemplate(
      {
        to: emailUsers[0].user_email,
        bcc: bcc,
        firstname: "",
        lastname: "",
        profileLink: "",
      },
      alert.title,
      alert.content,
      `${getRequestDomain(request)}${APP_ROUTES.PUBLIC_HEALTH_ALERTS}/${alert.databaseId}`,
    );
    if (result instanceof Error)
      console.error("An error occurred sending email", result);
  } else {
    console.error("No users to send email notifications to");
  }

  if (pushUsers.length > 0) {
    let emails = pushUsers.map((m) => m.user_email);
    emails =
      process.env.NODE_ENV === "development"
        ? ["jachankeng+1@hria.org"]
        : emails;
    console.log("Sending push notifications to", emails);

    const result = await OneSignal.API.sendPushNotification({
      emails:
        process.env.NODE_ENV === "development"
          ? ["jachankeng+1@hria.org"]
          : emails,
      headings: { en: "New Public Health Alert" },
      subtitle: { en: alert.title },
      contents: { en: excerpts(alert.content, { characters: 100 }) },
      name: `Automated Push Notification for Public Health Alert: ${alert.databaseId}`,
      url: `${getRequestDomain(request)}${APP_ROUTES.PUBLIC_HEALTH_ALERTS}/${alert.databaseId}`,
      data: {
        emails: emails.join(","),
      },
    });
    if (result instanceof Error)
      console.error("An error occurred sending push notification", result);
  } else {
    console.error("No users to send push notifications to");
  }
}
