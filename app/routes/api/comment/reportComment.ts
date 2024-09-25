import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Feed } from "~/controllers/feed.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();

  const userId = JWTUser.user.ID;

  const postId = formData.get("commentId") as string;
  const frmAction = formData.get("action") as string;

  let action = "REPORT" as "REPORT" | "UNREPORT";
  if (frmAction === "REPORT" || frmAction === "UNREPORT") {
    action = frmAction;
  }

  const result =
    action === "UNREPORT"
      ? await Feed.API.Comment.unReportComment(userId.toString(), postId)
      : await Feed.API.Comment.reportComment(userId.toString(), postId);

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json(result);
}
