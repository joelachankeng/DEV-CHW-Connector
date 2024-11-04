/***
 * To run this function locally, you can run the following command:
 * `netlify dev --port 4001`
 * The port number can be any port that is not in use.
 *
 * You can query this function by going to the following URL in your browser:
 * `http://localhost:4001/.netlify/functions/notifications`
 *
 * DON'T IMPORT ANY FUNCTIONS FROM A COMPONENT, IT WILL CAUSE AN ERROR
 */
import type { Context } from "@netlify/functions";
import { User } from "~/controllers/user.control";
import publicHealthAlertHandler from "./notifications/publicHealthAlert";
import type {
  iNotificationSettings,
  iWP_User_NotificationSettings,
} from "~/models/notifications.model";
import postHandler from "./notifications/post";
import { decryptUserSession } from "~/servers/userSession.server";
import messageHandler from "./notifications/message";
import type { iWP_Post, iWP_Post_Group_Type } from "~/models/post.model";
import reactionHandler from "./notifications/reaction";
import commentHandler from "./notifications/comment";

export default async (request: Request, context: Context) => {
  // console.log("request", request);

  const postType = request.headers.get("postType") as string | undefined;

  switch (postType?.toLowerCase()) {
    case "publichealthalert":
      await publicHealthAlertHandler(request, context);
      break;
    case "post":
      await postHandler(request, context);
      break;
    case "message":
      await messageHandler(request, context);
      break;
    case "reaction":
      await reactionHandler(request, context);
      break;
    case "comment":
      await commentHandler(request, context);
      break;
    default:
      return console.error("Invalid post type", postType);
  }
};

export const filterUserByNotificationSettings = (
  users: iWP_User_NotificationSettings[],
  func: (setting: iNotificationSettings) => boolean,
): iWP_User_NotificationSettings[] => {
  const filteredUsers: typeof users = [];
  users.forEach((user) => {
    const settings = user.notificationSettings;
    if (func(settings)) {
      filteredUsers.push(user);
    }
  });
  return filteredUsers;
};

export const validateSession = async (
  session: string,
): Promise<boolean | ReturnType<typeof User.API.validateToken>> => {
  const userToken = decryptUserSession(session);
  if (!userToken) {
    console.error("Unable to decrypt user session", userToken);
    return false;
  }

  const userData = await User.API.validateToken(userToken);
  if (!userData || userData instanceof Error) {
    console.error("Invalid user token", userData);
    return false;
  }
  return userData;
};

export const getPostGroupType = (
  post: iWP_Post,
):
  | {
      type: iWP_Post_Group_Type;
      id: number;
    }
  | undefined => {
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

  return { type: groupType, id: groupId };
};
