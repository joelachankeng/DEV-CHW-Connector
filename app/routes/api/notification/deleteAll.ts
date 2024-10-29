import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NotificationControl } from "~/controllers/notification.control";
import type { iGenericSuccess } from "~/models/appContext.model";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const result = await NotificationControl.API.deleteAll(JWTUser.user.ID);
  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json<iGenericSuccess>({ success: "Notification deleted" });
}
