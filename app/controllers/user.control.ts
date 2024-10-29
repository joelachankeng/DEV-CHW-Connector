import { gql } from "@apollo/client/core/core.cjs";
import type { TypedResponse } from "@remix-run/node";
import { json } from "@remix-run/node";
import axios, { isAxiosError } from "axios";
import { handleRequestFormFieldsValidation } from "~/components/Forms/FormFields";
import type {
  iMemberClicksAccessTokenResponse,
  iMemberClicksProfileAttributes,
  iPublic_MemberClicksProfileAttributes,
} from "~/models/memberClicks.model";
import {
  clearUserSession,
  encryptUserSession,
  getJWTUserDataFromSession,
  getUserSessionToken,
  setUserSession,
} from "~/servers/userSession.server";
import { APP_KEYS } from "~/session.server";
import { MemberClicks } from "./memberClicks.control";
import { LoginFormFields } from "~/components/User/LoginForm";
import { ACCOUNT_SCHEMAS } from "~/schemas/account";
import _ from "lodash";
import { SignupFormFields } from "~/components/User/SignupForm";
import {
  convertDateTimeForACF,
  copyKeysToObject,
  generatePassword,
  getCurrentDateTime,
  getRequestDomain,
  getRequestParams,
  parseDateTimeGraphql,
} from "~/utilities/main";
import { MailGun } from "./mailgun.control";
import {
  HPFORM_ACCOUNT_DELETED,
  type iHPActionData,
  type iHPForms,
} from "~/routes";
import { confirmResetPasswordFormFields } from "~/components/User/ConfirmResetPasswordForm";
import type { iGraphQLPageInfo, iGraphQLPagination } from "./graphql.control";
import {
  createGraphQLPagination,
  GraphQL,
  GRAPHQL_CONSTANTS,
  printGraphQLPagination,
} from "./graphql.control";
import { APP_ROUTES, USER_ACCOUNT_DELETION_DELAY_DAYS } from "~/constants";
import type {
  iUser_UploadKeys,
  iWP_User,
  iWP_User_RestPassword,
  iWP_Users,
} from "~/models/user.model";
import type {
  iSimpleJWTError,
  iSimpleJWTValidation,
} from "~/models/wpJWT.model";
import type { iProfileFormFields } from "~/routes/settings/edit-profile";
import {
  convertUserToProfileFormFields,
  defaultProfileFormFields,
  handleProfileFormFieldsValidation,
  isProfileFormFieldsValid,
  ProfileFormFieldSchema,
  transformProfileFormFieldsToSave,
} from "~/routes/settings/edit-profile";
import type { ZodRawShape } from "zod";
import { parseSettingsFromPathName } from "~/routes/settings/notifications/$";
import { createSchemaObjectFromSettings } from "~/components/Settings/Notifications/NotificationSettingsForm";
import type {
  iNotificationSettings,
  iNotificationSettings_Subcategory,
  iNotificationSettings_Type,
  iWP_NotificationSettings_Prepare,
  iWP_NotificationSettings_Restore,
  iWP_User_NotificationSettings,
} from "~/models/notifications.model";
import {
  defaultNotificationSettings,
  WP_NOTIFICATION_SEPARATOR,
} from "~/models/notifications.model";
import type { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import password from "~/routes/settings/password";
import { MESSAGE_QUERY_FIELDS } from "./message.control";
import type { iWP_Conversations, iWP_Message } from "~/models/message.model";
import { getMemberClicksSessionToken } from "~/servers/memberClicksSession.server";
import { UserPublic } from "./user.control.public";

export type iWP_Users_Pagination = iWP_Users & iGraphQLPageInfo;
export type iPublicUser = iProfileFormFields & {
  databaseId: number;
};

const USER_QUERY_FIELDS = (userId: string, includePrivateFields = false) => `
  email
  lastName
  firstName
  databaseId
  avatar {
    url
  }
  roles {
    nodes {
      name
    }
  }
  userFields {
    createdViaMemberclicks
    chwWorker
    emailType
    aboutMe
    phoneNumber
    state
    zipCode
    region
    preferredLanguages
    education
    ageRange
    certifiedWorker
    deletionDate
    ethnicity
    topPopulations
    memberships
    genderIdentity
    howDidYouHear
    siteNotifications
    pushNotifications
    emailNotifications
    public
    groupAdminAll
    changeemail {
      newEmail
      expiration
      ${includePrivateFields ? "code" : ""}
    }
  }
`;
export abstract class User {
  static API = class {
    /****
     * @description This method authenticates a user with the WordPress JWT plugin and returns a JWT token
     * @returns {string | Error} Returns a JWT token if the user is logged in successfully, otherwise an error
     * @example
     * const userToken = await User.loginUser("username", "password");
     * if (userToken instanceof Error) {
     *  console.error("Error logging in:", userToken.message);
     * } else {
     * console.log("User logged in successfully with token:", userToken);
     * }
     */
    public static async loginUser(
      email: string,
      password: string,
    ): Promise<string | Error> {
      try {
        const response = await axios.post(`${APP_KEYS.PRIVATE.JWT_URL}/auth`, {
          email: email,
          password,
          AUTH_KEY: APP_KEYS.PRIVATE.JWT_AUTH_KEY,
        });

        const userToken = response.data.data.jwt;
        return userToken;
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const response = error.response?.data;

          if ("data" in response) {
            const jwtError = response.data as iSimpleJWTError;
            console.log("jwtError", jwtError);
          }
          return new Error(
            "Sorry, we couldn't log you in. Please double-check your email and password and try again.",
          );
        }

        return new Error("An unknown error occurred");
      }
    }

    public static async createUser(
      firstName: string,
      lastName: string,
      email: string,
      password: string,
      emailType: string,
      createdViaMemberclicks = false,
    ): Promise<string | Error> {
      // this enables all notifications by for new users
      const notificationSettings = User.Utils.pepareNotificationSettingsForWP(
        defaultNotificationSettings,
      );

      // this set all profile fields to visible for new users
      const profileFields = _.cloneDeep(defaultProfileFormFields);
      const removeKey: Array<keyof iProfileFormFields> = [
        "firstName",
        "lastName",
        "email",
        "emailType",
      ];
      removeKey.forEach((key) => {
        delete profileFields[key];
      });

      const profile = btoa(
        JSON.stringify({
          ...profileFields,
          ...notificationSettings,
        }),
      );
      return await GraphQL.mutate(gql`
        mutation MyMutation {
          createUser(
            input: {
              username: "${email}"
              email: "${email}"
              firstName: "${firstName}"
              lastName: "${lastName}"
              password: "${password}"
              emailType: "${emailType}"
              createdViaMemberclicks: ${createdViaMemberclicks}
              profile: "${profile}"
            }
          ) {
            clientMutationId
          }
        }
      `);
    }

    public static async getUser(
      id: string,
      type: "EMAIL" | "DATABASE_ID",
      includePrivateFields = false, // THIS FIELDS SHOULD NEVER BE EXPOSED TO THE CLIENT
    ): Promise<iWP_User | null | Error> {
      return await GraphQL.query<iWP_User | null>(
        gql`
          query MyQuery {
            user(id: "${id}", idType: ${type}) {
              ${USER_QUERY_FIELDS(id, includePrivateFields)}            
            }
          }
        `,

        (response) => {
          const userData = response.data.user as iWP_User | null | undefined;
          if (!userData) {
            console.error("User not found");
            return null;
          }
          const newUser = transformUser(userData) as iWP_User;
          return newUser;
        },
      );
    }

    public static async searchUsers(
      search: string,
      userId?: string,
      pagination?: iGraphQLPagination,
    ): Promise<iWP_Users_Pagination | null | Error> {
      return await GraphQL.query<iWP_Users_Pagination | null>(
        gql`
          query MyQuery {
            users(
             ${printGraphQLPagination(createGraphQLPagination(pagination))}
              where: {
                search: "${search}"
                exclude: [${userId}]
              }
            ) {
              ${GRAPHQL_CONSTANTS.PAGINATION.QUERY.PAGEINFO}
              nodes {
                ${USER_QUERY_FIELDS(userId || "-1", false)}
              }
            }
          }
        `,

        (response) => {
          const all = response.data.users as iWP_Users_Pagination | null;
          if (!all) return all;

          const nodes = all.nodes
            .map(transformUser)
            .filter((user) => user !== null && user !== undefined);

          const users: iWP_Users_Pagination = {
            nodes: nodes.filter(
              (user) =>
                user.email.toLowerCase() !== "adminapi@admin.com" &&
                user.userFields.isDeleted === false,
            ),
            pageInfo: all.pageInfo,
          };

          return users;
        },
      );
    }
    public static async setResetPasswordCode(
      userId: string,
      code: string,
      expiration: string,
    ): Promise<string | Error> {
      return await GraphQL.mutate(gql`
        mutation MyMutation {
          updateUser(
            input: {
              id: "${userId}"
              resetPassword: [
                "${code}",
                "${expiration}"
              ]
            }
          ) {
            clientMutationId
          }
        }
      `);
    }

    public static async getResetPasswordCode(
      email: string,
    ): Promise<iWP_User_RestPassword | null | Error> {
      return await GraphQL.query<iWP_User_RestPassword | null>(
        gql`
          query MyQuery {
            user(id: "${email}", idType: EMAIL) {
              userFields {
                resetPassword {
                  code
                  expiration
                }
              }
            }
          }
        `,
        // eslint-disable-next-line @typescript-eslint/require-await
        (response) => {
          return response.data.user.userFields
            .resetPassword as iWP_User_RestPassword | null;
        },
      );
    }

    public static async changePassword(
      userId: string,
      password: string,
    ): Promise<string | Error> {
      return await GraphQL.mutate(gql`
        mutation MyMutation {
          updateUser(
            input: {
              id: "${userId}"
              password: "${password}"
            }
          ) {
            clientMutationId
          }
        }
      `);
    }

    public static async changeEmail(
      userId: string,
      email: string,
    ): Promise<string | Error> {
      return await GraphQL.mutate(gql`
        mutation MyMutation {
          updateUser(
            input: {
              id: "${userId}"
              email: "${email}"
              nickname: "${email}"
            }
          ) {
            clientMutationId
          }
        }
      `);
    }

    public static async updateProfile(
      userId: string,
      fields:
        | iProfileFormFields
        | iWP_NotificationSettings_Prepare
        | {
            deletionDate: { value: string };
          },
    ): Promise<string | Error> {
      const profile = btoa(JSON.stringify(fields));
      return await GraphQL.mutate(gql`
        mutation MyMutation {
          updateUser(
            input: {
              id: "${userId}"
              profile: "${profile}"
            }
          ) {
            clientMutationId
          }
        }
      `);
    }

    public static async validatePassword(
      userId: string,
      password: string,
    ): Promise<boolean | Error | null> {
      return await GraphQL.query<boolean | null>(
        gql`
          query MyQuery {
            user(idType: DATABASE_ID, id: "${userId}") {
              userFields {
                checkPassword(password: "${password}")
              }
            }
          }
        `,
        // eslint-disable-next-line @typescript-eslint/require-await
        (response) => {
          return response.data.user.userFields.checkPassword as boolean | null;
        },
      );
    }

    public static async validateToken(
      token: string,
    ): Promise<iSimpleJWTValidation["data"] | undefined> {
      try {
        const response = await axios.get(
          `${APP_KEYS.PRIVATE.JWT_URL}/auth/validate&JWT=${token}`,
        );

        if (response.data.success) {
          return response.data.data as iSimpleJWTValidation["data"];
        }
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          //const response = error.response?.data;
          // save to logs
        }
        return undefined;
      }
      return undefined;
    }

    public static async revokeToken(
      token: string,
    ): Promise<iSimpleJWTValidation["data"] | undefined> {
      try {
        const response = await axios.post(
          `${APP_KEYS.PRIVATE.JWT_URL}/auth/revoke&JWT=${token}`,
          {
            AUTH_KEY: APP_KEYS.PRIVATE.JWT_AUTH_KEY,
          },
        );
        if (response.data.success) {
          return response.data.data as iSimpleJWTValidation["data"];
        }
      } catch (error: unknown) {
        return undefined;
      }
      return undefined;
    }
    public static async search(
      userId?: string,
    ): Promise<boolean | Error | null> {
      return await GraphQL.query<boolean | null>(
        gql`
          query MyQuery {
            user(idType: DATABASE_ID, id: "${userId}") {
              userFields {
                checkPassword(password: "${password}")
              }
            }
          }
        `,
        // eslint-disable-next-line @typescript-eslint/require-await
        (response) => {
          return response.data.user.userFields.checkPassword as boolean | null;
        },
      );
    }

    public static async getAllUnreadMessagesIds(
      userId: string,
    ): Promise<number[] | Error | null> {
      return await GraphQL.query<number[] | null>(
        gql`
          query MyQuery {
            user(idType: DATABASE_ID, id: "${userId}") {
              userFields {
                getAllUnreadMessagesIds
              }
            }
          }
        `,
        // eslint-disable-next-line @typescript-eslint/require-await
        (response) => {
          return response.data.user.userFields.getAllUnreadMessagesIds as
            | number[]
            | null;
        },
      );
    }

    public static async getAllUnreadMessages(
      userId: string,
    ): Promise<iWP_Message[] | Error | null> {
      return await GraphQL.query<iWP_Message[] | null>(
        gql`
          query MyQuery {
            user(idType: DATABASE_ID, id: "${userId}") {
              userFields {
                getAllUnreadMessages {
                  ${MESSAGE_QUERY_FIELDS(userId)}
                }
              }
            }
          }
        `,
        (response) => {
          return response.data.user.userFields.getAllUnreadMessages as
            | iWP_Message[]
            | null;
        },
      );
    }

    public static async getMessageConversations(
      userId: string,
    ): Promise<iWP_Conversations[] | Error | null> {
      return await GraphQL.query<iWP_Conversations[] | null>(
        gql`
          query MyQuery {
            user(idType: DATABASE_ID, id: "${userId}") {
              userFields {
                getMessageConversations {
                  unreadCount
                  user {
                    lastName
                    firstName
                    databaseId
                    avatar {
                      url
                    }
                  }
                  message {
                    ${MESSAGE_QUERY_FIELDS(userId)}
                  }
                }
              }
            }
          }
        `,
        (response) => {
          return response.data.user.userFields.getMessageConversations as
            | iWP_Conversations[]
            | null;
        },
      );
    }
    public static async getLastOnline(
      userId: string,
    ): Promise<string | Error | null> {
      return await GraphQL.query<string | null>(
        gql`
          query MyQuery {
            user(idType: DATABASE_ID, id: "${userId}") {
              userFields {
                lastOnline
              }
            }
          }
        `,
        (response) => {
          return response.data.user.userFields.lastOnline as string | null;
        },
      );
    }

    public static async setLastOnline(
      userId: string,
      onlineDate?: string,
    ): Promise<string | Error | null> {
      let lastOnlineDate = onlineDate;
      if (!onlineDate) {
        const currentDate = new Date();
        lastOnlineDate = convertDateTimeForACF(currentDate);
        const lastOnline = await User.API.getLastOnline(userId);

        // if last online is less than a minute ago, don't update
        // this is to prevent spamming the database and causing a lock on the user table
        if (!(lastOnline instanceof Error) && lastOnline !== null) {
          const lastOnlineConverted = parseDateTimeGraphql(lastOnline);
          if (lastOnlineConverted.isValid) {
            const minutesPassed = getCurrentDateTime()
              .diff(lastOnlineConverted)
              .as("minutes");
            if (minutesPassed < 1) {
              return lastOnlineDate;
            }
          }
        }
      }

      return await GraphQL.mutate(gql`
        mutation MyMutation {
          updateUser(
            input: {
              id: "${userId}"
              lastOnline: "${lastOnlineDate}"
            }
          ) {
            clientMutationId
          }
        }
      `);
    }

    public static async getNotificationSettings(
      query:
        | {
            userIds: number[] | string[];
          }
        | "ALL USERS",
    ): Promise<iWP_User_NotificationSettings[] | Error> {
      const formData = new FormData();
      formData.append("authorization", process.env.SESSION_SECRET || "");
      if (query === "ALL USERS") {
        formData.append("all", "true");
      } else {
        if (query.userIds.length === 0)
          return new Error("No user ids provided");
        formData.append("user_ids", JSON.stringify(query.userIds));
      }
      try {
        const response = await axios.post(
          `${APP_KEYS.PUBLIC.WP_REST_URL}/user/notificationSettings`,
          formData,
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

  static Methods = class {
    public static async emailResetPassword(
      request: Request,
      email: string,
    ): Promise<void | Error> {
      const findWPUser = await User.API.getUser(email, "EMAIL");
      if (findWPUser instanceof Error) {
        return new Error(
          "Our system encountered an unexpected error. Please try again later.",
        );
      }

      if (findWPUser === null) {
        return new Error(
          "This email address is not associated with an account.",
        );
      }

      if (findWPUser.userFields.createdViaMemberclicks) {
        return new Error(
          "This account was created via MemberClicks. Please log in using the MemberClicks button.",
        );
      }

      const code = generatePassword(10);
      const expiration = new Date();
      expiration.setMinutes(expiration.getMinutes() + 15);

      const formatExpiration = convertDateTimeForACF(expiration);

      const result = await User.API.setResetPasswordCode(
        findWPUser.databaseId.toString(),
        code,
        formatExpiration,
      );

      if (result instanceof Error) {
        return result;
      }

      const mailResponse = await MailGun.sendResetPasswordTemplate(
        {
          to: findWPUser.email,
          firstname: findWPUser.firstName,
          lastname: findWPUser.lastName,
          profileLink: User.Utils.getProfileLink(
            request,
            findWPUser.databaseId.toString(),
          ),
        },
        code,
        User.Utils.getResetPasswordLink(request, findWPUser.email, code),
      );

      if (mailResponse instanceof Error) {
        return new Error(
          "Our system encountered an unexpected error. Please try again later.",
        );
      }
    }

    public static async emailChangeConfirmation(
      request: Request,
      email: string,
      updateExpiration = false,
    ): Promise<void | Error> {
      let findWPUser = await User.API.getUser(email, "EMAIL", true);

      if (findWPUser instanceof Error) {
        return new Error(
          "Our system encountered an unexpected error. Please try again later.",
        );
      }

      if (findWPUser === null) {
        return new Error(
          "This email address is not associated with an account.",
        );
      }

      if (!findWPUser.userFields.changeemail.newEmail) {
        return new Error(
          "This account does not have a pending email change request.",
        );
      }

      if (!findWPUser.userFields.changeemail.code) {
        return new Error(
          "This account does not have a pending email change request.",
        );
      }

      if (updateExpiration) {
        const profileFields = defaultProfileFormFields;
        profileFields.email.value = findWPUser.userFields.changeemail.newEmail;
        profileFields.email.public =
          findWPUser.userFields.public?.includes("email");

        const result = await User.API.updateProfile(
          findWPUser.databaseId.toString(),
          profileFields,
        );

        if (result instanceof Error) {
          return new Error(result.message);
        }
      }

      findWPUser = await User.API.getUser(email, "EMAIL", true);

      if (findWPUser instanceof Error) {
        return new Error(
          "Our system encountered an unexpected error. Please try again later.",
        );
      }

      if (findWPUser === null) {
        return new Error(
          "This email address is not associated with an account.",
        );
      }

      if (!findWPUser.userFields.changeemail.newEmail) {
        return new Error(
          "This account does not have a pending email change request.",
        );
      }

      if (!findWPUser.userFields.changeemail.code) {
        return new Error(
          "This account does not have a pending email change request.",
        );
      }

      const emailResult = MailGun.sendEmailConfirmationTemplate(
        {
          to: findWPUser.userFields.changeemail.newEmail,
          firstname: findWPUser.firstName,
          lastname: findWPUser.lastName,
          profileLink: User.Utils.getProfileLink(
            request,
            findWPUser.databaseId.toString(),
          ),
        },
        User.Utils.getConfirmEmailChangeLink(
          request,
          findWPUser.email,
          findWPUser.userFields.changeemail.code,
        ),
      );

      if (emailResult instanceof Error) {
        return new Error(
          "An error occurred while sending the email confirmation. Please try again later.",
        );
      }
    }

    public static async verifyResetPasswordCode(
      email: string,
      code: string,
    ): Promise<void | Error> {
      const resetPassword = await User.API.getResetPasswordCode(email);

      const invalidCodeError = new Error(
        "You entered an invalid code. Please try again.",
      );
      if (!resetPassword || resetPassword instanceof Error) {
        return invalidCodeError;
      }

      if (resetPassword.code !== code) {
        return invalidCodeError;
      }

      const expiration = parseDateTimeGraphql(resetPassword.expiration);
      if (!expiration.isValid) return invalidCodeError;

      if (expiration.diff(getCurrentDateTime()).as("minutes") <= 0) {
        // if now datetime is greater than expiration
        return new Error("The code has expired. Please request a new one: ");
      }
    }

    public static async changePassword(
      email: string,
      password: string,
    ): Promise<iWP_User | Error> {
      const findWPUser = await User.API.getUser(email, "EMAIL");
      if (findWPUser instanceof Error) {
        return new Error(
          "Our system encountered an unexpected error. Please try again later.",
        );
      }

      if (findWPUser === null) {
        return new Error(
          "This email address is not associated with an account.",
        );
      }

      if (findWPUser.userFields.createdViaMemberclicks) {
        return new Error(
          "This account was created via MemberClicks. Please change your password using the MemberClicks website.",
        );
      }

      const result = await User.API.changePassword(
        findWPUser.databaseId.toString(),
        password,
      );

      if (result instanceof Error) {
        return result;
      }
      return findWPUser;
    }

    public static async setDeletionDate(
      userId: string,
      deletionDate: string,
    ): Promise<string | Error> {
      return await User.API.updateProfile(userId, {
        deletionDate: { value: deletionDate },
      });
    }

    public static async removeDeletionDate(
      userId: string,
    ): Promise<string | Error> {
      return await User.API.updateProfile(userId, {
        deletionDate: { value: "" },
      });
    }

    public static async getMemberClicksProfile(
      request: Request,
      email: string,
      isPublic = true,
    ): Promise<
      | iPublic_MemberClicksProfileAttributes
      | iMemberClicksProfileAttributes
      | undefined
      | Error
    > {
      const mcToken = await getMemberClicksSessionToken(request);
      if (!mcToken) return new Error("Unable to connect to MemberClicks");

      const mc_result = await MemberClicks.profileSearch(mcToken, {
        "[Email | Primary]": email,
      });
      if ("error" in mc_result) return new Error(mc_result.error);

      const searchId = mc_result.id;

      const profiles = await MemberClicks.getSearchResults(
        mcToken,
        searchId,
        1,
        1,
      );
      if ("error" in profiles) {
        return new Error(profiles.error);
      }

      const findProfile = profiles.profiles.find(
        (profile) => profile["[Email | Primary]"] === email,
      );

      if (!findProfile) return undefined;

      if (isPublic) {
        return MemberClicks.publicizeMemberClicksProfileResult(
          findProfile as iMemberClicksProfileAttributes,
        );
      }

      return findProfile;
    }
  };

  static Forms = class {
    public static async executeLoginAction(
      request: Request,
      formData: FormData,
      schemaObject: ZodRawShape,
      viaMemberClicks = false,
      ignoreDeletion = false,
      clearDeletion = false,
    ): Promise<TypedResponse<iGenericError>> {
      const submittedForm = await handleRequestFormFieldsValidation({
        schema: schemaObject,
        formData,
      });

      if (!("fields" in submittedForm)) {
        return submittedForm;
      }

      const email = submittedForm.fields.find(
        (field) => field.name === "email",
      );
      const password = submittedForm.fields.find(
        (field) => field.name === "password",
      );

      const MC_Profile = await User.Methods.getMemberClicksProfile(
        request,
        email?.value as string,
        false,
      );

      if (!(MC_Profile instanceof Error)) {
        if (MC_Profile && UserPublic.Utils.isAllyMember(MC_Profile)) {
          return json(
            {
              error:
                "You're an Ally member! The CHW Connector Platform is restricted to Users who identify as CHW's.",
            },
            { status: 400 },
          );
        }
      }

      if (!viaMemberClicks) {
        const findWPUser = await User.API.getUser(
          email?.value as string,
          "EMAIL",
        );
        if (findWPUser instanceof Error) {
          console.error("executeLoginAction", findWPUser);
          return json(
            {
              error:
                "Our system encountered an unexpected error. Please try again later.",
            },
            { status: 400 },
          );
        }

        if (findWPUser !== null) {
          if (findWPUser.userFields.createdViaMemberclicks) {
            return json(
              {
                error:
                  "This account was created via MemberClicks. Please log in using the MemberClicks button.",
              },
              { status: 400 },
            );
          }

          if (!ignoreDeletion && findWPUser.userFields.isDeleted) {
            const returnError: iGenericError = {
              error: HPFORM_ACCOUNT_DELETED,
              error_description:
                "<p> This account is scheduled for deletion. </p>",
            };

            if (findWPUser.userFields.deletionDate) {
              const deletionStartDate = parseDateTimeGraphql(
                findWPUser.userFields.deletionDate,
              );

              if (deletionStartDate.isValid) {
                const deletionEndDate = deletionStartDate.plus({
                  days: USER_ACCOUNT_DELETION_DELAY_DAYS,
                });

                const daysLeft = deletionEndDate
                  .diff(getCurrentDateTime())
                  .as("days");

                returnError.error_description += `<p> It will be deleted in <b>${Math.ceil(daysLeft)} days</b>. </p>`;

                returnError.error_description +=
                  "<p> Signing in will cancel the deletion process. <br/> Do you want to proceed? </p>";
              }
            }

            return json(returnError, { status: 400 });
          }
          if (clearDeletion) {
            await User.Methods.removeDeletionDate(
              findWPUser.databaseId.toString(),
            );
          }
        }
      }

      const result = await User.API.loginUser(
        email?.value as string,
        password?.value as string,
      );

      if (result instanceof Error) {
        return json({ error: result.message }, { status: 400 });
      }
      const redirect = await setUserSession(request, result, APP_ROUTES.FEED);
      return redirect;
    }

    public static async executeSignupAction(
      request: Request,
      formData: FormData,
      schemaObject: ZodRawShape,
      viaMemberClicks = false,
    ): Promise<TypedResponse> {
      const mcToken = await getMemberClicksSessionToken(request);
      if (!mcToken) {
        return json(
          { error: "Unable to connect to MemberClicks" },
          { status: 400 },
        );
      }

      const submittedForm = await handleRequestFormFieldsValidation({
        schema: schemaObject,
        formData,
      });

      if (!("fields" in submittedForm)) {
        return submittedForm;
      }

      const firstName = submittedForm.fields.find(
        (field) => field.name === "firstName",
      );

      const lastName = submittedForm.fields.find(
        (field) => field.name === "lastName",
      );

      const email = submittedForm.fields.find(
        (field) => field.name === "email",
      );
      const password = submittedForm.fields.find(
        (field) => field.name === "password",
      );

      const emailType = submittedForm.fields.find(
        (field) => field.name === "email-type",
      );

      const MC_Profile = await User.Methods.getMemberClicksProfile(
        request,
        email?.value as string,
        false,
      );

      if (MC_Profile instanceof Error) {
        return json({ error: MC_Profile.message }, { status: 400 });
      }

      if (MC_Profile && UserPublic.Utils.isAllyMember(MC_Profile)) {
        return json(
          {
            error:
              "You're an Ally member! The CHW Connector Platform is restricted to Users who identify as CHW's.",
          },
          { status: 400 },
        );
      }

      const result = await User.API.createUser(
        firstName?.value as string,
        lastName?.value as string,
        email?.value as string,
        password?.value as string,
        emailType?.value as string,
        viaMemberClicks,
      );

      if (result instanceof Error) {
        return json({ error: result.message }, { status: 400 });
      }

      const loginResult = await User.API.loginUser(
        email?.value as string,
        password?.value as string,
      );

      if (loginResult instanceof Error) {
        return json({ error: loginResult.message }, { status: 400 });
      }

      return await setUserSession(request, loginResult, APP_ROUTES.FEED);
    }

    public static async executeResetPasswordAction(
      request: Request,
      formData: FormData,
      schemaObject: ZodRawShape,
    ): Promise<TypedResponse | iHPActionData> {
      const submittedForm = await handleRequestFormFieldsValidation({
        schema: schemaObject,
        formData,
      });

      if (!("fields" in submittedForm)) {
        return submittedForm;
      }
      const email = submittedForm.fields.find(
        (field) => field.name === "email",
      );

      const result = await User.Methods.emailResetPassword(
        request,
        email?.value as string,
      );

      if (result instanceof Error) {
        return json({ error: result.message }, { status: 400 });
      }

      return { activeForm: "CONFIRM_RESET_CODE" };
    }

    public static async executeLoginMemberClicksAction(
      request: Request,
      memeberClickToken: iMemberClicksAccessTokenResponse,
    ): Promise<Error> {
      /**
       * 1. Get the user access token and user id from the memberClicks response
       * 2. Get the user profile from memberClicks
       * 3. Determine if the user exists in WordPress (account is already created)
       * 3a. If the user exists, log the user in
       * 4. If the user does not exist, create the user in WordPress
       * 5. Log the user in
       */
      const { access_token, userId } = memeberClickToken;

      const user = await MemberClicks.getProfileById(
        access_token,
        userId,
        true,
      );
      if ("error" in user) {
        if ("error_description" in user) {
          // invalid token
          return new Error(user.error_description);
        }
        // unexpected error
        return new Error("Error getting user profile");
      }

      const emailPreferred = user["[Email | Preferred]"];
      const emailPrimary = user["[Email | Primary]"];
      const email = emailPreferred || emailPrimary;

      if (user && UserPublic.Utils.isAllyMember(user)) {
        return new Error(
          "You're an Ally member! The CHW Connector Platform is restricted to Users who identify as CHW's.",
        );
      }

      const findWPUser = await User.API.getUser(email, "EMAIL");
      if (findWPUser instanceof Error) {
        return new Error(
          "Our system encountered an unexpected error. Please try again later.",
        );
      }

      if (findWPUser !== null) {
        if (findWPUser.userFields.createdViaMemberclicks == false) {
          return new Error(
            "Your MemberClicks's email is already associated with an account. Please log in using the email and password you used to create your account.",
          );
        }

        const loginFormFields = _.cloneDeep(LoginFormFields);
        loginFormFields.forEach((field) => {
          switch (field.name) {
            case "email":
              field.value = email;
              break;
            case "password":
              field.value = `MC@${user["[Profile ID]"]}`;
              break;
          }
        });

        const formData = new FormData();
        formData.append("form", JSON.stringify(loginFormFields));

        const loginResponse = await User.Forms.executeLoginAction(
          request,
          formData,
          ACCOUNT_SCHEMAS.LOGIN,
          true,
        );

        if (loginResponse.status === 302) {
          // successful login
          throw loginResponse;
        }

        const body = (await loginResponse.json()) as object;

        if ("error" in body) {
          return new Error(
            "An error occurred while logging in with MemberClicks: " +
              body.error,
          );
        }
      }

      const formFields = _.cloneDeep(SignupFormFields);
      formFields.forEach((field) => {
        switch (field.name) {
          case "firstName":
            field.value = user["[Name | First]"];
            break;
          case "lastName":
            field.value = user["[Name | Last]"];
            break;
          case "email":
            field.value = email;
            break;
          case "password":
            field.value = `MC@${user["[Profile ID]"]}`;
            break;
          case "chw-worker":
            field.value = "yes";
            break;
          case "email-type":
            field.value = "personal";
            break;
        }
      });

      const formData = new FormData();
      formData.append("form", JSON.stringify(formFields));

      const signupResponse = await User.Forms.executeSignupAction(
        request,
        formData,
        ACCOUNT_SCHEMAS.SIGNUP,
        true,
      );

      if (signupResponse.status === 302) {
        // successful signup
        throw signupResponse;
      }

      const body = (await signupResponse.json()) as object;
      if ("error" in body) {
        return new Error(
          "An error occurred while transferring your information from MemberClicks: " +
            body.error,
        );
      }

      return new Error("An unknown error occurred. Please try again later.");
    }

    public static async executeConfirmResetPasswordAction(
      request: Request,
      formData: FormData,
      schemaObject: ZodRawShape,
    ): Promise<TypedResponse | iHPActionData> {
      const submittedForm = await handleRequestFormFieldsValidation({
        schema: schemaObject,
        formData,
      });

      if (!("fields" in submittedForm)) {
        return submittedForm;
      }

      const email = submittedForm.fields.find(
        (field) => field.name === "email",
      );

      const code = submittedForm.fields.find((field) => field.name === "code");

      const result = await User.Methods.verifyResetPasswordCode(
        email?.value as string,
        code?.value as string,
      );

      if (result instanceof Error) {
        return json({ error: result.message }, { status: 400 });
      }

      return { activeForm: "CHANGE_PASSWORD" };
    }

    public static async executeConfirmResetPasswordRequest(
      request: Request,
    ): Promise<Error | void | iHPForms> {
      const params = getRequestParams(request);

      if (!params.has("email") || !params.has("reset-code")) return;
      const fields = _.cloneDeep(confirmResetPasswordFormFields);

      const email = params.get("email");
      const code = params.get("reset-code");

      const emailField = fields.find((field) => field.name === "email");
      if (emailField) emailField.value = email as string;

      const codeField = fields.find((field) => field.name === "code");
      if (codeField) codeField.value = code as string;

      const formData = new FormData();
      formData.append("form", JSON.stringify(fields));

      const confirmCodeResponse =
        await User.Forms.executeConfirmResetPasswordAction(
          request,
          formData,
          ACCOUNT_SCHEMAS.CONFIRM_RESET_PASSWORD,
        );

      if ("activeForm" in confirmCodeResponse) {
        return confirmCodeResponse.activeForm;
      }

      const body = (await confirmCodeResponse.json()) as object;
      if ("error" in body) {
        return new Error(body.error as string);
      }

      return "CONFIRM_RESET_CODE";
    }

    public static async executeChangePasswordAction(
      request: Request,
      formData: FormData,
      schemaObject: ZodRawShape,
    ): Promise<TypedResponse | iHPActionData> {
      const submittedForm = await handleRequestFormFieldsValidation({
        schema: schemaObject,
        formData,
      });

      if (!("fields" in submittedForm)) {
        return submittedForm;
      }

      const email = submittedForm.fields.find(
        (field) => field.name === "email",
      );

      const password = submittedForm.fields.find(
        (field) => field.name === "password",
      );

      const UserResult = await User.Methods.changePassword(
        email?.value as string,
        password?.value as string,
      );

      if (UserResult instanceof Error) {
        return json({ error: UserResult.message }, { status: 400 });
      }

      // resetting the password code so it can't be used again
      const expiration = new Date();
      expiration.setMinutes(expiration.getDay() - 1);

      const formatExpiration = convertDateTimeForACF(expiration);

      const result = await User.API.setResetPasswordCode(
        UserResult.databaseId.toString(),
        generatePassword(10),
        formatExpiration,
      );

      if (result instanceof Error) {
        return json({ error: result.message }, { status: 400 });
      }

      return {
        activeForm: "LOGIN",
        success: "Your password has been changed successfully. Please log in.",
      };
    }

    public static async executeUpdateProfileAction(
      request: Request,
      formData: FormData,
    ): Promise<
      TypedResponse<
        | { success: iWP_User }
        | { error: string }
        | { error: iProfileFormFields }
      >
    > {
      const JWTUser = await getJWTUserDataFromSession(request);
      if (!JWTUser) {
        return json({ error: "UNAUTHORIZED" }, { status: 401 });
      }

      const userId = JWTUser.user.ID;

      const submittedFields = formData.get("profileFields") as string;
      const parsedProfileFields = JSON.parse(
        submittedFields,
      ) as iProfileFormFields;

      const profileFields = copyKeysToObject(
        defaultProfileFormFields,
        parsedProfileFields,
      ) as iProfileFormFields;

      const validation = handleProfileFormFieldsValidation(
        profileFields,
        ProfileFormFieldSchema,
      );

      if (!isProfileFormFieldsValid(validation)) {
        return json({ error: validation }, { status: 400 });
      }

      const transformProfileFields =
        transformProfileFormFieldsToSave(profileFields);

      const result = await User.API.updateProfile(
        userId,
        transformProfileFields,
      );
      if (result instanceof Error) {
        return json({ error: result.message }, { status: 400 });
      }

      const userPRIVATE = await User.API.getUser(
        JWTUser.user.user_email,
        "EMAIL",

        true,
      );
      if (userPRIVATE instanceof Error || userPRIVATE === null) {
        return json(
          {
            error:
              "An error occurred while updating your profile. Please try again later.",
          },
          { status: 400 },
        );
      }

      if (
        userPRIVATE.userFields.createdViaMemberclicks === false &&
        userPRIVATE.userFields.changeemail.newEmail &&
        userPRIVATE.userFields.changeemail.code
      ) {
        if (userPRIVATE.userFields.changeemail.newEmail !== userPRIVATE.email) {
          await User.Methods.emailChangeConfirmation(
            request,
            userPRIVATE.email,
          );
        }
      }

      const user = await User.API.getUser(JWTUser.user.user_email, "EMAIL");
      if (user instanceof Error || user === null) {
        return json(
          {
            error:
              "An error occurred while updating your profile. Please try again later.",
          },
          { status: 400 },
        );
      }
      return json({ success: user });
    }

    public static async executeConfirmEmail(
      code: string,
      email: string,
    ): Promise<void | Error> {
      const findWPUser = await User.API.getUser(email, "EMAIL", true);
      if (findWPUser instanceof Error) {
        return new Error(
          "Our system encountered an unexpected error. Please try again later.",
        );
      }

      if (findWPUser === null) {
        return new Error(
          "This email address is not associated with an account.",
        );
      }

      if (!findWPUser.userFields.changeemail.newEmail) {
        return new Error(
          "This account does not have a pending email change request.",
        );
      }

      if (!findWPUser.userFields.changeemail.expiration) {
        return new Error(
          "This account does not have a pending email change request.",
        );
      }

      if (!findWPUser.userFields.changeemail.code) {
        return new Error(
          "This account does not have a pending email change request.",
        );
      }

      if (findWPUser.userFields.changeemail.code !== code) {
        const invalidCodeError = new Error("The code is invalid.");
        invalidCodeError.name = "INVALID_CODE";
        return invalidCodeError;
      }

      const expiration = parseDateTimeGraphql(
        findWPUser.userFields.changeemail.expiration,
      );
      if (!expiration.isValid) {
        const invalidCodeError = new Error("The expiration date is invalid");
        invalidCodeError.name = "INVALID_EXPIRATION";
        return invalidCodeError;
      }

      if (expiration.diff(getCurrentDateTime()).as("minutes") <= 0) {
        const expiredCodeError = new Error("The code has expired.");
        expiredCodeError.name = "EXPIRED_CODE";
        return expiredCodeError;
      }

      const result = await User.API.changeEmail(
        findWPUser.databaseId.toString(),
        findWPUser.userFields.changeemail.newEmail,
      );

      if (result instanceof Error) {
        return result;
      }

      return;
    }

    public static async executeUpdatePassword(
      request: Request,
      formData: FormData,
      schemaObject: ZodRawShape,
    ): Promise<TypedResponse<iGenericSuccess | iGenericError>> {
      const submittedForm = await handleRequestFormFieldsValidation({
        schema: schemaObject,
        formData,
      });

      if (!("fields" in submittedForm)) {
        return submittedForm;
      }

      const JWTUser = await getJWTUserDataFromSession(request);
      if (!JWTUser) {
        return json({ error: "UNAUTHORIZED" }, { status: 401 });
      }

      const userId = JWTUser.user.ID;

      const currentPassword = submittedForm.fields.find(
        (field) => field.name === "password",
      );

      const newPassword = submittedForm.fields.find(
        (field) => field.name === "newPassword",
      );

      const confirmPassword = submittedForm.fields.find(
        (field) => field.name === "confirmPassword",
      );

      if (newPassword?.value !== confirmPassword?.value) {
        return json(
          { error: "The new password and confirm password do not match." },
          { status: 400 },
        );
      }

      if (newPassword?.value === currentPassword?.value) {
        return json(
          {
            error:
              "The new password cannot be the same as the current password.",
          },
          { status: 400 },
        );
      }

      const validPassword = await User.API.validatePassword(
        userId,
        currentPassword?.value as string,
      );

      if (validPassword instanceof Error || validPassword === null) {
        return json(
          {
            error:
              "An error occurred while validating your current password. Please try again later.",
          },
          { status: 400 },
        );
      }

      if (!validPassword) {
        return json(
          { error: "The current password you entered is incorrect." },
          { status: 400 },
        );
      }

      const result = await User.Methods.changePassword(
        JWTUser.user.user_email,
        newPassword?.value as string,
      );

      if (result instanceof Error) {
        return json({ error: result.message }, { status: 400 });
      }

      return json({ success: "Your password has been changed successfully." });
    }

    public static async executeUpdateNotificationsSettings(
      request: Request,
      formData: FormData,
    ): Promise<
      TypedResponse<{ success: iNotificationSettings } | iGenericError>
    > {
      const url = new URL(request.url);
      const currentSettings = parseSettingsFromPathName(
        url.pathname,
        defaultNotificationSettings,
      );

      if (!currentSettings) {
        return json({ error: "Invalid settings path" }, { status: 400 });
      }

      if (!("settings" in currentSettings)) {
        return json({ error: "Invalid settings" }, { status: 400 });
      }

      const schemaObject = createSchemaObjectFromSettings(
        currentSettings.settings,
      );

      const submittedForm = await handleRequestFormFieldsValidation({
        schema: schemaObject,
        formData,
      });

      if (!("fields" in submittedForm)) {
        return submittedForm;
      }

      const primaryCategory = currentSettings.primaryCategory;
      const settingsName = currentSettings.title;

      const updatedSettings = User.Utils.updateNotificationSettings(
        primaryCategory,
        settingsName as keyof iNotificationSettings[typeof primaryCategory],
        {
          emailNotifications: submittedForm.fields.find(
            (field) => field.name === "emailNotifications",
          )?.value as boolean,
          pushNotifications: submittedForm.fields.find(
            (field) => field.name === "pushNotifications",
          )?.value as boolean,
          siteNotifications: submittedForm.fields.find(
            (field) => field.name === "siteNotifications",
          )?.value as boolean,
        },
        defaultNotificationSettings,
      );

      if (!updatedSettings) {
        return json({ error: "Invalid settings" }, { status: 400 });
      }

      const WP_Settings =
        User.Utils.pepareNotificationSettingsForWP(updatedSettings);

      const JWTUser = await getJWTUserDataFromSession(request);
      if (!JWTUser) {
        return json({ error: "UNAUTHORIZED" }, { status: 401 });
      }

      const userId = JWTUser.user.ID;

      const result = await User.API.updateProfile(userId, WP_Settings);
      if (result instanceof Error) {
        return json({ error: result.message }, { status: 400 });
      }

      return json({ success: updatedSettings });
    }

    public static async executeDeleteAccount(
      request: Request,
      formData: FormData,
      schemaObject: ZodRawShape,
    ): Promise<TypedResponse<iGenericError> | void> {
      const submittedForm = await handleRequestFormFieldsValidation({
        schema: schemaObject,
        formData,
      });

      if (!("fields" in submittedForm)) {
        return submittedForm;
      }

      const JWTUser = await getJWTUserDataFromSession(request);
      if (!JWTUser) {
        return json({ error: "UNAUTHORIZED" }, { status: 401 });
      }

      const userId = JWTUser.user.ID;

      const today = new Date();
      const deletionDate = convertDateTimeForACF(today);

      const result = await User.Methods.setDeletionDate(userId, deletionDate);

      if (result instanceof Error) {
        return json({ error: result.message }, { status: 400 });
      }

      return await clearUserSession(request);
    }
  };

  public static Utils = class {
    public static getProfileLink(request: Request, userId: string): string {
      const domain = getRequestDomain(request);
      return `${domain}${APP_ROUTES.PROFILE}/${userId}`;
    }
    public static getUserProfileLink(request: Request, email: string) {
      const domain = getRequestDomain(request);
      // remove domain from email
      email = email.split("@")[0];
      return `${domain}${APP_ROUTES.PROFILE}/${email}`;
    }

    public static getResetPasswordLink(
      request: Request,
      email: string,
      code: string,
    ) {
      const domain = getRequestDomain(request);
      const emailUri = encodeURIComponent(email);
      const codeUri = encodeURIComponent(code);
      return `${domain}?email=${emailUri}&reset-code=${codeUri}`;
    }

    public static getConfirmEmailChangeLink(
      request: Request,
      email: string,
      code: string,
    ) {
      const domain = getRequestDomain(request);
      const emailUri = encodeURIComponent(email);
      const codeUri = encodeURIComponent(code);
      return `${domain}${APP_ROUTES.CONFIRM_EMAIL}/?email=${emailUri}&code=${codeUri}`;
    }

    public static updateNotificationSettings<
      iNotificationSettings,
      K extends keyof iNotificationSettings,
    >(
      settingsCategory: K,
      settingsName: keyof iNotificationSettings[K],
      newSettings: iNotificationSettings_Type,
      currentSettings: iNotificationSettings,
    ): iNotificationSettings | undefined {
      if (!currentSettings || typeof currentSettings !== "object") return;
      if (!(settingsCategory in currentSettings)) return;

      if (
        !currentSettings[settingsCategory] ||
        typeof currentSettings[settingsCategory] !== "object"
      )
        return;
      if (!(settingsName in currentSettings[settingsCategory])) return;

      const clonedSettings = _.cloneDeep(currentSettings);
      const subCategory = clonedSettings[settingsCategory][settingsName];
      if (!subCategory || typeof subCategory !== "object") return;

      const clonedNewSettings = copyKeysToObject(subCategory, newSettings);

      clonedSettings[settingsCategory][settingsName] = clonedNewSettings;

      return clonedSettings;
    }

    public static pepareNotificationNameForWP(
      categoryName: string,
      settingName: string,
    ): string {
      return categoryName + WP_NOTIFICATION_SEPARATOR + settingName;
    }

    public static pepareNotificationSettingsForWP(
      settings: iNotificationSettings,
    ): iWP_NotificationSettings_Prepare {
      // ANY UPDATES TO THIS FUNCTION SHOULD BE APPLIED TO restoreNotificationSettingsFromWP
      const WP_Settings: iWP_NotificationSettings_Prepare = {
        siteNotifications: { value: [] },
        pushNotifications: { value: [] },
        emailNotifications: { value: [] },
      };

      const notificationsKeys = Object.keys(WP_Settings) as Array<
        keyof iNotificationSettings_Type
      >;

      for (const category in settings) {
        const categoryKey = category as keyof iNotificationSettings;
        if (!settings[categoryKey] || typeof settings[categoryKey] !== "object")
          continue;
        for (const setting in settings[categoryKey]) {
          const settingKey =
            setting as keyof iNotificationSettings[typeof categoryKey];
          if (
            !settings[categoryKey][settingKey] ||
            typeof settings[categoryKey][settingKey] !== "object"
          )
            continue;
          const settingValue = settings[categoryKey][settingKey];

          notificationsKeys.forEach((notificationsKey) => {
            if (
              notificationsKey in settingValue &&
              settingValue[notificationsKey] === true
            ) {
              WP_Settings[notificationsKey].value.push(
                User.Utils.pepareNotificationNameForWP(category, setting),
              );
            }
          });
        }
      }

      return WP_Settings;
    }

    public static restoreNotificationSettingsFromWP(
      WP_Settings: iWP_NotificationSettings_Restore,
    ): iNotificationSettings {
      // ANY UPDATES TO THIS FUNCTION SHOULD BE APPLIED TO pepareNotificationSettingsFormForWP
      const settings = _.cloneDeep(defaultNotificationSettings);

      // loop through notificationSettings categories
      // loop through subcategories
      // loop through notification types
      // if notification type is not in the WP_Settings, set it to false

      for (const category in settings) {
        const categoryKey = category as keyof iNotificationSettings;
        if (!settings[categoryKey] || typeof settings[categoryKey] !== "object")
          continue;
        for (const setting in settings[categoryKey]) {
          const settingKey =
            setting as keyof iNotificationSettings[typeof categoryKey];
          if (
            !settings[categoryKey][settingKey] ||
            typeof settings[categoryKey][settingKey] !== "object"
          )
            continue;
          const settingValue = settings[categoryKey][
            settingKey
          ] as iNotificationSettings_Subcategory;
          for (const settingValue_Key in settingValue) {
            const settingValue_KeyKey =
              settingValue_Key as keyof iNotificationSettings_Subcategory;
            if (!settingValue[settingValue_KeyKey]) continue;
            if (!(typeof settingValue[settingValue_KeyKey] === "boolean"))
              continue;

            if (settingValue_KeyKey in WP_Settings) {
              const notificationTypes =
                WP_Settings[
                  settingValue_KeyKey as keyof iWP_NotificationSettings_Restore
                ];

              const notificationName = User.Utils.pepareNotificationNameForWP(
                category,
                setting,
              );
              if (
                !Array.isArray(notificationTypes) ||
                !notificationTypes.includes(notificationName)
              ) {
                (settings[categoryKey][settingKey][
                  settingValue_KeyKey
                ] as boolean) = false;
                // console.log(notificationName, settingValue_KeyKey, "false");
              } else {
                // console.log(notificationName, settingValue_KeyKey, "true");
              }
            }
          }
        }
      }
      // console.log("settings", settings);

      return settings;
    }

    public static async getUserFromSession(
      request: Request,
    ): Promise<iWP_User | Error | undefined> {
      const userToken = await getUserSessionToken(request);
      if (!userToken) return;
      const userData = await User.API.validateToken(userToken);
      if (!userData) return;
      const user = await User.API.getUser(userData.user.user_email, "EMAIL");
      if (user === null) return;

      return user;
    }

    public static removeSensitiveUserData(user: iWP_User): iPublicUser {
      const profileFields = {
        ...transformProfileFormFieldsToSave(
          convertUserToProfileFormFields(user),
        ),
        databaseId: user.databaseId,
      };

      // remove private fields
      for (const key in profileFields) {
        const keyName = key as keyof iProfileFormFields;
        if (typeof profileFields[keyName] === "object") {
          if (
            "public" in profileFields[keyName] &&
            "value" in profileFields[keyName]
          ) {
            if (profileFields[keyName].public === false) {
              if (Array.isArray(profileFields[keyName].value)) {
                profileFields[keyName].value = [];
              } else {
                profileFields[keyName].value = "";
              }
            }
          }
        }
      }

      return profileFields;
    }

    public static getUploadKeys(userToken: string): iUser_UploadKeys {
      return {
        authorization: encryptUserSession(userToken),
        uploadUrl: APP_KEYS.UPLOAD.ALL_FILES,
        avatarUrl: APP_KEYS.UPLOAD.AVATAR,
      };
    }
  };
}

function transformUser(
  user: iWP_User | null | undefined,
): iWP_User | null | undefined {
  if (!user) return user;

  if (
    "userFields" in user &&
    user.userFields &&
    typeof user.userFields === "object"
  ) {
    const migratedFields: {
      siteNotifications: string[];
      pushNotifications: string[];
      emailNotifications: string[];
    } = {
      siteNotifications: [],
      pushNotifications: [],
      emailNotifications: [],
    };

    const userFields = user.userFields as { [key: string]: unknown };
    for (const key in migratedFields) {
      if (key in userFields) {
        const migratedValue = userFields[key];
        if (Array.isArray(migratedValue)) {
          migratedFields[key as keyof typeof migratedFields] =
            _.cloneDeep(migratedValue);
          // userFields[key] = undefined;
        }
      }
    }

    user.userFields.notificationSettings =
      User.Utils.restoreNotificationSettingsFromWP({
        siteNotifications: migratedFields.siteNotifications,
        pushNotifications: migratedFields.pushNotifications,
        emailNotifications: migratedFields.emailNotifications,
      });

    user.userFields.isDeleted = false;
    if ("deletionDate" in user.userFields && user.userFields.deletionDate) {
      user.userFields.isDeleted = true;
    }
  }
  return user;
}
