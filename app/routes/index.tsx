import type {
  ActionFunctionArgs,
  LoaderFunction,
  TypedResponse,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { useActionData, useLoaderData } from "@remix-run/react";
import { Logo } from "~/assets/Logo";
import { useEffect, useState } from "react";
import Page from "~/components/Pages/Page";
import { ACCOUNT_SCHEMAS } from "~/schemas/account";
import { Alert } from "~/components/Alert";
import { User } from "~/controllers/user.control";
import { LoginForm } from "~/components/User/LoginForm";
import { SignupForm } from "~/components/User/SignupForm";
import { requireMemberClicks } from "~/servers/memberClicksSession.server";
import { MemberClicks } from "~/controllers/memberClicks.control";
import type { iMemberClicksError } from "~/models/memberClicks.model";
import _ from "lodash";
import { ResetPasswordForm } from "~/components/User/ResetPasswordForm";
import { ConfirmResetPasswordForm } from "~/components/User/ConfirmResetPasswordForm";
import { ChangePasswordForm } from "~/components/User/ChangePasswordForm";
import { getRequestParams } from "~/utilities/main";
import { getUserSessionToken } from "~/servers/userSession.server";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";

export type iHPLoaderData = {
  MC_URL: string;
  MC_ERROR?: iMemberClicksError;
  defaultForm?: iHPForms;
  formError?: string;
  email?: string;
};
const defaultLoaderData: iHPLoaderData = {
  MC_URL: "",
  MC_ERROR: undefined,
  defaultForm: "LOGIN",
  formError: undefined,
  email: "",
};

export const HPFORM_ACCOUNT_DELETED = "ACCOUNT_DELETED";

export type iHPForms =
  | "LOGIN"
  | "SIGNUP"
  | "RESET_PASSWORD"
  | "CONFIRM_RESET_CODE"
  | "CHANGE_PASSWORD";

export const loader: LoaderFunction = async ({
  request,
}): Promise<iHPLoaderData> => {
  const userToken = await getUserSessionToken(request);

  if (userToken && userToken) {
    const userData = await User.API.validateToken(userToken);
    if (userData !== undefined && userData !== null) {
      throw redirect(APP_ROUTES.FEED);
    }
  }

  await requireMemberClicks(request);
  defaultLoaderData.MC_URL = MemberClicks.getOauthUrl(request);

  const urlParams = getRequestParams(request);

  defaultLoaderData.email = urlParams.get("email") || "";
  const MC_code = urlParams.get("code");

  const checkResetParamsResponse =
    await User.Forms.executeConfirmResetPasswordRequest(request);

  if (checkResetParamsResponse instanceof Error) {
    defaultLoaderData.defaultForm = "CONFIRM_RESET_CODE";
    defaultLoaderData.formError = checkResetParamsResponse.message;
  }

  if (typeof checkResetParamsResponse === "string") {
    defaultLoaderData.defaultForm = checkResetParamsResponse;
  }

  if (!MC_code) return defaultLoaderData;

  const response = await MemberClicks.getMemberClickCodeAccessToken(
    request,
    MC_code,
  );

  if ("error" in response) {
    defaultLoaderData.MC_ERROR = response;
    return defaultLoaderData;
  }

  const MC_response = await User.Forms.executeLoginMemberClicksAction(
    request,
    response,
  );

  defaultLoaderData.MC_ERROR = {
    error: "",
    error_description: MC_response.message,
  };
  return defaultLoaderData;
};

export type iHPActionData = {
  activeForm: iHPForms;
  error?: string;
  success?: string;
};

export async function action({
  request,
}: ActionFunctionArgs): Promise<iHPActionData | TypedResponse> {
  const formData = await request.formData();
  const action = formData.get("action") as string;

  if (action === "login") {
    return await User.Forms.executeLoginAction(
      request,
      formData,
      ACCOUNT_SCHEMAS.LOGIN,
    );
  }

  if (action === "loginDeletion") {
    return await User.Forms.executeLoginAction(
      request,
      formData,
      ACCOUNT_SCHEMAS.LOGIN,
      undefined,
      true,
      true,
    );
  }

  if (action === "signup") {
    return await User.Forms.executeSignupAction(
      request,
      formData,
      ACCOUNT_SCHEMAS.SIGNUP,
    );
  }

  if (action === "reset-password") {
    return await User.Forms.executeResetPasswordAction(
      request,
      formData,
      ACCOUNT_SCHEMAS.RESET_PASSWORD,
    );
  }

  if (action === "confirm-reset-password") {
    return await User.Forms.executeConfirmResetPasswordAction(
      request,
      formData,
      ACCOUNT_SCHEMAS.CONFIRM_RESET_PASSWORD,
    );
  }

  if (action === "change-password") {
    return await User.Forms.executeChangePasswordAction(
      request,
      formData,
      ACCOUNT_SCHEMAS.CHANGE_PASSWORD,
    );
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function Index() {
  const loaderData = useLoaderData() as iHPLoaderData;
  const actionData = useActionData() as iHPActionData;

  const [currentForm, setCurrentForm] = useState<iHPForms>(
    loaderData.defaultForm || "LOGIN",
  );
  const [email, setEmail] = useState(loaderData.email || "");
  const [, setFrmActionData] = useState<iHPActionData>(actionData);

  useEffect(() => {
    if (_.isEmpty(actionData)) return;
    if ("activeForm" in actionData) {
      setCurrentForm(actionData.activeForm);
    }
  }, [actionData]);

  useEffect(() => {
    if (actionData?.error) actionData.error = undefined;

    setFrmActionData(actionData);
  }, [currentForm]);

  const renderCurrentForm = () => {
    switch (currentForm) {
      case "LOGIN":
        return (
          <LoginForm
            handleJoinClick={() => setCurrentForm("SIGNUP")}
            handleResetPasswordClick={() => setCurrentForm("RESET_PASSWORD")}
          />
        );
      case "SIGNUP":
        return <SignupForm handleLoginClick={() => setCurrentForm("LOGIN")} />;
      case "RESET_PASSWORD":
        return (
          <ResetPasswordForm
            handleJoinClick={() => setCurrentForm("SIGNUP")}
            setEmail={setEmail}
          />
        );
      case "CONFIRM_RESET_CODE":
        return (
          <ConfirmResetPasswordForm
            email={email}
            handleJoinClick={() => setCurrentForm("SIGNUP")}
            handleChangeEmail={() => setCurrentForm("RESET_PASSWORD")}
          />
        );
      case "CHANGE_PASSWORD":
        return (
          <ChangePasswordForm
            email={email}
            handleJoinClick={() => setCurrentForm("SIGNUP")}
          />
        );
    }
  };

  return (
    <>
      <Page
        className="flex min-h-full flex-col justify-between gap-[3.125rem] bg-white"
        header={{
          display: false,
        }}
        main={{
          className: "flex flex-col justify-center h-full",
        }}
        article={{
          className: "items-center",
        }}
      >
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div className="mx-auto mt-[3.125rem] flex max-w-[67rem] flex-col max-md:items-center">
            <h1 className="sr-only">Welcome to CHW Connector</h1>
            <div className="mb-[3.125rem] h-32 w-full max-w-[27.188rem] max-md:h-24">
              <Logo />
            </div>
            <div className="flex w-full max-w-[67.5rem] justify-between gap-4 max-md:flex-col max-md:items-center max-md:gap-10">
              <div>
                <h2 className="w-full max-w-[36.563rem] text-[2.63rem] font-medium leading-[2.76rem] text-chw-dark-green max-md:text-center max-md:text-[2rem] max-md:leading-[2.125rem]">
                  Where community health workers and networks come together to
                  share information, insights, and resources.
                </h2>
                {loaderData?.MC_ERROR && (
                  <div className="max-w-[36.563rem]">
                    <Alert
                      title="An error occurred signing in with MemberClicks!"
                      type="error"
                      className="my-5"
                    >
                      <p>{loaderData.MC_ERROR.error_description}</p>
                    </Alert>
                  </div>
                )}
                {actionData?.success && (
                  <Alert
                    title={actionData.success}
                    type="success"
                    className="my-5"
                  ></Alert>
                )}
              </div>
              {renderCurrentForm()}
            </div>
          </div>
        </div>
      </Page>
    </>
  );
}
