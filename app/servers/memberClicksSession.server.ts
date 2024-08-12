import {
  createCookie,
  createCookieSessionStorage,
  json,
  redirect,
} from "@remix-run/node";
import invariant from "tiny-invariant";
import { MemberClicks } from "~/controllers/memberClicks.control";
import { APP_ROUTES } from "~/constants";

invariant(process.env.SESSION_SECRET, "SESSION_SECRET must be set");

const memberClicksCookie = createCookie("__MCsession", {
  secrets: [process.env.SESSION_SECRET!],
  maxAge: 36000,
  sameSite: "lax", // this helps with CSRF
  path: APP_ROUTES.HOME, // remember to add this so the cookie will work in all routes
  httpOnly: true, // for security reasons, make this cookie http only
  secure:
    process.env.NODE_ENV === "production" &&
    process.env.ARC_ENV === "production", // enable this in prod only
});

export const memberClicksSessionStorage = createCookieSessionStorage({
  cookie: memberClicksCookie,
});

export async function getMemberClicksSession(request: Request) {
  const cookie = request.headers.get("Cookie");
  return memberClicksSessionStorage.getSession(cookie);
}

export async function getMemberClicksSessionToken(
  request: Request,
): Promise<any> {
  const session = await getMemberClicksSession(request);
  return session.get("accessToken");
}

export async function setMemberClicksSession(
  request: Request,
  accessToken: string,
  redirectTo?: string,
  jsonData?: {},
) {
  const session = await getMemberClicksSession(request);
  session.set("accessToken", accessToken);
  const newCookie = await memberClicksSessionStorage.commitSession(session);

  if (redirectTo) {
    return redirect(redirectTo, { headers: { "Set-Cookie": newCookie } });
  }
  return json(jsonData || { ok: true }, {
    headers: { "Set-Cookie": newCookie },
  });
}

export async function requireMemberClicks(request: Request) {
  const session = await getMemberClicksSession(request);
  const accessToken = session.get("accessToken");
  if (accessToken && (await authenticateMemberClicks(accessToken)))
    return accessToken;

  const token = await MemberClicks.getMemberClickClientCredentials();
  if (token) {
    throw await setMemberClicksSession(request, token, request.url);
  }

  return undefined;
}

export async function authenticateMemberClicks(
  token: string,
): Promise<boolean> {
  if (!token) return false;
  const result = await MemberClicks.getAllProfiles(token, 1, 1);
  if ("error" in result) {
    return false;
  }
  if (result.count === 1) return true;
  return false;
}
