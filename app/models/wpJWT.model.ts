export type iSimpleJWTError = {
  success: boolean;
  data: {
    status: number;
    message: string;
  };
};
export type iSimpleJWTValidation = {
  success: boolean;
  data: {
    user: {
      ID: string;
      user_login: string;
      user_nicename: string;
      user_email: string;
      user_url: string;
      user_registered: string;
      user_activation_key: string;
      user_status: string;
      display_name: string;
    };
    roles: string[];
    jwt: any[];
  };
};
