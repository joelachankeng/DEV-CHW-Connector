import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { classNames } from "~/utilities/main";
import Accordion from "../Accordion";
import SearchField from "../Forms/SearchField";
import InfoSideBar from "./InfoSideBar";
import { forwardRef, useEffect, useRef, useState } from "react";
import type { iWP_CHWNetwork } from "~/models/CHWNetwork.model";
import type { iWP_Community } from "~/models/community.model";
import { Link } from "@remix-run/react";
import LoadingSpinner from "../Loading/LoadingSpinner";

type iButtonOrLinkProps = {
  text: string;
  isLoading?: boolean;
} & (
  | {
      onClick: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    }
  | {
      href: string;
    }
);

export type iInfoSideBarGroupTemplateProps = {
  ariaLabel: string;
  image: string;
  title: string;
  subtitle?: string;
  description?: string;
  membership?: {
    isMember: boolean;
    joinButton: iButtonOrLinkProps;
    leaveButton: iButtonOrLinkProps;
  };
  guidelines?: {
    title: string;
    content: string;
  };
  searchText: string;
  reportText?: string;
  onSearchChange?: (value: string) => void;
  onReport?: () => void;
  visible?: boolean;
};

type AboutSectionProps = {
  description: iInfoSideBarGroupTemplateProps["description"];
  className?: string;
};

const AboutSection = forwardRef<HTMLDivElement, AboutSectionProps>(
  ({ description, className }, ref) => {
    return (
      <div
        ref={ref}
        className={classNames(
          "about-sidebar-container",
          "text-sm leading-[18px] text-[#032525]",
          "relative z-0 transition-all duration-300 ease-in-out",
          className ?? "",
        )}
        dangerouslySetInnerHTML={{
          __html: description ?? "",
        }}
      />
    );
  },
);
AboutSection.displayName = "AboutSection";

export default function InfoSideBarGroupTemplate({
  ariaLabel,
  image,
  title,
  subtitle,
  description,
  membership,
  guidelines,
  searchText,
  reportText,
  onSearchChange,
  onReport,
  visible = true,
}: iInfoSideBarGroupTemplateProps) {
  const aboutSection = useRef<HTMLDivElement>(null);

  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!aboutSection.current) return;
    const isOverflowing =
      aboutSection.current.scrollHeight > aboutSection.current.clientHeight;

    setIsOverflowing(isOverflowing);
  }, []);

  return (
    <InfoSideBar
      image={image}
      title={title}
      subtitle={subtitle}
      ariaLabel={ariaLabel}
      visible={visible}
    >
      {description && (
        <h3 className="mx-0 mb-5 font-semibold text-[#032525]">About</h3>
      )}
      <AboutSection
        ref={aboutSection}
        description={description}
        className={classNames(
          "overflow-hidden",
          isOverflowing && isCollapsed
            ? "before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-full before:bg-[linear-gradient(transparent_10%,white)] before:content-['']"
            : "",
          isCollapsed ? "max-h-[145px]" : "",
        )}
      />
      {isOverflowing && isCollapsed && (
        <button
          className="mt-2 text-sm text-chw-light-purple transition duration-300 ease-in-out hover:text-chw-dark-purple hover:underline"
          onClick={() => setIsCollapsed(false)}
        >
          More...
        </button>
      )}
      {onSearchChange && (
        <SearchField
          placeholder={searchText}
          screenReaderText={searchText}
          onChange={(value) => onSearchChange(value)}
        />
      )}
      {membership && (
        <ButtonOrLink
          {...(membership.isMember
            ? membership.leaveButton
            : membership.joinButton)}
          className={classNames(
            "block",
            "mt-5 cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
            "w-full rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
          )}
        />
        // <button
        //   className={classNames(
        //     "mt-5 cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
        //     "w-full rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
        //   )}
        //   onClick={membership.isMember ? membership.onLeave : membership.onJoin}
        // >
        //   {membership.isMember
        //     ? membership.leaveButton.text
        //     : membership.joinButton.text}
        // </button>
      )}
      {guidelines && (
        <>
          <hr className="my-5 border-[#C1BAB4]" />
          <Accordion
            isOpen={isOpen}
            onToggle={() => setIsOpen(!isOpen)}
            classnames={{
              parent: "",
              button:
                "w-full group hover:text-[#625da6] transition duration-300 ease-in-out",
            }}
            buttonInner={
              <>
                <span className="flex w-full items-center gap-2 text-left">
                  <span
                    className={classNames(
                      "text-base font-semibold group-hover:text-[#625da6]",
                      isOpen ? "text-[#032525]" : "",
                    )}
                  >
                    {guidelines.title}
                  </span>
                  <ChevronDownIcon
                    className={classNames(
                      "h-6 w-6 min-w-[1.5rem] text-[#686867] transition duration-300 ease-in-out group-hover:text-[#625da6]",
                      isOpen ? "mt-0 rotate-180 transform" : "-mt-[.1875rem]",
                    )}
                  />
                </span>
              </>
            }
          >
            <div
              className={classNames(
                "html-formatted-content text-sm leading-[18px] text-[#032525]",
                "mt-5",
              )}
              dangerouslySetInnerHTML={{
                __html: guidelines.content,
              }}
            />
          </Accordion>
        </>
      )}
      {reportText && (
        <button
          className={classNames(
            "mt-5 cursor-pointer border-2 border-chw-light-purple bg-white text-chw-light-purple hover:bg-chw-light-purple hover:text-white",
            "w-full rounded-[40px] border-[none] px-[25px] py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
          )}
          onClick={onReport}
        >
          {reportText}
        </button>
      )}
    </InfoSideBar>
  );
}

