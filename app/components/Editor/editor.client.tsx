import EditorJS, { type OutputData } from "@editorjs/editorjs";
import { Buffer } from "buffer";

import Header from "@editorjs/header";
import List from "@editorjs/list";
import ImageTool from "@editorjs/image";
import AttachesTool from "@editorjs/attaches";

import Embed from "./plugins/embed";
import GIPHY from "./plugins/giphy";
import EmptyBlock from "./plugins/emptyBlock";
// export * from "@editorjs/paragraph";

const EDITOR_TOOLS = {
  emptyBlock: {
    class: EmptyBlock,
  },
  header: {
    class: Header,
    inlineToolbar: ["link"],
  },
  list: {
    class: List,
    inlineToolbar: true,
  },
  embed: {
    class: Embed,
    inlineToolbar: true,
  },
  image: {
    class: ImageTool,
    config: {
      uploader: {
        uploadByFile(file: File) {
          return new Promise(async (resolve) => {
            if (
              !file ||
              !file.type.includes("image/") ||
              file.size > 1024 * 1024 * 2
            )
              return resolve({ success: 0, file: { url: "" } });
            window.Buffer = Buffer;
            const image64 = Buffer.from(await file.arrayBuffer()).toString(
              "base64",
            );

            console.log("image64", file.type);

            const imageData = "data:" + file.type + ";base64," + image64;
            return resolve({
              success: 1,
              file: { url: imageData },
            });
          });
        },
        uploadByUrl(url: string) {
          return new Promise((resolve) => {
            return resolve({
              success: 1,
              file: {
                url,
              },
            });
          });
        },
      },
    },
  },
  giphy: {
    class: GIPHY,
    config: {
      apiKey: "9Ixlv3DWC1biJRI57RanyL7RTbfzz0o7",
    },
  },
  attaches: {
    class: AttachesTool,
    config: {
      uploader: {
        uploadByFile(file: File) {
          return new Promise(async (resolve) => {
            if (!file || file.size > 1024 * 1024 * 100)
              return resolve({ success: 0, file: { url: "" } });
            console.log("file", file);

            return resolve({
              success: 1,
              file: {
                url: URL.createObjectURL(file),
                name: file.name,
                size: file.size,
                title: file.name,
              },
            });
          });
        },
      },
    },
  },
};

export { EDITOR_TOOLS, type OutputData };

export default EditorJS;
