import {
  Form,
  Link,
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
import { HPFORM_ACCOUNT_DELETED, type iHPLoaderData } from "~/routes";
import { SigninTerms } from "./SigninTerms";
import { classNames } from "~/utilities/main";
import { APP_ROUTES } from "~/constants";
import type { iGenericError } from "~/models/appContext.model";
import ModalNotification from "../Modals/ModalNotification";

const schemaObject = ACCOUNT_SCHEMAS.LOGIN;
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
  {
    classes: {
      label: {
        className: "sr-only",
      },
      parent: {
        className: "w-full",
      },
      input: {
        className: "pr-14",
      },
    },
    label: "Password",
    name: "password",
    type: "password",
    required: true,
    value: "",
    placeholder: "Password",
    autoComplete: "current-password",
  },
];
export { fields as LoginFormFields };

export const LoginForm = ({
  handleJoinClick,
  handleResetPasswordClick,
}: {
  handleJoinClick: () => void;
  handleResetPasswordClick: () => void;
}) => {
  const loaderdata = useLoaderData() as iHPLoaderData;
  const actionData = useActionData() as iGenericError;
  const navigation = useNavigation();
  const submit = useSubmit();

  const [formFields, setFormFields] = useState<iFormField[]>(fields);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = (
    e?: React.MouseEvent<HTMLButtonElement>,
    ignoreDeletion = false,
  ) => {
    e?.preventDefault();
    const result = handleFormFieldsSubmit(formFields, schemaObject, e);
    if ("error" in result) return setFormFields(result.error);

    result.formData.append(
      "action",
      ignoreDeletion ? "loginDeletion" : "login",
    );
    submit(result.formData, {
      method: "post",
      encType: "multipart/form-data",
    });
  };

  useEffect(() => {
    if (!actionData) return;
    if ("error" in actionData && actionData.error === HPFORM_ACCOUNT_DELETED) {
      setShowModal(true);
    }
  }, [actionData]);

  return (
    <>
      <ModalNotification
        show={showModal}
        title={`Are you sure you want to sign in?`}
        content={
          <>
            {actionData && "error_description" in actionData && (
              <div
                className="flex flex-col gap-1 text-base"
                dangerouslySetInnerHTML={{
                  __html: actionData.error_description || "",
                }}
              />
            )}
          </>
        }
        confirmButton={{
          text: "Sign In",
        }}
        onConfirm={() => handleSubmit(undefined, true)}
        onClose={() => setShowModal(false)}
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
        {actionData?.error && actionData.error !== HPFORM_ACCOUNT_DELETED && (
          <Alert title="An error occurred" type="error" className="mb-5">
            <p>{actionData.error}</p>
          </Alert>
        )}
        <FormFields
          fields={formFields}
          schema={schemaObject}
          onFieldsChange={(fields) => setFormFields(fields)}
        />
        <Link
          to={APP_ROUTES.FORGOT_PASSWORD}
          className="mb-10 ml-5 mt-[0.313rem] text-base font-medium text-chw-light-purple transition duration-300 ease-in-out hover:underline"
          onClick={(e) => {
            e.preventDefault();
            handleResetPasswordClick();
          }}
        >
          Forgot password?
        </Link>
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
              Sign in
            </button>
            <a
              href={loaderdata.MC_URL}
              className="mt-2 w-full rounded-[40px] border-[none] bg-[#00426B] px-[25px] py-2.5 text-center text-base font-bold text-white opacity-80 transition duration-300 ease-in-out hover:opacity-100"
            >
              Sign in via MemberClicks
            </a>
          </>
        )}
        <SigninTerms />
        <button
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
      </Form>
    </>
  );
};
