import { createContext } from "react";
import type { iAppContext } from "~/models/appContext.model";

export const defaultAppContext: iAppContext = {
  User: {
    user: undefined,
    set: () => {
      throw new Error("set method not implemented.");
    },
  },
  UploadKeys: {
    uploadKeys: {
      authorization: "",
      uploadUrl: "",
      avatarUrl: "",
    },
    set: () => {
      throw new Error("set method not implemented.");
    },
  },
  UploadManager: {
    uploadManager: {
      attachments: [],
    },
    set: () => {
      throw new Error("set method not implemented.");
    },
  },
  NotificationManager: {
    notificationManager: [],
    setNotifications: () => {
      throw new Error("setNotifications method not implemented.");
    },
    addNotification: () => {
      throw new Error("addNotification method not implemented.");
    },
    removeNotification: () => {
      throw new Error("removeNotification method not implemented.");
    },
    unreadIds: [],
    setUnreadIds: () => {
      throw new Error("setUnreadIds method not implemented.");
    },
    addUnreadId: () => {
      throw new Error("addUnreadId method not implemented.");
    },
  },
  MessagesManager: {
    unreadIds: [],
    setUnreadIds: () => {
      throw new Error("setUnreadIds method not implemented.");
    },
    addUnreadId: () => {
      throw new Error("addUnreadId method not implemented.");
    },
  },
};

export const AppContext = createContext<iAppContext>(defaultAppContext);
