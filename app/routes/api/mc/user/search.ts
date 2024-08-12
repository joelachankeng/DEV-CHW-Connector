import { ActionFunctionArgs, HeadersFunction, json } from "@remix-run/node";
import { MemberClicks } from "~/controllers/memberClicks.control";
import { getMemberClicksSessionToken } from "~/servers/memberClicksSession.server";
import { cors } from "remix-utils/cors";

// DONT NEED TO BE LOGGED IN
export async function action({ request }: ActionFunctionArgs) {
  // await restrictRequest(request);

  const mcToken = await getMemberClicksSessionToken(request);

  if (!mcToken) {
    return json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const formData = await request.formData();

  let jsonData: { [key: string]: any } = {};
  for (const [key, value] of formData.entries()) {
    jsonData[key] = value;
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

  return json(profiles);
}

// TODO: RESTRICT ALL REQUESTS TO SAME ORIGIN
async function restrictRequest(request: Request) {
  const origin = request.headers.get("Origin");
  const host = request.headers.get("Host");
  let response = json(host);
  return await cors(request, response, {
    origin: ["www.nachw.org"],
  });
  return json({ host });
}
