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
  getPostGroupType,
  validateSession,
} from "../notifications";
import { excerpts } from "~/utilities/excerpts";
import { MailGun } from "~/controllers/mailgun.control";
import { Feed } from "~/controllers/feed.control";
import { NotificationControl } from "~/controllers/notification.control";
import type { iWP_NotificationTypes } from "~/models/notifications.model";
import { UserPublic } from "~/controllers/user.control.public";

export default async function reactionHandler(
  request: Request,
  context: Context,
) {
  if (request.method !== "POST") return;

  const session = request.headers.get("session") as string;
  const postId = request.headers.get("postId") as string;
  const postType = request.headers.get("postType") as string;

  const userData = await validateSession(session);
  if (typeof userData === "boolean" || userData === undefined)
    return console.error("Invalid session", session);

  const parseId = parseInt(postId);
  if (isNaN(parseId)) return console.error("Invalid post ID", postId);

  const post = await Feed.API.Post.getPost(
    userData.user.ID.toString(),
    parseId.toString(),
  );
  if (!post || post instanceof Error)
    return console.error("There was an error getting the post", post);

  const userEmoji = post.postFields.totalEmojis.users?.find(
    (u) => u.userId.toString() === userData.user.ID.toString(),
  );

  if (!userEmoji) return console.error("Could not find user emoji");

  const currentUser = await User.API.getUser(
    userData.user.ID.toString(),
    "DATABASE_ID",
  );

  if (!currentUser || currentUser instanceof Error)
    return console.error(
      "There was an error getting the currentUser",
      currentUser,
    );

  const poster = await User.API.getUser(
    post.author.node.databaseId.toString(),
    "DATABASE_ID",
  );

  if (!poster || poster instanceof Error)
    return console.error("There was an error getting the poster", poster);

  //DEV MODE ===================================
  if (UserPublic.Utils.userIsAdmin(poster) === false)
    return console.log("Poster is not an admin");
  //=================================================

  const title = `New Reaction`;
  const url = `${APP_ROUTES.POST}/${post.databaseId}`;
  const fullUrl = `${getRequestDomain(request)}${url}`;

  const excerpt = excerpts(
    `${currentUser.firstName} ${currentUser.lastName} reacted via ${userEmoji.emojiId}`,
  );

  const postExcerpt = excerpts(
    getParagraphTextFromEditorData(post.postFields.content),
    { characters: 100 },
  );

  const groupType = getPostGroupType(post);
  if (!groupType) return console.error("Could not get group type");

  NotificationControl.API.create({
    id: 0, // SQL will auto-increment the ID
    user_id: post.author.node.databaseId,
    type: postType as iWP_NotificationTypes,
    group_type: groupType.type,
    user_url: `${APP_ROUTES.PROFILE}/${currentUser.databaseId}`,
    avatar: currentUser.avatar.url || "",
    url: url,
    full_name: title,
    is_read: false,
    excerpt: excerpt,
    date: "",
  }).catch((error) => {
    console.error("Error creating notification", error);
  });

  const users = await User.API.getNotificationSettings({
    userIds: [post.author.node.databaseId],
  });

  if (!users || users instanceof Error)
    return console.error("Unable to get notification settings", users);

  const emailUsers = filterUserByNotificationSettings(users, (settings) => {
    const setting =
      groupType.type === "NETWORK"
        ? settings["CHW Network Groups"]
        : settings["Community Groups"];
    return setting.Reactions.emailNotifications === true;
  });
  const pushUsers = filterUserByNotificationSettings(users, (settings) => {
    const setting =
      groupType.type === "NETWORK"
        ? settings["CHW Network Groups"]
        : settings["Community Groups"];
    return setting.Reactions.pushNotifications === true;
  });

  if (emailUsers.length > 0) {
    const bcc = emailUsers.map((m) => m.user_email).join(", ");
    console.log("Sending email notifications to", bcc);

    const result = await MailGun.sendNewPostReactionTemplate(
      {
        to: emailUsers[0].user_email,
        bcc: bcc,
        firstname: "",
        lastname: "",
        profileLink: "",
      },
      `${currentUser.firstName} ${currentUser.lastName}`,
      userEmoji.emojiId,
      postExcerpt,
      fullUrl,
    );
    if (result instanceof Error)
      console.error("An error occurred sending email", result);
  } else {
    console.error("No users to send email notifications to");
  }

  if (pushUsers.length > 0) {
    const emails = pushUsers.map((m) => m.user_email);
    console.log("Sending push notifications to", emails);

    const result = await OneSignal.API.sendPushNotification({
      emails: ["jachankeng+1@hria.org"],
      // emails: emails,
      headings: {
        en: "New Reaction",
      },
      subtitle: {
        en: `${currentUser.firstName} ${currentUser.lastName}`,
      },
      contents: { en: userEmoji.emojiId },
      name: `Automated Push Notification for New Post Reaction: ${userEmoji.userId}`,
      url: fullUrl,
    });
    if (result instanceof Error)
      console.error("An error occurred sending push notification", result);
  } else {
    console.error("No users to send push notifications to");
  }
}
