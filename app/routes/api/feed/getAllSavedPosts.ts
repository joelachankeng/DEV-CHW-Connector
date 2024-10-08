import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Feed } from "~/controllers/feed.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  // const formData = await request.formData();
  const userId = JWTUser.user.ID;

  const feed = await Feed.API.Post.getAllSavedPosts(userId.toString());

  if (feed instanceof Error) {
    return json({ error: feed.message }, { status: 400 });
  }

  return json(feed);
}
