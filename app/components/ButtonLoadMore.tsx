import { faChevronDown } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ButtonLoadMore({
  text = "Load More",
  onClick,
}: {
  text?: string;
  onClick: () => void;
}) {
  return (
    <>
      <div className="">
        <button
          className="group flex font-medium flex-col mx-auto justify-center items-center text-chw-light-purple hover:text-[#625DA6] transition duration-300 ease-in-out"
          onClick={() => onClick()}
        >
          {text}
          <FontAwesomeIcon
            icon={faChevronDown}
            className="h-4 w-4 animate-bounce group-hover:animate-none group-hover:text-chw-yellow"
          />
        </button>
      </div>
    </>
  );
}
