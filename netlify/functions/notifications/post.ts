import type { Context } from "@netlify/functions";
import axios, { isAxiosError } from "axios";
import { APP_ROUTES } from "~/constants";
import { Feed } from "~/controllers/feed.control";
import { NotificationControl } from "~/controllers/notification.control";
import { OneSignal } from "~/controllers/OneSignal.control";
import { User } from "~/controllers/user.control";
import type { iWP_Post_Group_Type } from "~/models/post.model";
import { decryptUserSession } from "~/servers/userSession.server";
import {
  parseDateTimeGraphql,
  getCurrentDateTime,
  getRequestDomain,
  getParagraphTextFromEditorData,
} from "~/utilities/main";
import {
  filterUserByNotificationSettings,
  isDevMode,
  validateSession,
} from "../notifications";
import { excerpts } from "~/utilities/excerpts";
import type { iWP_NotificationTypes } from "~/models/notifications.model";
import { MailGun } from "~/controllers/mailgun.control";

type iGroupMember = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  admin: boolean;
};

export default async function postHandler(request: Request, context: Context) {
  if (request.method !== "POST") return;

  const session = request.headers.get("session") as string;
  const postId = request.headers.get("postId") as string;
  const postType = request.headers.get("postType") as string;

  const postTypes: iWP_NotificationTypes[] = [
    "comment",
    "post",
    "reaction",
    "mention",
    "message",
  ];

  if (!postTypes.includes(postType as iWP_NotificationTypes)) {
    return console.error("Invalid post type", postType);
  }

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

  const postNetworkID = post.postFields.network?.node.databaseId;
  const postCommunityID = post.postFields.community?.node.databaseId;

  const groupType: iWP_Post_Group_Type = postNetworkID
    ? "NETWORK"
    : "COMMUNITY";

  const groupId = postNetworkID || postCommunityID;
  if (!groupId) {
    console.error(`Post does not belong to a network or community`, post);
    console.error("postNetworkID", postNetworkID);
    console.error("postCommunityID", postCommunityID);
    return;
  }

  let user_url = `${APP_ROUTES.PROFILE}/${post.author.node.databaseId}`;
  let avatar = post.author.node.avatar.url;
  const group_url = `${
    groupType === "COMMUNITY" ? APP_ROUTES.COMMUNITIES : APP_ROUTES.CHW_NETWORKS
  }/${groupId}`;
  const groupName =
    post.postFields.community?.node.title ||
    post.postFields.network?.node.title ||
    "";

  const authorName = `${post.author.node.firstName} ${post.author.node.lastName}`;
  const title = `New Post in ${groupName}`;
  const excerpt = excerpts(
    getParagraphTextFromEditorData(post.postFields.content),
    { characters: 100 },
  );

  if (post.postFields.poster === "GROUP") {
    user_url = group_url;
    avatar =
      post.postFields.network?.node.featuredImage.node.mediaItemUrl ||
      post.postFields.community?.node.featuredImage.node.mediaItemUrl ||
      "";
  }

  const url = `${APP_ROUTES.POST}/${post.databaseId}`;
  const fullUrl = `${getRequestDomain(request)}${url}`;

  let members = await getGroupMembers(groupId, groupType);
  if (members instanceof Error) return console.error(members);

  //DEV MODE ===================================
  if (isDevMode(request)) {
    members = members.filter((u) => u.admin === true);
  }
  //=================================================

  const uniqueMembers: iGroupMember[] = [];
  members.forEach((member) => {
    if (uniqueMembers.find((m) => m.id.toString() === member.id.toString()))
      return;
    uniqueMembers.push(member);
  });

  const offline: iGroupMember[] = [];

  await Promise.all(
    uniqueMembers.map(async (member) => {
      NotificationControl.API.create({
        id: 0, // SQL will auto-increment the ID
        user_id: parseInt(member.id),
        type: postType as iWP_NotificationTypes,
        user_url: user_url,
        group_id: groupId,
        group_type: groupType,
        group_url: group_url,
        avatar: avatar || "",
        url: url,
        full_name: title,
        is_read: false,
        excerpt: excerpt,
        date: "",
      }).catch((error) => {
        console.error("Error creating notification", error);
      });

      let isOnline = false;
      const lastOnline = await User.API.getLastOnline(member.id);

      // if lastOnline is less than 2 minutes ago, then the user is online
      if (!(lastOnline instanceof Error) && lastOnline !== null) {
        const lastOnlineConverted = parseDateTimeGraphql(lastOnline);
        if (lastOnlineConverted.isValid) {
          const minutesPassed = getCurrentDateTime()
            .diff(lastOnlineConverted)
            .as("minutes");
          if (minutesPassed < 2) {
            isOnline = true;
          }
        }
      }

      console.log(`User ${member.name} is ${isOnline ? "online" : "offline"}`);
      if (isOnline) {
        // creating a notification automatically sends a platform notification
      } else {
        offline.push(member);
      }
    }),
  );

  const users = await User.API.getNotificationSettings({
    userIds: uniqueMembers.map((m) => m.id),
  });
  if (!users || users instanceof Error)
    return console.error("Unable to get notification settings", users);

  const emailUsers = filterUserByNotificationSettings(users, (settings) => {
    const setting =
      groupType === "NETWORK"
        ? settings["CHW Network Groups"]
        : settings["Community Groups"];
    return setting["New Posts"].emailNotifications === true;
  });
  const pushUsers = filterUserByNotificationSettings(users, (settings) => {
    const setting =
      groupType === "NETWORK"
        ? settings["CHW Network Groups"]
        : settings["Community Groups"];
    return setting["New Posts"].pushNotifications === true;
  });

  if (emailUsers.length > 0) {
    const bcc = emailUsers.map((m) => m.user_email).join(", ");
    console.log("Sending email notifications to", bcc);

    const result = await MailGun.sendNewPostTemplate(
      {
        to: emailUsers[0].user_email,
        bcc: bcc,
        firstname: "",
        lastname: "",
        profileLink: "",
      },
      post.title,
      excerpt,
      fullUrl,
      groupName,
      post.postFields.poster === "GROUP" ? groupName : authorName,
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
      emails:
        process.env.NODE_ENV === "production"
          ? emails
          : ["jachankeng+1@hria.org"],
      headings: {
        en: "New Post".concat(
          post.postFields.poster === "GROUP" ? "" : ` in ${groupName}`,
        ),
      },
      subtitle: {
        en: post.postFields.poster === "GROUP" ? groupName : authorName,
      },
      contents: { en: excerpt },
      name: `Automated Push Notification for New Post: ${post.databaseId}`,
      url: fullUrl,
    });
    if (result instanceof Error)
      console.error("An error occurred sending push notification", result);
  } else {
    console.error("No users to send push notifications to");
  }
}

const getGroupMembers = async (
  groupId: number,
  groupType: iWP_Post_Group_Type,
): Promise<Error | iGroupMember[]> => {
  const url = `${process.env.WP_REST_URL}/${
    groupType === "NETWORK" ? "network" : "community"
  }/members`;

  try {
    const formData = new FormData();
    formData.append("authorization", process.env.SESSION_SECRET || "");
    formData.append("id", groupId.toString());
    const response = await axios.post(url, formData);
    if (response.data) {
      return response.data.members as iGroupMember[];
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
