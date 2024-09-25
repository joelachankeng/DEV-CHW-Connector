/**
 * Video Tool for the Editor.js
 *
 * @author CodeX <team@codex.so>
 * @license MIT
 * @see {@link https://github.com/editor-js/video}
 *
 * To developers.
 * To simplify Tool structure, we split it to 4 parts:
 *  1) index.js — main Tool's interface, public API and methods for working with data
 *  2) uploader.js — module that has methods for sending files via AJAX: from device, by URL or File pasting
 *  3) ui.js — module for UI manipulations: render, showing preloader, etc
 *  4) tunes.js — working with Block Tunes: render buttons, handle clicks
 *
 * For debug purposes there is a testing server
 * that can save uploaded files and return a Response {@link UploadResponseFormat}
 *
 *       $ node dev/server.js
 *
 * It will expose 8008 port, so you can pass http://localhost:8008 with the Tools config:
 *
 * video: {
 *   class: VideoTool,
 *   config: {
 *     endpoints: {
 *       byFile: 'http://localhost:8008/uploadFile',
 *       byUrl: 'http://localhost:8008/fetchUrl',
 *     }
 *   },
 * },
 */

/**
 * @typedef {object} VideoToolData
 * @description Video Tool's input and output data format
 * @property {string} caption — video caption
 * @property {boolean} withBorder - should video be rendered with border
 * @property {boolean} withBackground - should video be rendered with background
 * @property {boolean} stretched - should video be stretched to full width of container
 * @property {object} file — Video file data returned from backend
 * @property {string} file.url — video URL
 */

// eslint-disable-next-line
import css from "./index.css";
import Ui from "./ui";
import Tunes from "./tunes";
import Uploader from "./uploader";

/**
 * @typedef {object} VideoConfig
 * @description Config supported by Tool
 * @property {object} endpoints - upload endpoints
 * @property {string} endpoints.byFile - upload by file
 * @property {string} endpoints.byUrl - upload by URL
 * @property {string} field - field name for uploaded video
 * @property {string} types - available mime-types
 * @property {string} captionPlaceholder - placeholder for Caption field
 * @property {object} additionalRequestData - any data to send with requests
 * @property {object} additionalRequestHeaders - allows to pass custom headers with Request
 * @property {string} buttonContent - overrides for Select File button
 * @property {object} [uploader] - optional custom uploader
 * @property {function(File): Promise.<UploadResponseFormat>} [uploader.uploadByFile] - method that upload video by File
 * @property {function(string): Promise.<UploadResponseFormat>} [uploader.uploadByUrl] - method that upload video by URL
 */

/**
 * @typedef {object} UploadResponseFormat
 * @description This format expected from backend on file uploading
 * @property {number} success - 1 for successful uploading, 0 for failure
 * @property {object} file - Object with file data.
 *                           'url' is required,
 *                           also can contain any additional data that will be saved and passed back
 * @property {string} file.url - [Required] video source URL
 */
export default class VideoTool {
  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Get Tool toolbox settings
   * icon - Tool icon's SVG
   * title - title to show in toolbox
   *
   * @returns {{icon: string, title: string}}
   */
  static get toolbox() {
    return {
      icon: `<svg
          version="1.1"
          id="Capa_1"
          xmlns="http://www.w3.org/2000/svg"
          width="20"
          height="20"
          viewBox="0 0 489.2 489.2"
        >
          <path
            d="M439.6,0h-390C22.2,0,0,22.2,0,49.6v390c0,27.4,22.2,49.6,49.6,49.6h390c27.4,0,49.6-22.2,49.6-49.6V49.7
       C489.3,22.3,467,0,439.6,0z M300.6,47.8h42.5v42.5h-42.5V47.8z M223.4,47.8h42.5v42.5h-42.5V47.8L223.4,47.8z M146.1,47.8h42.5
       v42.5h-42.5V47.8z M111.3,441.6H68.8v-42.5h42.5V441.6z M111.3,90.3H68.8V47.8h42.5V90.3z M188.6,441.6h-42.5v-42.5h42.5V441.6z
        M265.8,441.6h-42.5v-42.5h42.5V441.6z M343.1,441.6h-42.5v-42.5h42.5V441.6z M352.5,256.7l-163.1,94.2c-9.2,5.3-20.8-1.3-20.8-12
       V150.5c0-10.7,11.6-17.3,20.8-12l163.1,94.2C361.8,238,361.8,251.4,352.5,256.7z M420.4,441.6h-42.5v-42.5h42.5V441.6z M420.4,90.3
       h-42.5V47.8h42.5V90.3z"
          />
        </svg>`,
      title: "Video",
    };
  }

