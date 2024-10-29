import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { NotificationControl } from "~/controllers/notification.control";
import type { iWP_Notification_Pagination } from "~/models/notifications.model";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();
  const frmOffset = formData.get("offset") as string | null;
  const frmLimit = formData.get("limit") as string | null;

  const { offset, limit } = NotificationControl.Utils.createPagination(
    frmOffset,
    frmLimit,
  );

  const result = await NotificationControl.API.getByUser(
    parseInt(JWTUser.user.ID.toString()),
    offset,
    limit,
  );

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  if (result === null || result === undefined) {
    return json({ error: "Unable to get all notifications" }, { status: 400 });
  }

  return json<iWP_Notification_Pagination>(result);
}
