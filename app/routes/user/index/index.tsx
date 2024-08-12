import type { LoaderFunctionArgs } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import Page from "~/components/Pages/Page";
import Profile from "~/components/User/Profile";
import { APP_CLASSNAMES, APP_ROUTES } from "~/constants";
import { classNames } from "~/utilities/main";
import ProfileTabs from "~/components/User/ProfileTabs";
import {
  clearUserSession,
  requireUserSession,
} from "~/servers/userSession.server";
import { User } from "~/controllers/user.control";
import { useLoaderData } from "@remix-run/react";
import type { iWP_User } from "~/models/user.model";
import {
  convertUserToProfileFormFields,
  transformProfileFormFieldsToSave,
} from "~/routes/settings/edit-profile";
import type { iGenericError } from "~/models/appContext.model";
import { ErrorPageGeneric } from "~/components/Pages/ErrorPage";

type loaderData = {
  user: iWP_User | iGenericError;
};

export async function loader({
  request,
}: LoaderFunctionArgs): Promise<ReturnType<typeof json<loaderData>>> {
  const userToken = await requireUserSession(request);
  const userData = await User.API.validateToken(userToken);
  if (!userData) return await clearUserSession(request);

  const user = await User.API.getUser(userData.user.user_email, "EMAIL");
  if (!user) return redirect(APP_ROUTES.LOGOUT);

  if (user instanceof Error)
    return json({
      user: {
        error: user.message,
      },
    });
  return json({ user });
}

export default function UserProfile() {
  const { user } = useLoaderData() as loaderData;

  if ("error" in user || !user) {
    return <ErrorPageGeneric error={user} />;
  }

  return (
    <>
      <Page>
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div
            className={classNames(
              APP_CLASSNAMES.CONTAINER,
              "!max-w-[56.25rem]",
            )}
          >
            <div className="mt-28 max-md:mt-0">
              <Profile
                fields={transformProfileFormFieldsToSave(
                  convertUserToProfileFormFields(user),
                )}
                userId={user.databaseId}
                viewerId={user.databaseId}
                privateView={true}
              />
            </div>
          </div>
          <div className="mt-20 w-full">
            <ProfileTabs userId={user.databaseId} viewerId={user.databaseId} />
          </div>
        </div>
      </Page>
    </>
  );
}
