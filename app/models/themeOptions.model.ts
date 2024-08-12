export type iThemeSettings = {
  themeSettingsField: iThemeOptions_PublicHealthAlerts;
};

export type iThemeOptions_PublicHealthAlerts = {
  rightSidebar: {
    aboutContent: string;
    accordionContent: string;
    image: {
      node: {
        mediaItemUrl: string;
      };
    };
  };
  leftSidebar: {
    description: string;
  };
};
