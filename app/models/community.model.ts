import type { iWP_Status } from "./post.model";

export type iWP_Community = {
  databaseId: number;
  title: string;
  status: iWP_Status;
  featuredImage: {
    node: {
      mediaItemUrl: string;
    };
  };
  communitiesFields: {
    about: string;
    communityGuidelines: string;
    totalMembers: number;
    isMember: boolean;
  };
};

export type iWP_Communites = {
  nodes: iWP_Community[];
};
