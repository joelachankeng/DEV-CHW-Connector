import { ActionFunctionArgs, json } from "@remix-run/node";
import { Feed } from "~/controllers/feed.control";
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
      : await Feed.API.Post.reactPost(userId, postId, emojiId);

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }
  return json(result);
}
