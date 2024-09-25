import { memo, useEffect, useRef } from "react";
import EditorJS, {
  type iEditor_Tools_Config,
  EDITOR_TOOLS,
  type OutputData,
} from "./editor.client";
import _ from "lodash";
import {
  getStringWithEmojisLength,
  hasSingleEmoji,
  isAllEmojis,
} from "~/utilities/main";
import type { API, BlockMutationEvent } from "@editorjs/editorjs";

export const EditorComponent = ({
  data,
  holder,
  readOnly = false,
  className = "prose border rounded-lg px-10 py-3 w-full",
  placeholder,
  dataContentId,
  editorToolsConfig,
  onReady,
  onChange,
  onEditor,
}: {
  data?: OutputData;
  holder: string;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
  dataContentId?: string;
  editorToolsConfig?: iEditor_Tools_Config;
  onReady?(): void;
  onChange?(val: OutputData): void;
  onEditor(editor: EditorJS): void;
}) => {
  const editorRef = useRef<EditorJS>();

  useEffect(() => {
    if (!editorRef.current || _.isEmpty(editorRef.current)) {
      const getHolder = document.getElementById(holder);

      if (!getHolder) return;

      const editor = new EditorJS({
        defaultBlock: readOnly ? "emptyBlock" : "paragraph",
        holder: holder,
        readOnly: readOnly,
        placeholder: placeholder,
        tools: EDITOR_TOOLS(editorToolsConfig) as unknown as never, // type was not provided by the library
        autofocus: false,
        minHeight: 0,
        data: data,
        onReady: () => {
          updateParagaphBlocks(editor);
          onReady?.();
        },
        async onChange(
          api: API,
          event: BlockMutationEvent | BlockMutationEvent[],
        ) {
          updateParagaphBlocks(editor);
          if (readOnly) return;
          const data = await api.saver.save();
          if (onChange) onChange(data);
        },
      });

      editorRef.current = editor;
      onEditor?.(editor);

      document.addEventListener("click", updateEditorToolbar);
    }

    //add a return function handle cleanup
    return () => {
      if (editorRef.current && editorRef.current.destroy) {
        console.log("destroying editor");

        editorRef.current.destroy();
      }
    };
  }, [
    holder,
    readOnly,
    placeholder,
    data,
    onEditor,
    onReady,
    onChange,
    editorToolsConfig,
  ]);

  return (
    <>
      <div
        id={holder}
        className={className}
        data-readonly={readOnly}
        data-content-id={dataContentId}
      />
    </>
  );
};

export const EditorBlock = memo(EditorComponent);

function updateEditorToolbar(e: MouseEvent) {
  const target = e.target as HTMLElement | null;
  if (!target) return;

  // // if window width is less than 650px, do not show the editor toolbar
  // if (window.innerWidth >= 650) {
  //   document.querySelectorAll(".editor-top-parent-active").forEach((el) => {
  //     el.classList.remove("editor-top-parent-active");
  //   });
  //   return;
  // }

  if (
    target.closest(".cdx-search-field") ||
    target.classList.contains("cdx-search-field")
  )
    return;

  const isToolbar =
    target.closest(".ce-toolbar__actions") ||
    target.classList.contains("ce-toolbar__actions");
  if (isToolbar) {
    const parent = target.closest(".editor-top-parent");
    if (!parent) return;

    parent.classList.add("editor-top-parent-active");
  } else {
    document.querySelectorAll(".editor-top-parent").forEach((el) => {
      el.classList.remove("editor-top-parent-active");
    });
  }
}

function updateParagaphBlocks(editor: EditorJS) {
  const blocksLength = editor.blocks.getBlocksCount();

  for (let i = 0; i < blocksLength; i++) {
    const block = editor.blocks.getBlockByIndex(i);
    if (!block) continue;
    if (block.name !== "paragraph") continue;

    const paragraph = block.holder as HTMLElement;
    if (!paragraph) continue;

    const text = paragraph.innerText;

    if (isAllEmojis(text)) {
      const textLength = getStringWithEmojisLength(text);
      if (textLength <= 3) {
        paragraph.classList.add("single-emoji");
      } else {
        if (hasSingleEmoji(text)) {
          paragraph.classList.add("single-emoji");
        } else {
          paragraph.classList.remove("single-emoji");
        }
      }
    } else {
      paragraph.classList.remove("single-emoji");
    }
  }
}
