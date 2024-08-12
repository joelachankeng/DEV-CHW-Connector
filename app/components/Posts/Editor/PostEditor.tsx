import type { MutableRefObject } from "react";
import { useContext, useEffect, useState } from "react";
import { Tooltip } from "react-tooltip";
import SVGAddEmoji from "~/assets/SVGs/SVGAddEmoji";
import SVGAddImage from "~/assets/SVGs/SVGAddImage";
import SVGAddGIF from "~/assets/SVGs/SVGAddGIF";
import SVGAddDocument from "~/assets/SVGs/SVGAddDocument";
import type {
  BlockAPI,
  BlockToolData,
  OutputData,
  ToolConfig,
} from "@editorjs/editorjs";
import type EditorJS from "@editorjs/editorjs";
import { ClientOnly } from "remix-utils/client-only";
import { classNames } from "~/utilities/main";
import SVGPostComment from "~/assets/SVGs/SVGPostComment";
import { EditorBlock } from "~/components/Editor/EditorBlock";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import { Link, unstable_usePrompt, useNavigate } from "@remix-run/react";
import { Collapse } from "@kunukn/react-collapse";
import type { iEmojiPickerIcon } from "~/utilities/hooks/useEmojiMart";
import { useEmojiMart } from "~/utilities/hooks/useEmojiMart";
import { AppContext } from "~/contexts/appContext";
import { APP_ROUTES } from "~/constants";

const BUTTON_CLASSNAMES =
  "text-[#686867] h-6 w-6 hover:text-chw-light-purple transition duration-300 ease-in-out";

type iPostEditorProps = {
  editorRef: MutableRefObject<EditorJS | undefined>;
  containerClassNames: string;
  blockData: OutputData["blocks"];
  editorHolderId: string;
  editorPlaceholder?: string;
  preventWindowClosingMessage?: string;
  isSubmitting?: boolean;
  submitTooltipText?: string;
  onSubmit?: (editor: EditorJS, blockData: OutputData["blocks"]) => void;
  onChange?: (data: OutputData["blocks"]) => void;
};

export const EDITOR_ERROR_MESSAGE =
  "An unexpected error occurred with the post editor. Please refresh the page and try again.";

