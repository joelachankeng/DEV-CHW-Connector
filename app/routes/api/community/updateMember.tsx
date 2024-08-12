import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Community } from "~/controllers/community.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();

  const userId = JWTUser.user.ID;

  const communityId = formData.get("communityId") as string;
  const frmAction = formData.get("action") as string;

  let action = "ADD" as "ADD" | "REMOVE";
  if (frmAction === "ADD" || frmAction === "REMOVE") {
    action = frmAction;
  }

  const result =
    action === "ADD"
      ? await Community.API.follow(userId.toString(), communityId)
      : await Community.API.unFollow(userId.toString(), communityId);

  if (result instanceof Error) {
    return json(
      {
        id: communityId,
        error: result.message,
      },
      { status: 400 },
    );
  }

  return json({ id: communityId, result });
}
