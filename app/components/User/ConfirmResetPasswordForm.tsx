import {
  useActionData,
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
import { classNames } from "~/utilities/main";
import { resetPasswordFormFields } from "./ResetPasswordForm";
import type { iHPLoaderData } from "~/routes";

const schemaObject = ACCOUNT_SCHEMAS.CONFIRM_RESET_PASSWORD;

const fields: iFormField[] = [
  {
    classes: {
      label: {
        className: "sr-only",
      },
      parent: {
        className: "hidden",
      },
    },
    label: "Email",
    name: "email",
    type: "email",
    required: true,
    value: "",
    placeholder: "Email",
  },
  {
    classes: {
      label: {
        className: "sr-only",
      },
      parent: {
        className: "w-full mb-2",
      },
    },
    label: "Code",
    name: "code",
    type: "text",
    required: true,
    value: "",
    placeholder: "Code",
  },
];
export { fields as confirmResetPasswordFormFields };

export const ConfirmResetPasswordForm = ({
  email,
  handleChangeEmail,
  handleJoinClick,
}: {
  email: string;
  handleChangeEmail: () => void;
  handleJoinClick: () => void;
}) => {
  const loaderData = useLoaderData() as iHPLoaderData;
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const submit = useSubmit();

  const [formFields, setFormFields] = useState<iFormField[]>(fields);
  const [resetCodeDuration, setResetCodeDuration] = useState<number>(0);

  useEffect(() => {
    if (resetCodeDuration === 0) return;
    const interval = setInterval(() => {
      setResetCodeDuration((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resetCodeDuration]);

  useEffect(() => {
    const emailField = formFields.find((field) => field.name === "email");
    if (!emailField) return;

    emailField.value = email;
    setFormFields([...formFields]);
  }, [email]);

  const handleSubmit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    const result = handleFormFieldsSubmit(formFields, schemaObject, e);
    if ("error" in result) return setFormFields(result.error);

    result.formData.append("action", "confirm-reset-password");
    submit(result.formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  const handleResetCode = async () => {
    if (resetCodeDuration > 0) return;
    setResetCodeDuration(30);

    const fields = resetPasswordFormFields;
    const emailField = fields.find((field) => field.name === "email");
    if (!emailField) return;

    emailField.value = email;
    const formData = new FormData();
    formData.append("form", JSON.stringify(fields));
    formData.append("action", "reset-password");
    submit(formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  return (
    <>
      <form className="flex max-w-[22.188rem] flex-col">
        {(actionData?.error || loaderData.formError) && (
          <Alert title="An error occurred" type="error" className="mb-5">
            <p>{actionData?.error || loaderData?.formError}</p>
          </Alert>
        )}
        <p className="mb-2.5 font-medium leading-6 text-chw-dim-gray">
          Please enter the verification code sent to sent to <b>{email}</b>.
        </p>
        <FormFields
          fields={formFields}
          schema={schemaObject}
          onFieldsChange={(fields) => setFormFields(fields)}
        />
        <div className="flex flex-wrap justify-between gap-2.5">
          <button
            className={classNames(
              "mb-8 text-left font-medium leading-6 text-chw-light-purple transition duration-300 ease-in-out",
              resetCodeDuration > 0
                ? "cursor-not-allowed grayscale"
                : "cursor-pointer hover:text-chw-dark-purple",
            )}
            onClick={(e) => {
              e.preventDefault();
              handleResetCode();
            }}
          >
            {resetCodeDuration > 0
              ? `Resend code in ${resetCodeDuration}s`
              : "Resend code"}
          </button>
          <button
            className="mb-8 text-left font-medium leading-6 text-chw-light-purple transition duration-300 ease-in-out hover:text-chw-dark-purple"
            onClick={(e) => {
              e.preventDefault();
              handleChangeEmail();
            }}
          >
            Change email?
          </button>
        </div>

        {navigation.state !== "idle" ? (
          <LoadingSpinner className="mx-auto mb-2" />
        ) : (
          <>
            <button
              disabled={handleDisabledSubmit(formFields)}
              className={classNames(
                handleDisabledSubmit(formFields)
                  ? FORM_CLASSES.BUTTON.DISABLED
                  : "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
                "w-full rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
              )}
              type="submit"
              onClick={(e) => handleSubmit(e)}
            >
              Verify
            </button>
          </>
        )}
        <p className="mt-4 leading-6 text-chw-dim-gray">
          If you don't see a code in your inbox, check your spam folder. If it's
          not there, the email address may not be confirmed, or it may not match
          an existing account.
        </p>
        <hr className="mx-0 my-5 h-0.5 bg-chw-black-shadows" />
        <a
          href="#"
          className="rounded-[40px] border-2 border-solid border-chw-light-purple bg-white px-[25px] py-2.5 text-base font-bold text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
          onClick={(e) => {
            e.preventDefault();
            handleJoinClick();
          }}
        >
          New to CHW Connector? Join now.
        </a>
        <p className="mt-2.5 text-xs font-medium leading-4 text-chw-dim-gray">
          CHW Connector is free to use! Simply complete the sign-up process to
          gain access to this online community health space.
        </p>
      </form>
    </>
  );
};
