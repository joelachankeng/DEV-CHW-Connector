import { useContext, useEffect, useRef, useState } from "react";
import SVGAddPhoto from "~/assets/SVGs/SVGAddPhoto";
import { SVGAvatarTwo } from "~/assets/SVGs/SVGAvatarTwo";
import SVGTrash from "~/assets/SVGs/SVGTrash";
import type { iRadioButtonFieldInput } from "~/components/Forms/RadioButtonField";
import { RadioButtonField } from "~/components/Forms/RadioButtonField";
import Avatar from "~/components/User/Avatar";
import { SignupFormFields } from "~/components/User/SignupForm";
import { AppContext } from "~/contexts/appContext";
import {
  classNames,
  formatPhoneNumber,
  getCurrentDateTime,
  parseDateTimeGraphql,
  phoneRegex,
} from "~/utilities/main";
import USA_States from "~/utilities/US-states.json";
import HHS_regions from "~/utilities/HHS-regions.json";
import _ from "lodash";
import {
  Form,
  json,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunction } from "@remix-run/node";
import {
  encryptUserSession,
  requireUserSession,
} from "~/servers/userSession.server";
import { APP_KEYS } from "~/session.server";
import type { AxiosError } from "axios";
import axios from "axios";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import { InputField } from "~/components/Forms/InputField";
import { ACCOUNT_SCHEMAS } from "~/schemas/account";
import type { ZodRawShape } from "zod";
import { z } from "zod";
import type { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import { User } from "~/controllers/user.control";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { FORM_CLASSES } from "~/components/Forms/FormFields";
import PrivacyLockField from "~/components/Forms/PrivacyLockField";
import type { iWP_User } from "~/models/user.model";
import ModalNotification from "~/components/Modals/ModalNotification";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import { TextAreaField } from "~/components/Forms/TextAreaField";
import type { MultiValue, SingleValue } from "react-select";
import Select from "react-select";
import { ClientOnly } from "remix-utils/client-only";
import { APP_ROUTES, APP_UPLOADS } from "~/constants";

const ZIPCODE_MAX_LENGTH = 5;
const PREFERREDLANGUAGES_MAX_LENGTH = 50;
const ABOUTME_MAX_LENGTH = 1000;

const getRadioField = (
  name: string,
  checkedOptionValue?: string,
): iRadioButtonFieldInput[] => {
  const field = SignupFormFields.find(
    (f) => f.name === name && f.type === "radio",
  );

  if (!field) return [];
  if (!("type" in field)) return [];
  if (field.type !== "radio") return [];

  return field.options.map((option) => {
    return {
      ...option,
      checked: option.value === checkedOptionValue,
    };
  });
};

const allStates = USA_States.map((state) => {
  return {
    label: state.name,
    value: state.abbreviation,
  };
});

const ethnicityOptions = [
  "Native Indian or Alaska Native",
  "Asian",
  "Black or African American",
  "Hispanic or Latino",
  "Middle Eastern or North African",
  "Native Hawaiian or Pacific Islander",
  "White",
  "Prefer not to answer",
  "Not listed",
].map((e) => {
  return {
    label: e,
    value: _.kebabCase(e),
  };
});

const topPopulationsOptions = [
  "Adolescents/teens",
  "Farm workers",
  "Foreign nationals/immigrants/refugees",
  "Incarcerated, formerly incarcerated, or justice-involved individuals",
  "Individuals with complex healthcare needs",
  "Individuals experiencing homelessness",
  "Individuals with physical and/or developmental disabilities",
  "Individuals without insurance",
  "Individuals impacted by Covid-19 (including long Covid-19)",
  "Individuals with substance use disorders (e.g. opioid use disorder)",
  "Non-English speakers",
  "Pregnant women, mothers and their young children",
  "Rural residents",
  "Seniors (aged 65 and up)",
  "Sexual or gender minorities (i.e. LGBTQ people)",
  "Other CHWs",
  "Not currently serving a community",
  "Other",
  "Prefer not to answer",
].map((e) => {
  return {
    label: e,
    value: _.kebabCase(e),
  };
});

const membershipOptions = [
  "NACHW (individual membership)",
  "NACHW (organizational membership)",
  "My state public health association",
  "My state CHW association",
  "A CHW-led community-based organization ",
].map((e) => {
  return {
    label: e,
    value: _.kebabCase(e),
  };
});

const genderIdentityOptions = [
  "Woman",
  "Man",
  "Transgender",
  "Non-binary",
  "Māhū",
  "Two Spirit",
  "Prefer not to answer",
  "Another gender identity not listed",
].map((e) => {
  return {
    label: e,
    value: _.kebabCase(e),
  };
});

const educationOptions = [
  "Less than High School",
  "High School or GED",
  "Bachelor's Degree",
  "Some college or 2 year Degree",
  "Graduate / Professional Degree",
  "Vocational / Trade School / CHW Certification ",
].map((e) => {
  return {
    label: e,
    value: _.kebabCase(e),
  };
});

const ageRangeOptions = [
  "16 - 24 years",
  "25 -  34 years",
  "35 - 44 years",
  "45 - 54 years",
  "55 - 64 years",
  "65 - 74 years",
  "75 years or older ",
].map((e) => {
  return {
    label: e,
    value: _.kebabCase(e),
  };
});

const how_did_you_hear_about_usOptions = [
  "NACHW Newsletter",
  "NACHW events",
  "NACHW Twitter, Facebook, Instagram",
  "Friend or colleague",
  "My state/local network, association or coalition",
  "Other",
].map((e) => {
  return {
    label: e,
    value: _.kebabCase(e),
  };
});

type iProfileFormFields_Text = {
  value: string;
  error?: string;
  public?: boolean;
};

type iProfileFormFields_Number = {
  value?: number | undefined;
  error?: string;
  public?: boolean;
};

type iProfileFormFields_Boolean = {
  value: boolean;
  error?: string;
  public?: boolean;
};

type iProfileFormFields_Array = {
  value: string[];
  error?: string;
  public?: boolean;
};

export const ProfileFormFieldSchema = {
  firstName: ACCOUNT_SCHEMAS.SIGNUP.firstName,
  lastName: ACCOUNT_SCHEMAS.SIGNUP.lastName,
  email: ACCOUNT_SCHEMAS.SIGNUP.email,
  emailType: ACCOUNT_SCHEMAS.SIGNUP["email-type"],
  "chw-worker": ACCOUNT_SCHEMAS.SIGNUP["chw-worker"],
  "about-me": z
    .string()
    .max(1000, "About me must be less than 1000 characters")
    .optional()
    .or(z.literal("")),
  phoneNumber: z
    .string()
    .regex(phoneRegex, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .refine((val) => allStates.map((field) => field.value).includes(val), {
      message: "Please select a valid state",
    })
    .optional()
    .or(z.literal("")),
  zipCode: z
    .number()
    .int("Please enter a valid zip code")
    .refine(
      (val) => val.toString().length <= ZIPCODE_MAX_LENGTH,
      `Zip Code must be less than ${ZIPCODE_MAX_LENGTH} digits.`,
    )
    .nullable()
    .optional()
    .or(z.literal("")),
  region: z
    .string()
    .refine((val) => Object.keys(HHS_regions).includes(val), {
      message: "You entered an invalid region",
    })
    .optional()
    .or(z.literal("")),
  ethnicity: z
    .array(z.string().min(1, "Please specify a race or ethnicity"))
    .optional()
    .nullable(),
  topPopulations: z
    .array(z.string().min(1, "Please specify a population"))
    .optional()
    .nullable(),
  certifiedWorker: z.boolean().optional().or(z.literal("")),
  memberships: z
    .array(
      z
        .string()
        .min(1, "Please select a membership")
        .refine(
          (val) => membershipOptions.map((field) => field.value).includes(val),
          {
            message: "Please select a valid membership",
          },
        ),
    )
    .optional()
    .nullable(),
  genderIdentity: z
    .array(z.string().min(1, "Please specify a gender identity"))
    .optional()
    .nullable(),
  preferredLanguages: z
    .string()
    .max(
      PREFERREDLANGUAGES_MAX_LENGTH,
      `Preferred languages must be less than ${PREFERREDLANGUAGES_MAX_LENGTH} characters`,
    )
    .optional()
    .or(z.literal("")),
  education: z
    .string()
    .refine(
      (val) => educationOptions.map((field) => field.value).includes(val),
      {
        message: "You entered an invalid education level",
      },
    )
    .optional()
    .or(z.literal("")),
  ageRange: z
    .string()
    .refine(
      (val) => ageRangeOptions.map((field) => field.value).includes(val),
      {
        message: "You entered an invalid age range",
      },
    )
    .optional()
    .or(z.literal("")),
  howDidYouHear: z
    .array(z.string().min(1, "Please specify how you heard about us"))
    .optional()
    .nullable(),
};

export type iProfileFormFields = {
  avatar: iProfileFormFields_Text;
  firstName: iProfileFormFields_Text;
  lastName: iProfileFormFields_Text;
  email: iProfileFormFields_Text;
  emailType: iProfileFormFields_Text;
  phoneNumber: iProfileFormFields_Text;
  "chw-worker": iProfileFormFields_Text;
  "about-me": iProfileFormFields_Text;
  state: iProfileFormFields_Text;
  zipCode: iProfileFormFields_Number;
  region: iProfileFormFields_Text;
  ethnicity: iProfileFormFields_Array;
  topPopulations: iProfileFormFields_Array;
  topPopulationsOther: iProfileFormFields_Text;
  certifiedWorker: iProfileFormFields_Boolean;
  memberships: iProfileFormFields_Array;
  genderIdentity: iProfileFormFields_Array;
  genderIdentityOther: iProfileFormFields_Text;
  preferredLanguages: iProfileFormFields_Text;
  education: iProfileFormFields_Text;
  ageRange: iProfileFormFields_Text;
  howDidYouHear: iProfileFormFields_Array;
};

export const defaultProfileFormFields: iProfileFormFields = {
  avatar: {
    value: "",
    error: "",
  },
  firstName: {
    value: "",
    error: "",
  },
  lastName: {
    value: "",
    error: "",
  },
  email: {
    value: "",
    error: "",
    public: true,
  },
  emailType: {
    value: "",
    error: "",
  },
  "chw-worker": {
    value: "",
    error: "",
    public: true,
  },
  "about-me": {
    value: "",
    error: "",
    public: true,
  },
  phoneNumber: {
    value: "",
    error: "",
    public: true,
  },
  state: {
    value: "",
    error: "",
    public: true,
  },
  zipCode: {
    value: undefined,
    error: "",
  },
  region: {
    value: "",
    error: "",
  },
  ethnicity: {
    value: [],
    error: "",
    public: true,
  },
  topPopulations: {
    value: [],
    error: "",
    public: true,
  },
  topPopulationsOther: {
    value: "",
    error: "",
  },
  certifiedWorker: {
    value: false,
    error: "",
    public: true,
  },
  memberships: {
    value: [],
    error: "",
    public: true,
  },
  genderIdentity: {
    value: [],
    error: "",
    public: true,
  },
  genderIdentityOther: {
    value: "",
    error: "",
  },
  preferredLanguages: {
    value: "",
    error: "",
    public: true,
  },
  education: {
    value: "",
    error: "",
    public: true,
  },
  ageRange: {
    value: "",
    error: "",
    public: true,
  },
  howDidYouHear: {
    value: [],
    error: "",
  },
};

export const convertUserToProfileFormFields = (
  user: iWP_User | undefined,
): iProfileFormFields => {
  if (!user) return defaultProfileFormFields;
  return transformProfileFormFieldsFromSave({
    avatar: {
      value: user.avatar.url || "",
    },
    firstName: { value: user.firstName || "" },
    lastName: { value: user.lastName || "" },
    email: {
      value: user.email || "",
      public: user.userFields.public?.includes("email") || false,
    },
    emailType: { value: user.userFields.emailType || "" },
    "chw-worker": {
      value: user.userFields.chwWorker ? "yes" : "no",
      public: user.userFields.public?.includes("chw-worker") || false,
    },
    "about-me": {
      value: user.userFields.aboutMe || "",
      public: user.userFields.public?.includes("about-me") || false,
    },
    phoneNumber: {
      value: user.userFields.phoneNumber || "",
      public: user.userFields.public?.includes("phoneNumber") || false,
    },
    state: {
      value: user.userFields.state || "",
      public: user.userFields.public?.includes("location") || false,
    },
    zipCode: {
      value: user.userFields.zipCode,
      public: false,
    },
    region: {
      value: user.userFields.region || "",
      public: false,
    },
    ethnicity: {
      value: user.userFields.ethnicity || [],
      public: user.userFields.public?.includes("ethnicity") || false,
    },
    topPopulations: {
      value: user.userFields.topPopulations || [],
      public: user.userFields.public?.includes("topPopulations") || false,
    },
    topPopulationsOther: {
      value:
        user.userFields.topPopulations
          ?.filter(
            (tp) => !topPopulationsOptions.map((o) => o.label).includes(tp),
          )
          .join(", ") || "",
    },
    certifiedWorker: {
      value: user.userFields.certifiedWorker === true,
      public: user.userFields.public?.includes("certifiedWorker") || false,
    },
    memberships: {
      value: user.userFields.memberships || [],
      public: user.userFields.public?.includes("memberships") || false,
    },
    genderIdentity: {
      value: user.userFields.genderIdentity || [],
      public: user.userFields.public?.includes("genderIdentity") || false,
    },
    genderIdentityOther: {
      value:
        user.userFields.genderIdentity
          ?.filter(
            (gi) => !genderIdentityOptions.map((o) => o.label).includes(gi),
          )
          .join(", ") || "",
    },
    preferredLanguages: {
      value: user.userFields.preferredLanguages || "",
      public: user.userFields.public?.includes("preferredLanguages") || false,
    },
    education: {
      value: user.userFields.education || "",
      public: user.userFields.public?.includes("education") || false,
    },
    ageRange: {
      value: user.userFields.ageRange || "",
      public: user.userFields.public?.includes("ageRange") || false,
    },
    howDidYouHear: {
      value: user.userFields.howDidYouHear || [],
    },
  });
};

type iEditProfileLoaderData = {
  authorization: string;
  avatarUploadUrl: string;
};
export const loader: LoaderFunction = async ({ request }) => {
  const userToken = await requireUserSession(request);

  return json({
    authorization: encryptUserSession(userToken),
    avatarUploadUrl: APP_KEYS.UPLOAD.AVATAR,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const result = await User.Forms.executeUpdateProfileAction(request, formData);

  return result;
};

export default function SettingsEditProfile() {
  const { authorization, avatarUploadUrl } =
    useLoaderData<iEditProfileLoaderData>();
  const actionData = useActionData<
    | undefined
    | { success: iWP_User }
    | { error: string }
    | { error: iProfileFormFields }
  >();
  const { appContext, setAppContext } = useContext(AppContext);
  const navigation = useNavigation();
  const submit = useSubmit();

  const [Modal, setModal] = useState({
    show: false,
    title: "",
    content: "",
  });
  const [profileFields, setProfileFields] = useState<iProfileFormFields>(
    convertUserToProfileFormFields(appContext.User),
  );

  console.log("profileFields", profileFields);

  const [actionDataState, setActionDataState] = useState<{
    current: typeof actionData;
    prev: typeof actionData;
  }>({
    current: actionData,
    prev: undefined,
  });
  const [selectedFile, setSelectedFile] = useState<File | undefined>();
  const [hasChanged, setHasChanged] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resendVerificationEmailDuration, setResendVerificationEmailDuration] =
    useState<number>(0);

  const inputProfileImageUploadRef = useRef<HTMLInputElement>(null);

  const { submit: sendEmailConfirmationFetchSubmit } = useAutoFetcher<
    iGenericSuccess | iGenericError
  >("/api/user/sendEmailConfirmation", (data) => {
    if ("error" in data) {
      setModal({
        show: true,
        title: "An Error Occurred",
        content:
          "An unexpected error occurred while sending the confirmation email - " +
          data.error,
      });
    }
  });

  useEffect(() => {
    if (actionDataState.current === undefined) {
      if (!_.isEqual(actionDataState.prev, actionData)) {
        setActionDataState({
          current: actionData,
          prev: actionDataState.prev,
        });
      }
    }
  }, [actionData, actionDataState]);

  useEffect(() => {
    if (navigation.state !== "idle") return;
    if (!isSubmitting) return;
    if (actionDataState.current === undefined) return;
    if ("error" in actionDataState.current) {
      if (typeof actionDataState.current.error === "string") {
        setModal({
          show: true,
          title: "An Error Occurred",
          content: actionDataState.current.error,
        });
      } else {
        setProfileFields(actionDataState.current.error);
      }
    }

    if ("success" in actionDataState.current) {
      const newAppContext = {
        ...appContext,
        User: actionDataState.current.success,
      };
      setAppContext(newAppContext);
      const newProfileFields = convertUserToProfileFormFields(
        actionDataState.current.success,
      );

      setProfileFields(newProfileFields);
    }

    setIsSubmitting(false);
    setHasChanged(false);
  }, [
    actionDataState,
    appContext,
    isSubmitting,
    navigation.state,
    setAppContext,
  ]);

  useEffect(() => {
    if (resendVerificationEmailDuration === 0) return;
    const interval = setInterval(() => {
      setResendVerificationEmailDuration((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendVerificationEmailDuration]);

  const handleResendVerificationEmail = () => {
    if (resendVerificationEmailDuration > 0) return;
    setResendVerificationEmailDuration(30);

    sendEmailConfirmationFetchSubmit(
      {
        email: appContext.User?.userFields.changeemail.newEmail || "",
      },
      "POST",
    );
  };

  const handleProfileImageUpload = () => {
    inputProfileImageUploadRef.current?.click();
  };

  const handleDeleteProfileImage = () => {
    setSelectedFile(undefined);
    setHasChanged(true);

    let newValue = appContext.User?.avatar.url || "";
    if (profileFields.avatar.value === newValue) newValue = "";
    setProfileFields((prev) => {
      return {
        ...prev,
        avatar: {
          value: newValue,
        },
      };
    });
  };

  const onFileChangeCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) {
      setSelectedFile(undefined);
      return;
    }
    setHasChanged(true);

    const imgFile = e.target.files[0];
    const maxAllowedSize = APP_UPLOADS.FILE_SIZE_LIMIT.IMAGE;

    if (!imgFile.type.includes("image") || imgFile.size > maxAllowedSize) {
      setSelectedFile(undefined);
      setProfileFields((prev) => {
        return {
          ...prev,
          avatar: {
            value: appContext.User?.avatar.url || "",
            error: "Please upload an image file less than 1MB",
          },
        };
      });
      return;
    } else {
      setProfileFields((prev) => {
        return {
          ...prev,
          avatar: {
            value: URL.createObjectURL(imgFile),
            error: "",
          },
        };
      });
    }

    setSelectedFile(imgFile);
  };

  const submitProfileImage = async (): Promise<iProfileFormFields_Text> => {
    const newAvatar: iProfileFormFields["avatar"] = profileFields.avatar;
    let deleteImage = false;

    if (
      profileFields.avatar.value === appContext.User?.avatar.url ||
      (profileFields.avatar.value === "" &&
        (appContext.User?.avatar.url === "" ||
          appContext.User?.avatar.url === undefined ||
          appContext.User?.avatar.url === null))
    )
      return newAvatar;

    if (!profileFields.avatar.value) {
      if (appContext.User?.avatar.url) {
        deleteImage = true;
      }
    }

    try {
      const result = await axios.post(
        avatarUploadUrl,
        {
          file: selectedFile,
          authorization,
          delete: deleteImage,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );

      if (result.status === 200) {
        newAvatar.value = result.data.url;

        if (appContext.User) {
          const newAppContext = {
            ...appContext,
            User: {
              ...appContext.User,
              avatar: {
                url: newAvatar.value,
              },
            },
          };
          setAppContext(newAppContext);
        }
      }
    } catch (error) {
      let errorMessage =
        "An unexpected error occurred. Please try again later.";
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        if (axiosError.response) {
          const data = axiosError.response.data as { message: string };
          if ("message" in data) {
            errorMessage = data.message;
          }
        }
      }

      newAvatar.value = appContext.User?.avatar.url || "";
      newAvatar.error = errorMessage;
    } finally {
      setProfileFields((prev) => {
        return {
          ...prev,
          avatar: {
            value: newAvatar.value,
            error: newAvatar.error,
          },
        };
      });
    }

    return newAvatar;
  };

  const handleAboutMeChange = (value: string) => {
    if (value.length > ABOUTME_MAX_LENGTH) return;
    console.log("value", encodeURIComponent(value));

    updateFieldValue("about-me", value);
  };

  const handleEthnicityChange = (
    newValue:
      | MultiValue<{
          label: string;
          value: string;
        }>
      | undefined,
  ) => {
    const newOptions = isolateMultiSelectValues(
      ["not-listed", "prefer-not-to-answer"],
      newValue,
    );
    updateFieldValue("ethnicity", newOptions?.map((e) => e.value) || []);
  };

  const handleTopPopulationsChange = (
    newValue:
      | MultiValue<{
          label: string;
          value: string;
        }>
      | undefined,
  ) => {
    let newOptions = isolateMultiSelectValues(
      ["prefer-not-to-answer"],
      newValue,
    );

    const maxOptions = 4;
    if (newOptions?.length && newOptions.length > maxOptions) {
      // get last value in array and replace with 4th value
      const lastValue = newOptions[newOptions.length - 1];
      newOptions = newOptions.slice(0, maxOptions - 1);
      newOptions = [...newOptions, lastValue];
    }

    updateFieldValue("topPopulations", newOptions?.map((e) => e.value) || []);
  };

  const handleGenderIdentityChange = (
    newValue:
      | MultiValue<{
          label: string;
          value: string;
        }>
      | undefined,
  ) => {
    const newOptions = isolateMultiSelectValues(
      ["prefer-not-to-answer"],
      newValue,
    );
    updateFieldValue("genderIdentity", newOptions?.map((e) => e.value) || []);
  };

  const handlePreferredLanguages = (value: string) => {
    if (value.length > PREFERREDLANGUAGES_MAX_LENGTH) return;
    updateFieldValue("preferredLanguages", value);
  };

  const handlehowDidYouHearChange = (
    newValue:
      | SingleValue<{
          label: string;
          value: string;
        }>
      | undefined,
  ) => {
    const options = newValue?.value ? [newValue] : [];
    const newOptions = isolateMultiSelectValues(["other"], options);
    updateFieldValue("howDidYouHear", newOptions?.map((e) => e.value) || []);
  };

  const handleValidation = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newAvatar = await submitProfileImage();

    const newProfileFields = {
      ...profileFields,
      avatar: newAvatar,
    };

    const validation = handleProfileFormFieldsValidation(
      newProfileFields,
      ProfileFormFieldSchema,
    );

    if (!isProfileFormFieldsValid(validation)) {
      setProfileFields(validation);
    } else {
      const formData = new FormData();
      formData.append("profileFields", JSON.stringify(newProfileFields));

      submit(formData, {
        method: "post",
        encType: "multipart/form-data",
      });
    }

    setIsSubmitting(true);
    setActionDataState({
      current: undefined,
      prev: actionDataState.current,
    });
  };

  const updateFieldValue = (
    key: keyof iProfileFormFields,
    newValue: string | string[] | boolean | number,
    subkey: keyof iProfileFormFields_Text = "value",
  ) => {
    if (key in profileFields) {
      const clonedField = _.cloneDeep(profileFields);

      if (subkey in clonedField[key]) {
        clonedField[key][subkey] = newValue as never;
        console.log(clonedField);

        const validation = handleProfileFormFieldsValidation(
          clonedField,
          ProfileFormFieldSchema,
        );
        setProfileFields(validation);
      }
    }
    setHasChanged(true);
  };

  const emailExpiration = parseDateTimeGraphql(
    appContext.User?.userFields.changeemail.expiration || "",
  );

  return (
    <div className="">
      <ModalNotification
        show={Modal.show}
        title={Modal.title}
        content={<p className="text-base">{Modal.content}</p>}
        spinner={false}
        cancelButton={{
          display: false,
        }}
        confirmButton={{
          display: true,
          text: "Close",
        }}
        onConfirm={() => setModal({ show: false, title: "", content: "" })}
        onClose={() => setModal({ show: false, title: "", content: "" })}
      />
      <Form
        method="post"
        onSubmit={(e) => {
          handleValidation(e).catch((error) => {
            console.error(error);
          });
        }}
      >
        <div className="">
          <div className="flex items-center gap-5 max-xs:flex-col max-xs:justify-center">
            <div
              className="h-[6.25rem] w-[6.25rem] cursor-pointer"
              onClick={handleProfileImageUpload}
            >
              {profileFields.avatar.value ? (
                <Avatar
                  src={profileFields.avatar.value}
                  alt={`${profileFields.firstName.value} ${profileFields.lastName.value}`}
                />
              ) : (
                <SVGAvatarTwo />
              )}
            </div>
            <button
              type="button"
              onClick={handleProfileImageUpload}
              className={classNames(
                "flex items-center gap-2.5 text-base font-semibold text-[#686867] hover:text-[#032525]",
              )}
            >
              <div className="h-8 w-8 text-[#686867] hover:text-chw-light-purple">
                <SVGAddPhoto />
              </div>
              <span>
                {selectedFile || profileFields.avatar.value ? "Change" : "Add"}{" "}
                photo
              </span>
            </button>
            {(selectedFile || profileFields.avatar.value) && (
              <button
                type="button"
                onClick={() => handleDeleteProfileImage()}
                className={classNames(
                  "flex items-center gap-2.5 text-base font-semibold text-[#686867] hover:text-[#032525]",
                )}
              >
                <div className="h-8 w-8 text-[#686867] hover:text-chw-light-purple">
                  <SVGTrash />
                </div>
                <span>Delete</span>
              </button>
            )}
            <input
              hidden
              type="file"
              name="profileImage"
              accept="image/png, image/gif, image/jpeg, image/jpg"
              ref={inputProfileImageUploadRef}
              onChangeCapture={onFileChangeCapture}
            />
          </div>
          <ErrorMessage message={profileFields.avatar.error} />
        </div>
        <div className="mt-12 flex flex-col gap-8">
          <div className="flex items-start gap-8 max-xs:flex-col">
            <div className="w-full">
              <InputField
                required
                value={profileFields.firstName.value}
                onChange={(e) => updateFieldValue("firstName", e.target.value)}
                classes={{
                  input: {
                    className: "bg-white",
                  },
                }}
                label="First Name"
                type="text"
                name="firstName"
              />
              <ErrorMessage message={profileFields.firstName.error} />
            </div>
            <div className="w-full">
              <InputField
                required
                value={profileFields.lastName.value}
                onChange={(e) => updateFieldValue("lastName", e.target.value)}
                classes={{
                  input: {
                    className: "bg-white",
                  },
                }}
                label="Last Name"
                type="text"
                name="lastName"
              />
              <ErrorMessage message={profileFields.lastName.error} />
            </div>
          </div>
          <div className="">
            <label className={FORM_CLASSES.LABEL.DEFAULT} htmlFor="email">
              Email
            </label>

            <div className="relative flex items-center">
              <InputField
                required
                readOnly={appContext.User?.userFields.createdViaMemberclicks}
                value={profileFields.email.value}
                onChange={(e) => updateFieldValue("email", e.target.value)}
                classes={{
                  parent: {
                    className: "w-full",
                  },
                  input: {
                    className: classNames(
                      "bg-white pr-14",
                      appContext.User?.userFields.createdViaMemberclicks
                        ? "!bg-[#f5f6f7] cursor-default"
                        : "",
                    ),
                  },
                }}
                type="email"
                name="email"
              />

              <PrivacyLockField
                name="email-privacy"
                value={!profileFields.email.public}
                onChange={(value) => updateFieldValue("email", value, "public")}
                className={classNames("absolute right-0", "mr-5")}
              />
            </div>
            {appContext.User?.userFields.createdViaMemberclicks && (
              <div className="mb-2 mt-1 text-sm font-semibold text-chw-dark-purple">
                <p>
                  Your email was created via Memberclicks. Please{" "}
                  <Link
                    className="text-chw-light-purple underline transition-all duration-300 ease-in-out hover:text-chw-dark-purple"
                    to={APP_ROUTES.CONTACT}
                  >
                    contact
                  </Link>{" "}
                  support to update your email.
                </p>
              </div>
            )}
            <PrivacyLabel isPrivate={!profileFields.email.public} />
            <ErrorMessage message={profileFields.email.error} />
            {appContext.User?.userFields.changeemail.newEmail && (
              <>
                <div className="mt-1 text-sm font-semibold italic text-chw-dark-purple">
                  <p>
                    A confirmation email has been sent to{" "}
                    {appContext.User?.userFields.changeemail.newEmail}
                  </p>
                  {emailExpiration.isValid &&
                  emailExpiration.diff(getCurrentDateTime()).as("minutes") <=
                    0 ? (
                    <p className="font-bold text-red-800">
                      The email confirmation has expired. Please request a new
                      verification email.
                    </p>
                  ) : (
                    <p>
                      Please check your email to confirm your new email address.
                    </p>
                  )}
                  <div className="mt-2 flex w-full justify-end">
                    <button
                      className={classNames(
                        resendVerificationEmailDuration <= 0
                          ? "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple"
                          : FORM_CLASSES.BUTTON.DISABLED,
                        "rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
                      )}
                      onClick={(e) => {
                        e.preventDefault();
                        handleResendVerificationEmail();
                      }}
                    >
                      {resendVerificationEmailDuration > 0
                        ? `Resend verification email in ${resendVerificationEmailDuration}s`
                        : "Resend verification email"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="">
            <div className="relative flex items-center">
              <RadioButtonField
                required
                checked={true}
                options={getRadioField(
                  "email-type",
                  profileFields.emailType.value,
                )}
                label="Email Type"
                onChange={(value) => updateFieldValue("emailType", value)}
                name="email-type"
                classes={{}}
              />
            </div>
            <ErrorMessage message={profileFields.emailType.error} />
          </div>
          <div className="">
            <RadioButtonField
              required
              checked={true}
              options={[
                {
                  type: "radio",
                  id: "chw-worker-yes",
                  name: "chw-worker",
                  value: "yes",
                  label: "Yes",
                  checked: profileFields["chw-worker"].value === "yes",
                },
              ]}
              label={
                SignupFormFields.find((f) => f.name === "chw-worker")?.label ||
                ""
              }
              onChange={(value) => updateFieldValue("chw-worker", value)}
              name="chw-worker"
              classes={{
                label: {
                  className: "text-[0.875rem] text-chw-dark-green",
                },
                parent: {
                  className:
                    "w-full flex gap-[2.813rem] max-md:flex-col max-md:gap-0",
                },
                input: {
                  className: "text-[0.875rem] text-chw-dark-green",
                },
                container: {
                  className: "flex-col max-md:!items-start max-md:flex-row",
                },
              }}
            />
            <div className="item-center flex gap-1">
              <PrivacyLockField
                name="chw-worker-privacy"
                value={!profileFields["chw-worker"].public}
                onChange={(value) =>
                  updateFieldValue("chw-worker", value, "public")
                }
              />
              <PrivacyLabel isPrivate={!profileFields["chw-worker"].public} />
            </div>
            <ErrorMessage message={profileFields["chw-worker"].error} />
          </div>
          <div className="">
            <div className="flex items-center justify-between max-xs:flex-col max-xs:items-start">
              <label className={FORM_CLASSES.LABEL.DEFAULT} htmlFor="about-me">
                About Me
              </label>
              <span className="text-sm font-semibold text-[#686867]">
                Character Limit:{" "}
                {profileFields["about-me"].value.length === 0
                  ? ABOUTME_MAX_LENGTH
                  : ABOUTME_MAX_LENGTH -
                    profileFields["about-me"].value.length +
                    " / " +
                    ABOUTME_MAX_LENGTH}
              </span>
            </div>
            <div className="relative flex">
              <TextAreaField
                value={profileFields["about-me"].value}
                onChange={(value) => handleAboutMeChange(value)}
                classes={{
                  textarea: {
                    className:
                      "border w-full h-[9.6875rem] p-2.5 rounded-3xl text[#032525] text-base leading-[1.25rem] whitespace-pre-line",
                  },
                }}
                name="about-me"
                label=""
              />
            </div>
            <div className="item-center mt-1 flex gap-1">
              <PrivacyLockField
                name="about-me-privacy"
                value={!profileFields["about-me"].public}
                onChange={(value) =>
                  updateFieldValue("about-me", value, "public")
                }
              />
              <PrivacyLabel isPrivate={!profileFields["about-me"].public} />
            </div>
            <ErrorMessage message={profileFields["about-me"].error} />
          </div>
          <div className="">
            <label className={FORM_CLASSES.LABEL.DEFAULT} htmlFor="phoneNumber">
              Phone
            </label>
            <div className="relative flex items-center">
              <InputField
                value={profileFields.phoneNumber.value}
                onChange={(e) =>
                  updateFieldValue(
                    "phoneNumber",
                    formatPhoneNumber(e.target.value),
                  )
                }
                classes={{
                  parent: {
                    className: "max-w-[11.5rem] w-full",
                  },
                  input: {
                    className: "bg-white",
                  },
                }}
                type="tel"
                name="phoneNumber"
                placeholder="(123) 456-7890"
              />
            </div>
            <div className="item-center mt-1 flex gap-1">
              <PrivacyLockField
                name="phoneNumber-privacy"
                value={!profileFields.phoneNumber.public}
                onChange={(value) =>
                  updateFieldValue("phoneNumber", value, "public")
                }
              />
              <PrivacyLabel isPrivate={!profileFields.phoneNumber.public} />
            </div>
            <ErrorMessage message={profileFields.phoneNumber.error} />
          </div>
          <div className="">
            <label className={FORM_CLASSES.LABEL.DEFAULT} htmlFor="location">
              Location
            </label>
            <div className="relative flex items-center">
              <div className="flex w-full items-start gap-5 max-md:flex-col">
                <ClientOnly fallback={<></>}>
                  {() => (
                    <Select
                      className="w-full"
                      name="state"
                      options={allStates}
                      classNamePrefix="state"
                      placeholder="State/Territory"
                      value={allStates.find(
                        (state) => state.value === profileFields.state.value,
                      )}
                      onChange={(newValue) =>
                        updateFieldValue("state", newValue?.value || "")
                      }
                      styles={{
                        control: (style) => ({
                          ...style,
                          backgroundColor: "white",
                          borderColor: "#C1BAB4",
                          borderRadius: "3rem",
                          padding: "3px 0 3px 20px",
                        }),
                      }}
                    />
                  )}
                </ClientOnly>
                <InputField
                  value={profileFields.zipCode.value?.toString() || ""}
                  onChange={(e) => {
                    if (e.target.value.length > ZIPCODE_MAX_LENGTH) return;
                    updateFieldValue("zipCode", parseInt(e.target.value) || "");
                  }}
                  classes={{
                    parent: {
                      className: "w-full",
                    },
                    input: {
                      className: "bg-white",
                    },
                  }}
                  type="number"
                  name="zipcode"
                  placeholder="Zip Code"
                />
                <InputField
                  value={profileFields.region.value}
                  readOnly={true}
                  // onChange={(e) =>
                  //   updateFieldValue("region", parseInt(e.target.value) || "")
                  // }
                  classes={{
                    parent: {
                      className: "w-full",
                    },
                    input: {
                      className: "!bg-[#f5f6f7] cursor-default",
                    },
                  }}
                  type="text"
                  name="region"
                  placeholder="Region"
                />
              </div>
            </div>
            <div className="item-center mt-1 flex gap-1">
              <PrivacyLockField
                name="location-privacy"
                value={!profileFields.state.public}
                onChange={(value) => updateFieldValue("state", value, "public")}
              />
              <PrivacyLabel isPrivate={!profileFields.state.public} />
            </div>
            <ErrorMessage
              message={
                profileFields.state.error ||
                profileFields.zipCode.error ||
                profileFields.region.error
              }
            />
          </div>
          <div className="">
            <label className={FORM_CLASSES.LABEL.DEFAULT} htmlFor="ethnicity">
              Race/Ethnicity
            </label>
            <ClientOnly fallback={<></>}>
              {() => (
                <Select
                  isMulti
                  name="ethnicity"
                  options={ethnicityOptions}
                  classNamePrefix="ethnicity"
                  placeholder="Select all that apply"
                  value={ethnicityOptions.filter((options) => {
                    return profileFields.ethnicity.value.includes(
                      options.value,
                    );
                  })}
                  onChange={handleEthnicityChange}
                  styles={{
                    control: (style) => ({
                      ...style,
                      backgroundColor: "white",
                      borderColor: "#C1BAB4",
                      borderRadius: "6px",
                      padding: "3px 0 3px 20px",
                    }),
                  }}
                />
              )}
            </ClientOnly>
            {profileFields.ethnicity.value.includes("not-listed") && (
              <InputField
                value={getMultiSelectOtherValue(profileFields.ethnicity.value)}
                onChange={(e) =>
                  updateFieldValue("ethnicity", ["not-listed", e.target.value])
                }
                classes={{
                  parent: {
                    className: "w-full mt-4",
                  },
                  input: {
                    className: "bg-white",
                  },
                }}
                type="text"
                name="other-ethnicity"
                placeholder="Please specify if not listed"
              />
            )}
            <div className="item-center mt-1 flex gap-1">
              <PrivacyLockField
                name="ethnicity-privacy"
                value={!profileFields.ethnicity.public}
                onChange={(value) =>
                  updateFieldValue("ethnicity", value, "public")
                }
              />
              <PrivacyLabel isPrivate={!profileFields.ethnicity.public} />
            </div>
            <ErrorMessage message={profileFields.ethnicity.error} />
          </div>
          <div className="">
            <label
              className={FORM_CLASSES.LABEL.DEFAULT}
              htmlFor="top-populations"
            >
              Which are the top 4 populations that you serve?
            </label>
            <ClientOnly fallback={<></>}>
              {() => (
                <Select
                  isMulti
                  name="top-populations"
                  options={topPopulationsOptions}
                  classNamePrefix="top-populations"
                  placeholder="Select all that apply"
                  value={topPopulationsOptions.filter((options) => {
                    return profileFields.topPopulations.value.includes(
                      options.value,
                    );
                  })}
                  onChange={handleTopPopulationsChange}
                  styles={{
                    control: (style) => ({
                      ...style,
                      backgroundColor: "white",
                      borderColor: "#C1BAB4",
                      borderRadius: "6px",
                      padding: "3px 0 3px 20px",
                    }),
                  }}
                />
              )}
            </ClientOnly>
            {profileFields.topPopulations.value.includes("other") && (
              <InputField
                value={profileFields.topPopulationsOther.value}
                onChange={(e) =>
                  updateFieldValue("topPopulationsOther", e.target.value)
                }
                classes={{
                  parent: {
                    className: "w-full mt-4",
                  },
                  input: {
                    className: "bg-white",
                  },
                }}
                type="text"
                name="other-top-populations"
                placeholder="Please specify if not listed"
              />
            )}
            <div className="item-center mt-1 flex gap-1">
              <PrivacyLockField
                name="top-populations-privacy"
                value={!profileFields.topPopulations.public}
                onChange={(value) =>
                  updateFieldValue("topPopulations", value, "public")
                }
              />
              <PrivacyLabel isPrivate={!profileFields.topPopulations.public} />
            </div>
            <ErrorMessage message={profileFields.topPopulations.error} />
          </div>
          <div className="">
            <RadioButtonField
              options={[
                {
                  type: "radio",
                  id: "certified-chw-worker-yes",
                  name: "certified-chw-worker",
                  value: "yes",
                  label: "Yes",
                  checked: profileFields.certifiedWorker.value === true,
                },
                {
                  type: "radio",
                  id: "certified-chw-worker-no",
                  name: "certified-chw-worker",
                  value: "no",
                  label: "No",
                  checked: profileFields.certifiedWorker.value === false,
                },
              ]}
              label={
                "Are you Certified as a Community Health Worker by your State or other organization?"
              }
              onChange={(value) =>
                updateFieldValue("certifiedWorker", value === "yes")
              }
              name="certified-chw-worker"
              classes={{
                label: {
                  className: "text-[0.875rem] text-chw-dark-green",
                },
                parent: {
                  className:
                    "w-full flex gap-[2.813rem] max-md:flex-col max-md:gap-0",
                },
                input: {
                  className: "text-[0.875rem] text-chw-dark-green",
                },
                container: {
                  className: "flex-col max-md:!items-start max-md:flex-row",
                },
              }}
            />
            <div className="item-center mt-1 flex gap-1">
              <PrivacyLockField
                name="certified-chw-worker-privacy"
                value={!profileFields.certifiedWorker.public}
                onChange={(value) =>
                  updateFieldValue("certifiedWorker", value, "public")
                }
              />
              <PrivacyLabel isPrivate={!profileFields.certifiedWorker.public} />
            </div>
            <ErrorMessage message={profileFields.certifiedWorker.error} />
          </div>
          <div className="">
            <label className={FORM_CLASSES.LABEL.DEFAULT} htmlFor="membership">
              Are you a member of the following?
            </label>
            <ClientOnly fallback={<></>}>
              {() => (
                <Select
                  isMulti
                  name="memberships"
                  options={membershipOptions}
                  classNamePrefix="memberships"
                  placeholder="Select all that apply"
                  value={membershipOptions.filter((options) => {
                    return profileFields.memberships.value.includes(
                      options.value,
                    );
                  })}
                  onChange={(newValue) =>
                    updateFieldValue(
                      "memberships",
                      newValue?.map((v) => v.value) || [],
                    )
                  }
                  styles={{
                    control: (style) => ({
                      ...style,
                      backgroundColor: "white",
                      borderColor: "#C1BAB4",
                      borderRadius: "6px",
                      padding: "3px 0 3px 20px",
                    }),
                  }}
                />
              )}
            </ClientOnly>
            <div className="item-center mt-1 flex gap-1">
              <PrivacyLockField
                name="memberships-privacy"
                value={!profileFields.memberships.public}
                onChange={(value) =>
                  updateFieldValue("memberships", value, "public")
                }
              />
              <PrivacyLabel isPrivate={!profileFields.memberships.public} />
            </div>
            <ErrorMessage message={profileFields.memberships.error} />
          </div>
          <div className="">
            <label
              className={FORM_CLASSES.LABEL.DEFAULT}
              htmlFor="genderIdentity"
            >
              What is your gender identity?
            </label>
            <ClientOnly fallback={<></>}>
              {() => (
                <Select
                  isMulti
                  name="genderIdentity"
                  options={genderIdentityOptions}
                  classNamePrefix="genderIdentity"
                  placeholder="Select all that apply"
                  value={genderIdentityOptions.filter((options) => {
                    return profileFields.genderIdentity.value.includes(
                      options.value,
                    );
                  })}
                  onChange={(newValue) => handleGenderIdentityChange(newValue)}
                  styles={{
                    control: (style) => ({
                      ...style,
                      backgroundColor: "white",
                      borderColor: "#C1BAB4",
                      borderRadius: "6px",
                      padding: "3px 0 3px 20px",
                    }),
                  }}
                />
              )}
            </ClientOnly>
            {profileFields.genderIdentity.value.includes(
              "another-gender-identity-not-listed",
            ) && (
              <InputField
                value={profileFields.genderIdentityOther.value}
                onChange={(e) =>
                  updateFieldValue("genderIdentityOther", e.target.value)
                }
                classes={{
                  parent: {
                    className: "w-full mt-4",
                  },
                  input: {
                    className: "bg-white",
                  },
                }}
                type="text"
                name="other-genderIdentity"
                placeholder="Please specify if not listed"
              />
            )}
            <div className="item-center mt-1 flex gap-1">
              <PrivacyLockField
                name="genderIdentity-privacy"
                value={!profileFields.genderIdentity.public}
                onChange={(value) =>
                  updateFieldValue("genderIdentity", value, "public")
                }
              />
              <PrivacyLabel isPrivate={!profileFields.genderIdentity.public} />
            </div>
            <ErrorMessage message={profileFields.genderIdentity.error} />
          </div>
          <div className="">
            <div className="flex items-center justify-between">
              <label
                className={FORM_CLASSES.LABEL.DEFAULT}
                htmlFor="preferred-languages"
              >
                Preferred Languages
              </label>
              <span className="text-sm font-semibold text-[#686867]">
                Character Limit:{" "}
                {profileFields.preferredLanguages.value.length === 0
                  ? PREFERREDLANGUAGES_MAX_LENGTH
                  : PREFERREDLANGUAGES_MAX_LENGTH -
                    profileFields.preferredLanguages.value.length +
                    " / " +
                    PREFERREDLANGUAGES_MAX_LENGTH}
              </span>
            </div>
            <div className="relative flex items-center">
              <InputField
                value={profileFields.preferredLanguages.value}
                onChange={(e) => handlePreferredLanguages(e.target.value)}
                classes={{
                  parent: {
                    className: "w-full",
                  },
                  input: {
                    className: "bg-white pr-14",
                  },
                }}
                type="text"
                name="preferred-languages"
              />
              <PrivacyLockField
                className={classNames("absolute right-0", "mr-5")}
                name="preferred-languages-privacy"
                value={!profileFields.preferredLanguages.public}
                onChange={(value) =>
                  updateFieldValue("preferredLanguages", value, "public")
                }
              />
            </div>
            <PrivacyLabel
              isPrivate={!profileFields.preferredLanguages.public}
            />
            <ErrorMessage message={profileFields.preferredLanguages.error} />
          </div>
          <div className="">
            <label className={FORM_CLASSES.LABEL.DEFAULT} htmlFor="education">
              Highest Level of Education
            </label>
            <ClientOnly fallback={<></>}>
              {() => (
                <Select
                  name="education"
                  options={educationOptions}
                  classNamePrefix="education"
                  placeholder="Select one"
                  value={educationOptions.filter((options) => {
                    return profileFields.education.value.includes(
                      options.value,
                    );
                  })}
                  onChange={(newValue) =>
                    updateFieldValue("education", newValue?.value || "")
                  }
                  styles={{
                    control: (style) => ({
                      ...style,
                      backgroundColor: "white",
                      borderColor: "#C1BAB4",
                      borderRadius: "6px",
                      padding: "3px 0 3px 20px",
                    }),
                  }}
                />
              )}
            </ClientOnly>
            <div className="item-center mt-1 flex gap-1">
              <PrivacyLockField
                name="education-privacy"
                value={!profileFields.education.public}
                onChange={(value) =>
                  updateFieldValue("education", value, "public")
                }
              />
              <PrivacyLabel isPrivate={!profileFields.education.public} />
            </div>
            <ErrorMessage message={profileFields.education.error} />
          </div>
          <div className="">
            <label className={FORM_CLASSES.LABEL.DEFAULT} htmlFor="ageRange">
              Age
            </label>
            <ClientOnly fallback={<></>}>
              {() => (
                <Select
                  name="ageRange"
                  options={ageRangeOptions}
                  classNamePrefix="ageRange"
                  placeholder="In years"
                  value={ageRangeOptions.filter((options) => {
                    return profileFields.ageRange.value.includes(options.value);
                  })}
                  onChange={(newValue) =>
                    updateFieldValue("ageRange", newValue?.value || "")
                  }
                  styles={{
                    control: (style) => ({
                      ...style,
                      backgroundColor: "white",
                      borderColor: "#C1BAB4",
                      borderRadius: "6px",
                      padding: "3px 0 3px 20px",
                    }),
                  }}
                />
              )}
            </ClientOnly>
            <div className="item-center mt-1 flex gap-1">
              <PrivacyLockField
                name="ageRange-privacy"
                value={!profileFields.ageRange.public}
                onChange={(value) =>
                  updateFieldValue("ageRange", value, "public")
                }
              />
              <PrivacyLabel isPrivate={!profileFields.ageRange.public} />
            </div>
            <ErrorMessage message={profileFields.ageRange.error} />
          </div>
          <div className="">
            <label
              className={FORM_CLASSES.LABEL.DEFAULT}
              htmlFor="how-did-you-hear-about-us"
            >
              How did you hear about the CHW Connector App?
            </label>
            <ClientOnly fallback={<></>}>
              {() => (
                <Select
                  name="how-did-you-hear-about-us"
                  options={how_did_you_hear_about_usOptions}
                  classNamePrefix="how-did-you-hear-about-us"
                  placeholder="Select one"
                  value={how_did_you_hear_about_usOptions.filter((options) => {
                    return profileFields.howDidYouHear.value.includes(
                      options.value,
                    );
                  })}
                  onChange={handlehowDidYouHearChange}
                  styles={{
                    control: (style) => ({
                      ...style,
                      backgroundColor: "white",
                      borderColor: "#C1BAB4",
                      borderRadius: "6px",
                      padding: "3px 0 3px 20px",
                    }),
                  }}
                />
              )}
            </ClientOnly>
            {profileFields.howDidYouHear.value.includes("other") && (
              <InputField
                value={getMultiSelectOtherValue(
                  profileFields.howDidYouHear.value,
                )}
                onChange={(e) =>
                  updateFieldValue("howDidYouHear", ["other", e.target.value])
                }
                classes={{
                  parent: {
                    className: "w-full mt-4",
                  },
                  input: {
                    className: "bg-white",
                  },
                }}
                type="text"
                name="other-how-did-you-hear-about-us"
                placeholder="Please specify"
              />
            )}
            <ErrorMessage message={profileFields.howDidYouHear.error} />
          </div>
          <div className="mb-40 flex justify-end">
            {navigation.state !== "idle" || isSubmitting ? (
              <LoadingSpinner className="mx-auto" />
            ) : actionDataState.current &&
              "success" in actionDataState.current &&
              !hasChanged ? (
              <>
                <div className="flex items-center text-base font-bold text-chw-dark-purple">
                  <CheckCircleIcon className="mr-2 h-8 w-8 text-green-500" />
                  Your profile has been updated successfully.
                </div>
              </>
            ) : (
              <>
                <button
                  className={classNames(
                    hasChanged && isProfileFormFieldsValid(profileFields)
                      ? "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple"
                      : FORM_CLASSES.BUTTON.DISABLED,
                    "rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
                  )}
                  type="submit"
                  disabled={
                    !hasChanged || !isProfileFormFieldsValid(profileFields)
                  }
                >
                  Save Changes
                </button>
              </>
            )}
          </div>
        </div>
      </Form>
    </div>
  );
}

function ErrorMessage({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div>
      <p className="mt-2 text-sm font-bold text-red-800">{message}</p>
    </div>
  );
}

function PrivacyLabel({ isPrivate }: { isPrivate: boolean | undefined }) {
  return (
    <div className="mt-1 text-sm font-semibold italic text-chw-dark-purple">
      This is {isPrivate ? "not visible" : "visible"} to the public.
    </div>
  );
}

export function validMultiSelectOtherSingle(
  values: string[],
  key: string,
): boolean {
  if (!values.includes(key)) return true; // don't display error if key is not in values
  if (values.length > 1) {
    const specifiedValue = values[1];
    if (specifiedValue) {
      return true;
    }
  }
  return false;
}

export function validMultiSelectOther(
  values: string[],
  key: string,
  otherFieldValue: string,
): boolean {
  if (!values.includes(key)) return true; // don't display error if key is not in values
  if (otherFieldValue) {
    return true;
  }
  return false;
}

export function handleProfileFormFieldsValidation(
  fields: iProfileFormFields,
  schema: ZodRawShape,
): iProfileFormFields {
  const clonedFormFields = _.cloneDeep(fields);
  const validationFields: Record<
    string,
    string | string[] | number | boolean | undefined
  > = {};

  for (const key in clonedFormFields) {
    clonedFormFields[key as keyof iProfileFormFields].error = "";
    validationFields[key] =
      clonedFormFields[key as keyof iProfileFormFields].value;
  }

  if (clonedFormFields.state.value) {
    const getStateLabel = allStates.find(
      (state) => state.value === clonedFormFields.state.value,
    );

    const regionValue = getRegionByState(getStateLabel?.label || "");
    fields.region.value = regionValue;
    clonedFormFields.region.value = regionValue;
    validationFields.region = regionValue;
  }

  const zObject = z.object(schema);
  const errors = zObject.safeParse(validationFields);

  if (!errors.success) {
    errors.error.issues.forEach((issue) => {
      issue.path.forEach((path) => {
        let errorMessage = issue.message;
        if (errorMessage?.toLowerCase() === "required")
          errorMessage = `${_.capitalize(path as string)} is required.`;

        // find key in clonedFormFields and set error message
        for (const key in clonedFormFields) {
          if (key === path) {
            clonedFormFields[key as keyof iProfileFormFields].error =
              errorMessage;
          }
        }
      });
    });
  }

  if (fields.avatar.error) clonedFormFields.avatar.error = fields.avatar.error;

  if (fields.region.value || fields.zipCode.value || fields.state.value) {
    if (!fields.region.value) {
      clonedFormFields.region.error = "Region is required.";
    }
    if (!fields.zipCode.value) {
      clonedFormFields.zipCode.error = "Zip Code is required.";
    }
    if (!fields.state.value) {
      clonedFormFields.state.error = "State is required.";
    }
  }

  if (
    !validMultiSelectOtherSingle(clonedFormFields.ethnicity.value, "not-listed")
  )
    clonedFormFields.ethnicity.error = "Please specify a race or ethnicity";
  if (
    !validMultiSelectOther(
      clonedFormFields.topPopulations.value,
      "other",
      clonedFormFields.topPopulationsOther.value,
    )
  )
    clonedFormFields.topPopulations.error = "Please specify a population";
  if (
    !validMultiSelectOther(
      clonedFormFields.genderIdentity.value,
      "another-gender-identity-not-listed",
      clonedFormFields.genderIdentityOther.value,
    )
  )
    clonedFormFields.genderIdentity.error = "Please specify a gender identity";

  return clonedFormFields;
}

export function isProfileFormFieldsValid(fields: iProfileFormFields): boolean {
  for (const key in fields) {
    if (fields[key as keyof iProfileFormFields].error) return false;
  }
  return true;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const findMismatchedRegionsByState = () => {
  for (const key in HHS_regions) {
    const states = HHS_regions[key as keyof typeof HHS_regions];
    states.forEach((state) => {
      const findState = allStates.find(
        (s) => s.label.toLowerCase() === state.toLowerCase(),
      );
      if (!findState) {
        console.log("State not found in allStates: ", state);
      }
    });
  }
};

export function getRegionByState(state: string): string {
  if (!state) return "";

  for (const key in HHS_regions) {
    const states = HHS_regions[key as keyof typeof HHS_regions];
    const findMatch = states.find(
      (s) => s.toLowerCase() === state.toLowerCase(),
    );
    if (findMatch) return key;
  }
  return "";
}

/***
 * For the MultiSelect component:
 * If value is chosen, every other value is removed
 * If value is already chosen, it is removed from the list
 */
function isolateMultiSelectValues(
  isolatedValues: string[],
  values:
    | MultiValue<{
        label: string;
        value: string;
      }>
    | undefined,
):
  | MultiValue<{
      label: string;
      value: string;
    }>
  | undefined {
  if (!values) return undefined;
  if (!values.length) return undefined;

  const lastSelectedValue = values[values.length - 1];

  let newValues = values;

  if (lastSelectedValue) {
    if (isolatedValues.includes(lastSelectedValue.value)) {
      newValues = [lastSelectedValue];
    } else {
      newValues = newValues.filter((v) => !isolatedValues.includes(v.value));
    }
  }

  return newValues;
}

function getMultiSelectOtherValue(values: string[]): string {
  if (values.length > 1) {
    return values[1];
  } else {
    return "";
  }
}

export const transformProfileFormFieldsFromSave = (
  profileFields: iProfileFormFields,
): iProfileFormFields => {
  // transform the labels back to values
  profileFields.ethnicity.value = getSavedOptionsAttribute(
    "value",
    profileFields.ethnicity.value,
    ethnicityOptions,
  );

  profileFields.topPopulations.value = getSavedOptionsAttribute(
    "value",
    profileFields.topPopulations.value,
    topPopulationsOptions,
  );

  profileFields.memberships.value = getSavedOptionsAttribute(
    "value",
    profileFields.memberships.value,
    membershipOptions,
  );

  profileFields.genderIdentity.value = getSavedOptionsAttribute(
    "value",
    profileFields.genderIdentity.value,
    genderIdentityOptions,
  );

  profileFields.education.value = getSavedOptionsAttribute(
    "value",
    [profileFields.education.value],
    educationOptions,
  )[0];

  profileFields.ageRange.value = getSavedOptionsAttribute(
    "value",
    [profileFields.ageRange.value],
    ageRangeOptions,
  )[0];

  profileFields.howDidYouHear.value = getSavedOptionsAttribute(
    "value",
    profileFields.howDidYouHear.value,
    how_did_you_hear_about_usOptions,
  );

  return profileFields;
};

export function transformProfileFormFieldsToSave(
  profileFields: iProfileFormFields,
): iProfileFormFields {
  profileFields["chw-worker"].value = "yes"; // User cannot change this field

  profileFields.topPopulations.value = addOtherToProfileFieldValue(
    profileFields.topPopulations.value,
    profileFields.topPopulationsOther.value,
    "other",
  );

  profileFields.genderIdentity.value = addOtherToProfileFieldValue(
    profileFields.genderIdentity.value,
    profileFields.genderIdentityOther.value,
    "another-gender-identity-not-listed",
  );

  // save the labels instead of the values
  profileFields.ethnicity.value = getSavedOptionsAttribute(
    "label",
    profileFields.ethnicity.value,
    ethnicityOptions,
  );

  profileFields.topPopulations.value = getSavedOptionsAttribute(
    "label",
    profileFields.topPopulations.value,
    topPopulationsOptions,
  );

  profileFields.memberships.value = getSavedOptionsAttribute(
    "label",
    profileFields.memberships.value,
    membershipOptions,
  );

  profileFields.genderIdentity.value = getSavedOptionsAttribute(
    "label",
    profileFields.genderIdentity.value,
    genderIdentityOptions,
  );

  profileFields.education.value = getSavedOptionsAttribute(
    "label",
    [profileFields.education.value],
    educationOptions,
  )[0];

  profileFields.ageRange.value = getSavedOptionsAttribute(
    "label",
    [profileFields.ageRange.value],
    ageRangeOptions,
  )[0];

  profileFields.howDidYouHear.value = getSavedOptionsAttribute(
    "label",
    profileFields.howDidYouHear.value,
    how_did_you_hear_about_usOptions,
  );

  // if (profileFields["about-me"].value) {
  //   // allows break lines to be saved
  //   profileFields["about-me"].value = encodeURIComponent(
  //     profileFields["about-me"].value,
  //   );
  // }

  return profileFields;
}

function getSavedOptionsAttribute(
  key: "label" | "value",
  savedOptions: string[],
  collection: {
    label: string;
    value: string;
  }[],
): string[] {
  return savedOptions.map((so) => {
    if (key === "label")
      return collection.find((c) => c.value === so)?.[key] || so;

    return (
      collection.find((c) => c.label.toLowerCase() === so.toLowerCase())?.[
        key
      ] || so
    );
  });
}

function addOtherToProfileFieldValue(
  valueArray: string[],
  otherValue: string,
  otherKey: string,
): string[] {
  if (!valueArray.length) return valueArray;
  if (!valueArray.includes(otherKey)) return valueArray;

  if (otherValue && !valueArray.includes(otherValue)) {
    valueArray.push(otherValue);
  }

  return valueArray;
}
