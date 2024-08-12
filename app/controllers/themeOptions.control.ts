import { gql } from "@apollo/client/core/core.cjs";
import { GraphQL } from "./graphql.control";
import type { iThemeOptions_PublicHealthAlerts } from "~/models/themeOptions.model";

export abstract class themeOptions {
  static API = class {
    public static async getPublicHealthAlerts(): Promise<
      iThemeOptions_PublicHealthAlerts | null | Error
    > {
      return await GraphQL.query<iThemeOptions_PublicHealthAlerts | null>(
        gql`
          query MyQuery {
            optionsThemeSettings {
              themeSettingsField {
                rightSidebar {
                  aboutContent
                  accordionContent
                  image {
                    node {
                      mediaItemUrl
                    }
                  }
                }
                leftSidebar {
                  description
                }
              }
            }
          }
        `,
        async (response) => {
          return (await response.data.optionsThemeSettings
            .themeSettingsField) as iThemeOptions_PublicHealthAlerts | null;
        },
      );
    }
  };
}
