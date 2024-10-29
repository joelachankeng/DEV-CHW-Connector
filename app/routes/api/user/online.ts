import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { User } from "~/controllers/user.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function loader({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const result = await User.API.getLastOnline(JWTUser.user.ID.toString());
  if (result instanceof Error || result === null) {
    return json({ error: "Unable to get last online" }, { status: 400 });
  }

  return json(result);
}

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();
  const onlineDate = formData.get("onlineDate") as string;

  const result = await User.API.setLastOnline(
    JWTUser.user.ID.toString(),
    onlineDate,
  );
  if (result instanceof Error || result === null) {
    return json({ error: "Unable to set last online" }, { status: 400 });
  }

  return json(result);
}
