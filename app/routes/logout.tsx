import type { ActionFunction, LoaderFunction } from "@remix-run/node";
import { clearUserSession } from "~/servers/userSession.server";

const logout = async (request: Request): Promise<Response> => {
  return await clearUserSession(request);
};

export const loader: LoaderFunction = async ({ request }) => logout(request);
export const action: ActionFunction = async ({ request }) => logout(request);
