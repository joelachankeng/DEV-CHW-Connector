import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useOutletContext } from "@remix-run/react";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import type { iWP_CHWNetwork } from "~/models/CHWNetwork.model";
import { requireUserSession } from "~/servers/userSession.server";
import { APP_CLASSNAMES } from "~/constants";
import type { iCHWNetworkContextState } from "../chw-networks";
import FullWidthContainer from "~/components/Containers/FullWidthContainer";
import { classNames } from "~/utilities/main";
import MyCHWNetworksGrid from "~/components/Grids/MyCHWNetworksGrid";
import { useState } from "react";

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);

  return json({});
};

export default function CHWNetworksMy() {
  const { layoutContext } = useOutletContext<iCHWNetworkContextState>();
  const [networks, setNetworks] = useState<iWP_CHWNetwork[]>([]);

  return (
    <>
      <FullWidthContainer>
        {layoutContext.alert && (
          <div className={classNames(APP_CLASSNAMES.CONTAINER, "!py-0")}>
            <PublicHealthAlertsBanner alert={layoutContext.alert} />
          </div>
        )}
        <div className="flex items-center justify-between gap-2.5 border-b border-solid border-b-[#C1BAB4] pb-1 text-base font-semibold text-[#686867] ">
          <div className="w-full">
            <h2 className="mb-2 font-bold text-chw-dark-green">
              All CHW Networks {"you've"} joined ({networks.length})
            </h2>
            <hr />
            <MyCHWNetworksGrid onReady={setNetworks} />
          </div>
        </div>
      </FullWidthContainer>
    </>
  );
}
