import { createContext } from "react";
import type { iAppContext } from "~/models/appContext.model";

export const defaultAppContext: iAppContext = {
  User: undefined,
  UploadKeys: {
    authorization: "",
    uploadUrl: "",
    avatarUrl: "",
  },
  UploadManager: {
    attachments: [],
  },
  NotificationManager: [],
  MessagesManager: {
    unreadIds: [],
  },
};
export const AppContext = createContext<{
  appContext: iAppContext;
  setAppContext: (appContext: iAppContext) => void;
}>({
  appContext: defaultAppContext,
  setAppContext: () => {
    return;
  },
});
