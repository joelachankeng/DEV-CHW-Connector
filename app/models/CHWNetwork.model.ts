export type iWP_CHWNetwork = {
  databaseId: number;
  title: string;
  featuredImage: {
    node: {
      mediaItemUrl: string;
    };
  };
  chwNetworksFields: {
    about: string;
    communityGuidelines: string;
    totalMembers: number;
    isMember: boolean;
  };
};

export type iWP_CHWNetworks = {
  nodes: iWP_CHWNetwork[];
};
