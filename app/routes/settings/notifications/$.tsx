import { SettingsNotificationsLink } from "./index";
import { Link, useLocation } from "@remix-run/react";
import _, { set } from "lodash";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { NotificationSettingsForm } from "~/components/Settings/Notifications/NotificationSettingsForm";
import type { ActionFunctionArgs } from "@remix-run/node";
import {
  type iNotificationSettings,
  type iNotificationSettings_Subcategory,
} from "~/models/notifications.model";
import { useContext, useEffect, useState } from "react";
import { User } from "~/controllers/user.control";
import { AppContext } from "~/contexts/appContext";
import { ErrorComponent } from "~/components/Pages/ErrorPage";

type iCurrentSettings_DataType =
  | {
      list: iNotificationSettings[keyof iNotificationSettings];
    }
  | {
      settings: iNotificationSettings_Subcategory;
      primaryCategory: keyof iNotificationSettings;
    };

type iCurrentSettings = {
  title: string;
  previousTo: string;
} & iCurrentSettings_DataType;

export const parseSettingsFromPathName = (
  pathName: string,
  notificationsSettings: iNotificationSettings,
): undefined | iCurrentSettings => {
  const primaryCategoryIndex = 3;
  const pathnames = pathName.toLowerCase().split("/");

  const primaryCategory = pathnames[primaryCategoryIndex];
  if (primaryCategory === undefined) return undefined;

  const findSettingKey = Object.keys(notificationsSettings).find(
    (category) => _.kebabCase(category) === primaryCategory,
  );

  if (findSettingKey === undefined) return undefined;

  const list =
    notificationsSettings[findSettingKey as keyof iNotificationSettings];
  if (list === undefined) return undefined;

  let settings: iCurrentSettings = {
    title: findSettingKey,
    list: list,
    previousTo: pathnames.slice(0, primaryCategoryIndex).join("/"),
  };

  const subCategory = pathnames[primaryCategoryIndex + 1];
  if (subCategory === undefined || subCategory === "") return settings;

  let subSettingKey: string | undefined = undefined;

  const findSubSettingKey = Object.keys(
    notificationsSettings[findSettingKey as keyof iNotificationSettings],
  ).find((category) => _.kebabCase(category) === subCategory);

  if (findSubSettingKey === undefined) return undefined;
  subSettingKey = findSubSettingKey;

  const subSettings = list[subSettingKey as keyof typeof list];
  if (subSettings === undefined) return undefined;

  settings = {
    title: findSubSettingKey,
    settings: subSettings as iNotificationSettings_Subcategory,
    primaryCategory: findSettingKey as keyof iNotificationSettings,
    previousTo: pathnames.slice(0, primaryCategoryIndex + 1).join("/"),
  };

  return settings;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const result = await User.Forms.executeUpdateNotificationsSettings(
    request,
    formData,
  );

  return result;
};

export default function SettingsNotificationsSettings() {
  const { User } = useContext(AppContext);
  const location = useLocation();

  const [currentSettings, setCurrentSettings] = useState<
    iCurrentSettings | undefined
  >(undefined);

  useEffect(() => {
    if (!User.user?.userFields.notificationSettings) return;
    const settings = parseSettingsFromPathName(
      location.pathname,
      User.user.userFields.notificationSettings,
    );
    if (_.isEqual(settings, currentSettings)) return;

    setCurrentSettings(settings);
  }, [User.user, currentSettings, location.pathname]);

  return (
    <>
      {currentSettings ? (
        <>
          <div className="flex items-center gap-2">
            <Link to={currentSettings.previousTo}>
              <ArrowLeftIcon className="h-5 w-5 text-[#686867] transition duration-300 ease-in-out hover:text-chw-light-purple" />
            </Link>
            <h2 className="text-xl font-bold text-chw-dark-green">
              {currentSettings.title}
            </h2>
          </div>
          {"settings" in currentSettings &&
            typeof currentSettings.settings.description === "string" && (
              <p className="mt-2 text-sm text-gray-700">
                {currentSettings.settings.description}
              </p>
            )}
          {"list" in currentSettings ? (
            <NotificationSettingsSubcategory list={currentSettings.list} />
          ) : (
            <NotificationSettingsForm settings={currentSettings.settings} />
          )}
        </>
      ) : (
        <ErrorComponent
          title={"Setting not found"}
          description={
            "The Setting you are looking for does not exist or has been deleted."
          }
          status={"404"}
          className="!min-h-0 !p-0"
        />
      )}
    </>
  );
}

const displayNotificationSettingsSubtitle = (
  types: iNotificationSettings_Subcategory,
): string => {
  const enabledTypes = Object.entries(types)
    .filter(([, value]) => value === true)
    .map(([key]) =>
      _.capitalize(key.toLowerCase().replace("notifications", "")),
    );
  // add and between the last two enabled types
  if (enabledTypes.length > 1) {
    const lastTwoEnabledTypes = enabledTypes.slice(-2);
    const newLastTwoEnabledTypes = lastTwoEnabledTypes.join(" and ");
    enabledTypes.splice(-2, 2, newLastTwoEnabledTypes);
  }

  return enabledTypes.join(", ");
};

function NotificationSettingsSubcategory({
  list,
}: {
  list: iNotificationSettings[keyof iNotificationSettings];
}) {
  return (
    <ul>
      {Object.entries(list).map(([key, value], index) => (
        <li key={key}>
          <SettingsNotificationsLink
            title={key}
            subtitle={displayNotificationSettingsSubtitle(value)}
            to={`${location.pathname}/${_.kebabCase(key)}`}
            className={
              index === Object.keys(list).length - 1 ? "!border-b-0" : ""
            }
          />
        </li>
      ))}
    </ul>
  );
}
