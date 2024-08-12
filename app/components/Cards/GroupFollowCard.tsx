import { Link } from "@remix-run/react";
import LoadingSpinner from "../Loading/LoadingSpinner";

export default function GroupFollowCard({
  image,
  title,
  membersCount,
  url,
  text,
  isMember,
  isLoading,
  onFollow,
}: {
  image: string;
  title: string;
  isMember: boolean;
  membersCount: number;
  url: string;
  text: {
    follow: string;
    unfollow: string;
  };
  isLoading: boolean;
  onFollow: (following: "REMOVE" | "ADD") => void;
}) {
  return (
    <div className="flex min-h-[21.5625rem] max-w-full flex-col overflow-hidden rounded-lg border-2 border-[#f4ebdf] bg-white max-md:min-h-0">
      <Link
        to={url}
        className="relative flex h-[12.5rem] overflow-hidden bg-[#f4ebdf] max-md:h-[7.5rem]"
      >
        <img
          src={image}
          className="absolute left-0 top-0 z-0 h-full w-full object-cover object-center"
          alt={title}
        />
        <img
          src={image}
          className="relative z-10 h-full w-full object-contain object-center backdrop-blur"
          alt={title}
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link
          to={url}
          className="text-lg font-bold leading-[1.125rem] text-chw-dark-green transition duration-300 ease-in-out hover:text-chw-light-purple"
        >
          {title}
        </Link>
        <p className="text-sm font-semibold leading-[1.125rem] text-chw-dim-gray">
          {membersCount} {membersCount > 1 ? "members" : "member"}
        </p>
        <div className="mt-4 flex flex-1 items-end">
          {isLoading ? (
            <div className="mx-auto flex cursor-progress justify-center">
              <LoadingSpinner />
            </div>
          ) : (
            <button
              className="w-full cursor-pointer rounded-[40px] border-[none] bg-chw-light-purple px-[.3125rem] py-2 text-center text-base font-bold text-white transition duration-300 ease-in-out hover:bg-chw-dark-purple"
              onClick={() => onFollow(isMember ? "REMOVE" : "ADD")}
            >
              {isMember ? text.unfollow : text.follow}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
