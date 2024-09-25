import { gql } from "@apollo/client/core/core.cjs";
import type { iGraphQLPageInfo, iGraphQLPagination } from "./graphql.control";
import {
  createGraphQLPagination,
  GraphQL,
  GRAPHQL_CONSTANTS,
  printGraphQLPagination,
} from "./graphql.control";
import type { iWP_Communites, iWP_Community } from "~/models/community.model";

export type iWP_Communites_Pagination = iWP_Communites & iGraphQLPageInfo;

const COMMUNITY_QUERY_FIELDS = (userId: string): string => `
databaseId
title
featuredImage {
  node {
    mediaItemUrl
  }
}
communitiesFields {
  about
  communityGuidelines
  totalMembers
  isMember(userId: ${userId})
}
`;

export abstract class Community {
  static API = class {
    public static async get(
      userId: string,
      communityId: string,
    ): Promise<iWP_Community | null | Error> {
      return await GraphQL.query<iWP_Community | null>(
        gql`
         query MyQuery {
            community(id: "${communityId}", idType: DATABASE_ID) {
              ${COMMUNITY_QUERY_FIELDS(userId)}
            }
          }
        `,
        async (response) => {
          return (await response.data.community) as iWP_Community | null;
        },
      );
    }

    public static async getAll(
      userId: string,
      pagination?: iGraphQLPagination,
    ): Promise<iWP_Communites_Pagination | null | Error> {
      return await GraphQL.query<iWP_Communites_Pagination | null>(
        gql`
          query MyQuery {
            communities(
              ${printGraphQLPagination(createGraphQLPagination(pagination))}
              where: { orderby: { field: DATE, order: DESC } 
            }) {
              ${GRAPHQL_CONSTANTS.PAGINATION.QUERY.PAGEINFO}
              nodes {
                ${COMMUNITY_QUERY_FIELDS(userId)}
              }
            }
          }
        `,
        async (response) => {
          return (await response.data
            .communities) as iWP_Communites_Pagination | null;
        },
      );
    }

    public static async getAllByMembership(
      userId: string,
      pagination?: iGraphQLPagination,
    ): Promise<iWP_Communites_Pagination | null | Error> {
      return await GraphQL.query<iWP_Communites_Pagination | null>(
        gql`
          query MyQuery {
            communities(
              ${printGraphQLPagination(createGraphQLPagination(pagination))}
              where: { 
                orderby: { field: DATE, order: DESC, },
                userMembership: ${userId}
              }
            ) {
              ${GRAPHQL_CONSTANTS.PAGINATION.QUERY.PAGEINFO}
              nodes {
                ${COMMUNITY_QUERY_FIELDS(userId)}
              }
            }
          }
        `,
        async (response) => {
          return (await response.data
            .communities) as iWP_Communites_Pagination | null;
        },
      );
    }

    public static async follow(
      userId: string,
      communityId: string,
    ): Promise<string | Error> {
      return await GraphQL.mutate(gql`
        mutation MyMutation {
          userFollowCommunity(
            input: {
              userId: ${userId}
              communityId: ${communityId}
            }
          ) {
            clientMutationId
          }
        }
      `);
    }
    public static async unFollow(
      userId: string,
      communityId: string,
    ): Promise<string | Error> {
      return await GraphQL.mutate(gql`
        mutation MyMutation {
          userUnfollowCommunity(
            input: {
              userId: ${userId}
              communityId: ${communityId}
            }
          ) {
            clientMutationId
          }
        }
      `);
    }
  };
}
