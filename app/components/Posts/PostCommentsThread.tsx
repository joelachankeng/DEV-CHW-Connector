import type { iWP_Comment, iWP_Post } from "~/models/post.model";
import PostComment from "./PostComment";
import React, { useCallback, useEffect, useRef, useState } from "react";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { classNames } from "~/utilities/main";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import type { iGenericError } from "~/models/appContext.model";
import type { iGraphQLPageInfo } from "~/controllers/graphql.control";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import type { iWP_Comments_Pagination } from "~/controllers/feed.control";
import _ from "lodash";

type iPostCommentsThread = iPostCommentsThread_All &
  (iPostCommentsThread_Root | iPostCommentsThread_Child);

type iPostCommentsThread_All = {
  post: iWP_Post;
  total: number;
  indent?: number;
  activeCommentId?: number;
};

type iPostCommentsThread_Root = {
  root: true;
  totalComments: iWP_Post["postFields"]["firstComments"];
};

type iPostCommentsThread_Child = {
  root: false;
  organizedAllComments: iOrganizedComments[];
};

type iPostCommentsThread_CustomEvent = CustomEvent<{
  postId: number;
  commentId: number;
}>;

type iPostCommentsThread_CustomEvent_AddComment = CustomEvent<{
  postId: number;
  parentId: number;
  comment: iWP_Comment;
}>;

const EVENT_NAMES = {
  LOAD_COMMENT: "custom:loadComment",
  LOAD_COMMENT_END: "custom:loadCommentEnd",
  ADD_COMMENT: "custom:addComment",
};

export default function PostCommentsThread(prop: iPostCommentsThread) {
  const { root } = prop;

  if (root) {
    return <PostCommentsThreadRoot {...prop} />;
  } else {
    return <PostCommentsThreadChild {...prop} />;
  }
}

