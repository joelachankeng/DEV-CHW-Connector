export type iUploadManager = {
  attachments: {
    file: File;
    content: {
      id: string;
      url: string;
      type: string;
    };
  }[];
};
