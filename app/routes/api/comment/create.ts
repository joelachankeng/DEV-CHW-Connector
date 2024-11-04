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
  const frmParentId = formData.get("parentId") as string;
  const comment = formData.get("comment") as string;

  const parentId: string | null = parseInt(frmParentId)
    ? parseInt(frmParentId).toString()
    : "0";

  const result = await Feed.API.Comment.createPostComment(
    userId.toString(),
    postId,
    parentId,
    comment,
  );

  if (result instanceof Error || !result.comment) {
    return json({ error: result.message }, { status: 400 });
  }

  await NotificationControl.API.Automations.send(
    request,
    result.comment.databaseId.toString() || "",
    "comment",
  );

  return json(result);
}
