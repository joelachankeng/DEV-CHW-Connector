import { Link } from "@remix-run/react";
import { APP_ROUTES } from "~/constants";

export const SigninTerms = () => {
  return (
    <>
      <p className="mt-2.5 text-[0.75rem] leading-4 text-chw-dim-gray">
        By clicking <b>Sign in</b>, you agree to the CHW Connector{" "}
        <Link
          className="font-semibold text-chw-light-purple transition duration-300 ease-in-out hover:underline"
          to={APP_ROUTES.TERMS_OF_USE}
        >
          Terms of Use,
        </Link>{" "}
        <Link
          className="font-semibold text-chw-light-purple transition duration-300 ease-in-out hover:underline"
          to={APP_ROUTES.COMMUNITY_GUIDELINES}
        >
          Community Guidelines,
        </Link>{" "}
        and{" "}
        <Link
          className="font-semibold text-chw-light-purple transition duration-300 ease-in-out hover:underline"
          to={APP_ROUTES.PRIVACY_POLICY}
        >
          Privacy Policy.
        </Link>
      </p>
      <hr className="mx-0 my-5 h-0.5 bg-chw-black-shadows" />
    </>
  );
};
