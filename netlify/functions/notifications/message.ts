import type { Context } from "@netlify/functions";
import { APP_ROUTES } from "~/constants";
import { OneSignal } from "~/controllers/OneSignal.control";
import { User } from "~/controllers/user.control";
import {
  getRequestDomain,
  getParagraphTextFromEditorData,
} from "~/utilities/main";
import {
  filterUserByNotificationSettings,
  isDevMode,
  validateSession,
} from "../notifications";
import { excerpts } from "~/utilities/excerpts";
import { MailGun } from "~/controllers/mailgun.control";
import { Message } from "~/controllers/message.control";
import { UserPublic } from "~/controllers/user.control.public";

export default async function messageHandler(
  request: Request,
  context: Context,
) {
  if (request.method !== "POST") return;

  const session = request.headers.get("session") as string;
  const postId = request.headers.get("postId") as string;

  const userData = await validateSession(session);
  if (typeof userData === "boolean" || userData === undefined)
    return console.error("Invalid session", session);

  const parseId = parseInt(postId);
  if (isNaN(parseId)) return console.error("Invalid post ID", postId);

  const message = await Message.API.getMessage(
    userData.user.ID.toString(),
    parseId.toString(),
  );
  if (!message || message instanceof Error)
    return console.error("There was an error getting the message", message);

  if (message.author.node.databaseId.toString() !== userData.user.ID.toString())
    return console.error("User is not the author of the message");

  const sender = await User.API.getUser(
    message.author.node.databaseId.toString(),
    "DATABASE_ID",
  );

  if (!sender || sender instanceof Error)
    return console.error("There was an error getting the sender", sender);

  const recieverUser = await User.API.getUser(
    message.messageFields.receiverId.toString(),
    "DATABASE_ID",
  );

  if (!recieverUser || recieverUser instanceof Error)
    return console.error(
      "There was an error getting the reciever user",
      recieverUser,
    );

  //DEV MODE ===================================
  if (isDevMode(request)) {
    if (UserPublic.Utils.userIsAdmin(recieverUser) === false)
      return console.log("Reciever is not an admin");
  }
  //=================================================

  const excerpt = excerpts(
    getParagraphTextFromEditorData(message.messageFields.content),
    { characters: 100 },
  );

  const title = `New Message from ${sender.firstName} ${sender.lastName}`;
  const url = `${APP_ROUTES.MESSAGES}/${userData.user.ID}`;
  const fullUrl = `${getRequestDomain(request)}${url}`;

  //   NotificationControl.API.create({
  //     id: 0, // SQL will auto-increment the ID
  //     user_id: recieverUser.databaseId,
  //     type: postType as iWP_NotificationTypes,
  //     user_url: `${APP_ROUTES.PROFILE}/${message.author.node.databaseId}`,
  //     avatar: sender.avatar.url || "",
  //     url: url,
  //     full_name: title,
  //     is_read: false,
  //     excerpt: excerpt,
  //     date: "",
  //   }).catch((error) => {
  //     console.error("Error creating notification", error);
  //   });

  const users = await User.API.getNotificationSettings({
    userIds: [recieverUser.databaseId],
  });

  if (!users || users instanceof Error)
    return console.error("Unable to get notification settings", users);

  const emailUsers = filterUserByNotificationSettings(
    users,
    (settings) =>
      settings.Messaging["Direct Messages"].emailNotifications === true,
  );
  const pushUsers = filterUserByNotificationSettings(
    users,
    (settings) =>
      settings.Messaging["Direct Messages"].pushNotifications === true,
  );

  if (emailUsers.length > 0) {
    const bcc = emailUsers.map((m) => m.user_email).join(", ");
    console.log("Sending email notifications to", bcc);

    const result = await MailGun.sendNewMessageTemplate(
      {
        to: emailUsers[0].user_email,
        bcc: bcc,
        firstname: "",
        lastname: "",
        profileLink: "",
      },
      `${sender.firstName} ${sender.lastName}`,
      excerpt,
      fullUrl,
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
      emails: emails,
      headings: {
        en: "New Message",
      },
      subtitle: {
        en: `${sender.firstName} ${sender.lastName}`,
      },
      contents: { en: excerpt },
      name: `Automated Push Notification for New Message: ${message.databaseId}`,
      url: fullUrl,
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
