import { UserGroupIcon } from "@heroicons/react/20/solid";
import { Tooltip } from "react-tooltip";
import type { iWP_Post, iWP_Posts_EmojisUser } from "~/models/post.model";
import ModalReactions from "../Modals/ModalReactions";
import React, { useContext, useEffect, useState } from "react";
import { AppContext } from "~/contexts/appContext";
import { classNames } from "~/utilities/main";
import type { iNotificationItem_General } from "../Managers/Notification/NotificationItem";
import { DateTime } from "luxon";
import type {
  iGenericSuccess,
  iGenericError,
  iAppContext,
} from "~/models/appContext.model";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";
import type { iWP_User } from "~/models/user.model";
import { APP_ROUTES } from "~/constants";
import { useNavigate } from "@remix-run/react";

export default function PostEmojis({
  postId,
  postType = "POST",
  totalEmojis,
  onChange,
}: {
  postId: number;
  postType?: "POST" | "COMMENT";
  totalEmojis: iWP_Post["postFields"]["totalEmojis"];
  onChange: (totalEmojis: iWP_Post["postFields"]["totalEmojis"]) => void;
}) {
  const { User, NotificationManager } = useContext(AppContext);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(false);
  const [updatedTotalEmojis, setUpdatedTotalEmojis] = useState(totalEmojis);
  const collectionSorted = updatedTotalEmojis.collection
    ?.sort((a, b) => b.count - a.count)
    .filter(
      (emoji) =>
        emoji.emojiId !== "" &&
        emoji.emojiId !== undefined &&
        emoji.emojiId !== null &&
        emoji.count > 0,
    );

  useEffect(() => {
    setUpdatedTotalEmojis(totalEmojis);
    // console.log("userCount changed", totalEmojis.usersCount);
  }, [totalEmojis.usersCount]);

  const isActiveEmoji = (emojiId: string): boolean => {
    const findUserEmoji = hasUserReacted(User.user, updatedTotalEmojis);
    if (!findUserEmoji) return false;

    return findUserEmoji.emojiId === emojiId;
  };

  const handleReactionClick = (emojiId: string) => {
    const result = calcUserUpdateReaction(
      User,
      NotificationManager,
      emojiId,
      totalEmojis,
    );
    if (!result) return;

    if ("time" in result) {
      NotificationManager.addNotification(result);
      return;
    }

    emojiFetchSubmit(
      {
        postId: postId.toString(),
        action: result.action,
        emojiId,
      },
      "POST",
    );

    setUpdatedTotalEmojis(result.emojis);
    console.log("result.emojis", result.emojis);

    onChange(result.emojis);
  };

  const { submit: emojiFetchSubmit } = useAutoFetcher<
    iGenericSuccess | iGenericError
  >(`/api/${postType === "POST" ? "post" : "comment"}/react`, (data) => {
    if ("error" in data) {
      const errorNotification = sendNotificationError(NotificationManager);
      setUpdatedTotalEmojis(totalEmojis);
      onChange(totalEmojis);
      if (errorNotification)
        NotificationManager.addNotification(errorNotification);
    }
  });

  return (
    <>
      <ModalReactions
        show={showModal}
        totalEmojis={updatedTotalEmojis}
        onClose={() => setShowModal(false)}
      />
      <Tooltip id={`tooltip-add-reaction-${postId}`} />
      <div className="flex flex-1 flex-wrap items-center gap-1">
        {updatedTotalEmojis.users && updatedTotalEmojis.users.length > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              setShowModal(true);
            }}
            data-tooltip-id={`tooltip-add-reaction-${postId}`}
            data-tooltip-content={`View All Reaction`}
            data-tooltip-place="top"
            className="h-6 max-w-[2.5rem] rounded-[10px] bg-[#EAEAEA] px-2 py-1 text-[#454447] transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
          >
            <span className="sr-only">View All Reaction</span>
            <UserGroupIcon className="h-full w-full" />
          </button>
        )}

        {collectionSorted?.map((emoji) => (
          <React.Fragment key={`reaction-${postId}-${emoji.emojiId}`}>
            <Tooltip id={`tooltip-grin-reaction-${postId}`} />
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                if (!User.user) return navigate(APP_ROUTES.LOGIN);
                handleReactionClick(emoji.emojiId);
              }}
              data-tooltip-id={`tooltip-add-reaction-${postId}`}
              data-tooltip-content={`React via ${emoji.emojiId}`}
              data-tooltip-place="top"
              className={classNames(
                "h-6 rounded-[10px] px-2 transition duration-300 ease-in-out",
                isActiveEmoji(emoji.emojiId)
                  ? "bg-chw-light-purple text-white hover:bg-[#EAEAEA] hover:text-[#454447]"
                  : "bg-[#EAEAEA] text-[#454447] hover:bg-chw-light-purple hover:text-white ",
              )}
            >
              <span className="sr-only">React via {emoji.emojiId}</span>
              <span className="flex items-baseline gap-[0.2rem]">
                <em-emoji id={emoji.emojiId}></em-emoji>{" "}
                <span className="text-sm leading-normal">{emoji.count}</span>
              </span>
            </button>
          </React.Fragment>
        ))}
      </div>
    </>
  );
}