function PostCommentsThreadRoot({
  post,
  totalComments,
  indent = 0,
  total = 0,
  activeCommentId,
}: iPostCommentsThread_All & iPostCommentsThread_Root) {
  const [allOrganizedComments, setAllOrganizedComments] = useState(
    organizeAllComments(totalComments),
  );
  const [threadFetch, setThreadFetch] = useState({
    postId: 0,
    commentId: 0,
    isFetching: false,
  });
  const [startSubmit, setStartSubmit] = useState<boolean>(false);

  const submitData = useRef<
    | {
        postId: number;
        commentId: number;
        after: string;
      }
    | undefined
  >(undefined);

  const pagination = useRef<iGraphQLPageInfo["pageInfo"] | undefined>(
    undefined,
  );
  const childPaginations = useRef<{
    [commentId: number]: iGraphQLPageInfo["pageInfo"] | undefined;
  }>([]);

  const signalFetchEnd = (postId: number, commentId: number): void => {
    const event: iPostCommentsThread_CustomEvent = new CustomEvent(
      EVENT_NAMES.LOAD_COMMENT_END,
      {
        detail: {
          postId: postId,
          commentId,
        },
      },
    );
    dispatchEvent(event);
  };

  const { state: postCommentsFetchState, submit: postCommentsFetchSubmit } =
    useAutoFetcher<iWP_Comments_Pagination | iGenericError>(
      "/api/comment/getAll",
      (data: iWP_Comments_Pagination | iGenericError) => {
        setStartSubmit(false);
        submitData.current = undefined;

        if ("error" in data) {
          return;
        }
        console.log(data.nodes);

        const newComments = organizeAllComments({
          nodes: data.nodes,
          total: data.pageInfo.total || 0,
        });
        console.log("newComments", newComments);

        if (threadFetch.isFetching) {
          const newOrganizedComments = addChildrenToOrganizedComments(
            allOrganizedComments,
            newComments,
            threadFetch.commentId,
            data.pageInfo.total,
            true,
          );
          childPaginations.current[threadFetch.commentId] = data.pageInfo;

          signalFetchEnd(threadFetch.postId, threadFetch.commentId);
          setThreadFetch({
            postId: 0,
            commentId: 0,
            isFetching: false,
          });
          setAllOrganizedComments(newOrganizedComments.comments);
        } else {
          pagination.current = data.pageInfo;
          setAllOrganizedComments([...allOrganizedComments, ...newComments]);
        }
      },
    );

  const handleLoadMoreComments = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (postCommentsFetchState !== "idle") {
      return;
    }
    postCommentsFetchSubmit(
      {
        postId: post.databaseId.toString(),
        after: pagination.current?.endCursor || "",
        getCursor: pagination.current === undefined ? "true" : "false",
        parentId: "0",
      },
      "POST",
    );
  };

  const getTotal = (): number => {
    if (pagination.current) {
      return pagination.current.total;
    } else {
      return total;
    }
  };

  const loadCommentListener = useCallback(
    (event: iPostCommentsThread_CustomEvent) => {
      const { postId, commentId } = event.detail;

      if (postId !== post.databaseId) return signalFetchEnd(postId, commentId);
      const findComment = findCommentById(allOrganizedComments, commentId);
      if (!findComment) return signalFetchEnd(postId, commentId);

      console.log("LOADING COMMENT", postId, commentId);

      const after = childPaginations.current[commentId]?.endCursor || "";
      setStartSubmit(true);
      submitData.current = {
        postId,
        commentId,
        after,
      };
    },
    [allOrganizedComments, post.databaseId],
  );

  const addCommentListener = useCallback(
    (event: iPostCommentsThread_CustomEvent_AddComment) => {
      const { postId, parentId, comment } = event.detail;
      console.log("ADDING COMMENT", event.detail);

      if (postId !== post.databaseId) return;
      if (parentId === 0) {
        const newOrganizedComments: iOrganizedComments[] = [
          { comment, children: [] },
          ...allOrganizedComments,
        ];
        setAllOrganizedComments(newOrganizedComments);
        console.log("newOrganizedComments", newOrganizedComments);
      } else {
        const newComment: iOrganizedComments = {
          comment,
          children: [],
        };
        const newOrganizedComments = addChildrenToOrganizedComments(
          allOrganizedComments,
          [newComment],
          parentId,
        );
        console.log(
          "newOrganizedComments",
          allOrganizedComments,
          newOrganizedComments,
          _.isEqual(allOrganizedComments, newOrganizedComments),
        );
        setAllOrganizedComments(newOrganizedComments.comments);
      }
    },
    [allOrganizedComments, post.databaseId],
  );

  useEffect(() => {
    if (postCommentsFetchState !== "idle") return;
    if (!startSubmit) return;
    if (!submitData.current) return;
    postCommentsFetchSubmit(
      {
        postId: submitData.current.postId.toString(),
        parentId: submitData.current.commentId.toString(),
        after: submitData.current.after,
      },
      "POST",
    );
    setThreadFetch({
      postId: submitData.current.postId,
      commentId: submitData.current.commentId,
      isFetching: true,
    });
  }, [postCommentsFetchState, startSubmit]);

  useEffect(() => {
    window.addEventListener(
      EVENT_NAMES.LOAD_COMMENT,
      loadCommentListener as EventListener,
    );

    window.addEventListener(
      EVENT_NAMES.ADD_COMMENT,
      addCommentListener as EventListener,
    );

    return () => {
      window.removeEventListener(
        EVENT_NAMES.LOAD_COMMENT,
        loadCommentListener as EventListener,
      );

      window.removeEventListener(
        EVENT_NAMES.ADD_COMMENT,
        addCommentListener as EventListener,
      );
    };
  }, [addCommentListener, loadCommentListener]);

  return (
    <>
      <PostCommentsThreadChild
        root={false}
        organizedAllComments={allOrganizedComments}
        indent={indent}
        post={post}
        total={getTotal()}
        activeCommentId={activeCommentId}
      />
      <div className="mx-auto my-2 flex flex-col items-center justify-center">
        {!threadFetch.isFetching && postCommentsFetchState !== "idle" ? (
          <LoadingSpinner className="cursor-progress" />
        ) : (
          <>
            {getTotal() > 0 && getTotal() > allOrganizedComments.length && (
              <LoadMoreReplies
                className="mt-5"
                text={`${getTotal() - allOrganizedComments.length} more replies`}
                onClick={handleLoadMoreComments}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}

function PostCommentsThreadChild({
  post,
  organizedAllComments,
  indent = 0,
  total = 0,
  activeCommentId,
}: iPostCommentsThread_All & iPostCommentsThread_Child) {
  const groupId =
    post.postFields.network?.node.databaseId ||
    post.postFields.community?.node.databaseId ||
    undefined;

  const [loading, setLoading] = useState<number | undefined>(undefined);
  const loadingRef = useRef<number | undefined>(loading);

  const getTotal = (comments: iOrganizedComments): number => {
    const total = comments.comment.totalReplies - comments.children.length;

    return total;
  };

  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  useEffect(() => {
    const loadCommentEndListener = (event: iPostCommentsThread_CustomEvent) => {
      const { postId, commentId } = event.detail;
      if (postId !== post.databaseId) return;
      if (loadingRef.current === commentId) {
        setLoading(undefined);
      }
    };

    window.addEventListener(
      EVENT_NAMES.LOAD_COMMENT_END,
      loadCommentEndListener as EventListener,
    );
    return () => {
      window.removeEventListener(
        EVENT_NAMES.LOAD_COMMENT_END,
        loadCommentEndListener as EventListener,
      );
    };
  }, [post.databaseId]);

  const handleLoadReplies = (
    e: React.MouseEvent<HTMLButtonElement>,
    commentId: number,
  ) => {
    e.preventDefault();
    setLoading(commentId);

    const event: iPostCommentsThread_CustomEvent = new CustomEvent(
      EVENT_NAMES.LOAD_COMMENT,
      {
        detail: {
          postId: post.databaseId,
          commentId,
        },
      },
    );
    dispatchEvent(event);
  };

  const handlePostCommentSubmit = useCallback(
    (comment: iWP_Comment) => {
      dispatchAddCommentEvent(post.databaseId, comment);
    },
    [post.databaseId],
  );

  return (
    <>
      <div
        className={classNames("comments-thread", "flex flex-col gap-5")}
        style={{ marginLeft: `${indent * 40}px` }}
      >
        {organizedAllComments.map((comments, index) => (
          <React.Fragment
            key={`${comments.comment.databaseId}-${comments.comment.commentsField.parentId || 0}-${index}`}
          >
            <PostComment
              comment={comments.comment}
              groupId={groupId}
              postId={post.databaseId}
              onSubmit={handlePostCommentSubmit}
              active={activeCommentId === comments.comment.databaseId}
            />
            <PostCommentsThread
              root={false}
              organizedAllComments={comments.children}
              indent={indent + 1}
              post={post}
              total={getTotal(comments)}
              activeCommentId={activeCommentId}
            />
            {process.env.NODE_ENV === "development" && (
              <>
                {JSON.stringify({
                  commentId: comments.comment.databaseId,
                  totalReplies: comments.comment.totalReplies,
                  children: comments.children.length,
                  getTotal: getTotal(comments),
                })}
              </>
            )}
            {getTotal(comments) > 0 && (
              <div className="-mt-5 ml-10">
                {loading === comments.comment.databaseId ? (
                  <LoadingSpinner className="cursor-progress" />
                ) : (
                  <LoadMoreReplies
                    text={`${getTotal(comments)} more replies`}
                    onClick={(e) =>
                      handleLoadReplies(e, comments.comment.databaseId)
                    }
                  />
                )}
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

type iOrganizedComments = {
  comment: iWP_Comment;
  children: iOrganizedComments[];
};

function organizeAllComments(
  comments: iWP_Post["postFields"]["firstComments"],
): iOrganizedComments[] {
  const organizedComments: iOrganizedComments[] = [];
  console.log(comments);

  comments.nodes.forEach((comment) => {
    if (!comment.commentsField.parentId) {
      organizedComments.push({ comment, children: [] });
    } else {
      const { parentComment } = findParentComment(
        organizedComments,
        comment.commentsField.parentId,
      );
      if (parentComment) {
        parentComment.children.push({ comment, children: [] });
      } else {
        organizedComments.push({ comment, children: [] });
      }
    }
  });
  return organizedComments;
}

function findParentComment(
  organizedComments: iOrganizedComments[],
  parentId: number,
): { parentComment: iOrganizedComments | null; index: number } {
  for (let i = 0; i < organizedComments.length; i++) {
    if (organizedComments[i].comment.databaseId === parentId) {
      return { parentComment: organizedComments[i], index: i };
    } else if (organizedComments[i].children.length > 0) {
      const result = findParentComment(organizedComments[i].children, parentId);
      if (result.parentComment) {
        return result;
      }
    }
  }
  return { parentComment: null, index: -1 };
}

function findCommentById(
  organizedComments: iOrganizedComments[],
  commentId: number,
): iOrganizedComments | undefined {
  for (let i = 0; i < organizedComments.length; i++) {
    if (organizedComments[i].comment.databaseId === commentId) {
      return organizedComments[i];
    } else if (organizedComments[i].children.length > 0) {
      const result = findCommentById(organizedComments[i].children, commentId);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
}

const replaceOrAddOrganizedComments = (
  replace: boolean,
  organizedCommentsParent: iOrganizedComments[],
  newComments: iOrganizedComments[],
  index: number,
): iOrganizedComments[] => {
  if (replace) {
    organizedCommentsParent[index].children = newComments;
    organizedCommentsParent[index].comment.totalReplies = newComments.length;
  } else {
    newComments.forEach((newComment) => {
      const commentExist = organizedCommentsParent[index].children.findIndex(
        (comment) =>
          comment.comment.databaseId === newComment.comment.databaseId,
      );
      if (commentExist > -1) {
        organizedCommentsParent[index].children[commentExist] = newComment;
        return;
      }

      organizedCommentsParent[index].children.push(newComment);
      organizedCommentsParent[index].comment.totalReplies += 1;
      return;
    });
  }
  return organizedCommentsParent;
};

function addChildrenToOrganizedComments(
  organizedComments: iOrganizedComments[],
  newComments: iOrganizedComments[],
  parentId: number,
  parentTotalReplies?: number,
  replace = false,
): {
  comments: iOrganizedComments[];
  found: boolean;
} {
  const data = {
    comments: _.cloneDeep(organizedComments),
    found: false,
  };

  for (let i = 0; i < data.comments.length; i++) {
    if (data.comments[i].comment.databaseId === parentId) {
      const newChildren = replaceOrAddOrganizedComments(
        replace,
        data.comments,
        newComments,
        i,
      );
      if (parentTotalReplies) {
        data.comments[i].comment.totalReplies = parentTotalReplies;
      }
      return {
        comments: newChildren,
        found: true,
      };
    } else if (data.comments[i].children.length > 0) {
      const result = addChildrenToOrganizedComments(
        data.comments[i].children,
        newComments,
        parentId,
        undefined,
        replace,
      );
      if (result.found) {
        return {
          comments: replaceOrAddOrganizedComments(
            replace,
            data.comments,
            result.comments,
            i,
          ),
          found: true,
        };
      }
    }
    continue;
  }

  return data;
}

function LoadMoreReplies({
  className,
  text,
  onClick,
}: {
  className?: string;
  text: string;
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      className={classNames(
        "cursor-pointer text-chw-dark-green hover:bg-chw-light-purple hover:text-white",
        "rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
        "flex items-center justify-center gap-1",
        className || "",
      )}
      onClick={onClick}
    >
      <span>
        <ChevronDownIcon className="inline-block h-8 w-8" />
      </span>
      <span>{text}</span>
    </button>
  );
}

export function dispatchAddCommentEvent(postId: number, comment: iWP_Comment) {
  const event: iPostCommentsThread_CustomEvent_AddComment = new CustomEvent(
    EVENT_NAMES.ADD_COMMENT,
    {
      detail: {
        postId: postId,
        parentId: comment.commentsField.parentId || 0,
        comment,
      },
    },
  );
  dispatchEvent(event);
}
