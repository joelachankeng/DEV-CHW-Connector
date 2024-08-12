import { gql } from "@apollo/client/core/core.cjs";
import { GraphQL } from "./graphql.control";
import {
  iWP_PublicHealthAlert,
  iWP_PublicHealthAlerts,
} from "~/models/publicHealthAlert.model";

export abstract class publicHealthAlert {
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
        async (response: {
          data: { publicHealthAlerts: iWP_PublicHealthAlerts };
        }) => {
          return response.data.publicHealthAlerts
            .nodes[0] as iWP_PublicHealthAlert | null;
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
          return response.data
            .publicHealthAlert as iWP_PublicHealthAlert | null;
        },
      );
    }

    public static async getAlerts(): Promise<iWP_PublicHealthAlerts | Error> {
      return await GraphQL.query<iWP_PublicHealthAlerts>(
        gql`
          query MyQuery {
            publicHealthAlerts(
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
          return response.data.publicHealthAlerts;
        },
      );
    }
  };
}
