import { useState } from "react";
import SVGBookmark from "~/assets/SVGs/SVGBookmark";
import SVGCommunities from "~/assets/SVGs/SVGCommunities";
import SVGMyCHWNetworks from "~/assets/SVGs/SVGMyCHWNetworks";
import MyCHWNetworksGrid from "~/components/Grids/MyCHWNetworksGrid";
import MyCommunitiesGrid from "~/components/Grids/MyCommunitiesGrid";

import { classNames } from "~/utilities/main";
import SavedPostsFeed from "../Feed/SavedPostsFeed";
import { APP_CLASSNAMES } from "~/constants";

type iProfileTabsProps = {
  userId: number;
  viewerId: number | undefined;
};

const tabNavs = [
  {
    title: "My Communities",
    icon: <SVGCommunities />,
    active: true,
  },
  {
    title: "My CHW Networks",
    icon: <SVGMyCHWNetworks />,
    active: false,
  },
  {
    title: "Saved Posts",
    icon: <SVGBookmark />,
    active: false,
  },
];

const initTabNavs = (
  userId: iProfileTabsProps["userId"],
  viewerId: iProfileTabsProps["viewerId"],
): typeof tabNavs => {
  if (userId === viewerId) {
    return tabNavs;
  } else {
    return tabNavs.filter((tab) => tab.title !== "Saved Posts");
  }
};

export default function ProfileTabs({ userId, viewerId }: iProfileTabsProps) {
  const [userTabs, setUserTabs] = useState(initTabNavs(userId, viewerId));

  const renderTabContent = (): React.ReactNode => {
    switch (userTabs.find((tab) => tab.active)?.title) {
      case "My Communities":
        return <MyCommunitiesGrid userId={userId} />;
      case "My CHW Networks":
        return <MyCHWNetworksGrid userId={userId} />;
      case "Saved Posts":
        return (
          <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
            <div className={APP_CLASSNAMES.CONTAINER}>
              <SavedPostsFeed />
            </div>
          </div>
        );
      default:
        return <></>;
    }
  };

  const switchTab = (e: React.MouseEvent, index: number): void => {
    e.preventDefault();
    setUserTabs((prev) =>
      prev.map((tab, i) => {
        if (i === index) {
          return { ...tab, active: true };
        } else {
          return { ...tab, active: false };
        }
      }),
    );
  };

  return (
    <>
      <div className="w-full border-b border-solid border-b-[#C1BAB4] ">
        <ul className="flex gap-5 pl-5 max-sm:justify-between">
          {userTabs.map((tab, index) => (
            <li
              key={index}
              className={classNames(
                "relative cursor-pointer pb-[5px] text-center font-semibold transition-all duration-300 ease-in-out",
                "after:absolute after:bottom-0 after:left-0 after:h-1 after:w-full after:bg-[#625DA6] after:content-['']",
                "transition duration-300 ease-in-out",
                "hover:text-chw-dark-purple hover:after:bg-chw-yellow-100 hover:after:opacity-100",
                tab.active
                  ? "text-[#625da6]"
                  : "text-[#686867] after:opacity-0",
                "max-sm:w-full",
              )}
              onClick={(e) => switchTab(e, index)}
            >
              <div className="flex flex-col items-center gap-[5px]">
                <div
                  className={classNames("h-8 w-8", "max-xxs:h-10 max-xxs:w-10")}
                >
                  {tab.icon}
                </div>
                <h3
                  className={classNames(
                    "px-2.5",
                    tab.active ? "font-semibold text-[#032525]" : "",
                    "max-xxs:hidden",
                  )}
                >
                  {tab.title}
                </h3>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-5">{renderTabContent()}</div>
    </>
  );
}
