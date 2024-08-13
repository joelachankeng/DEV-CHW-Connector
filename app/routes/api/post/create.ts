import { ActionFunctionArgs, json } from "@remix-run/node";
import { USER_ROLES } from "~/constants";
import { CHWNetwork } from "~/controllers/CHWNetwork.control";
import { Community } from "~/controllers/community.control";
import { Feed } from "~/controllers/feed.control";
import { User } from "~/controllers/user.control";
import { iWP_CHWNetwork } from "~/models/CHWNetwork.model";
import { iWP_Community } from "~/models/community.model";
import { iWP_Post, iWP_Post_Group_Type } from "~/models/post.model";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();

  const userId = JWTUser.user.ID;

  const frmGroupId = formData.get("groupId") as string;
  const groupType = formData.get("groupType") as iWP_Post_Group_Type;
  const post = formData.get("post") as string;
  const frmPoster = formData.get("poster") as string;

  const groupId: string | null = parseInt(frmGroupId)
    ? parseInt(frmGroupId).toString()
    : "0";

  if (groupId === "0") {
    return json({ error: "Invalid group ID" }, { status: 400 });
  }

  if (groupType !== "NETWORK" && groupType !== "COMMUNITY") {
    return json({ error: "Invalid group type" }, { status: 400 });
  }

  let groupData: null | Error | iWP_CHWNetwork | iWP_Community = null;

  if (groupType === "NETWORK") {
    groupData = await CHWNetwork.API.get(userId.toString(), groupId);
  } else {
    groupData = await Community.API.get(userId.toString(), groupId);
  }

  if (groupData === null) {
    return json({ error: "Invalid group ID" }, { status: 400 });
  }

  if (groupData instanceof Error) {
    return json({ error: groupData.message }, { status: 400 });
  }

  let poster: iWP_Post["postFields"]["poster"] = "USER";
  if (frmPoster === "GROUP") {
    const getUser = await User.Utils.getUserFromSession(request);
    if (getUser && !(getUser instanceof Error)) {
      if (getUser.databaseId.toString() === userId) {
        if (getUser.roles.nodes.find((n) => n.name === USER_ROLES.ADMIN)) {
          poster = "GROUP";
        }
      }
    }
  }

  let isMember = false;
  if ("chwNetworksFields" in groupData) {
    isMember = groupData.chwNetworksFields.isMember;
  } else if ("communitiesFields" in groupData) {
    isMember = groupData.communitiesFields.isMember;
  }

  if (!isMember) {
    return json(
      { error: "You are not a member of this group" },
      { status: 400 },
    );
  }

  const result = await Feed.API.Post.createPost(
    userId.toString(),
    groupId,
    groupType,
    post,
    poster,
  );

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json(result);
}
