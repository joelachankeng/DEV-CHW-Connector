import { gql } from "@apollo/client/core/core.cjs";
import { GraphQL } from "./graphql.control";
import type {
  iWP_Comment,
  iWP_Comments,
  iWP_Post,
  iWP_Posts,
  iWP_Posts_EmojisUser,
} from "~/models/post.model";

const POST_QUERY_FIELDS = (userId: string): string => `
  databaseId
  title
  date
  author {
    node {
      databaseId
      firstName
      lastName
      avatar {
        url
      }
    }
  }
  postFields {
    isReported(userId: ${userId})
    isSaved(userId: ${userId})
    content
    score
    totalComments {
      count
      collection {
        createdDate
        modifiedDate
        content
        databaseId
        parentId
        postId
        author {
          avatarUrl
          databaseId
          firstName
          lastName
        }
      }
    }
    totalShares(userId: ${userId}) {
      count
      userHasShared
    }
    totalEmojis {
      usersCount
      users {
        avatar
        name
        userId
        emojiId
      }
      collection {
        count
        emojiId
      }
    }
    network {
      node {
        ... on CHWNetwork {
          databaseId
          title
          featuredImage {
            node {
              mediaItemUrl
            }
          }
          chwNetworksFields {
            about
          }
        }
      }
    }
    community {
      node {
        ... on Community {
          databaseId
          title
          featuredImage {
            node {
              mediaItemUrl
            }
          }
          communitiesFields {
            about
          }
        }
      }
    }
  }
`;
const COMMENT_QUERY_FIELDS = (): string => `
  databaseId
  commentsField {
    parentId
    postId
    content
    author {
      databaseId
      firstName
      lastName
    }
  }
`;

export abstract class Feed {
  static API = class {
    static Post = class {
      public static async getPost(
        userId: string,
        postId: string,
      ): Promise<iWP_Post | null | Error> {
        return await GraphQL.query<iWP_Post | null>(
          gql`
          query MyQuery {
            post(id: "${postId}", idType: DATABASE_ID) {
              ${POST_QUERY_FIELDS(userId)}
            }
          }
        `,
          async (response) => {
            return (await response.data.post) as iWP_Post | null;
          },
        );
      }

      public static async getAllPosts(
        userId: string,
        sortBy: "DATE" | "POPULAR",
        type: "ALL" | "NETWORKS" | "COMMUNITIES",
        typeId?: string,
      ): Promise<iWP_Posts | null | Error> {
        return await GraphQL.query<iWP_Posts | null>(
          gql`
          query MyQuery {
            posts(
              where: { 
                orderby: { field: ${sortBy}, 
                order: DESC }, 
                feedUserId: ${userId},
                feedUserPostType: "${type}"
                ${typeId ? `feedUserPostTypePostId: ${typeId}` : ""}
              }
            ) {
              nodes {
                ${POST_QUERY_FIELDS(userId)}
              }
            }
          }
        `,
          async (response) => {
            return (await response.data.posts) as iWP_Posts | null;
          },
        );
      }

      public static async getAllSavedPosts(
        userId: string,
      ): Promise<iWP_Posts | null | Error> {
        return await GraphQL.query<iWP_Posts | null>(
          gql`
          query MyQuery {
            posts(
              where: { 
                orderby: { field: DATE, 
                order: DESC }, 
                feedSavesUserId: ${userId}
              }
            ) {
              nodes {
                ${POST_QUERY_FIELDS(userId)}
              }
            }
          }
        `,
          async (response) => {
            return (await response.data.posts) as iWP_Posts | null;
          },
        );
      }

      public static async savePost(
        userId: string,
        postId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          userSavePost(input: { postId: ${postId}, userId: ${userId} }) {
            clientMutationId
            message
            success
          }
        }
      `);
      }

      public static async unSavePost(
        userId: string,
        postId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          userUnSavePost(input: { postId: ${postId}, userId: ${userId} }) {
            clientMutationId
            message
            success
          }
        }
      `);
      }

