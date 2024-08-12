import { ActionFunctionArgs, json } from "@remix-run/node";
import { User } from "~/controllers/user.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();

  const userId = JWTUser.user.ID;

  const email = formData.get("email") as string;
  if (!email) {
    return json({ error: "Email is required" }, { status: 400 });
  }

  if (email === JWTUser.user.user_email) {
    return json(
      { error: "Email is the same as the current email" },
      { status: 400 },
    );
  }

  const result = await User.Methods.emailChangeConfirmation(
    request,
    JWTUser.user.user_email,
    true,
  );

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json({ success: "Email confirmation sent" });
}
