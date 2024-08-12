import type { ActionFunctionArgs } from "@remix-run/node";
import {
  Form,
  useActionData,
  useNavigation,
  useSubmit,
} from "@remix-run/react";
import { useState } from "react";
import type { ZodRawShape } from "zod";
import { z } from "zod";
import { Alert } from "~/components/Alert";
import type { iFormField } from "~/components/Forms/FormFields";
import {
  FORM_CLASSES,
  FormFields,
  handleDisabledSubmit,
  handleFormFieldsSubmit,
} from "~/components/Forms/FormFields";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import { USER_ACCOUNT_DELETION_DELAY_DAYS } from "~/constants";
import { User } from "~/controllers/user.control";
import type { iGenericError } from "~/models/appContext.model";
import { classNames } from "~/utilities/main";

const fields: iFormField[] = [
  {
    classes: {
      label: {
        className: "",
      },
    },
    switchStyles: {
      disabled: "bg-chw-yellow",
    },
    label: `Your profile will be permanently removed from CHW Connector after a period of ${USER_ACCOUNT_DELETION_DELAY_DAYS} days.`,
    description: "",
    name: "account-deletion-term-1",
    type: "checkbox",
    required: true,
    value: false,
  },
  {
    classes: {
      label: {
        className: "",
      },
    },
    switchStyles: {
      disabled: "bg-chw-yellow",
    },
    label: `If you login after deleting but before these ${USER_ACCOUNT_DELETION_DELAY_DAYS} days have passed, account deletion will be cancelled.`,
    description: "",
    name: "account-deletion-term-2",
    type: "checkbox",
    required: true,
    value: false,
  },
  {
    classes: {
      label: {
        className: "",
      },
    },
    switchStyles: {
      disabled: "bg-chw-yellow",
    },
    label: `After ${USER_ACCOUNT_DELETION_DELAY_DAYS} days, you will lose access to all your connections and messages, and all personal data will be deleted.`,
    description: "",
    name: "account-deletion-term-3",
    type: "checkbox",
    required: true,
    value: false,
  },
];

const createAccountDeletionSchemaObject = (): ZodRawShape => {
  const schemaObject: ZodRawShape = {};

  fields.forEach((field) => {
    schemaObject[field.name] = z.boolean().refine((val) => val === true, {
      message: `You must agree to delete your account.`,
    });
  });

  return schemaObject;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const result = await User.Forms.executeDeleteAccount(
    request,
    formData,
    createAccountDeletionSchemaObject(),
  );

  return result;
};

export default function SettingsDeleteAccount() {
  const actionData = useActionData() as iGenericError;
  const navigation = useNavigation();
  const submit = useSubmit();

  const [formFields, setFormFields] = useState<iFormField[]>(fields);

  const schemaObject = createAccountDeletionSchemaObject();

  const handleSubmit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    const result = handleFormFieldsSubmit(formFields, schemaObject, e);
    if ("error" in result) return setFormFields(result.error);

    submit(result.formData, {
      method: "post",
      encType: "multipart/form-data",
      action: window.location.pathname,
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
      className="flex flex-col gap-2"
    >
      {actionData && (
        <>
          {"error" in actionData && (
            <Alert title="An error occurred" type="error" className="mb-5">
              <p>{actionData.error}</p>
            </Alert>
          )}
        </>
      )}
      <h1 className="mb-4 text-base font-semibold text-chw-dark-green">
        Are you sure you want to delete your CHW Connector account?
      </h1>
      <p>
        We are sad to see you go! If you are facing any issues or have feedback,
        we are here to help. Please let us know how we can improve your
        experience.
      </p>
      <div className="mt-2 flex flex-col gap-2 text-base font-semibold text-[#686867]">
        If you are sure about deleting your account, keep in mind:
        <div className="">
          <FormFields
            fields={formFields}
            schema={schemaObject}
            onFieldsChange={(fields) => setFormFields(fields)}
          />
        </div>
      </div>
      <p>
        If you still wish to proceed, click <b>Delete Account</b> below.
      </p>
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
                "rounded-[40px] border-[none] px-[25px] py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
              )}
              type="submit"
              onClick={(e) => handleSubmit(e)}
            >
              Delete Account
            </button>
          </>
        )}
      </div>
    </Form>
  );
}
