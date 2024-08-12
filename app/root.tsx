import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import tailwindStylesheetUrl from "./styles/tailwind.css";
import reactToolTipStylesheetUrl from "./styles/react-tooltip.css";
import globalStylesheetUrl from "./styles/global.css";
import editorBlockStylesheetUrl from "./styles/editor-block.css";
import ReactCircularProgressbarStylesheetUrl from "react-circular-progressbar/dist/styles.css";
import slickJSCssUrl from "slick-carousel/slick/slick.css";
import slickJSThemeCssUrl from "slick-carousel/slick/slick-theme.css";
import type { iAppContext } from "./models/appContext.model";
import UploadManager from "./components/Managers/UploadManager";
import { useEffect, useState } from "react";
import NotificationManager from "./components/Managers/Notification/NotificationManager";
import {
  clearUserSession,
  getUserSessionToken,
} from "./servers/userSession.server";
import { User } from "./controllers/user.control";
import { AppContext, defaultAppContext } from "./contexts/appContext";

export const meta: MetaFunction = () => {
  return [
    { title: "CHW Connector | A platform for community health workers" },
    { name: "msapplication-tileColor", content: "#da532c" },
    { name: "theme-color", content: "#ffffff" },

    {
      property: "og:title",
      content: "CHW Connector | A platform for community health workers",
    },
    {
      name: "description",
      content:
        "CHW Connector is a platform for community health workers to connect, share, and learn from one another.",
    },
  ];
};

export const links: LinksFunction = () => {
  return [
    { rel: "icon", href: "favicon.ico" },
    { rel: "apple-touch-icon", href: "/assets/apple-touch-icon.png" },
    { rel: "icon", href: "/assets/favicon-32x32.png" },
    { rel: "icon", href: "/assets/favicon-16x16.png" },
    { rel: "icon", href: "/assets/android-chrome-192x192.png" },
    { rel: "icon", href: "/assets/android-chrome-512x512.png" },
    { rel: "mask-icon", href: "/assets/safari-pinned-tab.svg" },
    { rel: "manifest", href: "/site.webmanifest" },
    { rel: "stylesheet", href: tailwindStylesheetUrl },
    { rel: "stylesheet", href: reactToolTipStylesheetUrl },
    { rel: "stylesheet", href: editorBlockStylesheetUrl },
    { rel: "stylesheet", href: globalStylesheetUrl },
    { rel: "stylesheet", href: ReactCircularProgressbarStylesheetUrl },
    { rel: "stylesheet", href: slickJSCssUrl },
    { rel: "stylesheet", href: slickJSThemeCssUrl },

    {
      rel: "preconnect",
      href: "https://fonts.googleapis.com",
    },
    {
      rel: "preconnect",
      href: "https://fonts.gstatic.com",
      crossOrigin: "anonymous",
    },
    {
      rel: "stylesheet",
      href: "https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap",
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const appContext: iAppContext = defaultAppContext;
  const userToken = await getUserSessionToken(request);

  if (userToken && userToken) {
    const userData = await User.API.validateToken(userToken);
    if (!userData) return await clearUserSession(request);

    const user = await User.API.getUser(userData.user.user_email, "EMAIL");

    if (!user) return await clearUserSession(request);
    if (user instanceof Error) return await clearUserSession(request);

    appContext.User = user;
  } else {
    if (appContext.User !== undefined) {
      /***
       * Added this because Remix is storing the logged in User object
       * in the defaultAppContext.User
       * even though it is it's own object.
       */
      appContext.User = undefined;
    }
  }

  return json({ appContext });
}

export default function App() {
  const { appContext } = useLoaderData() as { appContext: iAppContext };

  const [appContextState, setAppContextState] = useState(appContext);

  useEffect(() => {
    if (!appContextState.User && appContextState.User !== appContext.User) {
      setAppContextState(appContext);
    }
  }, [appContext.User]);

  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="h-full">
        <AppContext.Provider
          value={{
            appContext: appContextState,
            setAppContext: (appContext: iAppContext, fullReplace?: boolean) => {
              if (fullReplace) {
                setAppContextState(appContext);
              } else {
                setAppContextState((prev) => {
                  return {
                    ...prev,
                    ...appContext,
                  };
                });
              }
            },
          }}
        >
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
          <NotificationManager />
          <UploadManager />
          <div id="portal"></div>
        </AppContext.Provider>
      </body>
    </html>
  );
}
