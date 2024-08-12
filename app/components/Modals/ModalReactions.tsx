import { useEffect, useRef, useState } from "react";
import { Dialog } from "@headlessui/react";
import Modal from "./ModalBlank";
import { iWP_Post, iWP_Posts_EmojisUser } from "~/models/post.model";
import SVGCloseButton from "~/assets/SVGs/SVGCloseButton";
import { SlickSlider, iSliderRef } from "../SlickSlider";
import { classNames, generatePassword } from "~/utilities/main";
import Avatar from "../User/Avatar";
import { Link } from "@remix-run/react";
import { APP_ROUTES } from "~/constants";
import ButtonLoadMore from "../ButtonLoadMore";
import { useMediaSize } from "~/utilities/hooks/useMediaSize";

type iModalReactionsProps = {
  show: boolean;
  totalEmojis: iWP_Post["postFields"]["totalEmojis"];
  onClose: () => void;
};

const fakeUsers = (
  collection: iWP_Post["postFields"]["totalEmojis"]["collection"],
): iWP_Post["postFields"]["totalEmojis"]["users"] => {
  const users: iWP_Post["postFields"]["totalEmojis"]["users"] = [];
  collection?.forEach((emoji, index) => {
    for (let i = 0; i < emoji.count; i++)
      users.push({
        avatar:
          "https://react-slick.neostack.com/img/react-slick/abstract01.jpg",
        name: generatePassword(10),
        userId: index,
        emojiId: emoji.emojiId,
      });
  });
  return users;
};

