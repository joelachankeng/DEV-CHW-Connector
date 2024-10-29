import type { iWP_Page } from "~/models/page.model";
import { GraphQL } from "./graphql.control";
import { gql } from "@apollo/client/core/core.cjs";

export abstract class PageController {
  static API = class {
    public static async getPost(
      id: string,
      idType: "DATABASE_ID" | "SLUG",
    ): Promise<iWP_Page | null | Error> {
      let _idType: string = idType;
      if (idType === "SLUG") {
        _idType = "URI";
      }
      return await GraphQL.query<iWP_Page | null>(
        gql`
            query MyQuery {
              page(id: "${id}", idType: ${_idType}) {
                title
                content
              }
            }
          `,
        (response) => {
          return response.data.page as iWP_Page | null;
        },
      );
    }
  };
}
