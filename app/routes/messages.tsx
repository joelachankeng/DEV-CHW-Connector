import { json, type LoaderFunction } from "@remix-run/node";
import Page from "~/components/Pages/Page";
import LeftSideBar from "app/components/SideBars/LeftSideBar";
import { requireUserSession } from "~/servers/userSession.server";
import { APP_CLASSNAMES } from "~/constants";
import SVGComposeMessage from "~/assets/SVGs/SVGComposeMessage";
import { Tooltip } from "react-tooltip";
import { ListBoxField } from "~/components/Forms/ListBoxField";
import _ from "lodash";
import { useState } from "react";
import type { iGenericError } from "~/models/appContext.model";

const sortByOptions = ["Recent", "Read", "Unread"];
const sortByOptionsMap = sortByOptions.map((option) => ({
  label: _.startCase(option),
  value: option.toLowerCase(),
}));

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);

  return json({});
};
export default function Messages() {
  const [sortBy, setSortBy] =
    useState<(typeof sortByOptions)[number]>("recent");
  const [sortError, setSortError] = useState<iGenericError | undefined>(
    undefined,
  );

  const handleOnChangeSortBy = (value: string) => {
    if (value === sortBy) return;

    setSortError(undefined);
    setSortBy(value as (typeof sortByOptions)[number]);
  };

  return (
    <>
      <Page>
        <LeftSideBar
          name={"Messages Sidebar"}
          borderBottom={false}
          title={
            <div className="flex items-center justify-between gap-2">
              <h1>Messages</h1>
              <Tooltip id={`tooltip-message-compose`} />
              <button
                data-tooltip-id={`tooltip-message-compose`}
                data-tooltip-content={`New Message`}
                data-tooltip-place="top"
                className="h-8 w-8"
                onClick={() => {}}
              >
                <SVGComposeMessage />
              </button>
            </div>
          }
          search={{
            placeholder: "Search Messages",
            onChange: () => {},
          }}
        >
          {({ sidebarOpen, toolTipId }) => (
            <div className="">
              <div className="flex items-center justify-between gap-2.5 border-b border-solid border-b-[#C1BAB4] pb-1 text-base font-semibold text-[#686867] ">
                <h1 className="">Activity</h1>
                <div className="flex items-center gap-[15px]">
                  <ListBoxField
                    classes={{
                      parent: {
                        className: "flex items-center gap-[15px]",
                        override: true,
                      },
                      label: {
                        className: "",
                        override: true,
                      },
                      select: {
                        className: "text-[#032525] font-semibold",
                      },
                    }}
                    label="Sort By:"
                    name="activity-sort-by"
                    defaultValue={sortBy}
                    options={sortByOptionsMap}
                    // onChange={(value) => setSortBy(value)}
                    onChange={(value) => handleOnChangeSortBy(value)}
                    position="right"
                  />
                </div>
              </div>
              <div className=""></div>
            </div>
          )}
        </LeftSideBar>
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div className={APP_CLASSNAMES.CONTAINER}></div>
        </div>
      </Page>
    </>
  );
}
