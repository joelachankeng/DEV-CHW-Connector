import type { ActionFunctionArgs } from "@remix-run/node";
import {
  useActionData,
  useNavigation,
  useSubmit,
  Form,
} from "@remix-run/react";
import { useState } from "react";
import { Alert } from "~/components/Alert";
import type { iFormField } from "~/components/Forms/FormFields";
import {
  FORM_CLASSES,
  FormFields,
  handleDisabledSubmit,
  handleFormFieldsSubmit,
} from "~/components/Forms/FormFields";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import { User } from "~/controllers/user.control";
import type { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import { ACCOUNT_SCHEMAS } from "~/schemas/account";
import { classNames } from "~/utilities/main";

const schemaObject = {
  password: ACCOUNT_SCHEMAS.LOGIN.password,
  newPassword: ACCOUNT_SCHEMAS.CHANGE_PASSWORD.password,
  confirmPassword: ACCOUNT_SCHEMAS.CHANGE_PASSWORD.password,
};

const fields: iFormField[] = [
  {
    classes: {
      label: {
        className: FORM_CLASSES.LABEL.DEFAULT,
      },
      parent: {
        className: "w-full",
      },
      input: {
        className: "bg-white pr-14",
      },
    },
    label: "Password",
    name: "password",
    type: "password",
    required: true,
    value: "",
    placeholder: "",
    autoComplete: "current-password",
  },
  {
    classes: {
      label: {
        className: FORM_CLASSES.LABEL.DEFAULT,
      },
      parent: {
        className: "w-full",
      },
      input: {
        className: "bg-white",
      },
    },
    label: "New Password",
    name: "newPassword",
    type: "password",
    required: true,
    value: "",
    placeholder: "",
    autoComplete: "new-password",
  },
  {
    classes: {
      label: {
        className: FORM_CLASSES.LABEL.DEFAULT,
      },
      parent: {
        className: "w-full",
      },
      input: {
        className: "bg-white",
      },
    },
    label: "Confirm New Password",
    name: "confirmPassword",
    type: "password",
    required: true,
    value: "",
    placeholder: "",
    autoComplete: "confirm-password",
  },
];

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const result = await User.Forms.executeUpdatePassword(
    request,
    formData,
    schemaObject,
  );

  return result;
};
export default function SettingsPassword() {
  const actionData = useActionData() as iGenericError | iGenericSuccess;
  const navigation = useNavigation();
  const submit = useSubmit();

  const [formFields, setFormFields] = useState<iFormField[]>(fields);

  const handleonFieldsChange = (fields: iFormField[]) => {
    const newPassword = fields.find((field) => field.name === "newPassword");

    const confirmPasswordIndex = fields.findIndex(
      (field) => field.name === "confirmPassword",
    );
    const confirmPassword = fields[confirmPasswordIndex];

    const errorMessage = "The new password and confirm password do not match.";
    let newError: string | undefined = undefined;
    if (newPassword && confirmPassword) {
      if (
        newPassword.value !== "" &&
        confirmPassword.value !== "" &&
        newPassword.value !== confirmPassword.value
      ) {
        if (confirmPassword.error !== errorMessage) {
          newError = errorMessage;
        }
      } else {
        if (confirmPassword.error === errorMessage) {
          newError = "";
        }
      }
    }

    if (newError !== undefined && fields[confirmPasswordIndex] !== undefined) {
      fields[confirmPasswordIndex] = {
        ...confirmPassword,
        error: newError,
      };
    }

    setFormFields(fields);
  };

  const handleSubmit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    const result = handleFormFieldsSubmit(formFields, schemaObject, e);
    if ("error" in result) return setFormFields(result.error);

    submit(result.formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  return (
    <Form
      method="post"
      encType="multipart/form-data"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
      className={classNames("change-password-form", "")}
    >
      {actionData && (
        <>
          {"error" in actionData && (
            <Alert title="An error occurred" type="error" className="mb-5">
              <p>{actionData.error}</p>
            </Alert>
          )}
          {"success" in actionData && (
            <Alert title="Success" type="success" className="mb-5">
              <p>{actionData.success}</p>
            </Alert>
          )}
        </>
      )}
      <div className="flex flex-col gap-5">
        <FormFields
          fields={formFields}
          schema={schemaObject}
          onFieldsChange={(fields) => handleonFieldsChange(fields)}
        />
        <div className="mt-4 flex justify-end">
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
                  "rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
                )}
                type="submit"
                onClick={(e) => handleSubmit(e)}
              >
                Save Changes
              </button>
            </>
          )}
        </div>
      </div>
    </Form>
  );
}
