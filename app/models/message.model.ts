import type { iWP_Status } from "./post.model";

export type iWP_Message = {
  databaseId: number;
  date: string;
  status: iWP_Status;
  author: {
    node: {
      databaseId: number;
      firstName?: string;
      lastName?: string;
      avatar: {
        url?: string;
      };
    };
  };
  messageFields: {
    receiverId: number;
    content: string;
    read: boolean;
  };
};

export type iWP_Messages = {
  nodes: iWP_Message[];
};

export type iWP_Conversations = {
  unreadCount: number;
  user: {
    lastName: string;
    firstName: string;
    databaseId: number;
    avatar: { url: string };
  };
  message: iWP_Message;
};