      public static async reportPost(
        userId: string,
        postId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          userReportPost(input: { postId: ${postId}, userId: ${userId} }) {
            clientMutationId
            message
            success
          }
        }
      `);
      }

      public static async unReportPost(
        userId: string,
        postId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          userUnReportPost(input: { postId: ${postId}, userId: ${userId} }) {
            clientMutationId
            message
            success
          }
        }
      `);
      }

      public static async getPostReactionsUsers(
        postId: string,
        emojiId: string,
        offset?: number,
      ): Promise<iWP_Posts_EmojisUser | null | Error> {
        return await GraphQL.query<iWP_Posts_EmojisUser | null>(
          gql`
          query MyQuery {
            post(id: "${postId}", idType: DATABASE_ID) {
              postFields {
                totalEmojisUsersById(emojiId: "${emojiId}", offset: ${offset || 0}) {
                  avatar
                  emojiId
                  name
                  userId
                }
              }
            }
          }
        `,
          async (response) => {
            return (await response.data
              .postReactionsUsers) as iWP_Posts_EmojisUser | null;
          },
        );
      }

      public static async reactPost(
        userId: string,
        postId: string,
        emojiId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          userReactPost(input: { postId: ${postId}, userId: ${userId}, emojiId: "${emojiId}" }) {
            clientMutationId
            message
            success
          }
        }
      `);
      }

      public static async unReactPost(
        userId: string,
        postId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          userUnReactPost(input: { postId: ${postId}, userId: ${userId} }) {
            clientMutationId
            message
            success
          }
        }
      `);
      }

      public static async sharePost(
        userId: string,
        postId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          userSharePost(input: { postId: ${postId}, userId: ${userId} }) {
            clientMutationId
            message
            success
          }
        }
      `);
      }

      public static async createPost(
        userId: string,
        groupId: string,
        groupType: string,
        post: string,
      ): Promise<string | Error> {
        const post64 = btoa(encodeURIComponent(post)); // Encode to base64 to avoid special characters for GraphQL
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          createPostCustom(input: { 
            userId: ${userId}, 
            groupId: ${groupId}, 
            groupType: "${groupType}",
            post: "${post64}"
          }) {
            clientMutationId
            message
            success
          }
        }
      `);
      }

      public static async deletePost(postId: string): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          deletePost(input: { 
            id: "${postId}"
          }) {
            clientMutationId
          }
        }
      `);
      }
    };

    static Comment = class {
      public static async getComment(
        commentId: string,
      ): Promise<iWP_Comment | null | Error> {
        return await GraphQL.query<iWP_Comment | null>(
          gql`
          query MyQuery {
            postComment(id: "${commentId}", idType: DATABASE_ID) {
              ${COMMENT_QUERY_FIELDS()}
            }
          }
        `,
          async (response) => {
            return (await response.data.postComment) as iWP_Comment | null;
          },
        );
      }

      public static async getPostComments(
        postId: string,
      ): Promise<iWP_Comments | null | Error> {
        return await GraphQL.query<iWP_Comments | null>(
          gql`
          query MyQuery {
            postComments(where: {postId: ${postId}) {
              nodes {
                ${COMMENT_QUERY_FIELDS()}
              }
            }
          }
          `,
          async (response) => {
            return (await response.data.postComments) as iWP_Comments | null;
          },
        );
      }

      public static async createPostComment(
        userId: string,
        postId: string,
        parentId: string | null | undefined,
        comment: string,
      ): Promise<string | Error> {
        const comment64 = btoa(encodeURIComponent(comment)); // Encode to base64 to avoid special characters for GraphQL
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          createPostCommentCustom(input: { 
            postId: ${postId}, 
            userId: ${userId}, 
            parentId: ${parentId},
            comment: "${comment64}"
          }) {
            clientMutationId
            message
            success
          }
        }
      `);
      }

      public static async deleteComment(
        commentId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          deletePostComment(input: { 
            id: "${commentId}"
          }) {
            clientMutationId
          }
        }
      `);
      }
    };
  };
}
