import { gql } from "@apollo/client/core/core.cjs";
import type { iGraphQLPageInfo, iGraphQLPagination } from "./graphql.control";
import {
  createGraphQLPagination,
  GraphQL,
  GRAPHQL_CONSTANTS,
  printGraphQLPagination,
} from "./graphql.control";
import type {
  iWP_PublicHealthAlert,
  iWP_PublicHealthAlerts,
} from "~/models/publicHealthAlert.model";

export type iWP_PublicHealthAlert_Pagination = iWP_PublicHealthAlerts &
  iGraphQLPageInfo;

export abstract class PublicHealthAlert {
  static API = class {
    public static async getMostRecentAlert(): Promise<
      iWP_PublicHealthAlert | null | Error
    > {
      return await GraphQL.query<iWP_PublicHealthAlert | null>(
        gql`
          query MyQuery {
            publicHealthAlerts(
              first: 1
              where: { orderby: { field: DATE, order: DESC } }
            ) {
              nodes {
                databaseId
                date
                title
                content
                publicHealthAlertsField {
                  previewContent
                }
              }
            }
          }
        `,
        async (response) => {
          return (await response.data.publicHealthAlerts
            .nodes[0]) as iWP_PublicHealthAlert | null;
        },
      );
    }

    public static async getAlert(
      id: number,
    ): Promise<iWP_PublicHealthAlert | null | Error> {
      return await GraphQL.query<iWP_PublicHealthAlert | null>(
        gql`
        query MyQuery {
          publicHealthAlert(id: "${id}", idType: DATABASE_ID) {
            databaseId
            date
            title
            content
            publicHealthAlertsField {
              previewContent
            }
          }
        }
      `,
        async (response) => {
          return (await response.data
            .publicHealthAlert) as iWP_PublicHealthAlert | null;
        },
      );
    }

    public static async getAlerts(
      pagination?: iGraphQLPagination,
    ): Promise<iWP_PublicHealthAlert_Pagination | Error> {
      return await GraphQL.query<iWP_PublicHealthAlert_Pagination>(
        gql`
          query MyQuery {
            publicHealthAlerts(
              ${printGraphQLPagination(createGraphQLPagination(pagination))}
              where: { orderby: { field: DATE, order: DESC } }
            ) {
              ${GRAPHQL_CONSTANTS.PAGINATION.QUERY.PAGEINFO}
              nodes {
                databaseId
                date
                title
                content
                publicHealthAlertsField {
                  previewContent
                }
              }
            }
          }
        `,
        async (response) => {
          return (await response.data
            .publicHealthAlerts) as iWP_PublicHealthAlert_Pagination;
        },
      );
    }
  };
}
