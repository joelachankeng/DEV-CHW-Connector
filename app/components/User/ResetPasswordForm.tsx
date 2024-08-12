import { useActionData, useNavigation, useSubmit } from "@remix-run/react";
import { useState } from "react";
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
import type { iGenericError } from "~/models/appContext.model";

const schemaObject = ACCOUNT_SCHEMAS.RESET_PASSWORD;

const fields: iFormField[] = [
  {
    classes: {
      label: {
        className: "sr-only",
      },
      parent: {
        className: "w-full mb-10",
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
];
export { fields as resetPasswordFormFields };

export const ResetPasswordForm = ({
  handleJoinClick,
  setEmail,
}: {
  handleJoinClick: () => void;
  setEmail: (email: string) => void;
}) => {
  const actionData = useActionData() as iGenericError | undefined;
  const navigation = useNavigation();
  const submit = useSubmit();

  const [formFields, setFormFields] = useState<iFormField[]>(fields);

  const handleSubmit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    const result = handleFormFieldsSubmit(formFields, schemaObject, e);
    if ("error" in result) return setFormFields(result.error);

    result.formData.append("action", "reset-password");
    submit(result.formData, {
      method: "post",
      encType: "multipart/form-data",
    });

    const email = formFields.find((field) => field.name === "email")?.value;
    if (email) setEmail(email as string);
  };

  return (
    <>
      <form className="flex max-w-[22.188rem] flex-col">
        {actionData?.error && (
          <Alert title="An error occurred" type="error" className="mb-5">
            <p>{actionData.error}</p>
          </Alert>
        )}
        <p className="mb-2.5 font-medium leading-6 text-chw-dim-gray max-md:text-center">
          Please enter your email to recieve instructions on how to reset your
          password.
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
              Reset Password
            </button>
          </>
        )}
        <hr className="mx-0 my-5 h-0.5 bg-chw-black-shadows" />
        <button
          type="button"
          className="rounded-[40px] border-2 border-solid border-chw-light-purple bg-white px-[25px] py-2.5 text-base font-bold text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
          onClick={(e) => {
            e.preventDefault();
            handleJoinClick();
          }}
        >
          New to CHW Connector? Join now.
        </button>
        <p className="mt-2.5 text-xs font-medium leading-4 text-chw-dim-gray">
          CHW Connector is free to use! Simply complete the sign-up process to
          gain access to this online community health space.
        </p>
      </form>
    </>
  );
};
