import type { LoaderFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import { Link, useLoaderData } from "@remix-run/react";
import { Logo } from "~/assets/Logo";
import { Alert } from "~/components/Alert";
import Page from "~/components/Pages/Page";
import { APP_CLASSNAMES } from "~/constants";
import { User } from "~/controllers/user.control";
import type { iGenericError, iGenericSuccess } from "~/models/appContext.model";
import { classNames, getRequestParams } from "~/utilities/main";

export const loader: LoaderFunction = async ({ request, params }) => {
  const urlParams = getRequestParams(request);
  const code = urlParams.get("code");
  const email = urlParams.get("email");

  if (!code || !email) return redirect("/");

  const result = await User.Forms.executeConfirmEmail(code, email);
  if (result instanceof Error) {
    let errorMessage = result.message;
    if (
      result.name === "INVALID_CODE" ||
      result.name === "INVALID_EXPIRATION" ||
      result.name === "EXPIRED_CODE"
    ) {
      errorMessage += " Please login and request a new verification email.";
    }
    return json({ error: errorMessage }, { status: 400 });
  }

  return json({ success: "Email confirmed" });
};

export default function ConfirmEmail() {
  const loaderData = useLoaderData<iGenericError | iGenericSuccess>();
  console.log(loaderData);

  return (
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
        <div className="mx-auto mt-[3.125rem] flex max-w-[67rem] flex-col items-center">
          <h1 className="sr-only">
            {"success" in loaderData
              ? "New Email Confirmed"
              : "Error Confirming Email"}
          </h1>
          <div className="mb-[3.125rem] h-32 w-full max-w-[27.188rem] max-md:h-24">
            <Logo />
          </div>
          <div className="flex w-full max-w-[67.5rem] flex-col items-center justify-center gap-4 max-md:gap-10">
            {"success" in loaderData ? (
              <Alert
                title="New Email Activated"
                type="success"
                className="mb-5"
              >
                <p>
                  Your new email address has been successfully activated.
                  <br />
                  Please click the link below to login with your new email.
                </p>
              </Alert>
            ) : (
              <Alert
                title="Error Confirming Email"
                type="error"
                className="mb-5"
              >
                <p>{loaderData.error}</p>
              </Alert>
            )}

            <div className="">
              <Link
                to="/"
                className={classNames(
                  "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
                  "w-full rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
                )}
              >
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
