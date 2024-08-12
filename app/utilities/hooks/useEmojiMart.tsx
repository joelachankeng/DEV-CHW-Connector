import type { Picker } from "emoji-mart";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import { classNames } from "../main";
import { useMediaSize } from "./useMediaSize";
import { createPortal } from "react-dom";
import _ from "lodash";

export type iEmojiPickerIcon = {
  id: string;
  name: string;
  native: string;
  unified: string;
  keywords: string[];
  shortcodes: string;
  aliases: string[];
  emoticons: string[];
};

export const useEmojiMart = () => {
  const EmojiPicker = useRef<HTMLDivElement>(null);

  // const mediaQuery = useMediaSize();

  const [showEmojiMart, setShowEmojiMart] = useState<boolean>(false);

  const EmojiMartComponent = ({
    id,
    className,
    pickerOptions,
  }: {
    id: string;
    className?: string;
    pickerOptions?: object;
  }) => {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
      if (!isMounted) setIsMounted(true);
    }, [isMounted]);

    // useEffect(() => {
    //   if (_.isEqual(pickerOptions, pickerOptionsState)) return;
    //   setPickerOptionsState(pickerOptions || {});
    // }, [pickerOptions, pickerOptionsState]);
    // const picker = useRef<Picker | undefined>(undefined);
    // const container = useRef<HTMLDivElement>(null);
    // const [containerElement, setContainerElement] = useState<Element | null>(
    //   container.current,
    // );

    // useEffect(() => {
    //   if (!containerElement) return;
    //   console.log("containerElement", containerElement);
    // }, [containerElement]);

    useEffect(() => {
      (async () => {
        let picker: Picker | undefined = undefined;
        // console.log("EmojiMart", window.emojiMart);

        if (
          window.emojiMart &&
          window.emojiMart[Symbol.toStringTag] === "Module"
        ) {
          picker = new window.emojiMart.Picker(pickerOptions);
        } else {
          const EmojiMart = await import("emoji-mart");
          const EmojiData = await import("@emoji-mart/data");
          picker = new EmojiMart.Picker(pickerOptions);

          await EmojiMart.init({ EmojiData });
        }

        window.emojiMart = EmojiMart;

        // EmojiMart.getEmojiDataFromNative("grinning").then(console.log);

        const pickerContainer = EmojiPicker.current;

        if (pickerContainer) {
          !pickerContainer.children.length &&
            pickerContainer.appendChild(picker as unknown as Node);
        }
      })().catch(console.error);
    }, [pickerOptions]);

    useEffect(() => {
      // if (!mediaQuery) return;
      // if (!picker.current) return;
      // const pickerContainer =
      //   mediaQuery && mediaQuery?.width < 768
      //     ? document.querySelector(`#${EMOJIMARTMOBILE_ID}`)
      //     : EmojiPicker.current;
      // if (pickerContainer) {
      //   !pickerContainer.children.length &&
      //     pickerContainer.appendChild(picker.current as unknown as Node);
      // }
    }, []);

    useEffect(() => {
      // if (!mediaQuery) return;
      // console.log("mediaQuery", mediaQuery);
      // const mobileContainer = document.getElementById(EMOJIMARTMOBILE_ID);
      // if (!mobileContainer) return;
      // if (mediaQuery.width < 768 && showEmojiMart) {
      //   mobileContainer.parentElement?.classList.remove("!hidden");
      // } else {
      //   mobileContainer.parentElement?.classList.add("!hidden");
      // }
    }, [showEmojiMart]);

    // useEffect(() => {
    //   if (!mediaQuery) return;

    //   // if less than 768px, move the container to the body
    //   if (mediaQuery.width < 768) {
    //     console.log("moving to body", container.current);

    //     // document.body.appendChild(container.current as Node);
    //   } else {
    //     if (parent.current) {
    //       parent.current.appendChild(container.current as Node);
    //     }
    //   }
    // }, [mediaQuery?.width]);

    const containerRef = useCallback((container: HTMLDivElement) => {
      // if (!container) return;
      // console.log("containerRef", container);
      // parent.current = container.parentElement;
      // document.body.appendChild(container);
    }, []);

    const Component = () => {
      return (
        <>
          {/* {showEmojiMart && ( */}
          <ClientOnly fallback={null}>
            {() => (
              <>
                <div
                  className={classNames(
                    "emoji-mart-container",
                    className || "",
                  )}
                  ref={EmojiPicker}
                ></div>
              </>
            )}
          </ClientOnly>
          {/* )} */}
        </>
      );
    };

    const MobileComponent = () => {
      const portal = document.getElementById("portal");
      if (!portal) {
        return null;
      }

      return createPortal(
        <div
          id={id}
          className={classNames(
            showEmojiMart ? "" : "!hidden",
            "fixed bottom-auto left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black bg-opacity-50 backdrop-blur",
          )}
        >
          <div
            className={classNames(
              "emoji-mart-container",
              "w-full",
              "inset-y-auto left-auto mt-[65px] h-[85%] min-h-[15rem] w-auto max-w-lg p-5",
              "[&>div]:!h-[inherit] [&_em-emoji-picker]:h-[inherit]",
            )}
          >
            <MemoComponent />
          </div>
        </div>,

        portal,
      );
    };

    const MemoComponent = memo(Component);

    if (typeof window !== "object") {
      return null;
    }

    const portal = document.getElementById("portal");
    if (!portal) {
      return null;
    }

    // if (!mediaQuery) return null;

    return (
      <>
        {isMounted &&
          (window.outerWidth < 768 ? <MobileComponent /> : <MemoComponent />)}
      </>
    );

    // return createPortal(<div className=""></div>, portal);
  };

  // const EmojiMartMobile = ({ id }: { id: string }) => {
  //   if (typeof window !== "object") {
  //     return null;
  //   }

  //   const portal = document.getElementById("portal");
  //   if (!portal) {
  //     return null;
  //   }

  //   console.log("EmojiMartMobile", id);

  //   return createPortal(
  //     <>
  //       <div
  //         id={id}
  //         className={classNames(
  //           "z-50 max-md:fixed max-md:bottom-auto max-md:left-0 max-md:top-0 max-md:flex max-md:h-full max-md:w-full max-md:items-center max-md:justify-center max-md:bg-black max-md:bg-opacity-50 max-md:backdrop-blur",
  //         )}
  //       >
  //         <ClientOnly fallback={null}>
  //           {() => (
  //             <div
  //               className={classNames(
  //                 "emoji-mart-container",
  //                 "w-full",
  //                 "max-md:inset-y-auto max-md:left-auto max-md:mt-[65px] max-md:h-[85%] max-md:min-h-[15rem] max-md:w-auto",
  //                 "[&_em-emoji-picker]:h-[inherit]",
  //               )}
  //             >
  //               <EmojiMartComponent />
  //             </div>
  //           )}
  //         </ClientOnly>
  //       </div>
  //     </>,
  //     portal,
  //   );
  // };

  const EmojiMart = memo(EmojiMartComponent);
  const EmojiMartMobile = memo(EmojiMartComponent);

  return { EmojiMart, showEmojiMart, setShowEmojiMart, EmojiMartMobile };
};
