import { ApolloQueryResult } from "@apollo/client/core/types";
import { ApolloError } from "@apollo/client/errors/index.js";
import _ from "lodash";
import { client } from "~/servers/apolloClient.server";

export abstract class GraphQL {
  public static async mutate(GQLMutation: any): Promise<Error> {
    try {
      const response = await client.mutate({
        mutation: GQLMutation,
      });

      let data = response.data;
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
