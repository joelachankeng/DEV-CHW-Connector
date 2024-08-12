import { Fragment, useEffect, useState } from "react";
import {
  Dialog,
  DialogPanel,
  Transition,
  TransitionChild,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  ChevronDownIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/20/solid";
import { classNames } from "~/utilities/main";
import SVGCloseButton from "~/assets/SVGs/SVGCloseButton";

type iDrawerProps = {
  open: boolean;
  position: "left" | "right";
  children: React.ReactNode;
  onClose: () => void;
};

export default function Drawer({
  open,
  position,
  children,
  onClose,
}: iDrawerProps) {
  const [sidebarOpen, setSidebarOpen] = useState(open);

  useEffect(() => {
    setSidebarOpen(open);
    modalOpenHandler();
  }, [open]);

  function modalOpenHandler() {
    const html = document.body.parentNode as HTMLElement | null;
    if (html) {
      html.style.paddingRight = "0px";
    }
  }

  return (
    <>
      <Transition show={sidebarOpen}>
        <Dialog
          className="relative z-[110]"
          onClose={(value) => {
            onClose();
          }}
        >
          <TransitionChild
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black backdrop:blur-md opacity-50" />
          </TransitionChild>

          <div
            className={classNames(
              "fixed inset-0 flex w-full",
              position === "right" ? "justify-end left-auto right-0 top-0" : "",
            )}
          >
            <TransitionChild
              enter="transition ease-in-out duration-300 transform"
              enterFrom={
                position === "left" ? "-translate-x-full" : "translate-x-full"
              }
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo={
                position === "left" ? "-translate-x-full" : "translate-x-full"
              }
            >
              <DialogPanel
                className={classNames(
                  "relative flex w-full max-w-xs flex-1",
                  position === "left" ? "mr-16" : "ml-16",
                )}
              >
                {/* Sidebar component, swap this element with another sidebar if you like */}
                <div className="flex grow flex-col overflow-y-auto bg-[#FFF5E5] p-5">
                  <TransitionChild
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="flex w-full justify-end">
                      <div className="">
                        <button className="h-6 w-6" onClick={onClose}>
                          <span className="sr-only">Close SideBar</span>
                          <SVGCloseButton
                            bgStroke={{ default: "none", hover: "#032525" }}
                            stroke={{ default: "#686867", hover: "#fff" }}
                            border={{ default: "#686867", hover: "none" }}
                          />
                        </button>
                      </div>
                    </div>
                  </TransitionChild>
                  {children}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
