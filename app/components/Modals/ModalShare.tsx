import { Dialog } from "@headlessui/react";
import { useRef, useState } from "react";
import SVGCloseButton from "~/assets/SVGs/SVGCloseButton";
import Modal from "./ModalBlank";
import type { iGenericSuccess, iGenericError } from "~/models/appContext.model";
import { useAutoFetcher } from "~/utilities/hooks/useAutoFetcher";

type iModalShareProps = {
  show: boolean;
  link: string;
  hasShared?: boolean;
  postId: number;
  onClose: () => void;
  onShare: (hasShared: boolean) => void;
};

export default function ModalShare({
  show,
  link,
  hasShared,
  postId,
  onClose,
  onShare,
}: iModalShareProps) {
  const { submit: shareFetchSubmit } = useAutoFetcher<
    iGenericSuccess | iGenericError
  >("/api/post/share", (data) => {
    if (hasShared) return;

    if ("error" in data) {
      onShare(false);
      return;
    }
    onShare(true);
  });

  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [buttonText, setButtonText] = useState("Copy Link");

  const handleCopyLink = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    navigator.clipboard
      .writeText(link)
      .then(() => {
        setButtonText("Link Copied!");

        if (hasShared) return;
        shareFetchSubmit(
          {
            postId: postId.toString(),
          },
          "POST",
        );
      })
      .catch((err) => {
        console.error("Error copying link: ", err);
      });
  };

  return (
    <Modal show={show} cancelButtonRef={cancelButtonRef} onClose={onClose}>
      <div className="flex items-center justify-between gap-4">
        <Dialog.Title
          as="h3"
          className="text-base font-semibold leading-6 text-chw-dark-green"
        >
          Share Post
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
      <div className="mt-4">
        <div className="relative mt-1 rounded-md shadow-sm">
          <input
            type="link"
            name="share-link"
            className="block w-full rounded-3xl border border-solid border-chw-black-shadows bg-chw-floral-white px-5 py-2.5 text-base text-chw-dark-green placeholder:text-chw-dim-gray focus:border-chw-light-purple focus:ring-chw-light-purple disabled:pointer-events-none disabled:opacity-25"
            defaultValue={link}
            readOnly
          />
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-5 sm:mt-4">
        <button
          onClick={handleCopyLink}
          type="button"
          className="cursor-pointer rounded-[40px] border-[none] bg-chw-light-purple px-[25px] py-2.5 text-center text-base font-bold text-white transition duration-300 ease-in-out hover:bg-chw-dark-purple"
        >
          {buttonText}
        </button>
      </div>
    </Modal>
  );
}
