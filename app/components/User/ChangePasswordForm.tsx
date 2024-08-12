import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
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

const schemaObject = ACCOUNT_SCHEMAS.CHANGE_PASSWORD;

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
        className: "w-full mb-10",
      },
    },
    label: "New Password",
    name: "password",
    type: "password",
    required: true,
    value: "",
    placeholder: "Password",
    autoComplete: "new-password",
  },
];

export const ChangePasswordForm = ({
  email,
  handleJoinClick,
}: {
  email: string;
  handleJoinClick: () => void;
}) => {
  const actionData = useActionData() as any;
  const navigation = useNavigation();
  const submit = useSubmit();

  const [formFields, setFormFields] = useState<iFormField[]>(fields);

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

    result.formData.append("action", "change-password");
    submit(result.formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  return (
    <>
      <form className="flex max-w-[22.188rem] flex-col">
        {actionData?.error && (
          <Alert title="An error occurred" type="error" className="mb-5">
            <p>{actionData.error}</p>
          </Alert>
        )}

        <p className="mb-2.5 font-medium leading-6 text-chw-dim-gray">
          Please enter a new password for <b>{email}</b> account.
        </p>
        <FormFields
          fields={formFields}
          schema={schemaObject}
          onFieldsChange={(fields) => setFormFields(fields)}
        />

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
              Change
            </button>
          </>
        )}
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
