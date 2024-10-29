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

  const formData = await request.formData();
  const id = formData.get("id") as string | null;

  if (!id) return json({ error: "Missing required fields" }, { status: 400 });
  if (isNaN(parseInt(id)))
    return json({ error: "Invalid notification ID" }, { status: 400 });

  const notification = await NotificationControl.API.get(parseInt(id));
  if (notification instanceof Error) {
    return json({ error: notification.message }, { status: 400 });
  }

  if (notification.user_id.toString() !== JWTUser.user.ID.toString())
    return json({ error: "UNAUTHORIZED" }, { status: 401 });

  const result = await NotificationControl.API.markAsRead(id);

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json<iGenericSuccess>({ success: "Notification marked as read" });
}
