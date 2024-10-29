import { Link, useLocation, useOutletContext } from "@remix-run/react";
import _ from "lodash";
import { useCallback, useRef, useState } from "react";
import { ListBoxField } from "~/components/Forms/ListBoxField";
import SearchField from "~/components/Forms/SearchField";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import MessageThreadPreview from "~/components/Messages/MessageThreadPreview";
import Avatar from "~/components/User/Avatar";
import { APP_ROUTES } from "~/constants";
import type { iPublicUser } from "~/controllers/user.control";
import { UserPublic } from "~/controllers/user.control.public";
import type { iGenericError } from "~/models/appContext.model";
import type { iWP_Conversations } from "~/models/message.model";
import type { iPublicUsers_Pagination } from "~/routes/api/user/search";
import type { iMessagesContextState } from "~/routes/messages";
import { excerpts } from "~/utilities/excerpts";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import { useMediaSize } from "~/utilities/hooks/useMediaSize";
import { usePagination } from "~/utilities/hooks/usePagination";
import { classNames, getParagraphTextFromEditorData } from "~/utilities/main";

export default function MessagesIndex() {
  const { layoutContext } = useOutletContext<iMessagesContextState>();

  const mediaQuery = useMediaSize();

  const renderView = useCallback(() => {
    switch (layoutContext.currentView) {
      case "COMPOSE":
        return <MessageCompose />;
      default:
        return (
          <MessagesFeed conversations={layoutContext.conversations || []} />
        );
    }
  }, [layoutContext]);

  return (
    <>
      {mediaQuery && mediaQuery.width >= 992 ? (
        <>
          <MessageCompose />
        </>
      ) : (
        <>{renderView()}</>
      )}
    </>
  );
}

function MessageCompose() {
  const paginationContainerRef = useRef<HTMLDivElement | null>(null);
  const [users, setUsers] = useState<iPublicUser[]>([]);
  const [search, setSearch] = useState<string>("");
  const [searchChanged, setSearchChanged] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { state: userFetchState, submit: userFetchSubmit } = useAutoFetcher<
    iPublicUsers_Pagination | iGenericError
  >("/api/user/search", (data: iPublicUsers_Pagination | iGenericError) => {
    setSearchChanged(false);
    if ("error" in data) {
      setErrorMessage(
        `${data.error} ${data.error_description ? " - " + data.error_description : ""}`,
      );
      return;
    }

    if (pagination.isLoading) {
      setPagination({
        isLoading: false,
        pageInfo: data.pageInfo,
      });
      setUsers([...users, ...data.nodes]);
    } else {
      setPagination({
        isLoading: false,
        pageInfo: data.pageInfo,
      });
      setUsers(data.nodes);
    }
  });

  const { pagination, setPagination, LoadMoreButton } = usePagination(
    paginationContainerRef,
    () => {
      if (userFetchState !== "idle" || !pagination.pageInfo) {
        return;
      }
      userFetchSubmit(
        {
          search: search,
          after: pagination.pageInfo.endCursor,
        },
        "POST",
      );
      setErrorMessage("");
    },
  );

  const handleSearch = (value: string) => {
    if (value === "") {
      setUsers([]);
      setSearch("");
      return;
    }

    userFetchSubmit(
      {
        search: value,
        after: pagination.pageInfo?.endCursor ?? "",
      },
      "POST",
    );
    setSearchChanged(true);
    setSearch(value);
    setErrorMessage("");
  };

  return (
    <div
      className={classNames(
        "editor-top-parent",
        "relative flex flex-col overflow-hidden rounded-[10px] border border-solid border-[#E8E0D6] bg-white p-5",
        "max-md:border-none max-md:px-0 max-md:pt-0",
      )}
    >
      <h1 className="text-lg font-bold">New message to:</h1>
      <SearchField
        placeholder={"Type a name to search for a user"}
        screenReaderText={"Search for a user"}
        onChange={handleSearch}
      />
      {!searchChanged && (
        <div ref={paginationContainerRef} className="mt-5 max-md:mt-0">
          {search !== "" &&
            users.length === 0 &&
            userFetchState === "idle" &&
            !errorMessage && (
              <p className="text-center">
                <span className="">No users found.</span>
              </p>
            )}
          {errorMessage && (
            <p className="text-center">
              <span className="text-red-500">
                An error occurred while fetching users. <br />
                {errorMessage}
              </span>
            </p>
          )}
          {users.map((user, index) => (
            <div
              key={index}
              className={classNames(
                "flex items-center gap-5 border-solid border-b-[#C1BAB4] py-5 ",
                users.length - 1 === index ? "" : "border-b",
              )}
            >
              <Link
                to={APP_ROUTES.PROFILE.concat(`/${user.databaseId}`)}
                className="h-[4.5rem] w-[4.5rem] min-w-[4.5rem]"
              >
                <Avatar
                  src={user.avatar.value}
                  alt={`${user.firstName.value} ${user.lastName.value}`}
                />
              </Link>
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold text-[#032525]">
                  {user.firstName.value} {user.lastName.value}
                </h1>
                <p className="text-sm font-semibold text-[#686867]">
                  {getUserSubtext(user).map((text, index) => (
                    <span key={index}>{text}</span>
                  ))}
                </p>
                <Link
                  to={APP_ROUTES.MESSAGES.concat(`/${user.databaseId}`)}
                  className={classNames(
                    "mt-2.5 hidden max-xs:block",
                    "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
                    "rounded-[40px] border-[none] px-[25px] py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
                  )}
                >
                  Message
                </Link>
              </div>
              <div className="flex-1 text-right max-xs:hidden">
                <Link
                  to={APP_ROUTES.MESSAGES.concat(`/${user.databaseId}`)}
                  className={classNames(
                    "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
                    "w-full rounded-[40px] border-[none] px-[25px] py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
                  )}
                >
                  Message
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mx-auto my-8 flex flex-col items-center justify-center">
        {userFetchState !== "idle" ? (
          <LoadingSpinner className="cursor-progress" />
        ) : (
          <>
            {pagination.pageInfo && pagination.pageInfo.hasNextPage && (
              <LoadMoreButton />
            )}
          </>
        )}
      </div>
    </div>
  );
}

const sortByOptions = ["Recent", "Read", "Unread"];
const sortByOptionsMap = sortByOptions.map((option) => ({
  label: _.startCase(option),
  value: option.toLowerCase(),
}));

export function MessagesFeed({
  conversations,
}: {
  conversations: iWP_Conversations[];
}) {
  const location = useLocation();

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
      <div className="">
        {conversations.map((item, index) => (
          <MessageThreadPreview
            key={index}
            avatar={item.user.avatar.url || ""}
            profileLink={`${APP_ROUTES.MESSAGES}/${item.user.databaseId}`}
            name={`${item.user.firstName} ${item.user.lastName}`}
            dateTime={item.message.date}
            previewMessage={excerpts(
              getParagraphTextFromEditorData(
                item.message.messageFields.content,
              ),
            )}
            isUnRead={item.unreadCount > 0}
            unReadcount={item.unreadCount}
            className={classNames(
              conversations.length - 1 === index ? "" : "border-b",
              location.pathname ===
                `${APP_ROUTES.MESSAGES}/${item.user.databaseId}`
                ? "after:!bg-[#FFFAF3]"
                : "",
            )}
          />
        ))}
      </div>
    </>
  );
}

export const getUserSubtext = (user: iPublicUser): string[] => {
  const texts: string[] = [];
  texts.push(UserPublic.Utils.getLocation(user));
  if (user.certifiedWorker.value === true) texts.push("Certified CHW");
  return texts.filter((text) => text !== "");
};