export default function ModalReactions({
  show,
  totalEmojis,
  onClose,
}: iModalReactionsProps) {
  const MAX_SLIDES = 6;
  const PAGINATION_LIMIT = 2;

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const slider = useRef<iSliderRef | undefined>(undefined);
  const usersContainer = useRef<HTMLDivElement>(null);

  const mediaSize = useMediaSize();
  const [activeTab, setActiveTab] = useState<number>(0);
  const [users, setUsers] = useState<iWP_Posts_EmojisUser[] | undefined>(
    totalEmojis.users,
  );
  const [tabs, setTabs] = useState<JSX.Element[]>(initializeTabs());

  useEffect(() => {
    setUsers(totalEmojis.users);
    setTabs(initializeTabs());
  }, [totalEmojis]);

  useEffect(() => {
    setTabs(initializeTabs());
  }, [mediaSize?.width, activeTab]);

  useEffect(() => {
    let filteredUsers = totalEmojis.users;
    if (activeTab !== 0) {
      const getEmojiId = totalEmojis.collection?.[activeTab - 1]?.emojiId;
      if (!getEmojiId) return;

      filteredUsers = totalEmojis.users?.filter(
        (user) => user.emojiId === getEmojiId,
      );
    }

    setUsers(
      filteredUsers,
      // ?.splice(0, paginationLimit)
    );

    if (usersContainer.current) {
      usersContainer.current.scrollTo(0, 0);
    }
  }, [activeTab]);

  function initializeTabs(): JSX.Element[] {
    const tabs = [];
    tabs.push(
      createTab(<span>All</span>, totalEmojis.usersCount, activeTab === 0),
    );

    totalEmojis.collection?.forEach((emoji, index) => {
      if (!emoji.count) return;
      if (!emoji.emojiId) return;
      tabs.push(
        createTab(
          <em-emoji id={emoji.emojiId}></em-emoji>,
          emoji.count,
          activeTab === index + 1,
        ),
      );
    });

    let maxSlides = MAX_SLIDES;
    if (mediaSize?.width) {
      if (mediaSize.width < 500) maxSlides = 3;
      if (mediaSize.width < 400) maxSlides = 2;
    }

    if (tabs.length < maxSlides) {
      const remainingTabs = maxSlides - tabs.length;
      for (let i = 0; i < remainingTabs; i++) {
        tabs.push(<div></div>);
      }
    }

    return tabs;
  }

  function createTab(
    emoji: JSX.Element,
    count: number | string,
    isActive: boolean,
  ): JSX.Element {
    return (
      <div>
        <button
          className={classNames(
            "relative flex gap-[5px] p-3 hover:bg-chw-cream-01",
            isActive
              ? "border-b-[#625DA6] font-semibold text-[#413D70] content-[''] before:absolute before:-bottom-[2px] before:left-0 before:h-1 before:w-full before:bg-chw-light-purple"
              : "font-normal text-black",
          )}
        >
          {emoji}
          <span>{count}</span>
        </button>
      </div>
    );
  }

  const showLoadMore = (): boolean => {
    return false;
    // TO FIX: FINISH THIS FUNCTION
    // if (!totalEmojis.collection) return false;
    // if (!users) return false;

    // const activeEmoji = totalEmojis.collection[activeTab];
    // if (!activeEmoji) return false;

    // const activeEmojiCount = activeEmoji.count;
    // const activeEmojiUsersCount = users.length;
    // if (activeEmojiUsersCount >= activeEmojiCount) return false;
    // return true;
  };

  const handleLoadMore = () => {};

  return (
    <Modal show={show} cancelButtonRef={cancelButtonRef} onClose={onClose}>
      <div className="flex items-center justify-between gap-4">
        <Dialog.Title
          as="h3"
          className="text-base font-semibold leading-6 text-chw-dark-green"
        >
          Reactions
        </Dialog.Title>
        <button
          type="button"
          className="-mx-1.5 -my-1.5 ms-auto inline-flex h-8 w-8 min-w-[32px] items-center justify-center rounded-lg bg-white p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white"
          aria-label="Close"
          onClick={onClose}
          ref={cancelButtonRef}
        >
          <span className="sr-only">Close</span>
          <SVGCloseButton
            bgStroke={{ default: "none", hover: "#625da6" }}
            stroke={{ default: "#686867", hover: "#fff" }}
            border={{ default: "#686867", hover: "none" }}
          />
        </button>
      </div>
      <div className="-ml-6 mt-5 w-[calc(100%_+_48px)] border-b border-solid border-b-[#C1BAB4] px-6 py-0">
        <SlickSlider
          className="reaction-slick-slider"
          sliderRef={slider}
          settings={{
            infinite: false,
            speed: 500,
            slidesToShow: MAX_SLIDES,
            slidesToScroll: MAX_SLIDES,
            responsive: [
              {
                breakpoint: 500,
                settings: {
                  slidesToShow: 3,
                  slidesToScroll: 3,
                },
              },
              {
                breakpoint: 400,
                settings: {
                  slidesToShow: 2,
                  slidesToScroll: 2,
                },
              },
            ],
          }}
        >
          {tabs.map((tab, index) => (
            <div
              key={index}
              onClick={() => {
                slider.current?.slickGoTo(index);
                setActiveTab(index);
              }}
            >
              {tab}
            </div>
          ))}
        </SlickSlider>
      </div>
      <div
        ref={usersContainer}
        className="round -ml-6 mt-1 flex max-h-64 w-[calc(100%_+_48px)] flex-col overflow-auto scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-chw-black-shadows"
      >
        {users?.map((user, index) => (
          <div
            key={index}
            className={classNames(
              "px-6 py-3 ",
              index === users.length - 1
                ? ""
                : "border-b border-solid border-b-[#C1BAB4] border-opacity-25",
            )}
          >
            <Link
              to={`${APP_ROUTES.PROFILE}/${user.userId}`}
              className="flex items-center gap-2"
            >
              <div className="h-14 w-14">
                <Avatar src={user.avatar} alt={user.name} />
              </div>
              <div className="flex items-center gap-2 text-[1.5rem]">
                {user.emojiId && <em-emoji id={user.emojiId}></em-emoji>}
                <span className="text-base font-medium hover:text-chw-light-purple">
                  {user.name}
                </span>
              </div>
            </Link>
          </div>
        ))}
        {showLoadMore() && (
          <ButtonLoadMore text="Load More Reactions" onClick={handleLoadMore} />
        )}
      </div>
    </Modal>
  );
}
