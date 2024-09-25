import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { iWP_Comments_Pagination } from "~/controllers/feed.control";
import { Feed } from "~/controllers/feed.control";
import {
  createGraphQLPagination,
  GRAPHQL_CONSTANTS,
} from "~/controllers/graphql.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

const fetchComments = async (
  userId: string,
  postID: string,
  parentId?: string,
  after?: string,
): Promise<iWP_Comments_Pagination | Error | null> => {
  let pagination = createGraphQLPagination();
  if (after) {
    pagination = createGraphQLPagination({
      first: GRAPHQL_CONSTANTS.PAGINATION.MAX_ROWS,
      after,
    });
  }

  const result = await Feed.API.Comment.getPostComments(
    userId,
    postID.toString(),
    parentId,
    pagination,
  );

  return result;
};

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();
  const postID = formData.get("postId") as string;
  const parentId = formData.get("parentId") as string;
  let after = formData.get("after") as string;
  const getCursor = formData.get("getCursor") as string;

  if (!postID) {
    return json({ error: "Missing required fields" }, { status: 400 });
  }

  if (getCursor && getCursor.toLowerCase() === "true") {
    // firstComments in postFields does not have pageInfo so we need to fetch comments
    // to get the cursor in order to paginate
    const result = await fetchComments(
      JWTUser.user.ID.toString(),
      postID.toString(),
      parentId,
      after,
    );
    if (result instanceof Error) {
      return json({ error: result.message }, { status: 400 });
    }
    if (!result) {
      return json({ error: "No comments found" }, { status: 400 });
    }
    after = result.pageInfo.endCursor;
  }

  const result = await fetchComments(
    JWTUser.user.ID.toString(),
    postID.toString(),
    parentId,
    after,
  );
  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json(result);
}
