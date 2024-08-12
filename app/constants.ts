export const APP_ROUTES = {
  HOME: "/",
  LOGIN: "/",
  LOGOUT: "/logout",
  REGISTER: "/sign-up",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  PROFILE: "/user",
  FEED: "/feed",
  POST: "/post",
  COMMUNITIES: "/communities",
  COMMUNITIES_DISCOVER: "/communities/discover",
  COMMUNITIES_MY: "/communities/my",
  CHW_NETWORKS: "/chw-networks",
  CHW_NETWORKS_DISCOVER: "/chw-networks/discover",
  CHW_NETWORKS_MY: "/chw-networks/my",
  PUBLIC_HEALTH_ALERTS: "/public-health-alerts",
  MESSAGES: "/messages",
  NOTIFICATIONS: "/notifications",
  ABOUT: "/about",
  CONTACT: "/contact",
  TERMS_OF_USE: "/terms-of-use",
  COMMUNITY_GUIDELINES: "/community-guidelines",
  PRIVACY_POLICY: "/privacy-policy",
  ACCESSIBILITY: "/accessibility",
  SETTINGS: "/settings",
  HELP_CENTER: "/help-center",
  ABOUT_CHW_CONNECTOR: "https://nachw.org/about/",
  CONFIRM_EMAIL: "/confirm-email",
};

export const APP_CLASSNAMES = {
  CONTAINER:
    "container mx-auto max-w-[45rem] py-5 flex flex-col gap-5 max-md:max-w-full max-md:gap-0",
  CONTAINER_FULLWIDTH: "container mx-auto max-w-8xl",
};

export const APP_TIMEZONE = "America/New_York";
export const APP_DATE_FORMAT = "yyyy-LL-dd hh:mm:ss a";
export const USER_ACCOUNT_DELETION_DELAY_DAYS = 30;
export const USER_ROLES = {
  ADMIN: "administrator",
  EDITOR: "editor",
  CONTRIBUTOR: "contributor",
  SUBSCRIBER: "subscriber",
  AUTHOR: "author",
};