function sendNotificationError(
  notificationManager: iAppContext["NotificationManager"],
): iNotificationItem_General | undefined {
  const errorNotification: iNotificationItem_General = {
    type: "error",
    message:
      "An error occurred while trying to react to the post. Please try again later.",
    time: DateTime.now().toISO(),
  };

  const notifications = notificationManager.notificationManager;
  const lastNotification = notifications[notifications.length - 1];

  if (
    lastNotification?.message === errorNotification.message &&
    DateTime.now().diff(DateTime.fromISO(lastNotification.time)).as("minutes") <
      1
  )
    return;
  return errorNotification;
}

function hasUserReacted(
  user: iWP_User | undefined,
  updatedTotalEmojis: iWP_Post["postFields"]["totalEmojis"],
): iWP_Posts_EmojisUser | undefined {
  if (!user) return;

  return updatedTotalEmojis.users?.find(
    (emojiUser) => emojiUser.userId === user.databaseId,
  );
}

export function calcUserUpdateReaction(
  userContext: iAppContext["User"],
  NotificationManager: iAppContext["NotificationManager"],
  emojiId: string,
  totalEmojis: iWP_Post["postFields"]["totalEmojis"],
):
  | {
      action: "UPDATE" | "REMOVE";
      emojis: iWP_Post["postFields"]["totalEmojis"];
    }
  | iNotificationItem_General
  | undefined {
  const user = userContext.user;
  if (!user) {
    return sendNotificationError(NotificationManager);
  }

  const userReaction = hasUserReacted(user, totalEmojis);
  let action = "UPDATE" as "UPDATE" | "REMOVE";

  let newTotalEmojis = totalEmojis;
  if (userReaction) {
    // User has clicked on an emoji but already reacted to the post
    action = "REMOVE";

    // decrement the count of the emoji and remove the user from the list
    newTotalEmojis = {
      usersCount: newTotalEmojis.usersCount - 1,
      users: newTotalEmojis.users?.filter(
        (emojiUser) => emojiUser.userId !== userReaction.userId,
      ),
      collection: newTotalEmojis.collection?.map((emoji) => {
        if (emoji.emojiId === emojiId) {
          return {
            ...emoji,
            count: emoji.count - 1,
          };
        }
        return emoji;
      }),
    };

    // User has clicked on the same emoji
    if (userReaction.emojiId !== emojiId) {
      action = "UPDATE";

      // reset newTotalEmojis to the current state
      newTotalEmojis = totalEmojis;
      // change the emojiId of the user reaction
      newTotalEmojis.users = newTotalEmojis.users?.map((emojiUser) => {
        if (emojiUser.userId === userReaction.userId) {
          return {
            ...emojiUser,
            emojiId,
          };
        }
        return emojiUser;
      });

      let findEmojiInCollection = false;
      // decrement the count of the old emoji clicked
      newTotalEmojis.collection = newTotalEmojis.collection?.map((emoji) => {
        if (emoji.emojiId === userReaction.emojiId) {
          return {
            ...emoji,
            count: emoji.count - 1,
          };
        }
        // check if the new emoji clicked is already in the collection
        if (emoji.emojiId === emojiId) {
          findEmojiInCollection = true;
        }
        return emoji;
      });

      if (findEmojiInCollection) {
        newTotalEmojis.collection = newTotalEmojis.collection?.map((emoji) => {
          // increment the count of the new emoji clicked
          if (emoji.emojiId === emojiId) {
            return {
              ...emoji,
              count: emoji.count + 1,
            };
          }
          return emoji;
        });
      } else {
        // add the new emoji clicked to the collection
        newTotalEmojis.collection = [
          ...(newTotalEmojis.collection || []),
          {
            emojiId,
            count: 1,
          },
        ];
      }
    }
  } else {
    let findEmojiInCollection = false;
    newTotalEmojis = {
      usersCount: newTotalEmojis.usersCount + 1,
      users: [
        ...(newTotalEmojis.users || []),
        {
          userId: user?.databaseId || 0,
          emojiId,
          emojiIcon: "",
          avatar: user?.avatar.url || "",
          name: `${user?.firstName} ${user?.lastName}` || "",
        },
      ],
      collection: newTotalEmojis.collection?.map((emoji) => {
        if (emoji.emojiId === emojiId) {
          findEmojiInCollection = true;
          return {
            ...emoji,
            count: emoji.count + 1,
          };
        }
        return emoji;
      }),
    };

    if (!findEmojiInCollection) {
      newTotalEmojis.collection = [
        ...(newTotalEmojis.collection || []),
        {
          emojiId,
          count: 1,
        },
      ];
    }
  }

  return { action, emojis: newTotalEmojis };
}
