import { gql } from "@apollo/client/core/core.cjs";
import type { iGraphQLPageInfo, iGraphQLPagination } from "./graphql.control";
import {
  createGraphQLPagination,
  GraphQL,
  GRAPHQL_CONSTANTS,
  printGraphQLPagination,
} from "./graphql.control";
import type { iWP_Message, iWP_Messages } from "~/models/message.model";
import type { iMutationResponse } from "~/models/appContext.model";

export type iCreateMessage = iMutationResponse & {
  messagePost?: iWP_Message;
};

export type iWP_Messages_Pagination = iWP_Messages & iGraphQLPageInfo;

export const MESSAGE_QUERY_FIELDS = (userId: string) => `
  databaseId
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
  messageFields {
    receiverId
    isRead
    content
  }
`;

export abstract class Message {
  static API = class {
    public static async getMessage(
      userId: string,
      messageId: string,
    ): Promise<iWP_Message | null | Error> {
      return await GraphQL.query<iWP_Message | null>(
        gql`
          query MyQuery {
            message(id: "${messageId}", idType: DATABASE_ID) {
              ${MESSAGE_QUERY_FIELDS(userId)}
            }
          }
        `,
        (response) => {
          return response.data.message as iWP_Message | null;
        },
      );
    }

    public static async getMessages(
      userId: string,
      receiverId: string,
      pagination?: iGraphQLPagination,
    ): Promise<iWP_Messages_Pagination | null | Error> {
      return await GraphQL.query<iWP_Messages_Pagination | null>(
        gql`
        query MyQuery {
          messages(
            ${printGraphQLPagination(createGraphQLPagination(pagination))}
            where: {
              orderby: {
                field: DATE
                order: DESC
              }
              authorIn: [${userId}, ${receiverId}]
              receiverIds: [${receiverId}, ${userId}]
            }
          ) {
            ${GRAPHQL_CONSTANTS.PAGINATION.QUERY.PAGEINFO}
            nodes {
              ${MESSAGE_QUERY_FIELDS(userId)}
            }
          }
        }
        `,
        (response) => {
          return response.data.messages as iWP_Messages_Pagination | null;
        },
      );
    }

    public static async createMessage(
      userId: string,
      receiverId: string,
      message: string,
    ): Promise<iCreateMessage | Error> {
      const content64 = btoa(encodeURIComponent(message)); // Encode to base64 to avoid special characters for GraphQL
      return await GraphQL.mutate(gql`
      mutation MyMutation {
        createMessageCustom(input: { 
          userId: ${userId}, 
          receiver: ${receiverId}, 
          content: "${content64}"
        }) {
          clientMutationId
          message
          success
          messagePost {
            ${MESSAGE_QUERY_FIELDS(userId)}
          }
        }
      }
    `);
    }

    public static async readMessage(
      messageId: string,
    ): Promise<string | Error> {
      return await GraphQL.mutate(gql`
      mutation MyMutation {
        readMessageCustom(
          input: { 
            messageId: ${messageId}
          }
        ) {
          clientMutationId
          message
          success
        }
      }
    `);
    }
  };
}
