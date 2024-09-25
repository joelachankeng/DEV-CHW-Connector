import EditorJS, { type OutputData } from "@editorjs/editorjs";
import { Buffer } from "buffer";

import Header from "@editorjs/header";
import List from "@editorjs/list";
import ImageTool from "@editorjs/image";
import AttachesTool from "@editorjs/attaches";

import Embed from "./plugins/embed";
import GIPHY from "./plugins/giphy";
import EmptyBlock from "./plugins/emptyBlock";
import VideoTool from "./plugins/video";

import type { AxiosProgressEvent } from "axios";
import axios, { isAxiosError } from "axios";
import _ from "lodash";
import { APP_UPLOADS } from "~/constants";

type iUploadResult = {
  success: boolean;
  file: {
    url: string;
    name: string;
    size: number;
    title: string;
    path: string;
  };
};

type iUploadEvents = {
  filterUrl: (toolName: string) => string;
  onBeforeUpload?: (toolName: string, file: File) => void;
  onUploadProgress?: (toolName: string, file: File, progress: number) => void;
  onUploadComplete?: (
    toolName: string,
    file: File,
    result: iUploadResult | Error,
  ) => void;
};

export type iEditor_Tools_Config = {
  authorization: string;
  upload?: iUploadEvents;
};

const EDITOR_TOOLS = (config?: iEditor_Tools_Config) => {
  return {
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
      inlineToolbar: true,
      config: {
        uploader: {
          uploadByFile(file: File) {
            return new Promise((resolve) => {
              (async () => {
                if (
                  !file ||
                  !file.type.includes("image/") ||
                  file.size > APP_UPLOADS.FILE_SIZE_LIMIT.IMAGE
                ) {
                  if (!file.type.includes("image/")) {
                    throw new Error("File is not an image");
                  } else {
                    throw new Error("File is larger than 2MB");
                  }
                }
                window.Buffer = Buffer;
                const image64 = Buffer.from(await file.arrayBuffer()).toString(
                  "base64",
                );

                const imageData = "data:" + file.type + ";base64," + image64;
                return resolve({
                  success: 1,
                  file: { url: imageData },
                });
              })().catch((e: Error) => {
                alert(e.message);
                console.error(e);
                return resolve({
                  success: 0,
                  file: {
                    url: "",
                  },
                });
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
      inlineToolbar: true,
      config: {
        apiKey: "9Ixlv3DWC1biJRI57RanyL7RTbfzz0o7",
      },
    },
    attaches: {
      class: AttachesTool,
      inlineToolbar: true,
      config: {
        uploader: {
          uploadByFile(file: File) {
            return new Promise((resolve) => {
              (async () => {
                console.log("file", file);

                const result = await runUpload("attaches", file, config);
                console.log("result", result);

                resolve(result);
              })().catch((e: Error) => {
                console.error(e);
                return resolve({ success: false });
              });
            });
          },
        },
      },
    },
    video: {
      class: VideoTool,
      inlineToolbar: true,
      config: {
        uploader: {
          uploadByFile(file: File) {
            return new Promise((resolve) => {
              (async () => {
                const result = await runUpload("attaches", file, config);
                resolve({
                  ...result,
                  stretched: true,
                });
              })().catch((e: Error) => {
                console.error(e);
                return resolve({
                  success: 0,
                  file: {
                    url: "",
                  },
                  stretched: true,
                });
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
                stretched: true,
              });
            });
          },
        },
        player: {
          controls: true,
          autoplay: false,
        },
      },
    },
  };
};

const getProgressCompleted = (event: AxiosProgressEvent): number => {
  if (!event.total) return 0;
  const percentCompleted = Math.round((event.loaded * 100) / event.total);
  return percentCompleted;
};

const runUpload = async (
  toolName: string,
  file: File,
  config?: iEditor_Tools_Config,
): Promise<iUploadResult> => {
  const uploadResult: iUploadResult = {
    success: false,
    file: {
      url: "",
      name: "",
      size: 0,
      title: "",
      path: "",
    },
  };

  if (!config) {
    console.error(`config is required for ${_.upperFirst(toolName)} Tool`);
    return uploadResult;
  }

  const { filterUrl, onBeforeUpload, onUploadProgress, onUploadComplete } =
    config.upload || {};

  if (!filterUrl) {
    console.error(`filterUrl is required for ${_.upperFirst(toolName)} Tool`);
    return uploadResult;
  }

  return new Promise((resolve) => {
    (async () => {
      if (!file || file.size > APP_UPLOADS.FILE_SIZE_LIMIT.VIDEO) {
        alert("File is larger than 100MB");
        return resolve(uploadResult);
      }

      if (onBeforeUpload) onBeforeUpload(toolName, file);

      const url = filterUrl(toolName);
      const result = await axios.post(
        url,
        {
          file: file,
          authorization: config.authorization,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (event) => {
            const progress = getProgressCompleted(event);
            if (onUploadProgress) onUploadProgress(toolName, file, progress);
          },
        },
      );

      if (onUploadComplete)
        onUploadComplete(toolName, file, result.data as iUploadResult);

      if (isAxiosError(result)) {
        throw new Error(result.message);
      }

      const data = result.data as {
        url: string;
        path: string;
      };

      uploadResult.success = true;
      uploadResult.file = {
        url: data.url,
        path: data.path,
        name: file.name,
        size: file.size,
        title: file.name,
      };

      return resolve(uploadResult);
    })().catch((e: Error) => {
      if (onUploadComplete) onUploadComplete(toolName, file, e);

      console.error(e);
      return resolve(uploadResult);
    });
  });
};

export { EDITOR_TOOLS, type OutputData };

export default EditorJS;