export function InfoSideBarGroupTemplateMobile({
  description,
  membership,
  guidelines,
  searchText,
  reportText,
  onSearchChange,
  onReport,
  visible = true,
}: iInfoSideBarGroupTemplateProps) {
  return (
    <>
      {description && <AboutSection description={description} />}
      {onSearchChange && (
        <SearchField
          className="!bg-white"
          placeholder={searchText}
          screenReaderText={searchText}
          onChange={(value) => onSearchChange(value)}
        />
      )}
      {membership && (
        <ButtonOrLink
          {...(membership.isMember
            ? membership.leaveButton
            : membership.joinButton)}
          className={classNames(
            "block",
            "mt-5 cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
            "w-full rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
          )}
        />
        // <button
        //   className={classNames(
        //     "mt-5 cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
        //     "w-full rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
        //   )}
        //   onClick={membership.isMember ? membership.onLeave : membership.onJoin}
        // >
        //   {membership.isMember ? membership.leaveText : membership.joinText}
        // </button>
      )}
      {guidelines && (
        <>
          <hr className="my-5 border-[#C1BAB4]" />
          <h3 className={classNames("text-base font-semibold")}>
            {guidelines.title}
          </h3>
          <div
            className={classNames(
              "html-formatted-content text-sm leading-[18px] text-[#032525]",
              "mt-5",
            )}
            dangerouslySetInnerHTML={{
              __html: guidelines.content,
            }}
          />
        </>
      )}
      {reportText && (
        <button
          className={classNames(
            "mt-5 cursor-pointer border-2 border-chw-light-purple bg-transparent text-chw-light-purple hover:bg-chw-light-purple hover:text-white",
            "w-full rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
          )}
          onClick={onReport}
        >
          {reportText}
        </button>
      )}
    </>
  );
}

export type iCreateInfoSideBarGroupTemplatePropsArgs =
  | {
      type: "NETWORK";
      groupData: iWP_CHWNetwork | undefined | null;
    }
  | {
      type: "COMMUNITY";
      groupData: iWP_Community | undefined | null;
    };
export const createInfoSideBarGroupTemplateProps = ({
  type,
  groupData,
}: iCreateInfoSideBarGroupTemplatePropsArgs): iInfoSideBarGroupTemplateProps => {
  const defaultGroupProps: iInfoSideBarGroupTemplateProps = {
    ariaLabel: "",
    image: "",
    title: "",
    description: "",
    guidelines: {
      title: "",
      content: "",
    },
    searchText: "",
    reportText: "",
    visible: false,
  };

  if (!groupData) return defaultGroupProps;
  switch (type) {
    case "NETWORK":
      return {
        ariaLabel: `${groupData.title} CHW Network Information`,
        image: groupData.featuredImage.node.mediaItemUrl ?? "",
        title: groupData.title ?? "",
        subtitle: `${groupData.chwNetworksFields?.totalMembers} ${groupData.chwNetworksFields.totalMembers || 0 > 1 ? "members" : "member"}`,
        description: groupData.chwNetworksFields.about ?? "",
        membership: {
          isMember: groupData.chwNetworksFields.isMember ?? false,
          joinButton: {
            text: "Follow this CHW Network",
            href: "#",
          },
          leaveButton: {
            text: "Unfollow this CHW Network",
            href: "#",
          },
        },
        searchText: "Search CHW Network",
        reportText: "Report this CHW Network",
        onSearchChange: (value: string) => {
          // TOFIX: Implement search network
        },
        onReport: () => {
          // TOFIX: Implement report network
        },
      };
    case "COMMUNITY":
      return {
        ariaLabel: `${groupData.title} Community Information`,
        image: groupData.featuredImage.node.mediaItemUrl ?? "",
        title: groupData.title ?? "",
        subtitle: `${groupData.communitiesFields.totalMembers} ${groupData.communitiesFields.totalMembers || 0 > 1 ? "members" : "member"}`,
        description: groupData.communitiesFields.about ?? "",
        membership: {
          isMember: groupData.communitiesFields.isMember ?? false,
          joinButton: {
            text: "Join this Community",
            href: "#",
          },
          leaveButton: {
            text: "Leave this Community",
            href: "#",
          },
        },
        searchText: "Search Community",
        reportText: "Report this Community",
        onSearchChange: (value: string) => {
          console.log("Searching Community: ", value);
        },
        onReport: () => {
          console.log("Reporting Community");
        },
      };
  }
};

function ButtonOrLink({
  text,
  className,
  ...props
}: iButtonOrLinkProps & { className?: string }) {
  if (props.isLoading) {
    return (
      <div className="mx-auto mt-2 flex cursor-progress justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return "href" in props ? (
    <Link to={props.href} className={className}>
      {text}
    </Link>
  ) : (
    <button className={className} onClick={props.onClick}>
      {text}
    </button>
  );
}
