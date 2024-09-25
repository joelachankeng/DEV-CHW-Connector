import type { iNotification } from "~/components/Managers/Notification/NotificationManager";
import type { iUploadManager } from "./uploadManager";
import type { iUser_UploadKeys, iWP_User } from "./user.model";

export type iAppContext = {
  User?: iWP_User;
  UploadKeys: iUser_UploadKeys;
  UploadManager: iUploadManager;
  NotificationManager: iNotification[];
  MessagesManager: {
    unreadIds: number[];
  };
};

export type iGenericError = {
  error: string;
  error_description?: string;
};

export type iGenericSuccess = {
  success: string;
};

export type iMutationResponse = {
  success: boolean;
  message?: string;
};