export default function PostEditor({
  containerClassNames,
  editorRef,
  blockData,
  editorHolderId,
  editorPlaceholder,
  preventWindowClosingMessage,
  isSubmitting,
  submitTooltipText,
  onSubmit,
  onChange,
}: iPostEditorProps) {
  const { appContext } = useContext(AppContext);
  const navigate = useNavigate();
  const { EmojiMart, showEmojiMart, setShowEmojiMart } = useEmojiMart();

  // const editorRef = useRef<EditorJS>();
  // if (postEditorRef) postEditorRef = editorRef;

  const [isMounted, setIsMounted] = useState(false);
  const [editorBlockData, setEditorBlockData] =
    useState<OutputData["blocks"]>(blockData);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      window.removeEventListener("beforeunload", editorPreventWindowClosing);
    };
  }, []);

  useEffect(() => {
    if (onChange) {
      onChange(editorBlockData);
    }
  }, [editorBlockData, onChange]);

  const handleDataOnChange = (data: OutputData) => {
    console.log("handleDataOnChange", data);

    if (data.blocks.length === 0) {
      setHasData(false);
      setEditorBlockData([]);
      window.removeEventListener("beforeunload", editorPreventWindowClosing);
    } else {
      setHasData(true);
      setEditorBlockData(data.blocks);
      window.addEventListener("beforeunload", editorPreventWindowClosing);
    }
  };

  const handleEmojiSelect = (emoji: iEmojiPickerIcon) => {
    if (!editorRef.current) return console.error("Editor not initialized");

    let currentIndex = editorRef.current.blocks.getCurrentBlockIndex();
    let currentBlock = editorRef.current.blocks.getBlockByIndex(currentIndex);

    if (!currentBlock) return console.error("Current block not found");

    const currentBlockDOM = currentBlock.holder;
    let contentEditable = currentBlockDOM.querySelector(
      "[contenteditable = true]",
    );

    if (!contentEditable) {
      currentIndex += 1;
      currentBlock = editorRef.current.blocks.insert(
        "paragraph",
        {},
        {},
        currentIndex,
        true,
      );
      contentEditable = currentBlock.holder.querySelector(
        "[contenteditable = true]",
      );
    }

    if (contentEditable) {
      //   console.log("currentIndex", currentIndex);
      const focusNode = document.getSelection()?.focusNode;
      //   console.log("focusNode", focusNode);
      if (!focusNode) {
        // console.log("focusNode not found");
        focusOnBlock(editorRef.current, currentIndex);
      } else if (
        !contentEditable.contains(focusNode) &&
        !contentEditable.isSameNode(focusNode)
      ) {
        // console.log("focusNode not in contentEditable");
        focusOnBlock(editorRef.current, currentIndex);
      }
      insertTextAtCaret(emoji.native);
    }
  };

  const handleAttachImageVideo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const imageBlock = addBlockToEndOfEditor(editorRef, "image", {}, {}, true);
    if (!imageBlock) return console.error("Image block not found");

    const button = imageBlock.holder.querySelector(
      ".cdx-button",
    ) as HTMLButtonElement | null;
    button?.click();
  };

  const handleAddGIF = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const imageBlock = addBlockToEndOfEditor(editorRef, "giphy", {}, {}, true);
    if (!imageBlock) return console.error("Giphy block not found");
  };

  const handleAttachDocument = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const imageBlock = addBlockToEndOfEditor(
      editorRef,
      "attaches",
      {},
      {},
      true,
    );
    if (!imageBlock) return console.error("Attaches block not found");

    const button = imageBlock.holder.querySelector(
      ".cdx-button",
    ) as HTMLButtonElement | null;
    button?.click();
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!onSubmit) return console.error("onSubmit function not provided");
    if (!editorRef.current) return console.error("Editor not initialized");

    onSubmit(editorRef.current, blockData);
  };

  function editorPreventWindowClosing(e: BeforeUnloadEvent) {
    e.preventDefault();
    return (
      preventWindowClosingMessage ||
      "You have unsaved changes in the editor. Are you sure you want to leave?"
    );
  }

  unstable_usePrompt({
    message:
      preventWindowClosingMessage ||
      "You have unsaved changes in the editor. Are you sure you want to leave?",
    when: ({ currentLocation, nextLocation }) =>
      editorBlockData.length !== 0 &&
      currentLocation.pathname !== nextLocation.pathname,
  });

  return (
    <>
      <div
        className={classNames(
          "flex flex-1 flex-col rounded-[20px] bg-[#FFF5E5] px-5 py-2.5",
          containerClassNames || "",
        )}
        onClick={(e) => {
          if (!editorRef.current) return;

          const target = e.target as HTMLElement | null;
          if (!target) return;
          if (target.closest("button")) return;

          if (hasData) return;

          const index = editorRef.current.blocks.getCurrentBlockIndex();
          focusOnBlock(editorRef.current, index);
        }}
      >
        <div className="relative min-h-[2rem] w-full">
          {appContext.User ? (
            <>
              {isMounted && (
                <ClientOnly fallback={<></>}>
                  {() => (
                    <>
                      <EditorBlock
                        onEditor={(editor: EditorJS | undefined) => {
                          editorRef.current = editor as EditorJS;
                        }}
                        placeholder={editorPlaceholder}
                        data={{
                          blocks: editorBlockData,
                        }}
                        holder={editorHolderId}
                        className={classNames(
                          "relative z-10 w-full transition-all duration-300 ease-in-out",
                        )}
                        onChange={handleDataOnChange}
                      />
                    </>
                  )}
                </ClientOnly>
              )}
            </>
          ) : (
            <div className="">{editorPlaceholder}</div>
          )}
        </div>
        <div className={classNames(hasData ? "mt-11 " : "my-2")}>
          <Collapse
            isOpen={showEmojiMart}
            transition={"height 300ms cubic-bezier(0.4, 0, 0.2, 1)"}
          >
            <EmojiMart
              id={`emoji-mart-mobile-add-comment-${editorHolderId}`}
              className={classNames(
                "post-react-button-emoji-mart",
                "h-60 w-full",
              )}
              pickerOptions={{
                skinTonePosition: "none",
                skin: 1,
                dynamicWidth: true,
                onEmojiSelect: (emoji: iEmojiPickerIcon) =>
                  handleEmojiSelect(emoji),
                onClickOutside: () => setShowEmojiMart(false),
              }}
            />
          </Collapse>
        </div>

        <div
          className={classNames(
            "z-20 flex items-center justify-between gap-5 transition-all duration-300 ease-in-out",
          )}
        >
          {appContext.User ? (
            <>
              <div className="flex items-center gap-5">
                <Tooltip id={`tooltip-editor-${editorHolderId}`} />
                <div className="relative flex items-center justify-center">
                  <button
                    type="button"
                    onClick={() => setShowEmojiMart(!showEmojiMart)}
                    data-tooltip-id={`tooltip-editor-${editorHolderId}`}
                    data-tooltip-content={`Insert Emoji`}
                    data-tooltip-place="top"
                    className={BUTTON_CLASSNAMES}
                  >
                    <SVGAddEmoji />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAttachImageVideo}
                  data-tooltip-id={`tooltip-editor-${editorHolderId}`}
                  data-tooltip-content={`Attach photo or video`}
                  data-tooltip-place="top"
                  className={BUTTON_CLASSNAMES}
                >
                  <SVGAddImage />
                </button>
                <button
                  type="button"
                  onClick={handleAddGIF}
                  data-tooltip-id={`tooltip-editor-${editorHolderId}`}
                  data-tooltip-content={`Add GIF`}
                  data-tooltip-place="top"
                  className={BUTTON_CLASSNAMES}
                >
                  <SVGAddGIF />
                </button>
                <button
                  type="button"
                  onClick={handleAttachDocument}
                  data-tooltip-id={`tooltip-editor-${editorHolderId}`}
                  data-tooltip-content={`Attach document`}
                  data-tooltip-place="top"
                  className={BUTTON_CLASSNAMES}
                >
                  <SVGAddDocument />
                </button>
              </div>
              {onSubmit && (
                <div className="">
                  {blockData.length > 0 && (
                    <>
                      {isSubmitting ? (
                        <LoadingSpinner className="" />
                      ) : (
                        <button
                          type="submit"
                          onClick={handleSubmit}
                          {...(submitTooltipText && {
                            "data-tooltip-id": `tooltip-editor-${editorHolderId}`,
                            "data-tooltip-content": submitTooltipText,
                            "data-tooltip-place": "top",
                          })}
                          className={BUTTON_CLASSNAMES}
                        >
                          <SVGPostComment />
                        </button>
                      )}
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="flex w-full justify-end">
              <Link
                to={APP_ROUTES.LOGIN}
                className="block cursor-pointer rounded-[40px] border-[none] bg-chw-light-purple px-[25px] py-2.5 text-center  text-base font-bold text-white transition duration-300 ease-in-out hover:bg-chw-dark-purple"
              >
                Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function focusOnBlock(editor: EditorJS, index: number) {
  editor.caret.focus();
  editor.caret.setToBlock(index, "default", 0);
}

function insertTextAtCaret(text: string) {
  const sel = window.getSelection();
  if (sel) {
    if (sel.getRangeAt && sel.rangeCount) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(text));
      range.collapse(false);
    }
  }
}

function addBlockToEndOfEditor(
  editorRef: React.MutableRefObject<EditorJS | undefined>,
  type?: string,
  data?: BlockToolData,
  config?: ToolConfig,
  needToFocus?: boolean,
  replace?: boolean,
  id?: string,
): BlockAPI | undefined {
  if (!editorRef.current) {
    console.error("Editor not initialized");
    return;
  }

  const lastIndex = editorRef.current.blocks.getBlocksCount() - 1;

  const currentBlock = editorRef.current.blocks.getBlockByIndex(lastIndex);
  if (!currentBlock) {
    console.error("Current block not found");
    return;
  }

  return editorRef.current.blocks.insert(
    type,
    data,
    config,
    lastIndex + 1,
    needToFocus,
    replace,
    id,
  );
}
