export type iWP_PublicHealthAlert = {
  databaseId: number;
  date: string;
  title: string;
  content: string;
  publicHealthAlertsField: {
    previewContent: string;
  };
};

export type iWP_PublicHealthAlerts = {
  nodes: iWP_PublicHealthAlert[];
};
