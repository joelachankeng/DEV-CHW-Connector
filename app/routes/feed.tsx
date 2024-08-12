import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import _ from "lodash";
import { useEffect, useState } from "react";
import { ListBoxField } from "~/components/Forms/ListBoxField";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import Page from "~/components/Pages/Page";
import Post from "~/components/Posts/Post";
import PublicHealthAlertsBanner from "~/components/PublicHealthAlertsBanner/PublicHealthAlertsBanner";
import { APP_CLASSNAMES } from "~/constants";
import { publicHealthAlert } from "~/controllers/publicHealthAlert.control";
import type { iGenericError } from "~/models/appContext.model";
import type { iWP_Post, iWP_Posts } from "~/models/post.model";
import type { iWP_PublicHealthAlert } from "~/models/publicHealthAlert.model";
import { requireUserSession } from "~/servers/userSession.server";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import samplePost from "~/utilities/samplePost.json";

const sortByOptions = ["Recent", "Popular"];
const sortByOptionsMap = sortByOptions.map((option) => ({
  label: _.startCase(option),
  value: option.toLowerCase(),
}));

export const loader: LoaderFunction = async ({ request }) => {
  await requireUserSession(request);
  const alert = await publicHealthAlert.API.getMostRecentAlert();
  if (alert instanceof Error) {
    return json({});
  }
  return json({
    alert: alert,
  });
};

