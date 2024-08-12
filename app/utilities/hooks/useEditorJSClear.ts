import type { OutputData } from "@editorjs/editorjs";
import type EditorJS from "@editorjs/editorjs";
import type { RefObject } from "react";
import { useState, useEffect } from "react";

export const useEditorJSClear = (
  editorRef: RefObject<EditorJS | undefined>,
  blocks: OutputData["blocks"],
) => {
  const [forceClear, setForceClear] = useState<string | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const triggerForceClear = () => {
    setForceClear(Date.now().toString());
  };

  useEffect(() => {
    if (!isSubmitting) return;
    if (blocks.length === 0) {
      if (forceClear) {
        setForceClear(undefined);
        setIsSubmitting(false);
      }
      return;
    }
    editorRef.current?.clear();

    const timer1 = setTimeout(
      () => setForceClear(Date.now().toString()),
      1 * 500,
    );

    return () => {
      clearTimeout(timer1);
    };
  }, [isSubmitting, forceClear, blocks.length]);

  return { triggerForceClear, setIsSubmitting, isSubmitting };
};
