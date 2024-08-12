import { iNotification } from "~/components/Managers/Notification/NotificationManager";
import { iUploadManager } from "./uploadManager";
import { iWP_User } from "./user.model";

export type iAppContext = {
  User?: iWP_User;
  UploadManager: iUploadManager;
  NotificationManager: iNotification[];
};

export type iGenericError = {
  error: string;
  error_description?: string;
};

export type iGenericSuccess = {
  success: string;
};
