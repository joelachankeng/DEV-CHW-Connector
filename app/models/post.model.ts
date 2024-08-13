export type iWP_Post = {
  databaseId: number;
  title: string;
  date: string;
  author: {
    node: {
      databaseId: number;
      firstName?: string;
      lastName?: string;
      avatar: {
        url?: string;
      };
    };
  };
  postFields: {
    poster: "USER" | "GROUP";
    isReported: boolean;
    isSaved: boolean;
    content: string;
    score: number;
    totalComments: {
      count: number;
      collection: {
        createdDate: string;
        modifiedDate: string;
        databaseId: number;
        parentId?: number;
        postId: number;
        content: string;
        author: {
          databaseId: number;
          avatarUrl: string;
          firstName: string;
          lastName: string;
        };
      }[];
    };
    totalShares: {
      count: number;
      userHasShared: boolean;
    };
    totalEmojis: {
      usersCount: number;
      users?: iWP_Posts_EmojisUser[];
      collection?: {
        count: number;
        emojiId: string;
      }[];
    };
    network?: {
      node: {
        databaseId: number;
        title: string;
        featuredImage: {
          node: {
            mediaItemUrl: string;
          };
        };
        chwNetworksFields: {
          about: string;
        };
      };
    };
    community?: {
      node: {
        databaseId: number;
        title: string;
        featuredImage: {
          node: {
            mediaItemUrl: string;
          };
        };
        communitiesFields: {
          about: string;
        };
      };
    };
    comments: iWP_Comments;
  };
};

export type iWP_Posts_EmojisUser = {
  avatar: string;
  name: string;
  userId: number;
  emojiId: string;
};

export type iWP_Posts = {
  nodes: iWP_Post[];
};

export type iWP_Comment = {
  databaseId: number;
  commentsField: {
    parentId?: number;
    postId: number;
    content: string;
    author: {
      databaseId: number;
      firstName: string;
      lastName: string;
      avatarUrl: string;
    };
  };
};

export type iWP_Comments = {
  nodes: iWP_Comment[];
};

export type iWP_Post_Group_Type = "NETWORK" | "COMMUNITY";