  /**
   * @param {object} tool - tool properties got from editor.js
   * @param {VideoToolData} tool.data - previously saved data
   * @param {VideoConfig} tool.config - user config for Tool
   * @param {object} tool.api - Editor.js API
   * @param {boolean} tool.readOnly - read-only mode flag
   */
  constructor({ data, config, api, readOnly }) {
    this.api = api;
    this.readOnly = readOnly;

    /**
     * Tool's initial config
     */
    this.config = {
      endpoints: config.endpoints || "",
      additionalRequestData: config.additionalRequestData || {},
      additionalRequestHeaders: config.additionalRequestHeaders || {},
      field: config.field || "video",
      types: config.types || "video/*",
      captionPlaceholder: this.api.i18n.t(
        config.captionPlaceholder || "Caption",
      ),
      buttonContent: config.buttonContent || "",
      uploader: config.uploader || undefined,
      actions: config.actions || [],
      player: {
        pip: config.player.pip || false,
        controls: config.player.controls || false,
        light: config.player.light || false,
        playing: config.player.playing || false,
      },
    };

    /**
     * Module for file uploading
     */
    this.uploader = new Uploader({
      config: this.config,
      onUpload: (response) => this.onUpload(response),
      onError: (error) => this.uploadingFailed(error),
    });

    /**
     * Module for working with UI
     */
    this.ui = new Ui({
      api,
      config: this.config,
      onSelectFile: () => {
        this.uploader.uploadSelectedFile({
          onPreview: (src) => {
            this.ui.showPreloader(src);
          },
        });
      },
      readOnly,
    });

    /**
     * Module for working with tunes
     */
    this.tunes = new Tunes({
      api,
      actions: this.config.actions,
      onChange: (tuneName) => this.tuneToggled(tuneName),
    });

    /**
     * Set saved state
     */
    this._data = {};
    this.data = data;
  }

  /**
   * Renders Block content
   *
   * @public
   *
   * @returns {HTMLDivElement}
   */
  render() {
    const allLinks = document.getElementsByTagName("link");
    for (let i = 0; i < allLinks.length; i++) {
      if (allLinks[i].href === css) {
        return this.ui.render(this.data);
      }
    }

    const styleTag = document.createElement("link");
    styleTag.rel = "stylesheet";
    styleTag.href = css;
    document.head.appendChild(styleTag);

    return this.ui.render(this.data);
  }

  /**
   * Return Block data
   *
   * @public
   *
   * @returns {VideoToolData}
   */
  save() {
    const caption = this.ui.nodes.caption;

    this._data.caption = caption.innerHTML;

    return this.data;
  }

  /**
   * Makes buttons with tunes: add background, add border, stretch video
   *
   * @public
   *
   * @returns {Element}
   */
  renderSettings() {
    return this.tunes.render(this.data);
  }

  /**
   * Fires after clicks on the Toolbox Video Icon
   * Initiates click on the Select File button
   *
   * @public
   */
  appendCallback() {
    this.ui.nodes.fileButton.click();
  }

  /**
   * Specify paste substitutes
   *
   * @see {@link https://github.com/codex-team/editor.js/blob/master/docs/tools.md#paste-handling}
   * @returns {{tags: string[], patterns: object<string, RegExp>, files: {extensions: string[], mimeTypes: string[]}}}
   */
  static get pasteConfig() {
    return {
      /**
       * Paste HTML into Editor
       */
      tags: ["video"],

      /**
       * Paste URL of video into the Editor
       */
      patterns: {
        video: /https?:\/\/\S+\.(mp4)$/i,
      },

      /**
       * Drag n drop file from into the Editor
       */
      files: {
        mimeTypes: ["video/*"],
      },
    };
  }

