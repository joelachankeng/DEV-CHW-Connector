import invariant from "tiny-invariant";

invariant(
  process.env.SESSION_SECRET ? process.env.SESSION_SECRET.length === 32 : false,
  "SESSION_SECRET must be 32 characters long",
);
invariant(
  process.env.SESSION_AES_IV ? process.env.SESSION_AES_IV.length === 16 : false,
  "SESSION_AES_IV must be 16 characters long",
);
invariant(process.env.SESSION_AES_IV, "SESSION_AES_IV");
invariant(process.env.MC_DOMAIN, "MC_DOMAIN");
invariant(process.env.MC_CLIENT_ID, "MC_CLIENT_ID");
invariant(process.env.MC_CLIENT_SECRET, "MC_CLIENT_SECRET");
invariant(process.env.JWT_URL, "JWT_URL");
invariant(process.env.JWT_AUTH_KEY, "JWT_AUTH_KEY");
invariant(process.env.GRAPHQL_URL, "GRAPHQL_URL");
invariant(process.env.WP_REST_URL, "WP_REST_URL");
invariant(process.env.WP_ADMIN_USERNAME, "WP_ADMIN_USERNAME");
invariant(process.env.WP_ADMIN_PASSWORD, "WP_ADMIN_PASSWORD");
invariant(process.env.MAILGUN_API_KEY, "MAILGUN_API_KEY");
invariant(process.env.MAILGUN_DOMAIN, "MAILGUN_DOMAIN");
invariant(process.env.MAILGUN_FROM, "MAILGUN_FROM");
invariant(process.env.ONESIGNAL_APP_ID, "ONESIGNAL_APP_ID");
invariant(process.env.ONESIGNAL_REST_API_KEY, "ONESIGNAL_REST_API_KEY");

export const APP_KEYS = {
  PRIVATE: {
    // NEVER expose these keys to the client
    SESSION_SECRET: process.env.SESSION_SECRET,
    SESSION_AES_IV: process.env.SESSION_AES_IV,
    MC_CLIENT_SECRET: process.env.MC_CLIENT_SECRET,
    JWT_URL: process.env.JWT_URL,
    JWT_AUTH_KEY: process.env.JWT_AUTH_KEY,
    GRAPHQL_URL: process.env.GRAPHQL_URL,
    WP_ADMIN_USERNAME: process.env.WP_ADMIN_USERNAME,
    WP_ADMIN_PASSWORD: process.env.WP_ADMIN_PASSWORD,
    MAILGUN_API_KEY: process.env.MAILGUN_API_KEY,
    ONESIGNAL_APP_ID: process.env.ONESIGNAL_APP_ID,
    ONESIGNAL_REST_API_KEY: process.env.ONESIGNAL_REST_API_KEY,
  },
  PUBLIC: {
    MC_CLIENT_ID: process.env.MC_CLIENT_ID,
    MC_DOMAIN: process.env.MC_DOMAIN,
    MAILGUN_DOMAIN: process.env.MAILGUN_DOMAIN,
    MAILGUN_FROM: process.env.MAILGUN_FROM,
    WP_REST_URL: process.env.WP_REST_URL,
  },
  UPLOAD: {
    AVATAR: `${process.env.WP_REST_URL}/user/avatar`,
    ALL_FILES: `${process.env.WP_REST_URL}/post/upload`,
  },
};
