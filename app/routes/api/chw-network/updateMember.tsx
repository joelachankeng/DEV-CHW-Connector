import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { CHWNetwork } from "~/controllers/CHWNetwork.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();

  const userId = JWTUser.user.ID;

  const networkId = formData.get("networkId") as string;
  const frmAction = formData.get("action") as string;

  let action = "ADD" as "ADD" | "REMOVE";
  if (frmAction === "ADD" || frmAction === "REMOVE") {
    action = frmAction;
  }

  const result =
    action === "ADD"
      ? await CHWNetwork.API.follow(userId.toString(), networkId)
      : await CHWNetwork.API.unFollow(userId.toString(), networkId);

  if (result instanceof Error) {
    return json({ id: networkId, error: result.message }, { status: 400 });
  }

  return json({ id: networkId, result });
}
