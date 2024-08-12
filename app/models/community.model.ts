export type iWP_Community = {
  databaseId: number;
  title: string;
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
