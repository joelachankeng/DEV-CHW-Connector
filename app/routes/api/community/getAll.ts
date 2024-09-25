import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Community } from "~/controllers/community.control";
import {
  createGraphQLPagination,
  GRAPHQL_CONSTANTS,
} from "~/controllers/graphql.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();
  const after = formData.get("after") as string;

  const userId = JWTUser.user.ID;

  let pagination = createGraphQLPagination();
  if (after) {
    pagination = createGraphQLPagination({
      first: GRAPHQL_CONSTANTS.PAGINATION.MAX_ROWS,
      after,
    });
  }

  const result = await Community.API.getAll(userId.toString(), pagination);

  if (result instanceof Error) {
    return json({ error: result.message }, { status: 400 });
  }

  return json(result);
}
