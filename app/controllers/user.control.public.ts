import { USER_ROLES } from "~/constants";
import type { iWP_Post } from "~/models/post.model";
import type { iWP_User } from "~/models/user.model";

export abstract class UserPublic {
  public static Utils = class {
    public static userCanPostInGroup(
      user: iWP_User | undefined,
      networkID: number,
    ): boolean {
      if (!user) return false;
      if (user.roles.nodes.find((n) => n.name === USER_ROLES.ADMIN))
        return true;

      if (!user.userFields.groupAdminAll) return false;
      return user.userFields.groupAdminAll.includes(networkID);
    }

    public static userCanDeletePost(
      user: iWP_User | undefined,
      post: iWP_Post,
    ): boolean {
      if (!user) return false;

      // original creator
      if (user.databaseId === post.author.node.databaseId) return true;

      // user is admin
      if (user.roles.nodes.find((n) => n.name === USER_ROLES.ADMIN))
        return true;

      const postNetworkID = post.postFields.network?.node.databaseId;
      const postCommunityID = post.postFields.community?.node.databaseId;

      // user is network admin
      if (
        postNetworkID &&
        user.userFields.groupAdminAll?.includes(postNetworkID)
      )
        return true;

      // user is community admin
      if (
        postCommunityID &&
        user.userFields.groupAdminAll?.includes(postCommunityID)
      )
        return true;

      return false;
    }

    public static userCanDeleteComment(
      user: iWP_User | undefined,
      groupId: number | undefined,
      authorId: number,
    ): boolean {
      if (!user) return false;

      // original creator
      if (user.databaseId === authorId) return true;

      // user is admin
      if (user.roles.nodes.find((n) => n.name === USER_ROLES.ADMIN))
        return true;

      if (!groupId) return false;

      return user.userFields.groupAdminAll &&
        user.userFields.groupAdminAll.includes(groupId)
        ? true
        : false;
    }
  };
}
