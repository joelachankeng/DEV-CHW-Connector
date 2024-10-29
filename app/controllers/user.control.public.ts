import { USER_ROLES } from "~/constants";
import type {
  iMemberClicksProfileAttributes,
  iPublic_MemberClicksProfileAttributes,
} from "~/models/memberClicks.model";
import type { iWP_Post } from "~/models/post.model";
import type { iWP_User } from "~/models/user.model";
import type { iProfileFormFields } from "~/routes/settings/edit-profile";
import USA_States from "~/utilities/US-states.json";

export abstract class UserPublic {
  public static Utils = class {
    public static userIsAdmin(user: iWP_User | undefined): boolean {
      if (!user) return false;
      const isAdmin = user.roles.nodes.find((n) => n.name === USER_ROLES.ADMIN);
      return isAdmin ? true : false;
    }

    public static userCanPostInGroup(
      user: iWP_User | undefined,
      groupId: number,
    ): boolean {
      // check if user has admin privileges for the group
      if (!user) return false;
      if (user.roles.nodes.find((n) => n.name === USER_ROLES.ADMIN))
        return true;

      if (!user.userFields.groupAdminAll) return false;
      return user.userFields.groupAdminAll.includes(groupId);
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

    public static getLocation = (fields: iProfileFormFields): string => {
      const findState = USA_States.find(
        (state) => state.abbreviation === fields.state.value,
      );
      if (!findState) return "";

      let location = findState.name;
      if (fields.zipCode.value) location += `, ${fields.zipCode.value}`;
      return location;
    };

    public static isAllyMember = (
      profile:
        | iMemberClicksProfileAttributes
        | iPublic_MemberClicksProfileAttributes,
    ): boolean => {
      if (!profile) return false;
      if (!("[Member Type]" in profile)) return false;
      const memberType = profile["[Member Type]"];
      if (typeof memberType !== "string") return false;
      return memberType.toLowerCase() === "ally organization member";
    };
  };
}
