import {
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useEffect, useState } from "react";
import type { iFormField } from "~/components/Forms/FormFields";
import {
  FORM_CLASSES,
  FormFields,
  handleDisabledSubmit,
  handleFormFieldsSubmit,
} from "~/components/Forms/FormFields";
import { ACCOUNT_SCHEMAS } from "~/schemas/account";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import { Alert } from "~/components/Alert";

import type { iHPLoaderData } from "~/routes";
import { SigninTerms } from "./SigninTerms";
import { classNames } from "~/utilities/main";
import ModalNotification from "../Modals/ModalNotification";
import type { iMemberClicksProfilesResult } from "~/models/memberClicks.model";
import type { iGenericError } from "~/models/appContext.model";

const schemaObject = ACCOUNT_SCHEMAS.SIGNUP;
const fields: iFormField[] = [
  {
    classes: {
      label: {
        className: "sr-only",
      },
      parent: {
        className: "w-full mb-[1.25rem]",
      },
    },
    label: "First Name",
    name: "firstName",
    type: "text",
    required: true,
    value: "",
    placeholder: "First Name",
    autoComplete: "first-name",
  },
  {
    classes: {
      label: {
        className: "sr-only",
      },
      parent: {
        className: "w-full mb-[1.25rem]",
      },
    },
    label: "Last Name",
    name: "lastName",
    type: "text",
    required: true,
    value: "",
    placeholder: "Last Name",
    autoComplete: "last-name",
  },
  {
    classes: {
      label: {
        className: "sr-only",
      },
      parent: {
        className: "w-full mb-[0.5rem]",
      },
    },
    label: "Email",
    name: "email",
    type: "email",
    required: true,
    value: "",
    placeholder: "Email",
    autoComplete: "email",
  },
  {
    classes: {
      label: {
        className: "sr-only",
      },
      parent: {
        className: "w-full flex flex-col mb-[1.25rem]",
      },
      input: {
        className: "text-[0.875rem] text-chw-dark-green",
      },
      container: {
        className: "flex items-center gap-4 w-full flex-wrap",
        override: true,
      },
    },
    label: "What type of email is this?",
    value: "",
    name: "email-type",
    type: "radio",
    required: true,
    options: [
      {
        type: "radio",
        id: "email-type-personal",
        name: "email-type",
        value: "personal",
        label: "Personal",
      },
      {
        type: "radio",
        id: "email-type-work",
        name: "email-type",
        value: "work",
        label: "Work",
      },
    ],
  },
  {
    classes: {
      label: {
        className: "sr-only",
      },
      parent: {
        className: "w-full mb-[1.25rem]",
      },
      input: {
        className: "pr-14",
      },
    },
    label: "Password:",
    name: "password",
    type: "password",
    required: true,
    value: "",
    placeholder: "Password (8+ characters)",
    autoComplete: "current-password",
  },
  {
    classes: {
      label: {
        className: "text-[0.875rem] text-chw-dark-green",
      },
      parent: {
        className: "w-full flex gap-[2.813rem]",
      },
      input: {
        className: "text-[0.875rem] text-chw-dark-green",
      },
      container: {
        className: "flex-col",
      },
    },
    label:
      "I am a Community Health Worker, Community Health Representative, and/or Promotora",
    value: "",
    name: "chw-worker",
    type: "radio",
    required: true,
    options: [
      {
        type: "radio",
        id: "chw-worker-yes",
        name: "chw-worker",
        value: "yes",
        label: "Yes",
      },
      {
        type: "radio",
        id: "chw-worker-no",
        name: "chw-worker",
        value: "no",
        label: "No",
      },
    ],
  },
];

// export array fields with the name of SignupFormFields
export { fields as SignupFormFields };

