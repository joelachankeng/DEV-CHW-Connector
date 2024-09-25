// import types
import type { OutputData } from "./editor.client";
// import libs
import type EditorJS from "./editor.client";
import { useState } from "react";
import { ClientOnly } from "remix-utils/client-only";
import { EditorBlock } from "./EditorBlock";

export const Editor = ({
  holder,
  onEditor,
}: {
  holder: string;
  onEditor?(editor: EditorJS): void;
}) => {
  const [data, setData] = useState<OutputData>();

  return (
    <ClientOnly fallback={null}>
      {() => (
        <EditorBlock
          onEditor={(editor: EditorJS | undefined) => {
            onEditor?.(editor as EditorJS);
          }}
          data={data}
          onChange={setData}
          holder={holder}
        />
      )}
    </ClientOnly>
  );
};
