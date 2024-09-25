import type { Picker } from "emoji-mart";
import { memo, useEffect, useRef, useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import { classNames } from "../main";

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

export const EMOJIMART_EVENTS = {
  EMOJI_SELECTED: "EmojiMart:emojiSelected",
  HIDE_MOBILE_PICKER: "EmojiMart:hideMobilePicker",
  SHOW_MOBILE_PICKER: "EmojiMart:showMobilePicker",
};

export const useEmojiMart = () => {
  const EmojiPicker = useRef<HTMLDivElement>(null);

  const EmojiMartComponent = ({
    id,
    className,
    pickerOptions,
  }: {
    id: string;
    className?: string;
    pickerOptions?: object;
  }) => {
    useEffect(() => {
      (async () => {
        let picker: Picker | undefined = undefined;

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

        const pickerContainer = EmojiPicker.current;

        if (pickerContainer) {
          !pickerContainer.children.length &&
            pickerContainer.appendChild(picker as unknown as Node);
        }
      })().catch(console.error);
    }, [pickerOptions]);

    return (
      <>
        <ClientOnly fallback={null}>
          {() => (
            <>
              <div
                id={id}
                className={classNames("emoji-mart-container", className || "")}
                ref={EmojiPicker}
              ></div>
            </>
          )}
        </ClientOnly>
      </>
    );
  };

  const MobileComponent = ({
    id = "mobile-emoji-picker",
    className,
  }: {
    id?: string;
    className?: string;
  }) => {
    const [show, setShow] = useState(false);
    const currentId = useRef<string | undefined>(undefined);

    const handleShowMobilePicker = (e: CustomEvent<{ id: string }>) => {
      setShow(true);
      currentId.current = e.detail.id;
    };

    const handleHideMobilePicker = () => {
      setShow(false);
      currentId.current = undefined;
    };

    useEffect(() => {
      window.addEventListener(
        EMOJIMART_EVENTS.HIDE_MOBILE_PICKER,
        handleHideMobilePicker,
      );
      window.addEventListener(
        EMOJIMART_EVENTS.SHOW_MOBILE_PICKER,
        handleShowMobilePicker as EventListener,
      );

      return () => {
        window.removeEventListener(
          EMOJIMART_EVENTS.HIDE_MOBILE_PICKER,
          handleHideMobilePicker,
        );
        window.removeEventListener(
          EMOJIMART_EVENTS.SHOW_MOBILE_PICKER,
          handleShowMobilePicker as EventListener,
        );
      };
    }, []);

    const dispatchEmojiEvent = (emoji: iEmojiPickerIcon) => {
      const event: EMOJI_SELECTED_EVENT = new CustomEvent(
        EMOJIMART_EVENTS.EMOJI_SELECTED,
        {
          detail: {
            emoji,
            id: currentId.current,
          },
        },
      );

      dispatchEvent(event);
      dispatchHideMobilePicker();
    };

    return (
      <div
        className={classNames(
          "emoji-mart-mobile-container",
          "fixed bottom-auto left-0 top-0 z-50 flex h-full w-full items-center justify-center bg-black bg-opacity-50 backdrop-blur",
          show ? "block" : "hidden",
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
          <EmojiMart
            id={id}
            className={className}
            pickerOptions={{
              skinTonePosition: "none",
              skin: 1,
              dynamicWidth: false,
              onClickOutside: (e: PointerEvent) => {
                const target = e.target as HTMLElement;

                if (
                  target.closest(`#${id}`) ||
                  target.classList.contains("emoji-mart-emoji") ||
                  target.classList.contains("emoji-mart-container") ||
                  target.classList.contains("emoji-mart-mobile-container")
                ) {
                  dispatchHideMobilePicker();
                }
              },
              onEmojiSelect: dispatchEmojiEvent,
            }}
          />
        </div>
      </div>
    );
  };

  const EmojiMart = memo(EmojiMartComponent);
  const EmojiMartMobile = memo(MobileComponent);
  return { EmojiMart, EmojiMartMobile };
};

export const dispatchShowMobilePicker = (id: string) => {
  const event = new CustomEvent(EMOJIMART_EVENTS.SHOW_MOBILE_PICKER, {
    detail: { id },
  });
  dispatchEvent(event);
};

export const dispatchHideMobilePicker = () => {
  const event = new CustomEvent(EMOJIMART_EVENTS.HIDE_MOBILE_PICKER);
  dispatchEvent(event);
};

export type EMOJI_SELECTED_EVENT = CustomEvent<{
  emoji: iEmojiPickerIcon;
  id: string | undefined;
}>;
