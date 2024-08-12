import { config } from "@netlify/remix-adapter";
import { flatRoutes } from "remix-flat-routes";
import { createRoutesFromFolders } from "@remix-run/v1-route-convention";

/** @type {import('@remix-run/dev').AppConfig} */
export default {
  ...(process.env.NODE_ENV === "production" ? config : undefined),
  // This works out of the box with the Netlify adapter, but you can
  // add your own custom config here if you want to.
  //
  // See https://remix.run/file-conventions/remix-config
  ignoredRouteFiles: ["**/.*", "**/*.css", "**/*.test.{js,jsx,ts,tsx}"],
  routes(defineRoutes) {
    return createRoutesFromFolders(defineRoutes, {
      ignoredFilePatterns: ["**/.*", "**/*.css"],
    });
  },
  // routes: async (defineRoutes) => {
  //   return flatRoutes("routes", defineRoutes);
  // },
  serverDependenciesToBundle: [
    /^remix-utils.*/,
    /^@kunukn\/react-collapse.*/,
    /^react-use.*/,
  ],
  browserNodeBuiltinsPolyfill: {
    modules: { fs: true, buffer: true, crypto: true },
  },
};
