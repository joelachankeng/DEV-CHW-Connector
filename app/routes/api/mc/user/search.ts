import type { ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { MemberClicks } from "~/controllers/memberClicks.control";
import type { iMemberClicksProfileAttributes } from "~/models/memberClicks.model";
import { getMemberClicksSessionToken } from "~/servers/memberClicksSession.server";

// DONT NEED TO BE LOGGED IN
export async function action({ request }: ActionFunctionArgs) {
  const mcToken = await getMemberClicksSessionToken(request);

  if (!mcToken) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();

  const jsonData: { [key: string]: string | number } = {};
  for (const [key, value] of formData.entries()) {
    if (!(typeof value === "string") && !(typeof value === "number")) continue;
    jsonData[key as string] = value;
  }

  const result = await MemberClicks.profileSearch(mcToken, jsonData);
  if ("error" in result) {
    return json({ ...result }, { status: 400 });
  }

  const searchId = result.id;
  const profiles = await MemberClicks.getSearchResults(mcToken, searchId, 1, 1);
  if ("error" in profiles) {
    return json({ profiles }, { status: 400 });
  }

  const publicProfiles = profiles.profiles.map((profile) =>
    MemberClicks.publicizeMemberClicksProfileResult(
      profile as iMemberClicksProfileAttributes,
    ),
  );

  profiles.profiles = publicProfiles as typeof profiles.profiles;
  return json(profiles);
}
