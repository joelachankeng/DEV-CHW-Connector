import { z } from "zod";

const ACCOUNT_SCHEMAS_GLOBAL = {
  email: z
    .string()
    .email("Please enter a valid email address.")
    .regex(
      /^([a-zA-Z0-9_.+-])+@(([a-zA-Z0-9-])+\.)+([a-zA-Z0-9]{2,4})+$/,
      "Please enter a valid email address.",
    )
    .min(1, "An email is required."),
  password: z
    .string()
    .regex(
      /[^a-zA-Z0-9]/,
      "Password must contain at least one special character.",
    )
    .min(8, "Password must be at least 8 characters."),
};

export const ACCOUNT_SCHEMAS = {
  LOGIN: {
    email: ACCOUNT_SCHEMAS_GLOBAL.email,
    password: ACCOUNT_SCHEMAS_GLOBAL.password,
  },
  SIGNUP: {
    firstName: z.string().min(1, "First name is required."),
    lastName: z.string().min(1, "Last name is required."),
    email: ACCOUNT_SCHEMAS_GLOBAL.email,
    password: ACCOUNT_SCHEMAS_GLOBAL.password,
    "chw-worker": z
      .string()
      .trim()
      .min(1, "Please select an option.")
      .and(
        z.enum(["yes"], {
          errorMap: () => {
            return {
              message:
                "We are sorry we cannot create your account. The CHW Connector Platform is restricted to Users who identify as CHW’s.",
            };
          },
        }),
      ),
    "email-type": z
      .string()
      .trim()
      .min(1, "Please select an option.")
      .and(
        z.enum(["work", "personal"], {
          errorMap: () => {
            return {
              message: "Please select a valid email type.",
            };
          },
        }),
      ),
  },
  RESET_PASSWORD: {
    email: ACCOUNT_SCHEMAS_GLOBAL.email,
  },
  CONFIRM_RESET_PASSWORD: {
    email: ACCOUNT_SCHEMAS_GLOBAL.email,
    code: z.string().min(1, "Code is required."),
  },
  CHANGE_PASSWORD: {
    email: ACCOUNT_SCHEMAS_GLOBAL.email,
    password: ACCOUNT_SCHEMAS_GLOBAL.password,
  },
};
