import type { ApolloQueryResult } from "@apollo/client/core/types";
import { ApolloError } from "@apollo/client/errors/index.js";
import _ from "lodash";
import { client } from "~/servers/apolloClient.server";

export abstract class GraphQL {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async mutate(GQLMutation: any): Promise<Error> {
    try {
      const response = await client.mutate({
        mutation: GQLMutation,
      });

      const data = response.data;
      if (typeof data === "object") {
        if (!_.isEmpty(data)) {
          return data[Object.keys(data)[0]];
        }
      }

      return data;
    } catch (error: unknown) {
      if (error instanceof ApolloError) {
        const graphQLError = error?.graphQLErrors[0]?.message;
        if (
          graphQLError !== undefined &&
          graphQLError !== null &&
          graphQLError !== ""
        ) {
          return new Error(graphQLError);
        }
      }

      return new Error("An unknown error occurred. Please try again later.");
    }
  }

  public static async query<Type>(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    GQLQuery: any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    returnFunction: (response: ApolloQueryResult<any>) => Promise<Type>,
  ): Promise<Type | Error> {
    try {
      const response = await client.query({
        query: GQLQuery,
      });
      return await returnFunction(response);
    } catch (error: unknown) {
      if (error instanceof ApolloError) {
        const graphQLError = error?.graphQLErrors[0]?.message;
        if (
          graphQLError !== undefined &&
          graphQLError !== null &&
          graphQLError !== ""
        ) {
          return new Error(graphQLError);
        }
      }

      return new Error("An unknown error occurred. Please try again later.");
    }
  }
}

export type iGraphQLPagination = {
  first: number;
  after?: string;
  last?: number;
  before?: string;
};

export type iGraphQLPageInfo = {
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string;
    endCursor: string;
    total: number;
  };
};

export const GRAPHQL_CONSTANTS = {
  PAGINATION: {
    MAX_ROWS: 10,
    QUERY: {
      PAGEINFO: `
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
          total
        }
      `,
    },
  },
};

export const createGraphQLPagination = (
  pagination?: iGraphQLPagination,
): iGraphQLPagination => {
  if (!pagination) return defaultGraphQLPagination();
  return {
    first: pagination.first,
    after: pagination.after,
    last: pagination.last,
    before: pagination.before,
  };
};

export const defaultGraphQLPagination = (): iGraphQLPagination => {
  return createGraphQLPagination({
    first: GRAPHQL_CONSTANTS.PAGINATION.MAX_ROWS,
  });
};

export const printGraphQLPagination = (
  pagination: iGraphQLPagination,
): string => {
  return `
    first: ${pagination.first || "null"}
    after: "${pagination.after || ""}"
    last: ${pagination.last || "null"}
    before: "${pagination.before || ""}"
  `;
};
