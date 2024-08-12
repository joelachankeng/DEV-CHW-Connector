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

  const userId = JWTUser.user.ID;
  const frmSortBy = (formData.get("sortBy") as string).toUpperCase();
  const frmType = formData.get("type") as string;
  const frmTypeId = formData.get("typeId") as string;

  let sortBy = "DATE" as "DATE" | "POPULAR";
  if (frmSortBy === "DATE" || frmSortBy === "POPULAR") {
    sortBy = frmSortBy;
  }

  let type = "ALL" as "ALL" | "NETWORKS" | "COMMUNITIES";
  if (frmType === "NETWORKS" || frmType === "COMMUNITIES") {
    type = frmType;
  }

  let typeId = undefined;
  if (frmTypeId) {
    typeId = parseInt(frmTypeId);
  }

  console.log(frmType, type, sortBy, frmTypeId, typeId);

  const feed = typeId
    ? await Feed.API.Post.getAllPosts(
        userId.toString(),
        sortBy,
        type,
        typeId.toString(),
      )
    : await Feed.API.Post.getAllPosts(userId.toString(), sortBy, type);

  if (feed instanceof Error) {
    return json({ error: feed.message }, { status: 400 });
  }

  return json(feed);
}
