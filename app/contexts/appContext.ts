import { createContext } from "react";
import type { iAppContext } from "~/models/appContext.model";

export const defaultAppContext: iAppContext = {
  User: undefined,
  UploadManager: {
    attachments: [],
  },
  NotificationManager: [],
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
