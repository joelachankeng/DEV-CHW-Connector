import axios from "axios";
import type {
  iMemberClicksError,
  iMemberClicksProfileSearchResult,
  iMemberClicksProfileSearchError,
  iMemberClicksProfilesResult,
  iMemberClicksProfileAttributes,
  iMemberClicksAccessTokenResponse,
  iPublic_MemberClicksProfileAttributes,
} from "~/models/memberClicks.model";
import { APP_KEYS } from "~/session.server";
import { getRequestDomain } from "~/utilities/main";

const clientCredentials = btoa(
  `${APP_KEYS.PUBLIC.MC_CLIENT_ID}:${APP_KEYS.PRIVATE.MC_CLIENT_SECRET}`,
);

export abstract class MemberClicks {
  public static async getMemberClickClientCredentials(): Promise<
    string | null
  > {
    try {
      const response = await axios.post(
        `https://${APP_KEYS.PUBLIC.MC_DOMAIN}/oauth/v1/token`,
        new URLSearchParams({
          grant_type: "client_credentials",
          scope: "read",
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${clientCredentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      if (response.status !== 200) return null;
      const token = response.data.access_token;

      return token;
    } catch (error) {
      return null;
    }
  }

  public static async getMemberClickCodeAccessToken(
    request: Request,
    code: string,
  ): Promise<iMemberClicksAccessTokenResponse | iMemberClicksError> {
    try {
      const response = await axios.post(
        `https://${APP_KEYS.PUBLIC.MC_DOMAIN}/oauth/v1/token`,
        new URLSearchParams({
          grant_type: "authorization_code",
          scope: "read",
          code,
          redirect_uri: getRequestDomain(request),
        }).toString(),
        {
          headers: {
            Authorization: `Basic ${clientCredentials}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      if (response.status == 200)
        return response.data as iMemberClicksAccessTokenResponse;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return error.response?.data as iMemberClicksError;
      }
    }

    return {
      error: "UNKNOWN",
      error_description: "An unknown error occurred. Please try again later.",
    } as iMemberClicksError;
  }

  public static async getAllProfiles(
    accessToken: string,
    pageNumber = 1,
    pageSize = 100,
  ): Promise<iMemberClicksProfilesResult | iMemberClicksError> {
    try {
      const response = await axios.get(
        `https://${APP_KEYS.PUBLIC.MC_DOMAIN}/api/v1/profile/?pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.status !== 201) return response.data as iMemberClicksError;

      return response.data as iMemberClicksProfilesResult;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data as iMemberClicksError;
      }
      return {
        error: "UNKNOWN",
        error_description: (error as Error).message,
      };
    }
  }

  public static async profileSearch(
    accessToken: string,
    attributes: { [key: string]: string | number | boolean | object },
  ): Promise<
    | iMemberClicksProfileSearchResult
    | iMemberClicksProfileSearchError
    | iMemberClicksError
  > {
    try {
      const response = await axios.post(
        `https://${APP_KEYS.PUBLIC.MC_DOMAIN}/api/v1/profile/search`,
        attributes,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status !== 201) return response.data as iMemberClicksError;
      if ("error" in response.data)
        return response.data as iMemberClicksProfileSearchError;
      return response.data as iMemberClicksProfileSearchResult;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data as iMemberClicksError;
      }
      return {
        error: "UNKNOWN",
        error_description: (error as Error).message,
      };
    }
  }

  public static async getProfilesById(
    accessToken: string,
    searchId: string,
  ): Promise<
    | iMemberClicksProfileSearchResult
    | iMemberClicksProfileSearchError
    | iMemberClicksError
  > {
    try {
      const response = await axios.get(
        `https://${APP_KEYS.PUBLIC.MC_DOMAIN}/api/v1/profile?searchId=${searchId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status !== 200) return response.data as iMemberClicksError;
      if ("error" in response.data)
        return response.data as iMemberClicksProfileSearchError;
      return response.data as iMemberClicksProfileSearchResult;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data as iMemberClicksError;
      }
      return {
        error: "UNKNOWN",
        error_description: (error as Error).message,
      };
    }
  }

  public static async getProfileById(
    accessToken: string,
    profileId: string,
  ): Promise<
    | iPublic_MemberClicksProfileAttributes
    | iMemberClicksProfileSearchError
    | iMemberClicksError
  >;
  public static async getProfileById(
    accessToken: string,
    profileId: string,
    privateFields: false,
  ): Promise<
    | iPublic_MemberClicksProfileAttributes
    | iMemberClicksProfileSearchError
    | iMemberClicksError
  >;
  public static async getProfileById(
    accessToken: string,
    profileId: string,
    privateFields: true,
  ): Promise<
    | iMemberClicksProfileAttributes
    | iMemberClicksProfileSearchError
    | iMemberClicksError
  >;
  public static async getProfileById(
    accessToken: string,
    profileId: string,
    privateFields?: boolean,
  ): Promise<
    | iPublic_MemberClicksProfileAttributes
    | iMemberClicksProfileAttributes
    | iMemberClicksProfileSearchError
    | iMemberClicksError
  > {
    try {
      const response = await axios.get(
        `https://${APP_KEYS.PUBLIC.MC_DOMAIN}/api/v1/profile/${profileId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.status !== 200) return response.data as iMemberClicksError;
      if ("error" in response.data)
        return response.data as iMemberClicksProfileSearchError;

      const data = response.data as iMemberClicksProfileAttributes;
      if (privateFields !== true)
        return this.publicizeMemberClicksProfileResult(data);
      return data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data as iMemberClicksError;
      }
      return {
        error: "UNKNOWN",
        error_description: (error as Error).message,
      };
    }
  }

  public static async getSearchResults(
    accessToken: string,
    searchId: string,
    pageNumber = 1,
    pageSize = 100,
  ): Promise<iMemberClicksProfilesResult | iMemberClicksError> {
    try {
      const response = await axios.get(
        `https://${APP_KEYS.PUBLIC.MC_DOMAIN}/api/v1/profile?searchId=${searchId}&pageNumber=${pageNumber}&pageSize=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );

      if (response.status !== 201) return response.data as iMemberClicksError;

      return response.data as iMemberClicksProfilesResult;
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        return error.response?.data as iMemberClicksError;
      }
      return {
        error: "UNKNOWN",
        error_description: (error as Error).message,
      };
    }
  }

  public static getOauthUrl(request: Request, state?: string): string {
    const domain = getRequestDomain(request);
    if (!domain) return "";

    const MC_URL = `https://${APP_KEYS.PUBLIC.MC_DOMAIN}/oauth/v1/authorize?response_type=code&client_id=${APP_KEYS.PUBLIC.MC_CLIENT_ID}&scope=read&redirect_uri=${domain}`;

    if (state) return `${MC_URL}&state=${state}`;
    return MC_URL;
  }

  public static publicizeMemberClicksProfileResult = (
    result: iMemberClicksProfileAttributes,
  ): iPublic_MemberClicksProfileAttributes => {
    const PUBLIC_FIELDS: (keyof iMemberClicksProfileAttributes)[] = [
      "[Profile ID]",
      "[Name | First]",
      "[Name | Last]",
      "[Contact Name]",
      "[Email | Primary]",
      "[Email | Preferred]",
      "[Email | Contact Email]",
      "[Username]",
      "[Deleted]",
      "[Member Type]",
    ];

    const newResult: iPublic_MemberClicksProfileAttributes = {};
    for (const key of PUBLIC_FIELDS) {
      const value = result[key];
      if (!value) continue;
      newResult[key] = value;
    }

    return newResult;
  };
}
