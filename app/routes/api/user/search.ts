import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import type { iGraphQLPageInfo } from "~/controllers/graphql.control";
import {
  createGraphQLPagination,
  GRAPHQL_CONSTANTS,
} from "~/controllers/graphql.control";
import { User, type iPublicUser } from "~/controllers/user.control";
import { getJWTUserDataFromSession } from "~/servers/userSession.server";

export type iPublicUsers_Pagination = {
  nodes: iPublicUser[];
} & iGraphQLPageInfo;

export async function action({ request }: ActionFunctionArgs) {
  const JWTUser = await getJWTUserDataFromSession(request);
  if (!JWTUser) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();

  const userId = JWTUser.user.ID;
  const search = formData.get("search") as string;
  const after = formData.get("after") as string;

  const defaultUsers: iPublicUsers_Pagination = {
    nodes: [],
    pageInfo: {
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: "",
      endCursor: "",
      total: 0,
    },
  };

  if (!search) {
    return json(defaultUsers);
  }

  let pagination = createGraphQLPagination();
  if (after) {
    pagination = createGraphQLPagination({
      first: GRAPHQL_CONSTANTS.PAGINATION.MAX_ROWS,
      after,
    });
  }

  const users = await User.API.searchUsers(
    search,
    userId,

    pagination,
  );

  if (users instanceof Error) {
    return json({ error: users.message }, { status: 400 });
  }

  if (!users) {
    return json(defaultUsers);
  }

  return json<iPublicUsers_Pagination>({
    nodes: users.nodes.map((user) => User.Utils.removeSensitiveUserData(user)),
    pageInfo: users.pageInfo,
  });
}
