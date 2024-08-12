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
  const frmAction = formData.get("action") as string;

  let action = "SAVE" as "SAVE" | "UNSAVE";
  if (frmAction === "SAVE" || frmAction === "UNSAVE") {
    action = frmAction;
  }

  const result =
    action === "UNSAVE"
      ? await Feed.API.Post.unSavePost(userId.toString(), postId)
      : await Feed.API.Post.savePost(userId.toString(), postId);

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json(result);
}