  /**
   * Specify paste handlers
   *
   * @public
   * @see {@link https://github.com/codex-team/editor.js/blob/master/docs/tools.md#paste-handling}
   * @param {CustomEvent} event - editor.js custom paste event
   *                              {@link https://github.com/codex-team/editor.js/blob/master/types/tools/paste-events.d.ts}
   * @returns {void}
   */
  async onPaste(event) {
    switch (event.type) {
      case "tag": {
        const video = event.detail.data;

        /** Videos from PDF */
        if (/^blob:/.test(video.src)) {
          const response = await fetch(video.src);
          const file = await response.blob();

          this.uploadFile(file);
          break;
        }

        this.uploadUrl(video.src);
        break;
      }
      case "pattern": {
        const url = event.detail.data;

        this.uploadUrl(url);
        break;
      }
      case "file": {
        const file = event.detail.file;

        this.uploadFile(file);
        break;
      }
    }
  }

  /**
   * Private methods
   * ̿̿ ̿̿ ̿̿ ̿'̿'\̵͇̿̿\з= ( ▀ ͜͞ʖ▀) =ε/̵͇̿̿/’̿’̿ ̿ ̿̿ ̿̿ ̿̿
   */

  /**
   * Stores all Tool's data
   *
   * @private
   *
   * @param {VideoToolData} data - data in Video Tool format
   */
  set data(data) {
    this.video = data.file;

    this._data.caption = data.caption || "";
    this.ui.fillCaption(this._data.caption);

    Tunes.tunes.forEach(({ name: tune }) => {
      const value =
        typeof data[tune] !== "undefined"
          ? data[tune] === true || data[tune] === "true"
          : false;

      this.setTune(tune, value);
    });
  }

  /**
   * Return Tool data
   *
   * @private
   *
   * @returns {VideoToolData}
   */
  get data() {
    return this._data;
  }

  /**
   * Set new video file
   *
   * @private
   *
   * @param {object} file - uploaded file data
   */
  set video(file) {
    this._data.file = file || {};

    if (file && file.url) {
      this.ui.fillVideo(file.url);
    }
  }

  /**
   * File uploading callback
   *
   * @private
   *
   * @param {UploadResponseFormat} response - uploading server response
   * @returns {void}
   */
  onUpload(response) {
    if (response.success && response.file) {
      this.video = response.file;
    } else {
      this.uploadingFailed("incorrect response: " + JSON.stringify(response));
    }
  }

  /**
   * Handle uploader errors
   *
   * @private
   * @param {string} errorText - uploading error text
   * @returns {void}
   */
  uploadingFailed(errorText) {
    console.log("Video Tool: uploading failed because of", errorText);

    this.api.notifier.show({
      message: this.api.i18n.t("Couldn’t upload video. Please try another."),
      style: "error",
    });
    this.ui.hidePreloader();
  }

  /**
   * Callback fired when Block Tune is activated
   *
   * @private
   *
   * @param {string} tuneName - tune that has been clicked
   * @returns {void}
   */
  tuneToggled(tuneName) {
    // inverse tune state
    this.setTune(tuneName, !this._data[tuneName]);
  }

  /**
   * Set one tune
   *
   * @param {string} tuneName - {@link Tunes.tunes}
   * @param {boolean} value - tune state
   * @returns {void}
   */
  setTune(tuneName, value) {
    this._data[tuneName] = value;

    this.ui.applyTune(tuneName, value);

    if (tuneName === "stretched") {
      /**
       * Wait until the API is ready
       */
      Promise.resolve()
        .then(() => {
          const blockId = this.api.blocks.getCurrentBlockIndex();

          this.api.blocks.stretchBlock(blockId, value);
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }

  /**
   * Show preloader and upload video file
   *
   * @param {File} file - file that is currently uploading (from paste)
   * @returns {void}
   */
  uploadFile(file) {
    this.uploader.uploadByFile(file, {
      onPreview: (src) => {
        this.ui.showPreloader(src);
      },
    });
  }

  /**
   * Show preloader and upload video by target url
   *
   * @param {string} url - url pasted
   * @returns {void}
   */
  uploadUrl(url) {
    this.ui.showPreloader(url);
    this.uploader.uploadByUrl(url);
  }
}
