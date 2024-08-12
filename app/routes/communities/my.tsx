import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useOutletContext } from "@remix-run/react";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import { requireUserSession } from "~/servers/userSession.server";
import type { iWP_Community } from "~/models/community.model";
import { APP_CLASSNAMES } from "~/constants";
import type { iCommunitiesContextState } from "../communities";
import { classNames } from "~/utilities/main";
import FullWidthContainer from "~/components/Containers/FullWidthContainer";
import MyCommunitiesGrid from "~/components/Grids/MyCommunitiesGrid";
import { useState } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);

  return json({});
};
export default function CommunitiesMy() {
  const { layoutContext } = useOutletContext<iCommunitiesContextState>();
  const [communities, setCommunities] = useState<iWP_Community[]>([]);

  return (
    <>
      <FullWidthContainer>
        {layoutContext.alert && (
          <div className={classNames(APP_CLASSNAMES.CONTAINER, "!py-0")}>
            <PublicHealthAlertsBanner alert={layoutContext.alert} />
          </div>
        )}
        <div className="flex items-center justify-between gap-2.5 pb-1 text-base font-semibold text-[#686867]">
          <div className="w-full">
            <h2 className="mb-2 font-bold text-chw-dark-green">
              <span className="max-md:hidden">
                All Communities {"you've"} joined ({communities.length})
              </span>
              <span className="hidden max-md:block">
                Your communities ({communities.length})
              </span>
            </h2>
            <hr />
            <MyCommunitiesGrid onReady={setCommunities} />
          </div>
        </div>
      </FullWidthContainer>
    </>
  );
}
