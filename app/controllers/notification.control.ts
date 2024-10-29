import axios, { isAxiosError } from "axios";
import type {
  iWP_Notification,
  iWP_Notification_Pagination,
  iWP_NotificationTypes,
} from "~/models/notifications.model";
import { getSession } from "~/servers/userSession.server";
import { APP_KEYS } from "~/session.server";
import { getRequestDomain } from "~/utilities/main";
import { GRAPHQL_CONSTANTS } from "./graphql.control";

const NOTIFICATION_ROUTE = `${APP_KEYS.PUBLIC.WP_REST_URL}/notifications`;
const AUTOMATION_ROUTE = `/.netlify/functions/notifications`;

export abstract class NotificationControl {
  static API = class {
    public static async create(
      fields: iWP_Notification,
    ): Promise<void | Error> {
      const formData = new FormData();
      formData.append("fields", JSON.stringify(fields));
      return await NotificationControl.Utils.post<void>(
        NOTIFICATION_ROUTE.concat("/create"),
        formData,
      );
    }

    public static async get(id: number): Promise<iWP_Notification | Error> {
      const formData = new FormData();
      formData.append("id", id.toString());
      return await NotificationControl.Utils.post<iWP_Notification>(
        NOTIFICATION_ROUTE.concat("/get"),
        formData,
      );
    }

    public static async getByUser(
      user_id: number,
      offset?: number,
      limit?: number,
    ): Promise<iWP_Notification_Pagination | Error> {
      const formData = new FormData();
      formData.append("user_id", user_id.toString());
      if (offset) formData.append("offset", offset.toString());
      if (limit) formData.append("limit", limit.toString());
      return await NotificationControl.Utils.post<iWP_Notification_Pagination>(
        NOTIFICATION_ROUTE.concat("/get"),
        formData,
      );
    }

    public static async getUnreadByUser(
      user_id: number,
      offset?: number,
      limit?: number,
    ): Promise<iWP_Notification_Pagination | Error> {
      const formData = new FormData();
      formData.append("user_id", user_id.toString());
      formData.append("is_read", "false");
      if (offset) formData.append("offset", offset.toString());
      if (limit) formData.append("limit", limit.toString());
      return await NotificationControl.Utils.post<iWP_Notification_Pagination>(
        NOTIFICATION_ROUTE.concat("/get"),
        formData,
      );
    }
    public static async markAllAsRead(user_id: string): Promise<void | Error> {
      const formData = new FormData();
      formData.append("user_id", user_id.toString());
      return await NotificationControl.Utils.post<void>(
        NOTIFICATION_ROUTE.concat("/markAllAsRead"),
        formData,
      );
    }

    public static async markAsRead(id: string | number): Promise<void | Error> {
      const formData = new FormData();
      formData.append("id", id.toString());
      return await NotificationControl.Utils.post<void>(
        NOTIFICATION_ROUTE.concat("/markAsRead"),
        formData,
      );
    }

    public static async update(
      id: number,
      fields: iWP_Notification,
    ): Promise<void | Error> {
      const formData = new FormData();
      formData.append("fields", JSON.stringify(fields));
      return await NotificationControl.Utils.post<void>(
        NOTIFICATION_ROUTE.concat("/update"),
        formData,
      );
    }

    public static async delete(id: number | string): Promise<void | Error> {
      const formData = new FormData();
      formData.append("id", id.toString());
      return await NotificationControl.Utils.post<void>(
        NOTIFICATION_ROUTE.concat("/delete"),
        formData,
      );
    }

    public static async deleteAll(user_id: string): Promise<void | Error> {
      const formData = new FormData();
      formData.append("user_id", user_id.toString());
      return await NotificationControl.Utils.post<void>(
        NOTIFICATION_ROUTE.concat("/deleteAll"),
        formData,
      );
    }

    static Automations = class {
      public static async send(
        request: Request,
        postId: number | string,
        postType: iWP_NotificationTypes,
      ): Promise<void | Error> {
        const session = await getSession(request);
        const userToken = session.get("user");

        const formData = new FormData();
        formData.append("session", userToken || "");
        formData.append("postId", postId.toString());
        formData.append("postType", postType);

        return await NotificationControl.Utils.post<void>(
          NotificationControl.Utils.getAutomationsURL(request),
          formData,
        );
      }
    };
  };

  static Utils = class {
    public static async post<T>(
      url: string,
      formData: FormData,
    ): Promise<T | Error> {
      try {
        formData.append("authorization", process.env.SESSION_SECRET || "");

        const headers: HeadersInit = {};
        if (url.includes("netlify")) {
          /***
           * Remix delete the request body before
           * it reaches the netlify background function
           * so I put the data in the headers
           * */
          for (const pair of formData.entries()) {
            if (typeof pair[0] === "string" && typeof pair[1] === "string") {
              headers[pair[0] as string] = pair[1];
            }
          }
        }
        const response = await axios.post(url, formData, {
          headers,
        });
        if (response.data) return response.data;
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          const data = error.response?.data;
          if (data) {
            if (typeof data === "string") return new Error(data);
            if (typeof data === "object")
              return new Error(JSON.stringify(data));
          }
        }
      }
      return new Error("An unexpected error occurred");
    }

    public static getAutomationsURL(request: Request): string {
      const origin =
        process.env.NODE_ENV === "production"
          ? getRequestDomain(request)
          : "http://localhost:4001";

      const url = origin.concat(AUTOMATION_ROUTE);
      console.log("Automations URL", url);

      return url;
    }

    public static createPagination(
      offset?: string | number | null,
      limit?: string | number | null,
    ): { offset: number; limit: number } {
      let _offset = 0;
      let _limit = GRAPHQL_CONSTANTS.PAGINATION.MAX_ROWS;

      if (offset && !isNaN(parseInt(offset.toString()))) {
        _offset = parseInt(offset.toString());
      }

      if (limit && !isNaN(parseInt(limit.toString()))) {
        _limit = parseInt(limit.toString());
        if (_limit > 100) _limit = 100;
      }

      return {
        offset: _offset,
        limit: _limit,
      };
    }
  };
}
