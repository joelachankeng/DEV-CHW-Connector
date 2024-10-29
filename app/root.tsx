import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  isRouteErrorResponse,
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
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
import MessagesManager from "./components/Managers/MessagesManager";
import _ from "lodash";
import { useEmojiMart } from "./utilities/hooks/useEmojiMart";
import { ErrorPage } from "./components/Pages/ErrorPage";
import { NotificationControl } from "./controllers/notification.control";
import NotificationUnreadManager from "./components/Managers/Notification/NotificationUnreadManager";
import OnlineManager from "./components/Managers/OnlineManager";

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
    { rel: "icon", href: "/favicon.ico" },
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

const head = (
  <head>
    {process.env.NODE_ENV !== "development" && (
      <>
        <script
          async
          src={`https://www.googletagmanager.com/gtag/js?id=G-SF1YS24HHS`}
        ></script>
        <script
          async
          src={`https://cdn.onesignal.com/sdks/OneSignalSDK.js`}
        ></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-SF1YS24HHS');
            `,
          }}
        ></script>
      </>
    )}
    <script
      dangerouslySetInnerHTML={{
        __html: `
          window.CHW = {
            Mobiloud: {
              isReady: false,
              nativeFunctions: undefined,
            },
          };

          // Check if the user agent matches the app's user agent
          const isApp = navigator.userAgent.toLowerCase().indexOf("canvas") > -1;

          // Add the event listener that will trigger once the native functions are ready to be used
          window.addEventListener(
            "message",
            (event) => {
              runNativeFunctions(event);
            },
            false,
          );

          // Run when the event listener is triggered
          function runNativeFunctions(event) {
            try {
              if (isApp) {
                if (event.data && event.data == "nativeFunctionsLoaded") {
                  window.CHW.Mobiloud = {
                    isReady: true,
                    nativeFunctions: window.nativeFunctions,
                  };
                }
              }
            } catch (ex) {
              console.error("Error in runNativeFunctions", ex);
            }
          }
        `,
      }}
    ></script>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <Meta />
    <Links />
  </head>
);

export async function loader({ request }: LoaderFunctionArgs) {
  const appContext: iAppContext = defaultAppContext;
  const userToken = await getUserSessionToken(request);

  if (userToken && userToken) {
    const userData = await User.API.validateToken(userToken);
    if (!userData) return await clearUserSession(request);

    const user = await User.API.getUser(userData.user.user_email, "EMAIL");

    if (!user) return await clearUserSession(request);
    if (user instanceof Error) return await clearUserSession(request);

    const messagesIds = await User.API.getAllUnreadMessagesIds(
      user.databaseId.toString(),
    );
    if (messagesIds && !(messagesIds instanceof Error)) {
      appContext.MessagesManager.unreadIds = messagesIds;
    }

    const notificationIds = await NotificationControl.API.getUnreadByUser(
      user.databaseId,
      0,
      100,
    );
    if (notificationIds && !(notificationIds instanceof Error)) {
      appContext.NotificationManager.unreadIds =
        notificationIds.notifications.map((n) => n.id);
    }

    appContext.User.user = user;
    appContext.UploadKeys.uploadKeys = User.Utils.getUploadKeys(userToken);
  } else {
    if (appContext.User !== undefined) {
      /***
       * Added this because Remix is storing the logged in User object
       * in the defaultAppContext.User
       * even though it is it's own object.
       */
      appContext.User.user = undefined;
    }
  }

  return json({ appContext });
}

export default function App() {
  const { appContext } = useLoaderData() as { appContext: iAppContext };
  const { EmojiMartMobile } = useEmojiMart();

  const [user, setUser] = useState(appContext.User.user);
  const [uploadKeys, setUploadKeys] = useState(
    appContext.UploadKeys.uploadKeys,
  );
  const [uploadManager, setUploadManager] = useState(
    appContext.UploadManager.uploadManager,
  );
  const [notificationManager, setNotificationManager] = useState(
    appContext.NotificationManager.notificationManager,
  );
  const [messagesManager, setMessagesManager] = useState(
    appContext.MessagesManager.unreadIds,
  );
  const [notificationUnreadManager, setNotificationUnreadManager] = useState(
    appContext.NotificationManager.unreadIds,
  );

  useEffect(() => {
    if (!_.isEqual(appContext.User.user, user)) {
      if (appContext.User.user) {
        setUploadKeys(appContext.UploadKeys.uploadKeys);
        setMessagesManager(appContext.MessagesManager.unreadIds);
        setNotificationUnreadManager(appContext.NotificationManager.unreadIds);

        // tag the user device with the user email on OneSignal
        if (window.CHW.Mobiloud.isReady) {
          window.CHW.Mobiloud.nativeFunctions?.onesignalSetExternalUserId(
            appContext.User.user.email,
          );
          window.CHW.Mobiloud.nativeFunctions?.onesignalSetEmail(
            appContext.User.user.email,
          );
        }
      } else {
        setUploadKeys(defaultAppContext.UploadKeys.uploadKeys);
        setMessagesManager([]);
        setNotificationManager([]);
        setNotificationUnreadManager([]);
      }
      setUser(appContext.User.user);
    }
  }, [appContext, user]);

  return (
    <html lang="en" className="h-full">
      {head}
      <body className="h-full">
        <AppContext.Provider
          value={{
            User: {
              user,
              set: setUser,
            },
            UploadKeys: {
              uploadKeys,
              set: setUploadKeys,
            },
            UploadManager: {
              uploadManager,
              set: setUploadManager,
            },
            NotificationManager: {
              notificationManager,
              unreadIds: notificationUnreadManager,
              setNotifications: setNotificationManager,
              addNotification: (notification) => {
                setNotificationManager((prev) => [...prev, notification]);
              },
              removeNotification: (notification) => {
                if (typeof notification === "number") {
                  setNotificationManager((prev) =>
                    prev.filter((_, index) => index !== notification),
                  );
                  return;
                } else {
                  setNotificationManager((prev) =>
                    prev.filter((n) => !_.isEqual(n, notification)),
                  );
                }
              },
              setUnreadIds: setNotificationUnreadManager,
              addUnreadId: (unreadId) => {
                setNotificationUnreadManager((prev) => [...prev, unreadId]);
              },
            },
            MessagesManager: {
              unreadIds: messagesManager,
              setUnreadIds: setMessagesManager,
              addUnreadId: (unreadId) => {
                setMessagesManager((prev) => [...prev, unreadId]);
              },
            },
          }}
        >
          <Outlet />
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
          <MessagesManager />
          <NotificationManager />
          <NotificationUnreadManager />
          <OnlineManager />
          <UploadManager />
          <div id="portal">
            <EmojiMartMobile />
          </div>
        </AppContext.Provider>
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();
  const [currentUrl, setCurrentUrl] = useState("Unable to get current URL");

  useEffect(() => {
    setCurrentUrl(window.location.href);
  }, []);

  const getTitle = (): string => {
    if (isRouteErrorResponse(error)) {
      if (error.status == 404) {
        return "";
      }
      return error.status.toString();
    }
    if (error instanceof Error) {
      return "Application Error";
    }

    return "An unknown error occurred.";
  };

  const getDescription = (): string => {
    if (isRouteErrorResponse(error)) {
      if (error.status == 404) {
        return "";
      }
      return error.statusText;
    }
    if (error instanceof Error) {
      return error.stack || error.message;
    }

    return "An unknown error occurred.";
  };

  return (
    <html lang="en" className="h-full">
      {head}
      <body className="h-full">
        <ErrorPage
          title={getTitle()}
          description={
            !(error instanceof Error) ? (
              getDescription()
            ) : (
              <>
                <div className="mt-8 flex flex-col gap-2">
                  <p>
                    An unexpected error occurred.
                    <br />
                    Please screenshot the{" "}
                    <b className="uppercase">entire page</b> and send it to the
                    support team.
                  </p>
                  <p>
                    Current URL: <b>{currentUrl}</b>
                  </p>
                  <pre className="bg-[#bf5540] bg-opacity-10 p-8 text-left text-red-600">
                    {error.stack || error.message}
                  </pre>
                </div>
              </>
            )
          }
          status={isRouteErrorResponse(error) ? error.status.toString() : "500"}
        />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
