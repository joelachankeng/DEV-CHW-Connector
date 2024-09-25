import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Feed } from "~/controllers/feed.control";
import { User } from "~/controllers/user.control";
import { UserPublic } from "~/controllers/user.control.public";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const user = await User.API.getUser(JWTUser.user.user_email, "EMAIL");

  if (!user) return json({ error: "USER_NOT_FOUND" }, { status: 404 });
  if (user instanceof Error)
    return json({ error: user.message }, { status: 400 });

  const formData = await request.formData();
  const commentId = formData.get("commentId") as string;

  const comment = await Feed.API.Comment.getComment(
    user.databaseId.toString(),
    commentId,
  );
  if (!comment) return json({ error: "COMMENT_NOT_FOUND" }, { status: 404 });
  if (comment instanceof Error)
    return json({ error: comment.message }, { status: 400 });

  const postId = comment.commentsField.postId;

  const post = await Feed.API.Post.getPost(
    user.databaseId.toString(),
    postId.toString(),
  );
  if (!post) return json({ error: "POST_NOT_FOUND" }, { status: 404 });
  if (post instanceof Error)
    return json({ error: post.message }, { status: 400 });

  if (!UserPublic.Utils.userCanDeletePost(user, post)) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const result = await Feed.API.Comment.deleteComment(commentId);
  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json(result);
}
