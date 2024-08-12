import {
  redirect,
  type ActionFunction,
  type LoaderFunction,
} from "@remix-run/node";
import { APP_ROUTES } from "~/constants";
import { User } from "~/controllers/user.control";
import {
  clearUserSession,
  getUserSessionToken,
} from "~/servers/userSession.server";

const login = async (request: Request): Promise<Response> => {
  const userToken = await getUserSessionToken(request);

  if (userToken && userToken) {
    const userData = await User.API.validateToken(userToken);
    if (!userData) return await clearUserSession(request);

    const user = await User.API.getUser(userData.user.user_email, "EMAIL");

    if (!user) return await clearUserSession(request);
    if (user instanceof Error) return await clearUserSession(request);
  } else {
    return await clearUserSession(request);
  }
  return redirect(APP_ROUTES.FEED);
};

export const loader: LoaderFunction = async ({ request }) => login(request);
export const action: ActionFunction = async ({ request }) => login(request);
