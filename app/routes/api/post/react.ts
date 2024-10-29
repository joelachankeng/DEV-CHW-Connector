import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Feed } from "~/controllers/feed.control";
import { NotificationControl } from "~/controllers/notification.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();

  const userId = JWTUser.user.ID;
  const postId = formData.get("postId") as string;
  const frmAction = (formData.get("action") as string).toUpperCase();
  const emojiId = formData.get("emojiId") as string;
  const emojiIcon = formData.get("emojiIcon") as string;

  if (!postId || !frmAction || !emojiId) {
    return json({ error: "MISSING_PARAMETERS" }, { status: 400 });
  }

  let action = "UPDATE" as "UPDATE" | "REMOVE";
  if (frmAction === "UPDATE" || frmAction === "REMOVE") {
    action = frmAction;
  }

  const result =
    action === "REMOVE"
      ? await Feed.API.Post.unReactPost(userId, postId)
      : await Feed.API.Post.reactPost(userId, postId, emojiId, emojiIcon);

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  if (action === "UPDATE") {
    await NotificationControl.API.Automations.send(request, postId, "reaction");
  }

  return json(result);
}
