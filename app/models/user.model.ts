import type { iNotificationSettings } from "./notifications.model";

export type iWP_User = {
  databaseId: number;
  firstName: string;
  lastName: string;
  email: string;
  avatar: {
    url?: string;
  };
  roles: {
    nodes: {
      name: string;
    }[];
  };
  userFields: {
    createdViaMemberclicks: boolean;
    chwWorker: boolean;
    emailType: string;
    aboutMe?: string;
    phoneNumber?: string;
    state?: string;
    zipCode?: number;
    region?: string;
    preferredLanguages?: string;
    education?: string;
    ageRange?: string;
    certifiedWorker?: boolean;
    deletionDate?: string;
    isDeleted: boolean;
    ethnicity?: string[];
    topPopulations?: string[];
    memberships?: string[];
    genderIdentity?: string[];
    howDidYouHear?: string[];
    public?: string[];
    groupAdminAll?: number[];
    changeemail: {
      newEmail?: string;
      code?: string;
      expiration?: string;
    };
    notificationSettingsEncoded: string;
    notificationSettings: iNotificationSettings;
  };
};

export type iWP_User_RestPassword = {
  code: string;
  expiration: string;
};

export type iWP_Users = {
  nodes: iWP_User[];
};

export type iUser_UploadKeys = {
  authorization: string;
  uploadUrl: string;
  avatarUrl: string;
};
