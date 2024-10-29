import type { iWP_Post_Group_Type } from "./post.model";

export const WP_NOTIFICATION_SEPARATOR = " | ";
export type iNotificationSettings_Type = {
  siteNotifications: boolean;
  pushNotifications: boolean;
  emailNotifications: boolean;
};
export const defaultNotificationSettingsTypes: iNotificationSettings_Type = {
  siteNotifications: true,
  pushNotifications: true,
  emailNotifications: true,
};

export type iNOTIFICATIONS_TYPES = {
  name: string;
  description: string;
  key: keyof iNotificationSettings_Type;
};
export const NOTIFICATIONS_TYPES: iNOTIFICATIONS_TYPES[] = [
  {
    name: "Site Notifications",
    description: "Delivered inside the site",
    key: "siteNotifications",
  },

  {
    name: "Push Notifications",
    description: "Pushed to your device immediately",
    key: "pushNotifications",
  },
  {
    name: "Email Notifications",
    description: "Sent to your email address",
    key: "emailNotifications",
  },
];

export type iNotificationSettings_Subcategory = {
  description: string;
} & iNotificationSettings_Type;
export type iNotificationSettings = {
  "Mobilization Alerts": {
    "Public Health Alerts": iNotificationSettings_Subcategory;
  };
  "Community Groups": iNotificationSettings_Posting;
  "CHW Network Groups": iNotificationSettings_Posting;
  Messaging: {
    "Direct Messages": iNotificationSettings_Subcategory;
    "Message Reminders": iNotificationSettings_Subcategory;
  };
};

export type iNotificationSettings_Posting = {
  "New Posts": iNotificationSettings_Subcategory;
  Comments: iNotificationSettings_Subcategory;
  Reactions: iNotificationSettings_Subcategory;
  Mentions: iNotificationSettings_Subcategory;
};
export const defaultNotificationSettingsPosting: iNotificationSettings_Posting =
  {
    "New Posts": {
      description:
        "These are notifications that are sent to you when there is a new post in a group you are a member of.",
      ...defaultNotificationSettingsTypes,
    },
    Comments: {
      description:
        "These are notifications that are sent to you when there is a new comment on a post you've created or a reply to a comment you've made.",
      ...defaultNotificationSettingsTypes,
    },
    Reactions: {
      description:
        "These are notifications that are sent to you when there is a new reaction to a post or comment you've made.",
      ...defaultNotificationSettingsTypes,
    },
    Mentions: {
      description:
        "These are notifications that are sent to you when you are mentioned or tagged in a post or comment.",
      ...defaultNotificationSettingsTypes,
    },
  };

export const defaultNotificationSettings: iNotificationSettings = {
  "Mobilization Alerts": {
    "Public Health Alerts": {
      description:
        "These are notifications that are sent to you when there is a public health alert.",
      ...defaultNotificationSettingsTypes,
    },
  },
  "Community Groups": {
    ...defaultNotificationSettingsPosting,
  },
  "CHW Network Groups": {
    ...defaultNotificationSettingsPosting,
  },
  Messaging: {
    "Direct Messages": {
      description:
        "These are notifications that are sent to you when you receive a direct message.",
      ...defaultNotificationSettingsTypes,
    },
    "Message Reminders": {
      description:
        "These are notifications letting you know you've messages you haven't read.",
      ...defaultNotificationSettingsTypes,
    },
  },
};

export type iWP_NotificationSettings_Prepare = {
  [key in keyof iNotificationSettings_Type]: {
    value: string[];
  };
};
export type iWP_NotificationSettings_Restore = {
  [key in keyof iNotificationSettings_Type]: string[];
};

export type iWP_NotificationTypes =
  | "comment"
  | "post"
  | "reaction"
  | "mention"
  | "message";

export type iWP_Notification = {
  id: number;
  user_id: number;
  type: iWP_NotificationTypes;
  user_url: string;
  group_id?: number;
  group_type?: iWP_Post_Group_Type;
  group_url?: string;
  avatar: string;
  url: string;
  full_name: string;
  is_read: boolean;
  excerpt: string;
  date: string;
};

export type iWP_User_NotificationSettings = {
  ID: string;
  user_email: string;
  admin: boolean;
} & iWP_NotificationSettings_Restore;

export type iWP_Notification_Pagination = {
  notifications: iWP_Notification[];
  total: number;
  offset: number;
  limit: number;
};
