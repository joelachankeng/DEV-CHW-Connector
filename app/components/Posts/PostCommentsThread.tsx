import type { iWP_Post } from "~/models/post.model";
import PostComment from "./PostComment";
import React from "react";

type iPostCommentsThread = iPostCommentsThread_All &
  (iPostCommentsThread_Root | iPostCommentsThread_Child);

type iPostCommentsThread_All = {
  post: iWP_Post;
  indent?: number;
};

type iPostCommentsThread_Root = {
  root: true;
  totalComments: iWP_Post["postFields"]["totalComments"];
};

type iPostCommentsThread_Child = {
  root: false;
  organizeAllComments: iOrganizedComments[];
};

export default function PostCommentsThread(prop: iPostCommentsThread) {
  const { root, indent } = prop;

  if (root) {
    return <PostCommentsThreadRoot {...prop} />;
  } else {
    return <PostCommentsThreadChild {...prop} />;
  }

  //   return (
  //     <div
  //       className="comments-thread flex flex-col gap-5"
  //       style={{ marginLeft: `${indent * 20}px` }}
  //     >
  //       {root
  //         ? allOrganizedComments.map((comments, index) => (
  //             <React.Fragment
  //               key={`${comments.comment.databaseId}-${comments.comment.parentId || 0}-${index}`}
  //             >
  //               <PostComment comment={comments.comment} />
  //               <PostCommentsThread
  //                 totalComments={{
  //                   count: comments.children.length,
  //                   collection: comments.children.map((child) => child.comment),
  //                 }}
  //                 indent={indent + 1}
  //               />
  //             </React.Fragment>
  //           ))
  //         : totalComments.collection.map((comment, index) => (
  //             <React.Fragment
  //               key={`${comment.databaseId}-${comment.parentId || 0}-${index}`}
  //             >
  //               <PostComment
  //                 key={`${comment.databaseId}-${comment.parentId || 0}-${index}`}
  //                 comment={comment}
  //               />
  //             </React.Fragment>
  //           ))}
  //     </div>
  //   );
}

function PostCommentsThreadRoot({
  post,
  totalComments,
  indent = 0,
}: iPostCommentsThread_All & iPostCommentsThread_Root) {
  const allOrganizedComments = organizeAllComments(totalComments);
  return (
    <PostCommentsThreadChild
      root={false}
      organizeAllComments={allOrganizedComments}
      indent={indent}
      post={post}
    />
  );
}

function PostCommentsThreadChild({
  post,
  organizeAllComments,
  indent = 0,
}: iPostCommentsThread_All & iPostCommentsThread_Child) {
  const groupId =
    post.postFields.network?.node.databaseId ||
    post.postFields.community?.node.databaseId ||
    undefined;

  return (
    <div
      className="comments-thread flex flex-col gap-5"
      style={{ marginLeft: `${indent * 20}px` }}
    >
      {organizeAllComments.map((comments, index) => (
        <React.Fragment
          key={`${comments.comment.databaseId}-${comments.comment.parentId || 0}-${index}`}
        >
          <PostComment comment={comments.comment} groupId={groupId} />
          <PostCommentsThread
            root={false}
            organizeAllComments={comments.children}
            indent={indent + 1}
            post={post}
          />
        </React.Fragment>
      ))}
    </div>
  );
}

type iOrganizedComments = {
  comment: iWP_Post["postFields"]["totalComments"]["collection"][0];
  children: iOrganizedComments[];
};

function organizeAllComments(
  comments: iWP_Post["postFields"]["totalComments"],
): iOrganizedComments[] {
  const organizedComments: iOrganizedComments[] = [];
  comments.collection.forEach((comment) => {
    if (!comment.parentId) {
      organizedComments.push({ comment, children: [] });
    } else {
      const { parentComment, index } = findParentComment(
        organizedComments,
        comment.parentId,
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
