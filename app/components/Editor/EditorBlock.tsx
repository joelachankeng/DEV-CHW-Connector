import { memo, useEffect, useRef } from "react";

import EditorJS, { type OutputData, EDITOR_TOOLS } from "./editor.client";
import _ from "lodash";

export const EditorComponent = ({
  data,
  holder,
  readOnly = false,
  className = "prose border rounded-lg px-10 py-3 w-full",
  placeholder,
  onReady,
  onChange,
  onEditor,
}: {
  data?: OutputData;
  holder: string;
  readOnly?: boolean;
  className?: string;
  placeholder?: string;
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
        // @ts-ignore
        tools: EDITOR_TOOLS,
        autofocus: false,
        minHeight: 0,
        data: data,
        onReady: () => {
          onReady?.();
        },
        async onChange(api: { saver: { save: () => any } }, event: any) {
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
  }, [holder, editorRef.current]);

  return (
    <>
      <div id={holder} className={className} data-readonly={readOnly} />
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
