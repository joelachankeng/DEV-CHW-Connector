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
  isDevMode,
  validateSession,
} from "../notifications";
import { excerpts } from "~/utilities/excerpts";
import { MailGun } from "~/controllers/mailgun.control";
import { Feed } from "~/controllers/feed.control";
import { NotificationControl } from "~/controllers/notification.control";
import type { iWP_NotificationTypes } from "~/models/notifications.model";
import type { iWP_Comment_Ancesstors } from "~/models/post.model";
import axios, { isAxiosError } from "axios";

export default async function commentHandler(
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

  const comment = await Feed.API.Comment.getComment(
    userData.user.ID.toString(),
    parseId.toString(),
  );
  if (!comment || comment instanceof Error)
    return console.error("There was an error getting the comment", comment);

  const post = await Feed.API.Post.getPost(
    userData.user.ID.toString(),
    comment.commentsField.postId.toString(),
  );
  if (!post || post instanceof Error)
    return console.error("There was an error getting the post", post);

  const postCreator = await User.API.getUser(
    post.author.node.databaseId.toString(),
    "DATABASE_ID",
  );
  if (!postCreator || postCreator instanceof Error)
    return console.error(
      "There was an error getting the post creator",
      postCreator,
    );

  const poster = await User.API.getUser(
    comment.commentsField.author.databaseId.toString(),
    "DATABASE_ID",
  );

  if (!poster || poster instanceof Error)
    return console.error("There was an error getting the poster", poster);

  const ancestors = await getCommentAncestors(comment.databaseId);
  if (!ancestors || ancestors instanceof Error)
    return console.error("There was an error getting the ancestors", ancestors);

  const isReply = ancestors.length > 0;

  const title = isReply
    ? `New Reply on your comment`
    : `New Comment on your post`;
  const url = `${APP_ROUTES.POST}/${comment.commentsField.postId}/comment/${comment.databaseId}`;
  const fullUrl = `${getRequestDomain(request)}${url}`;

  const excerpt = excerpts(
    getParagraphTextFromEditorData(comment.commentsField.content),
    { characters: 100 },
  );

  const groupType = getPostGroupType(post);
  if (!groupType) return console.error("Could not get group type");

  const users: {
    id: number;
    email: string;
  }[] = [
    {
      id: post.author.node.databaseId,
      email: postCreator.email,
    },
  ];
  console.log("users", users);

  if (isReply) {
    ancestors.forEach((ancestor) => {
      if (users.find((u) => u.id.toString() === ancestor.author.id.toString()))
        return;
      users.push({
        id: ancestor.author.id,
        email: ancestor.author.email,
      });
    });
  }

  users.forEach((user) => {
    NotificationControl.API.create({
      id: 0, // SQL will auto-increment the ID
      user_id: user.id,
      type: postType as iWP_NotificationTypes,
      group_type: groupType.type,
      user_url: url,
      avatar: poster.avatar.url || "",
      url: url,
      full_name: title,
      is_read: false,
      excerpt: excerpt,
      date: "",
    }).catch((error) => {
      console.error("Error creating notification", error);
    });
  });

  let usersSettings = await User.API.getNotificationSettings({
    userIds: users.map((u) => u.id),
  });

  if (!usersSettings || usersSettings instanceof Error)
    return console.error("Unable to get notification settings", usersSettings);

  //DEV MODE ===================================
  if (isDevMode(request)) {
    usersSettings = usersSettings.filter((u) => {
      if (u.admin === true) return true;
      console.log("User is not an admin", u);
      return false;
    });
  }
  //=================================================

  const emailUsers = filterUserByNotificationSettings(
    usersSettings,
    (settings) => {
      const setting =
        groupType.type === "NETWORK"
          ? settings["CHW Network Groups"]
          : settings["Community Groups"];
      return setting.Reactions.emailNotifications === true;
    },
  );
  const pushUsers = filterUserByNotificationSettings(
    usersSettings,
    (settings) => {
      const setting =
        groupType.type === "NETWORK"
          ? settings["CHW Network Groups"]
          : settings["Community Groups"];
      return setting.Reactions.pushNotifications === true;
    },
  );

  if (emailUsers.length > 0) {
    const bcc = emailUsers.map((m) => m.user_email).join(", ");
    console.log("Sending email notifications to", bcc);

    const mailgunParams = {
      recipient: {
        to: emailUsers[0].user_email,
        bcc: bcc,
        firstname: "",
        lastname: "",
        profileLink: "",
      },
      commentator_full_name: `${poster.firstName} ${poster.lastName}`,
      comment_content: excerpt,
      comment_link: fullUrl,
    };

    const result = isReply
      ? await MailGun.sendNewCommentReplyTemplate(
          mailgunParams.recipient,
          mailgunParams.commentator_full_name,
          mailgunParams.comment_content,
          mailgunParams.comment_link,
        )
      : await MailGun.sendNewCommentTemplate(
          mailgunParams.recipient,
          mailgunParams.commentator_full_name,
          mailgunParams.comment_content,
          mailgunParams.comment_link,
        );

    if (result instanceof Error)
      console.error("An error occurred sending email", result);
  } else {
    console.error("No users to send email notifications to");
  }

  const groupName =
    post.postFields.community?.node.title ||
    post.postFields.network?.node.title ||
    `New ${isReply ? "Reply" : "Comment"}`;

  if (pushUsers.length > 0) {
    const emails = pushUsers.map((m) => m.user_email);
    console.log("Sending push notifications to", emails);

    const result = await OneSignal.API.sendPushNotification({
      emails:
        process.env.NODE_ENV === "production"
          ? emails
          : ["jachankeng+1@hria.org"],
      headings: {
        en: groupName,
      },
      subtitle: {
        en: `${poster.firstName} ${poster.lastName} ${
          isReply ? `replied to your comment` : `commented on your post`
        }`,
      },
      contents: { en: excerpt },
      name: `Automated Push Notification for New Comment: ${comment.databaseId}`,
      url: fullUrl,
    });
    if (result instanceof Error)
      console.error("An error occurred sending push notification", result);
  } else {
    console.error("No users to send push notifications to");
  }
}

const getCommentAncestors = async (
  id: number | string,
): Promise<Error | iWP_Comment_Ancesstors[]> => {
  const url = `${process.env.WP_REST_URL}/comment/ancestors`;

  try {
    const formData = new FormData();
    formData.append("authorization", process.env.SESSION_SECRET || "");
    formData.append("id", id.toString());
    const response = await axios.post(url, formData);
    if (response.data) {
      return response.data.ancestors as iWP_Comment_Ancesstors[];
    }
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      const data = error.response?.data;
      console.error("error.response", data);
      if (data) {
        if (typeof data === "string") return new Error(data);
        if (typeof data === "object") return new Error(JSON.stringify(data));
      }
    }
  }
  return new Error("An unexpected error occurred");
};
