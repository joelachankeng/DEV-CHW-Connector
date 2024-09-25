import { Fragment, useEffect, useRef, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";
import type { ReactNode } from "react";
import LoadingSpinner from "../Loading/LoadingSpinner";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Modal from "./ModalBlank";

type iModalNotificationProps = {
  title: string | ReactNode;
  content: ReactNode;
  show: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  spinner?: boolean;
  cancelButton?: {
    display?: boolean;
    text?: string;
  };
  confirmButton?: {
    display?: boolean;
    text?: string;
  };
};

export default function ModalNotification({
  title,
  content,
  show,
  onClose,
  onConfirm,
  spinner = true,
  cancelButton = {
    display: true,
    text: "Cancel",
  },
  confirmButton = {
    display: true,
    text: "Confirm",
  },
}: iModalNotificationProps) {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    if (!show) {
      setClicked(false);
    }
  }, [show]);

  return (
    <Modal show={show} cancelButtonRef={cancelButtonRef} onClose={onClose}>
      <div className="sm:flex sm:items-start">
        <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
          <FontAwesomeIcon
            icon={faTriangleExclamation}
            className="h-4 w-4 text-red-500"
            aria-hidden="true"
          />
        </div>
        <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
          <Dialog.Title
            as="h3"
            className="text-base font-semibold leading-6 text-chw-dark-green"
          >
            {title}
          </Dialog.Title>
          <div className="mt-2">{content}</div>
        </div>
      </div>
      <div className="mt-5 flex justify-end gap-5 sm:mt-4">
        {clicked ? (
          <LoadingSpinner />
        ) : (
          <>
            {confirmButton?.display !== false && (
              <button
                className="cursor-pointer rounded-[40px] border-[none] bg-chw-light-purple px-[25px] py-2.5 text-center text-base font-bold text-white transition duration-300 ease-in-out hover:bg-chw-dark-purple"
                type="submit"
                onClick={() => {
                  if (onConfirm) {
                    onConfirm();
                  }
                  if (spinner) setClicked(true);
                }}
              >
                {confirmButton?.text}
              </button>
            )}
            {cancelButton?.display !== false && (
              <button
                type="button"
                className="flex w-auto items-center gap-2 text-base font-bold text-chw-dark-green transition duration-300 ease-in-out hover:text-chw-dark-purple focus-visible:outline-none"
                onClick={onClose}
                ref={cancelButtonRef}
              >
                {cancelButton?.text}
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
