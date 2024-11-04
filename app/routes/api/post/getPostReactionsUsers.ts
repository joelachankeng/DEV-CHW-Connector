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
  const postId = formData.get("postId") as string;
  const emojiId = formData.get("emojiId") as string;
  const _offset = formData.get("offset") as string;

  if (!postId || !emojiId || !_offset) {
    return json({ error: "MISSING_PARAMETERS" }, { status: 400 });
  }

  const offset = parseInt(_offset);

  if (isNaN(offset)) {
    return json({ error: "INVALID_OFFSET" }, { status: 400 });
  }

  const result = await Feed.API.Post.getPostReactionsUsers(
    postId,
    emojiId,
    offset,
  );

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json(result);
}
