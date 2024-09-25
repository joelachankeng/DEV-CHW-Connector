import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import Page from "~/components/Pages/Page";
import Profile from "~/components/User/Profile";
import { APP_CLASSNAMES } from "~/constants";
import { classNames } from "~/utilities/main";
import ProfileTabs from "~/components/User/ProfileTabs";
import { User } from "~/controllers/user.control";
import { useLoaderData } from "@remix-run/react";
import type { iWP_User } from "~/models/user.model";
import type { iProfileFormFields } from "~/routes/settings/edit-profile";
import { ErrorPageGeneric } from "~/components/Pages/ErrorPage";

type loaderData = {
  profileFields:
    | (iProfileFormFields & {
        databaseId: number;
      })
    | undefined;
  viewer: iWP_User | undefined;
};

export async function loader({
  request,
  params,
}: LoaderFunctionArgs): Promise<ReturnType<typeof json<loaderData>>> {
  let viewer: iWP_User | undefined;
  let profileFields: loaderData["profileFields"] = undefined;

  const getUser = await User.Utils.getUserFromSession(request);
  if (getUser && !(getUser instanceof Error)) {
    viewer = getUser;
  }

  const paramId = params["*"];
  if (paramId) {
    const userId = parseInt(paramId);
    if (!isNaN(userId)) {
      const user = await User.API.getUser(userId.toString(), "DATABASE_ID");
      if (user && !(user instanceof Error)) {
        profileFields = User.Utils.removeSensitiveUserData(user);
      }
    }
  }

  return json({
    profileFields,
    viewer,
  });
}

export default function UserProfile() {
  const { profileFields, viewer } = useLoaderData() as loaderData;

  if (profileFields === undefined) {
    return (
      <ErrorPageGeneric
        error={{
          error: "User not found",
          error_description:
            "The user you are looking for does not exist or has been deleted.",
        }}
        dataType="User"
        status="404"
      />
    );
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
                fields={profileFields}
                userId={profileFields.databaseId}
                viewerId={viewer?.databaseId}
              />
            </div>
          </div>
          <div className="mt-20 w-full">
            <ProfileTabs
              userId={profileFields.databaseId}
              viewerId={viewer?.databaseId}
            />
          </div>
        </div>
      </Page>
    </>
  );
}
