import { Transition } from "@headlessui/react";
import { Link, useLocation } from "@remix-run/react";
import { Fragment, useContext, useEffect, useRef, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import { Collapse } from "@kunukn/react-collapse";
import { classNames, formatFileSize } from "~/utilities/main";
import {
  ArrowUpOnSquareIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  MusicalNoteIcon,
  PhotoIcon,
  VideoCameraIcon,
} from "@heroicons/react/20/solid";
import { AppContext } from "~/contexts/appContext";

export default function UploadManager() {
  const { UploadManager } = useContext(AppContext);

  const [isVisible, setIsVisible] = useState(false);

  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    updatePositon();
  }, [location.pathname]);

  useEffect(() => {
    updatePositon();
    window.addEventListener("scroll", updatePositon);
    return () => {
      window.removeEventListener("scroll", updatePositon);
    };
  }, []);

  useEffect(() => {
    if (UploadManager.uploadManager.attachments.length > 0) {
      setIsVisible(true);
      window.addEventListener("beforeunload", preventWindowClosing);
    } else {
      setIsVisible(false);
      window.removeEventListener("beforeunload", preventWindowClosing);
    }
  }, [UploadManager.uploadManager.attachments.length]);

  function updatePositon() {
    if (!element.current) return;

    const footer = document.querySelector("footer");
    if (!footer) return;

    const offset = 0;
    const top = footer.getBoundingClientRect().top;
    const footerInView =
      top + offset >= 0 && top - offset <= window.innerHeight;

    if (footerInView) {
      element.current.style.bottom = `${footer.getBoundingClientRect().height}px`;
    } else {
      element.current.style.bottom = "0";
    }
  }

  function preventWindowClosing(event: BeforeUnloadEvent) {
    event.preventDefault();
    return "Attachment upload is in progress. Are you sure you want to close the window?";
  }

  const getAttachmentIcon = (type: string): JSX.Element => {
    const iconProps = {
      className: "h-6 w-6 text-gray-600 group-hover:text-chw-light-purple",
      "aria-hidden": true,
    };

    const formattedType = type.toLowerCase();
    switch (true) {
      case formattedType.startsWith("image"):
        return <PhotoIcon {...iconProps} />;
      case formattedType.startsWith("audio"):
        return <MusicalNoteIcon {...iconProps} />;
      case formattedType.startsWith("video"):
        return <VideoCameraIcon {...iconProps} />;
      default:
        return <DocumentTextIcon {...iconProps} />;
    }
  };

  return (
    <>
      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
        show={isVisible}
      >
        <div
          className="fixed bottom-0 right-[15px] z-20 mb-4 transition-all"
          ref={element}
        >
          <div className="relative w-screen max-w-md flex-auto overflow-hidden rounded-3xl bg-white text-sm leading-6 shadow-lg ring-1 ring-gray-900/5">
            <div className="relative grid divide-x divide-gray-900/5 bg-gray-50">
              <div className="flex items-center justify-between gap-x-2.5 p-3 font-semibold text-gray-900 hover:bg-gray-100">
                <div className="flex items-center gap-2.5">
                  <ArrowUpOnSquareIcon
                    className="h-5 w-5 flex-none text-gray-400"
                    aria-hidden="true"
                  />
                  <span> Upload Queue</span>
                </div>
                <button onClick={() => setIsCollapsed(!isCollapsed)}>
                  <ChevronDownIcon
                    className={classNames(
                      "h-6 w-6 flex-none text-gray-400  hover:text-chw-dark-purple",
                      isCollapsed ? "" : "rotate-180 transform",
                    )}
                    aria-hidden="true"
                  />
                </button>
              </div>
              <div className="absolute bottom-0 h-1 w-full border-0 bg-chw-yellow">
                <div className="h-full w-12 bg-chw-dark-purple"></div>
              </div>
            </div>
            <Collapse
              isOpen={!isCollapsed}
              transition={"height 300ms cubic-bezier(0.4, 0, 0.2, 1)"}
            >
              <div className="round max-h-80 overflow-auto p-4 scrollbar-thin scrollbar-track-gray-50 scrollbar-thumb-chw-black-shadows">
                {UploadManager.uploadManager.attachments.map((item, index) => (
                  <div
                    key={`${item.file.name}-${index}`}
                    className="group relative flex items-center gap-x-6 rounded-lg p-2 hover:bg-gray-50"
                  >
                    <div className="mt-1 flex h-11 w-11 flex-none items-center justify-center rounded-lg bg-gray-50 group-hover:bg-white">
                      {getAttachmentIcon(item.file.type)}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">
                        {item.file.name}
                      </div>
                      <p className="mt-1 text-gray-600">
                        {formatFileSize(item.file.size)} | Uploading to{" "}
                        <Link
                          className="font-semibold text-chw-light-purple transition duration-300 ease-in-out hover:underline"
                          to={item.content.url}
                        >
                          {item.content.type}
                          {` #${item.content.id} `}
                        </Link>
                      </p>
                    </div>
                    <div className="h-6 w-6">
                      <div className="h-6 w-6">
                        <CircularProgressbar
                          value={66}
                          text={`${66}%`}
                          styles={buildStyles({
                            rotation: 0.25,
                            strokeLinecap: "butt",
                            textSize: "0px",
                            pathTransitionDuration: 0.5,
                            pathColor: `#625DA6`,
                            textColor: "#000",
                            trailColor: "rgba(229, 231, 235)",
                          })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Collapse>
          </div>
        </div>
      </Transition>
    </>
  );
}
