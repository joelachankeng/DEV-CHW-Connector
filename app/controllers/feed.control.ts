import { gql } from "@apollo/client/core/core.cjs";
import type { iGraphQLPageInfo, iGraphQLPagination } from "./graphql.control";
import {
  createGraphQLPagination,
  GraphQL,
  GRAPHQL_CONSTANTS,
  printGraphQLPagination,
} from "./graphql.control";
import type {
  iWP_Comment,
  iWP_Comments,
  iWP_Post,
  iWP_Posts,
  iWP_Posts_EmojisUser,
} from "~/models/post.model";
import type { iMutationResponse } from "~/models/appContext.model";

export type iCreatePost = iMutationResponse & {
  post?: iWP_Post;
};
export type iCreatePostComment = iMutationResponse & {
  comment?: iWP_Comment;
};

export type iWP_Posts_Pagination = iWP_Posts & iGraphQLPageInfo;
export type iWP_Comments_Pagination = iWP_Comments & iGraphQLPageInfo;

const POST_QUERY_FIELDS = (userId: string): string => `
  databaseId
  title
  date
  status
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
    poster
    isReported(userId: ${userId})
    isSaved(userId: ${userId})
    content
    score
    totalComments
    firstComments {
      total
      nodes {
       ${COMMENT_QUERY_FIELDS(userId)}
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
        emojiIcon
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
const COMMENT_QUERY_FIELDS = (userId: string): string => `
  databaseId
  status
  createdDate
  modifiedDate
  totalReplies
  commentsField {
    parentId
    postId
    content
    isReported(userId: ${userId})
    author {
      avatarUrl
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
          (response) => {
            return transformPost(response.data.post) as iWP_Post | null;
          },
        );
      }

      public static async getAllPosts(
        userId: string,
        sortBy: "DATE" | "POPULAR",
        type: "ALL" | "NETWORKS" | "COMMUNITIES",
        typeId?: string,
        pagination?: iGraphQLPagination,
      ): Promise<iWP_Posts_Pagination | null | Error> {
        return await GraphQL.query<iWP_Posts_Pagination | null>(
          gql`
          query MyQuery {
            posts(
              ${printGraphQLPagination(createGraphQLPagination(pagination))}
              where: { 
                orderby: { field: ${sortBy}, 
                order: DESC }, 
                feedUserId: ${userId},
                feedUserPostType: "${type}"
                ${typeId ? `feedUserPostTypePostId: ${typeId}` : ""}
              }
            ) {
              ${GRAPHQL_CONSTANTS.PAGINATION.QUERY.PAGEINFO}
              nodes {
                ${POST_QUERY_FIELDS(userId)}
              }
            }
          }
        `,
          (response) => {
            const all = response.data.posts as iWP_Posts_Pagination | null;
            if (!all) return all;
            return {
              nodes: all.nodes
                .map(transformPost)
                .filter((post) => post !== null && post !== undefined),
              pageInfo: all.pageInfo,
            };
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
          (response) => {
            return response.data.posts as iWP_Posts | null;
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
          (response) => {
            return response.data
              .postReactionsUsers as iWP_Posts_EmojisUser | null;
          },
        );
      }

      public static async reactPost(
        userId: string,
        postId: string,
        emojiId: string,
        emojiIcon: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          userReactPost(input: { 
            postId: ${postId},
            userId: ${userId},
            emojiId: "${emojiId}" 
            emojiIcon: "${emojiIcon}"
          }) {
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
        emojiId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          userUnReactPost(input: { 
            postId: ${postId}, 
            userId: ${userId},
            emojiId: "${emojiId}"
          }) {
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
        poster: iWP_Post["postFields"]["poster"] = "USER",
      ): Promise<iCreatePost | Error> {
        const post64 = btoa(encodeURIComponent(post)); // Encode to base64 to avoid special characters for GraphQL
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          createPostCustom(input: { 
            userId: ${userId}, 
            groupId: ${groupId}, 
            groupType: "${groupType}",
            post: "${post64}"
            poster: "${poster}"
          }) {
            clientMutationId
            message
            success
            post {
              ${POST_QUERY_FIELDS(userId)}
            }
          }
        }
      `);
      }

      public static async deletePost(postId: string): Promise<string | Error> {
        return await GraphQL.mutate(gql`
        mutation MyMutation {
          deletePostForce(input: { 
            postId: "${postId}"
          }) {
            clientMutationId
          }
        }
      `);
      }
    };

    static Comment = class {
      public static async getComment(
        userId: string,
        commentId: string,
      ): Promise<iWP_Comment | null | Error> {
        return await GraphQL.query<iWP_Comment | null>(
          gql`
          query MyQuery {
            postComment(id: "${commentId}", idType: DATABASE_ID) {
              ${COMMENT_QUERY_FIELDS(userId)}
            }
          }
        `,
          (response) => {
            return response.data.postComment as iWP_Comment | null;
          },
        );
      }

      public static async getPostComments(
        userId: string,
        postId: string,
        parentId?: string,
        pagination?: iGraphQLPagination,
      ): Promise<iWP_Comments_Pagination | null | Error> {
        return await GraphQL.query<iWP_Comments_Pagination | null>(
          gql`
          query MyQuery {
            postComments(
              ${printGraphQLPagination(createGraphQLPagination(pagination))}
              where: {
                postId: ${postId}
                ${parentId ? `parentId: ${parentId}` : ""}
                orderby: {field: DATE, order: ASC}
              }
            ) {
              ${GRAPHQL_CONSTANTS.PAGINATION.QUERY.PAGEINFO}
              nodes {
                ${COMMENT_QUERY_FIELDS(userId)}
              }
            }
          }
          `,
          (response) => {
            return response.data.postComments as iWP_Comments_Pagination | null;
          },
        );
      }

      public static async createPostComment(
        userId: string,
        postId: string,
        parentId: string | null | undefined,
        comment: string,
      ): Promise<iCreatePostComment | Error> {
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
            comment {
              ${COMMENT_QUERY_FIELDS(userId)}
            }
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

      public static async reportComment(
        userId: string,
        commentId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
      mutation MyMutation {
        userReportPostComment(input: { postId: ${commentId}, userId: ${userId} }) {
          clientMutationId
          message
          success
        }
      }
    `);
      }

      public static async unReportComment(
        userId: string,
        commentId: string,
      ): Promise<string | Error> {
        return await GraphQL.mutate(gql`
      mutation MyMutation {
        userUnReportPostComment(input: { postId: ${commentId}, userId: ${userId} }) {
          clientMutationId
          message
          success
        }
      }
    `);
      }
    };
  };
}

function transformPost(
  post: iWP_Post | null | undefined,
): iWP_Post | null | undefined {
  if (!post) return post;

  if (typeof post.postFields.poster === "boolean") {
    post.postFields.poster = post.postFields.poster ? "GROUP" : "USER";
  }
  return post;
}
