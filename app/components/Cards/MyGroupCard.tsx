import { Link } from "@remix-run/react";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { classNames } from "~/utilities/main";

export default function MyGroupCard({
  className,
  image,
  title,
  membersCount,
  url,
  text,
  isLoading,
  onUnFollow,
}: {
  className?: string;
  image: string;
  title: string;
  membersCount: number;
  url: string;
  text: {
    view: string;
    unfollow: string;
  };
  isLoading: boolean;
  onUnFollow: () => void;
}) {
  return (
    <div
      className={classNames(
        "flex max-w-full flex-col gap-5 rounded-md border-2 border-[#f4ebdf] bg-white p-5",
        "max-md:rounded-none max-md:border-0 max-md:border-b-4 max-md:border-chw-black-shadows",
        className || "",
      )}
    >
      <div className="flex items-center justify-center gap-2.5">
        <Link
          to={url}
          className={classNames(
            "my-2 h-[3.75rem] w-[3.75rem] overflow-hidden rounded-full bg-[#f4ebdf]",
            "border border-transparent transition duration-300 ease-in-out hover:border-[3px] hover:border-chw-light-purple",
          )}
        >
          <img
            src={image}
            className="h-full w-full object-cover object-center"
            alt={title}
          />
        </Link>
        <div className="w-full flex-1">
          <Link
            to={url}
            className="text-lg font-bold leading-[1.125rem] text-chw-dark-green transition duration-300 ease-in-out hover:text-chw-light-purple"
          >
            {title}
          </Link>

          <p className="text-sm font-semibold leading-[1.125rem] text-chw-dim-gray">
            {membersCount} {membersCount > 1 ? "members" : "member"}
          </p>
        </div>
      </div>

      <div className="flex items-start gap-4">
        <Link
          to={url}
          className="w-full max-w-[50%] cursor-pointer rounded-[40px] border-[none] bg-chw-light-purple px-[.3125rem] py-2 text-center text-base font-bold text-white transition duration-300 ease-in-out hover:bg-chw-dark-purple"
        >
          {text.view}
        </Link>
        {text.unfollow !== "" && (
          <>
            {isLoading ? (
              <div className="mx-auto flex cursor-progress justify-center">
                <LoadingSpinner />
              </div>
            ) : (
              <button
                className="w-full max-w-[50%] cursor-pointer rounded-[40px] border-2 border-solid border-[none] border-chw-light-purple bg-white px-[.3125rem] py-2 text-center text-base font-bold text-chw-light-purple transition duration-300 ease-in-out hover:border-chw-yellow hover:bg-chw-yellow hover:text-black"
                onClick={onUnFollow}
              >
                {text.unfollow}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
