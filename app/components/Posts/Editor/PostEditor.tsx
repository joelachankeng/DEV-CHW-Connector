import type { MutableRefObject } from "react";
import {
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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
import { Link, unstable_usePrompt } from "@remix-run/react";
import { Collapse } from "@kunukn/react-collapse";
import type {
  EMOJI_SELECTED_EVENT,
  iEmojiPickerIcon,
} from "~/utilities/hooks/useEmojiMart";
import {
  dispatchShowMobilePicker,
  EMOJIMART_EVENTS,
  useEmojiMart,
} from "~/utilities/hooks/useEmojiMart";
import { AppContext } from "~/contexts/appContext";
import { APP_ROUTES } from "~/constants";
import { VideoCameraIcon } from "@heroicons/react/24/outline";
import type { iEditor_Tools_Config } from "~/components/Editor/editor.client";

const BUTTON_CLASSNAMES =
  "text-[#686867] h-6 w-6 hover:text-chw-light-purple transition duration-300 ease-in-out";

export type iPostEditorPropSetter =
  | {
      setSubmitting: (status: boolean) => void;
      isSubmitting: () => boolean;
      setUploadStatus: (status: boolean) => void;
      isUploading: () => boolean;
    }
  | undefined;

type iPostEditorProps = {
  editorRef: MutableRefObject<EditorJS | undefined>;
  containerClassNames: string;
  blockData: OutputData["blocks"];
  editorHolderId: string;
  editorPlaceholder?: string;
  preventWindowClosingMessage?: string;
  isSubmitting?: boolean;
  submitTooltipText?: string;
  uploadEvents?: iEditor_Tools_Config["upload"];
  onSubmit?: (editor: EditorJS, blockData: OutputData["blocks"]) => void;
  onChange?: (data: OutputData["blocks"]) => void;
  propSetter?: MutableRefObject<iPostEditorPropSetter>;
};

export const EDITOR_ERROR_MESSAGE =
  "An unexpected error occurred with the post editor. Please refresh the page and try again.";

export default memo(PostEditorComponent);
function PostEditorComponent({
  containerClassNames,
  editorRef,
  blockData,
  editorHolderId,
  editorPlaceholder,
  preventWindowClosingMessage,
  isSubmitting,
  submitTooltipText,
  uploadEvents,
  onSubmit,
  onChange,
  propSetter,
}: iPostEditorProps) {
  const { appContext } = useContext(AppContext);
  const { EmojiMart } = useEmojiMart();

  const [isMounted, setIsMounted] = useState(false);
  const [hasData, setHasData] = useState(false);
  const [_isSubmitting, _setIsSubmitting] = useState(isSubmitting || false);
  const [_isUploading, _setIsUploading] = useState(false);
  const [showEmojiMart, setShowEmojiMart] = useState<boolean>(false);

  const propReturners = useRef({
    isSubmitting: _isSubmitting,
    isUploading: _isUploading,
  });
  const editorBlockData = useRef<OutputData["blocks"]>(blockData);
  const postEditorFiles = useRef<
    { toolName: string; file: File; isCompleted: boolean }[]
  >([]);

  useEffect(() => {
    if (!propSetter) return;

    propSetter.current = {
      setSubmitting: (status: boolean) => {
        _setIsSubmitting(status);
      },
      isSubmitting: () => propReturners.current.isSubmitting,
      setUploadStatus: (status: boolean) => {
        _setIsUploading(status);
      },
      isUploading: () => propReturners.current.isUploading,
    };

    return () => {
      propSetter.current = undefined;
    };
  }, [_isSubmitting, _isUploading, propSetter]);

  useEffect(() => {
    propReturners.current.isSubmitting = _isSubmitting;
    propReturners.current.isUploading = _isUploading;
  }, [_isSubmitting, _isUploading]);

  unstable_usePrompt({
    message:
      preventWindowClosingMessage ||
      "You have unsaved changes in the editor. Are you sure you want to leave?",
    when: ({ currentLocation, nextLocation }) =>
      editorBlockData.current.length !== 0 &&
      currentLocation.pathname !== nextLocation.pathname,
  });

  const editorPreventWindowClosing = useCallback(
    (e: BeforeUnloadEvent) => {
      e.preventDefault();
      return (
        preventWindowClosingMessage ||
        "You have unsaved changes in the editor. Are you sure you want to leave?"
      );
    },
    [preventWindowClosingMessage],
  );

  const handleDataOnChange = useCallback(
    (data: OutputData) => {
      if (onChange) {
        onChange(data.blocks);
      }

      if (data.blocks.length === 0) {
        setHasData(false);
        editorBlockData.current = [];
        window.removeEventListener("beforeunload", editorPreventWindowClosing);
      } else {
        setHasData(true);
        editorBlockData.current = data.blocks;
        window.addEventListener("beforeunload", editorPreventWindowClosing);
      }
    },
    [editorPreventWindowClosing, onChange],
  );

  useEffect(() => {
    setIsMounted(true);
    return () => {
      setIsMounted(false);
      window.removeEventListener("beforeunload", editorPreventWindowClosing);
    };
  }, [editorPreventWindowClosing]);

  useEffect(() => {
    const handleEmojiSelectListener = (event: EMOJI_SELECTED_EVENT) => {
      const { emoji, id } = event.detail;
      if (id !== editorHolderId) return;
      handleEmojiSelect(editorRef.current, emoji);
    };

    window.addEventListener(
      EMOJIMART_EVENTS.EMOJI_SELECTED,
      handleEmojiSelectListener as EventListener,
    );

    return () => {
      window.removeEventListener(
        EMOJIMART_EVENTS.EMOJI_SELECTED,
        handleEmojiSelectListener as EventListener,
      );
    };
  }, [editorHolderId, editorRef]);

  const createEditor = useMemo(
    () => (
      <EditorBlock
        onEditor={(editor: EditorJS | undefined) => {
          editorRef.current = editor as EditorJS;
        }}
        placeholder={editorPlaceholder}
        data={{
          blocks: editorBlockData.current,
        }}
        holder={editorHolderId}
        className={classNames(
          "relative z-10 w-full transition-all duration-300 ease-in-out",
        )}
        editorToolsConfig={{
          authorization: appContext.UploadKeys?.authorization,
          upload: {
            filterUrl: (toolName) => {
              if (uploadEvents?.filterUrl) {
                const newUrl = uploadEvents.filterUrl(toolName);
                if (newUrl) return newUrl;
              }
              return appContext.UploadKeys?.uploadUrl;
            },
            onBeforeUpload: (toolName, file) => {
              postEditorFiles.current.push({
                toolName,
                file,
                isCompleted: false,
              });
              _setIsUploading(true);
              propReturners.current.isUploading = true;
              if (uploadEvents?.onBeforeUpload)
                uploadEvents.onBeforeUpload(toolName, file);
            },
            onUploadComplete(toolName, file, result) {
              postEditorFiles.current = postEditorFiles.current.map((item) => {
                if (item.file === file && toolName == item.toolName) {
                  item.isCompleted = true;
                }
                return item;
              });

              if (postEditorFiles.current.every((item) => item.isCompleted)) {
                _setIsUploading(false);
                propReturners.current.isUploading = false;
              }

              if (uploadEvents?.onUploadComplete)
                uploadEvents.onUploadComplete(toolName, file, result);
            },
          },
        }}
        onChange={handleDataOnChange}
      />
    ),

    [
      appContext.UploadKeys,
      editorHolderId,
      editorPlaceholder,
      editorRef,
      uploadEvents,
      handleDataOnChange,
    ],
  );

  const handleAttachImage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const imageBlock = addBlockToEndOfEditor(
      editorRef.current,
      "image",
      {},
      {},
      true,
    );
    if (!imageBlock) return console.error("Image block not found");

    const button = imageBlock.holder.querySelector(
      ".cdx-button",
    ) as HTMLButtonElement | null;
    button?.click();
  };

  const handleAttachVideo = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const videoBlock = addBlockToEndOfEditor(
      editorRef.current,
      "video",
      {},
      {},
      true,
    );
    if (!videoBlock) return console.error("Video block not found");

    const button = videoBlock.holder.querySelector(
      ".cdx-button",
    ) as HTMLButtonElement | null;
    button?.click();
  };

  const handleAddGIF = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const imageBlock = addBlockToEndOfEditor(
      editorRef.current,
      "giphy",
      {},
      {},
      true,
    );
    if (!imageBlock) return console.error("Giphy block not found");
  };

  const handleAttachDocument = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const imageBlock = addBlockToEndOfEditor(
      editorRef.current,
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

    onSubmit(editorRef.current, editorBlockData.current);
  };

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
          if (
            target.closest("button") ||
            target.closest(".emoji-mart-container")
          )
            return;

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
                  {() => <>{createEditor}</>}
                </ClientOnly>
              )}
            </>
          ) : (
            <div className="">{editorPlaceholder}</div>
          )}
        </div>
        <div
          className={classNames(
            hasData ? "mt-32 max-md:mt-11" : "my-2",
            "transition-all duration-300 ease-in-out",
          )}
        >
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
                  handleEmojiSelect(editorRef.current, emoji),
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
                    onClick={() => {
                      if (window.innerWidth < 768) {
                        dispatchShowMobilePicker(editorHolderId);
                      } else {
                        setShowEmojiMart(!showEmojiMart);
                      }
                    }}
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
                  onClick={handleAttachImage}
                  data-tooltip-id={`tooltip-editor-${editorHolderId}`}
                  data-tooltip-content={`Attach photo`}
                  data-tooltip-place="top"
                  className={BUTTON_CLASSNAMES}
                >
                  <SVGAddImage />
                </button>
                <button
                  type="button"
                  onClick={handleAttachVideo}
                  data-tooltip-id={`tooltip-editor-${editorHolderId}`}
                  data-tooltip-content={`Attach video`}
                  data-tooltip-place="top"
                  className={BUTTON_CLASSNAMES}
                >
                  <VideoCameraIcon className="h-full w-full" />
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
                  {editorBlockData.current.length > 0 && (
                    <>
                      {_isSubmitting || _isUploading ? (
                        <div className="flex items-center gap-4 font-bold">
                          {_isUploading && <span>Uploading</span>}
                          <LoadingSpinner className="" />
                        </div>
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
  editorRef: EditorJS | undefined,
  type?: string,
  data?: BlockToolData,
  config?: ToolConfig,
  needToFocus?: boolean,
  replace?: boolean,
  id?: string,
): BlockAPI | undefined {
  if (!editorRef) {
    console.error("Editor not initialized");
    return;
  }

  const lastIndex = editorRef.blocks.getBlocksCount() - 1;

  const currentBlock = editorRef.blocks.getBlockByIndex(lastIndex);
  if (!currentBlock) {
    console.error("Current block not found");
    return;
  }

  return editorRef.blocks.insert(
    type,
    data,
    config,
    lastIndex + 1,
    needToFocus,
    replace,
    id,
  );
}

const handleEmojiSelect = (
  editorRef: EditorJS | undefined,
  emoji: iEmojiPickerIcon,
) => {
  if (!editorRef) return console.error("Editor not initialized");

  let currentIndex = editorRef.blocks.getCurrentBlockIndex();
  let currentBlock = editorRef.blocks.getBlockByIndex(currentIndex);

  if (!currentBlock) return console.error("Current block not found");

  const currentBlockDOM = currentBlock.holder;
  let contentEditable = currentBlockDOM.querySelector(
    "[contenteditable = true]",
  );

  if (!contentEditable) {
    currentIndex += 1;
    currentBlock = editorRef.blocks.insert(
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
      focusOnBlock(editorRef, currentIndex);
    } else if (
      !contentEditable.contains(focusNode) &&
      !contentEditable.isSameNode(focusNode)
    ) {
      // console.log("focusNode not in contentEditable");
      focusOnBlock(editorRef, currentIndex);
    }
    insertTextAtCaret(emoji.native);
  }
};
