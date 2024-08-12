import type { Session, SessionData } from "@remix-run/node";
import {
  createCookie,
  createCookieSessionStorage,
  json,
  redirect,
} from "@remix-run/node";
import invariant from "tiny-invariant";
import { APP_ROUTES } from "~/constants";
import { User } from "~/controllers/user.control";
import type { iSimpleJWTValidation } from "~/models/wpJWT.model";
import { decryptForWP, encryptForWP } from "~/utilities/main";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

const userSessionCookie = createCookie("__session", {
  secrets: [process.env.SESSION_SECRET!],
  maxAge: 36000,
  sameSite: "lax", // this helps with CSRF
  path: APP_ROUTES.HOME, // remember to add this so the cookie will work in all routes
  httpOnly: true, // for security reasons, make this cookie http only
  secure: process.env.NODE_ENV === "production", // enable this in prod only
});

export const userSessionSessionStorage = createCookieSessionStorage({
  cookie: userSessionCookie,
});

export async function getSession(
  request: Request,
): Promise<Session<SessionData, SessionData>> {
  const cookie = request.headers.get("Cookie");
  return await userSessionSessionStorage.getSession(cookie);
}

export async function getSessionUser(
  request: Request,
): Promise<Session<SessionData, SessionData>> {
  const session = await getSession(request);
  return session.get("user");
}

export async function setUserSession(
  request: Request,
  user: string,
  redirectTo?: string,
  jsonData?: object,
): Promise<Response> {
  const session = await getSession(request);

  session.set("user", encryptUserSession(user));
  const newCookie = await userSessionSessionStorage.commitSession(session);

  if (redirectTo) {
    return redirect(redirectTo, { headers: { "Set-Cookie": newCookie } });
  }
  return json(jsonData || { ok: true }, {
    headers: { "Set-Cookie": newCookie },
  });
}

export async function requireUserSession(request: Request): Promise<string> {
  const userToken = await getUserSessionToken(request);
  if (userToken) {
    return userToken;
  }

  throw redirect(APP_ROUTES.LOGIN);
}

export async function getUserSessionToken(
  request: Request,
): Promise<string | undefined> {
  const session = await getSession(request);
  return decryptUserSession(session.get("user"));
}

export async function clearUserSession(request: Request): Promise<Response> {
  const session = await getSession(request);
  const userToken = await getUserSessionToken(request);
  if (userToken) {
    await User.API.revokeToken(userToken);
  }

  session.set("user", undefined);
  const newCookie = await userSessionSessionStorage.commitSession(session);
  return redirect(APP_ROUTES.LOGIN, { headers: { "Set-Cookie": newCookie } });
}

export async function getJWTUserDataFromSession(
  request: Request,
): Promise<iSimpleJWTValidation["data"] | undefined> {
  const userToken = await getUserSessionToken(request);
  if (userToken) {
    const userData = await User.API.validateToken(userToken);
    return userData;
  }
}

export const encryptUserSession = (user: string): string => {
  return encryptForWP(
    user,
    process.env.SESSION_SECRET!,
    process.env.SESSION_AES_IV!,
  );
};

export const decryptUserSession = (user?: string): string => {
  if (!user) return "";
  return decryptForWP(
    user,
    process.env.SESSION_SECRET!,
    process.env.SESSION_AES_IV!,
  );
};