export const SignupForm = ({
  handleLoginClick,
}: {
  handleLoginClick: () => void;
}) => {
  const loaderdata = useLoaderData() as iHPLoaderData;
  const actionData = useActionData() as iGenericError;
  const navigation = useNavigation();
  const submit = useSubmit();
  const fetcher = useFetcher();

  const [formFields, setFormFields] = useState<iFormField[]>(fields);
  const [chwWorker, setChwWorker] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState<string>("");
  const [showCHWModal, setShowCHWModal] = useState<boolean>(false);
  const [showMCModal, setShowMCModal] = useState<boolean>(false);
  const [showMCButton, setShowMCButton] = useState<boolean>(false);
  const [profiles, setProfiles] = useState<
    iMemberClicksProfilesResult["profiles"] | undefined
  >(undefined);

  const isDisabled = handleDisabledSubmit(formFields) || chwWorker !== "yes";

  const handleonFieldsChange = (fields: iFormField[]) => {
    const chwWorkerField = fields.find((field) => field.name === "chw-worker");
    const emailField = fields.find((field) => field.name === "email");

    setChwWorker(chwWorkerField?.value as string);
    setEmail(emailField?.value as string);

    if (chwWorkerField?.value === "no") {
      setShowCHWModal(true);
    }

    setFormFields(fields);
  };

  const handleSubmit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    const result = handleFormFieldsSubmit(formFields, schemaObject, e);
    if ("error" in result) return setFormFields(result.error);

    result.formData.append("action", "signup");
    submit(result.formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      const isValidEmail = ACCOUNT_SCHEMAS.LOGIN.email.safeParse(email);
      if (isValidEmail.success) {
        const formData = new FormData();
        formData.append("[Email | Primary]", email);

        fetcher.submit(formData, {
          method: "post",
          action: "api/mc/user/search",
        });
      }
    }, 250);
    return () => clearTimeout(delayDebounceFn);
  }, [email]);

  useEffect(() => {
    if (fetcher.state !== "idle") {
      setShowMCModal(false);
      setShowMCButton(false);
      setProfiles(undefined);
      return;
    }
    if (fetcher.data === undefined) {
      setShowMCModal(false);
      setShowMCButton(false);
      setProfiles(undefined);
      return;
    }
    const results = fetcher.data as iMemberClicksProfilesResult;

    if ("error" in results) {
      setShowMCModal(false);
      setShowMCButton(false);
      setProfiles(undefined);
      return;
    }

    if (
      results.profiles.length > 0 &&
      results.profiles.some((profile) => profile["[Email | Primary]"] === email)
    ) {
      setShowMCModal(true);
      setShowMCButton(true);
      setProfiles(results.profiles);
    }
  }, [fetcher.data, fetcher.state]);

  return (
    <>
      <ModalNotification
        show={showMCModal}
        title={`Welcome back, ${profiles?.[0]["[Name | First]"]}!`}
        content={
          <p className="text-base">
            You are already a member of the NACHW community. Please sign in via
            the MemberClicks portal.
          </p>
        }
        confirmButton={{
          text: "Sign In",
        }}
        onConfirm={() => window.location.assign(loaderdata.MC_URL)}
        onClose={() => setShowMCModal(false)}
      />
      <ModalNotification
        show={showCHWModal}
        spinner={false}
        title={"We are sorry we cannot create your account!"}
        content={
          <p className="text-base">
            The CHW Connector Platform is restricted to Users who identify as
            CHW’s, Please email{" "}
            <a
              className="font-semibold text-chw-light-purple transition duration-300 ease-in-out hover:underline"
              href="https://form.jotform.com/232434102616142"
              target="_blank"
              rel="noreferrer"
            >
              Member Partner Engagement
            </a>{" "}
            for more information on how Allies and others can participate.
          </p>
        }
        cancelButton={{
          display: false,
        }}
        onConfirm={() => setShowCHWModal(false)}
        onClose={() => setShowCHWModal(false)}
      />
      <Form
        method="post"
        encType="multipart/form-data"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex max-w-[22.188rem] flex-col"
      >
        {actionData?.error && (
          <Alert title="An error occurred" type="error" className="mb-5">
            <p>{actionData.error}</p>
          </Alert>
        )}

        <FormFields
          fields={formFields}
          schema={schemaObject}
          onFieldsChange={(fields) => handleonFieldsChange(fields)}
        />
        {navigation.state !== "idle" || fetcher.state !== "idle" ? (
          <LoadingSpinner className="mx-auto mb-2" />
        ) : (
          <>
            <button
              disabled={isDisabled}
              className={classNames(
                isDisabled
                  ? FORM_CLASSES.BUTTON.DISABLED
                  : "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
                "w-full rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
              )}
              type="submit"
              onClick={(e) => handleSubmit(e)}
            >
              Agree & Join
            </button>
            {showMCButton && (
              <a
                href={loaderdata.MC_URL}
                className="mt-2 w-full rounded-[40px] border-[none] bg-[#00426B] px-[25px] py-2.5 text-center text-base font-bold text-white opacity-80 transition duration-300 ease-in-out hover:opacity-100"
              >
                Sign in via MemberClicks
              </a>
            )}
          </>
        )}
        <SigninTerms />

        <button
          className="rounded-[40px] border-2 border-solid border-chw-light-purple bg-white px-[20px] py-2.5 text-base font-bold text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
          onClick={(e) => {
            e.preventDefault();
            handleLoginClick();
          }}
        >
          Already on CHW Connector? Sign in.
        </button>
      </Form>
    </>
  );
};
