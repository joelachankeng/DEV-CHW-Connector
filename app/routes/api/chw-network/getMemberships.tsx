import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { CHWNetwork } from "~/controllers/CHWNetwork.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const frmUserId = formData.get("userId") as string;

  let userId: string | number = "";
  if (frmUserId) {
    userId = parseInt(frmUserId);
  } else {
    const JWTUser = await getJWTUserDataFromSession(request);
    if (!JWTUser) {
      return json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
    userId = JWTUser.user.ID;
  }

  if (!userId) {
    return json({ error: "User ID not found" }, { status: 400 });
  }

  const result = await CHWNetwork.API.getAllByMembership(userId.toString());

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json(result);
}
