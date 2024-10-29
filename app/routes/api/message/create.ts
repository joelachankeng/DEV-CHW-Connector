import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Message } from "~/controllers/message.control";
import { NotificationControl } from "~/controllers/notification.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();

  const userId = JWTUser.user.ID;

  const frmReceiver = formData.get("receiver") as string;
  const message = formData.get("message") as string;

  const receiver = parseInt(frmReceiver);
  if (isNaN(receiver)) {
    return json({ error: "Invalid receiver ID" }, { status: 400 });
  }

  const result = await Message.API.createMessage(
    userId.toString(),
    receiver.toString(),
    message,
  );

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  await NotificationControl.API.Automations.send(
    request,
    result.messagePost?.databaseId.toString() || "",
    "message",
  );

  return json(result);
}
