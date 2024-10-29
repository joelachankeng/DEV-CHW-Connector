import axios, { isAxiosError } from "axios";
import { APP_KEYS } from "~/session.server";

type iOneSignal_String_Language = {
  en: string;
};

export abstract class OneSignal {
  static API = class {
    public static async sendPushNotification(fields: {
      name: string;
      emails: string[];
      headings: iOneSignal_String_Language;
      subtitle: iOneSignal_String_Language;
      contents: iOneSignal_String_Language;
      data?: Record<string, string>; // NEED TO BE 2048 BYTES OR LESS
      url: string;
    }): Promise<void | Error> {
      if (!fields.emails.length) return new Error("No emails provided");

      return await OneSignal.Utils.post<void>(
        "https://onesignal.com/api/v1/notifications",
        {
          ...fields,
          emails: undefined,
          include_external_user_ids: fields.emails,
          channel_for_external_user_ids: "push",
        },
      );
    }
  };

  static Utils = class {
    public static async post<T>(url: string, data: object): Promise<T | Error> {
      try {
        const response = await axios.post(
          url,
          {
            ...data,
            app_id: APP_KEYS.PRIVATE.ONESIGNAL_APP_ID,
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Basic ${APP_KEYS.PRIVATE.ONESIGNAL_REST_API_KEY}`,
            },
          },
        );
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
  };
}
