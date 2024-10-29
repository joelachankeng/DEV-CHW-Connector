import { gql } from "@apollo/client/core/core.cjs";
import type { iGraphQLPageInfo, iGraphQLPagination } from "./graphql.control";
import {
  createGraphQLPagination,
  GraphQL,
  GRAPHQL_CONSTANTS,
  printGraphQLPagination,
} from "./graphql.control";
import type {
  iWP_CHWNetwork,
  iWP_CHWNetworks,
} from "~/models/CHWNetwork.model";

export type iWP_CHWNetwork_Pagination = iWP_CHWNetworks & iGraphQLPageInfo;

const CHWNETWORK_QUERY_FIELDS = (userId: string): string => `
databaseId
status
title
featuredImage {
  node {
    mediaItemUrl
  }
}
chwNetworksFields {
  about
  communityGuidelines
  totalMembers
  isMember(userId: ${userId})
}
`;
export abstract class CHWNetwork {
  static API = class {
    public static async get(
      userId: string,
      networkId: string,
    ): Promise<iWP_CHWNetwork | Error | null> {
      return await GraphQL.query<iWP_CHWNetwork | null>(
        gql`
         query MyQuery {
            cHWNetwork(id: "${networkId}", idType: DATABASE_ID) {
              ${CHWNETWORK_QUERY_FIELDS(userId)}
            }
          }
        `,
        (response) => {
          return response.data.cHWNetwork as iWP_CHWNetwork | null;
        },
      );
    }

    public static async getAll(
      userId: string,
      pagination?: iGraphQLPagination,
    ): Promise<iWP_CHWNetwork_Pagination | null | Error> {
      return await GraphQL.query<iWP_CHWNetwork_Pagination | null>(
        gql`
          query MyQuery {
            cHWNetworks(
              ${printGraphQLPagination(createGraphQLPagination(pagination))}
              where: { orderby: { field: DATE, order: DESC } 
            }) {
              ${GRAPHQL_CONSTANTS.PAGINATION.QUERY.PAGEINFO}
              nodes {
                ${CHWNETWORK_QUERY_FIELDS(userId)}
              }
            }
          }
        `,
        (response) => {
          return response.data.cHWNetworks as iWP_CHWNetwork_Pagination | null;
        },
      );
    }

    public static async getAllByMembership(
      userId: string,
      pagination?: iGraphQLPagination,
    ): Promise<iWP_CHWNetwork_Pagination | null | Error> {
      return await GraphQL.query<iWP_CHWNetwork_Pagination | null>(
        gql`
          query MyQuery {
            cHWNetworks(
              ${printGraphQLPagination(createGraphQLPagination(pagination))}
              where: { 
                orderby: { field: DATE, order: DESC, },
                userMembership: ${userId}
              }
            ) {
              ${GRAPHQL_CONSTANTS.PAGINATION.QUERY.PAGEINFO}
              nodes {
                ${CHWNETWORK_QUERY_FIELDS(userId)}
              }
            }
          }
        `,
        (response) => {
          return response.data.cHWNetworks as iWP_CHWNetwork_Pagination | null;
        },
      );
    }

    public static async follow(
      userId: string,
      networkId: string,
    ): Promise<string | Error> {
      return await GraphQL.mutate(gql`
        mutation MyMutation {
          userFollowCHWNetwork(
            input: {
              userId: ${userId}
              networkId: ${networkId}
            }
          ) {
            clientMutationId
          }
        }
      `);
    }

    public static async unFollow(
      userId: string,
      networkId: string,
    ): Promise<string | Error> {
      return await GraphQL.mutate(gql`
        mutation MyMutation {
          userUnfollowCHWNetwork(
            input: {
              userId: ${userId}
              networkId: ${networkId}
            }
          ) {
            clientMutationId
          }
        }
      `);
    }
  };
  static Utils = class {};
}
