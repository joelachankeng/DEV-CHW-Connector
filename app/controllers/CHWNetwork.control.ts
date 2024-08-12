import { gql } from "@apollo/client/core/core.cjs";
import { GraphQL } from "./graphql.control";
import type {
  iWP_CHWNetwork,
  iWP_CHWNetworks,
} from "~/models/CHWNetwork.model";

const CHWNETWORK_QUERY_FIELDS = (userId: string): string => `
databaseId
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
    ): Promise<iWP_CHWNetwork | null | Error> {
      return await GraphQL.query<iWP_CHWNetwork | null>(
        gql`
         query MyQuery {
            cHWNetwork(id: "${networkId}", idType: DATABASE_ID) {
              ${CHWNETWORK_QUERY_FIELDS(userId)}
            }
          }
        `,
        async (response) => {
          return (await response.data.cHWNetwork) as iWP_CHWNetwork | null;
        },
      );
    }

    public static async getAll(
      userId: string,
    ): Promise<iWP_CHWNetworks | null | Error> {
      return await GraphQL.query<iWP_CHWNetworks | null>(
        gql`
          query MyQuery {
            cHWNetworks(where: { orderby: { field: DATE, order: DESC } }) {
              nodes {
                ${CHWNETWORK_QUERY_FIELDS(userId)}
              }
            }
          }
        `,
        async (response) => {
          return (await response.data.cHWNetworks) as iWP_CHWNetworks | null;
        },
      );
    }

    public static async getAllByMembership(
      userId: string,
    ): Promise<iWP_CHWNetworks | null | Error> {
      return await GraphQL.query<iWP_CHWNetworks | null>(
        gql`
          query MyQuery {
            cHWNetworks(where: { 
              orderby: { field: DATE, order: DESC, },
              userMembership: ${userId}
            }) {
              nodes {
                ${CHWNETWORK_QUERY_FIELDS(userId)}
              }
            }
          }
        `,
        async (response) => {
          return (await response.data.cHWNetworks) as iWP_CHWNetworks | null;
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
