import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Message } from "~/controllers/message.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();
  const frmMessageId = formData.get("messageId") as string;

  const messageId = parseInt(frmMessageId);
  if (isNaN(messageId)) {
    return json({ error: "Invalid message ID" }, { status: 400 });
  }

  const message = await Message.API.getMessage(
    JWTUser.user.ID,
    messageId.toString(),
  );

  if (message instanceof Error) {
    return json({ error: message.message }, { status: 400 });
  }

  if (!message) {
    return json({ error: "Message not found" }, { status: 404 });
  }

  if (message.messageFields.receiverId.toString() !== JWTUser.user.ID) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await Message.API.readMessage(messageId.toString());

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json(result);
}
