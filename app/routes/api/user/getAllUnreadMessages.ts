import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { User } from "~/controllers/user.control";
import type { iWP_Message } from "~/models/message.model";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // const formData = await request.formData();

  const result = await User.API.getAllUnreadMessages(
    JWTUser.user.ID.toString(),
  );

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  if (result === null || result === undefined) {
    return json({ error: "Unable to get unread messages" }, { status: 400 });
  }

  return json<iWP_Message[]>(result);
}
