import * as build from "@remix-run/dev/server-build";
import { createRequestHandler } from "@netlify/remix-adapter";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
const handler = createRequestHandler({
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - can't override build due to Netlify's build process
  build,
  mode: process.env.NODE_ENV,
});

export default handler;