export default function FeedView() {
  const { alert } = useLoaderData() as { alert: iWP_PublicHealthAlert };
  console.log(alert);

  const [mounted, setMounted] = useState(false);
  const [sortBy, setSortBy] =
    useState<(typeof sortByOptions)[number]>("recent");
  const [posts, setPosts] = useState<iWP_Post[]>([]);
  const [sortError, setSortError] = useState<iGenericError | undefined>(
    undefined,
  );

  const postsFetcherAction = (data: iWP_Posts | iGenericError) => {
    if (!mounted) setMounted(true);
    if ("error" in data) {
      setSortError(data);
      return;
    }
    console.log(data.nodes);
    setPosts(data.nodes);
  };
  const { state: postFetchState, submit: postFetchSubmit } = useAutoFetcher<
    iWP_Posts | iGenericError
  >("/api/feed/getAllPosts", postsFetcherAction);

  const handleOnChangeSortBy = (value: string) => {
    if (value === sortBy) return;
    postFetchSubmit(
      {
        sortBy: value,
      },
      "POST",
    );
    setSortError(undefined);
    setSortBy(value as (typeof sortByOptions)[number]);
  };

  // TOFIX: I want to get rid of this useEffect but doing that prevents the overflowing useEffect on Post.tsx from running
  useEffect(() => {
    postFetchSubmit(
      {
        sortBy: sortBy,
      },
      "POST",
    );
  }, []);
  const fakeComments = [
    {
      createdDate: "2024-06-03T02:13:41",
      modifiedDate: "2024-06-03T02:40:47",
      content:
        '{\r\n  "blocks": [\r\n    {\r\n      "id": "PU-gQnb5jM",\r\n      "type": "paragraph",\r\n      "data": {\r\n        "text": "I don\'t like that GIPHY is a part of this project. I don\'t think it\'s appropriate for a professional project. I would suggest removing it."\r\n      }\r\n    }\r\n  ]\r\n}',
      databaseId: 1,
      parentId: undefined,
      postId: 690,
      author: {
        avatarUrl: "",
        databaseId: 1,
        firstName: "Joel",
        lastName: "Admin",
      },
    },
    {
      createdDate: "2024-06-03T05:30:18",
      modifiedDate: "2024-06-03T05:30:18",
      content: `{\r\n  "blocks": [\r\n    {\r\n      "id": "PU-gQnb5jM",\r\n      "type": "paragraph",\r\n      "data": {\r\n        "text": "2"\r\n      }\r\n    }\r\n  ]\r\n}`,
      parentId: 1,
      databaseId: 2,
      postId: 690,
      author: {
        avatarUrl: "",
        databaseId: 24,
        firstName: "joel",
        lastName: "heatherstone",
      },
    },
    {
      createdDate: "2024-06-03T05:30:18",
      modifiedDate: "2024-06-03T05:30:18",
      content: `{\r\n  "blocks": [\r\n    {\r\n      "id": "PU-gQnb5jM",\r\n      "type": "paragraph",\r\n      "data": {\r\n        "text": "3"\r\n      }\r\n    }\r\n  ]\r\n}`,
      parentId: 2,
      databaseId: 3,
      postId: 690,
      author: {
        avatarUrl: "",
        databaseId: 24,
        firstName: "joel",
        lastName: "heatherstone",
      },
    },
    {
      createdDate: "2024-06-03T05:30:18",
      modifiedDate: "2024-06-03T05:30:18",
      content: `{\r\n  "blocks": [\r\n    {\r\n      "id": "PU-gQnb5jM",\r\n      "type": "paragraph",\r\n      "data": {\r\n        "text": "4"\r\n      }\r\n    }\r\n  ]\r\n}`,
      parentId: 3,
      databaseId: 4,
      postId: 690,
      author: {
        avatarUrl: "",
        databaseId: 24,
        firstName: "joel",
        lastName: "heatherstone",
      },
    },
    {
      createdDate: "2024-06-03T05:30:18",
      modifiedDate: "2024-06-03T05:30:18",
      content: `{\r\n  "blocks": [\r\n    {\r\n      "id": "PU-gQnb5jM",\r\n      "type": "paragraph",\r\n      "data": {\r\n        "text": "5"\r\n      }\r\n    }\r\n  ]\r\n}`,
      parentId: 4,
      databaseId: 5,
      postId: 690,
      author: {
        avatarUrl: "",
        databaseId: 24,
        firstName: "joel",
        lastName: "heatherstone",
      },
    },
    {
      createdDate: "2024-06-03T05:30:18",
      modifiedDate: "2024-06-03T05:30:18",
      content: `{\r\n  "blocks": [\r\n    {\r\n      "id": "PU-gQnb5jM",\r\n      "type": "paragraph",\r\n      "data": {\r\n        "text": "6"\r\n      }\r\n    }\r\n  ]\r\n}`,
      parentId: 32,
      databaseId: 6,
      postId: 690,
      author: {
        avatarUrl: "",
        databaseId: 24,
        firstName: "joel",
        lastName: "heatherstone",
      },
    },
  ];

  return (
    <>
      <Page>
        <div className={APP_CLASSNAMES.CONTAINER_FULLWIDTH}>
          <div className={APP_CLASSNAMES.CONTAINER}>
            {alert && <PublicHealthAlertsBanner alert={alert} />}

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
            <Post post={samplePost[0] as any} />
            {/* <PostCommentsThread
              root={true}
              totalComments={{
                count: fakeComments.length,
                collection: fakeComments,
              }}
            /> */}
            {mounted === false || postFetchState !== "idle" ? (
              <div className="mx-auto my-8 cursor-progress">
                <LoadingSpinner />
              </div>
            ) : (
              <>
                {sortError ? (
                  <div className="text-basetext-[#032525] flex flex-col gap-2 text-center">
                    <p className="font-semibold ">
                      An error occurred while retrieving your feed. Please try
                      again.
                    </p>
                    <p>{sortError.error}</p>
                    {sortError.error_description && (
                      <p>{sortError.error_description}</p>
                    )}
                  </div>
                ) : (
                  <>
                    {posts.length === 0 ? (
                      <div className="text-center text-base text-[#032525]">
                        No posts available.
                      </div>
                    ) : (
                      <>
                        {posts.map((post) => (
                          <Post key={post.databaseId} post={post} />
                        ))}
                        <p className="text-center">
                          You reached the end of the feed.
                        </p>
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </Page>
    </>
  );
}
