import type { iNotification } from "~/components/Managers/Notification/NotificationManager";
import type { iUploadManager } from "./uploadManager";
import type { iUser_UploadKeys, iWP_User } from "./user.model";
import type { Dispatch, SetStateAction } from "react";

export type iAppContext = {
  User: {
    user?: iWP_User;
    set: Dispatch<SetStateAction<iWP_User | undefined>>;
  };
  UploadKeys: {
    uploadKeys: iUser_UploadKeys;
    set: Dispatch<SetStateAction<iUser_UploadKeys>>;
  };
  UploadManager: {
    uploadManager: iUploadManager;
    set: Dispatch<SetStateAction<iUploadManager>>;
  };
  NotificationManager: {
    notificationManager: iNotification[];
    unreadIds: number[];
    setNotifications: Dispatch<SetStateAction<iNotification[]>>;
    addNotification: (notification: iNotification) => void;
    removeNotification: (index: number) => void;
    setUnreadIds: Dispatch<SetStateAction<number[]>>;
    addUnreadId: (unreadId: number) => void;
  };
  MessagesManager: {
    unreadIds: number[];
    setUnreadIds: Dispatch<SetStateAction<number[]>>;
    addUnreadId: (unreadId: number) => void;
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
