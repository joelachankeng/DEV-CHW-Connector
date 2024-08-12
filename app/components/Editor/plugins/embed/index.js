import SERVICES from "./services";
import "./index.css";
// import { debounce } from "debounce";

/**
 * @typedef {object} EmbedData
 * @description Embed Tool data
 * @property {string} service - service name
 * @property {string} url - source URL of embedded content
 * @property {string} embed - URL to source embed page
 * @property {number} [width] - embedded content width
 * @property {number} [height] - embedded content height
 * @property {string} [caption] - content caption
 */
/**
 * @typedef {object} PasteEvent
 * @typedef {object} HTMLElement
 * @typedef {object} Service
 * @description Service configuration object
 * @property {RegExp} regex - pattern of source URLs
 * @property {string} embedUrl - URL scheme to embedded page. Use '<%= remote_id %>' to define a place to insert resource id
 * @property {string} html - iframe which contains embedded content
 * @property {Function} [id] - function to get resource id from RegExp groups
 */
/**
 * @typedef {object} EmbedConfig
 * @description Embed tool configuration object
 * @property {object} [services] - additional services provided by user. Each property should contain Service object
 */

/**
 * @class Embed
 * @classdesc Embed Tool for Editor.js 2.0
 *
 * @property {object} api - Editor.js API
 * @property {EmbedData} _data - private property with Embed data
 * @property {HTMLElement} element - embedded content container
 *
 * @property {object} services - static property with available services
 * @property {object} patterns - static property with patterns for paste handling configuration
 */
export default class Embed {
  #debounce;
  /**
   * @param {{data: EmbedData, config: EmbedConfig, api: object}}
   *   data — previously saved data
   *   config - user config for Tool
   *   api - Editor.js API
   *   readOnly - read-only mode flag
   */
  constructor({ data, api, readOnly }) {
    this.api = api;
    this._data = {};
    this.element = null;
    this.readOnly = readOnly;

    this.data = data;
    this.getDebounce().finally(() => {
      // console.log("debounce loaded", this.#debounce);
    });
  }

  async getDebounce() {
    if (!this.#debounce) {
      const module = await import("debounce");
      this.#debounce = module.default;
    }
    return this.#debounce;
  }

  static get toolbox() {
    return {
      title: "Embed",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M256 0H576c35.3 0 64 28.7 64 64V288c0 35.3-28.7 64-64 64H256c-35.3 0-64-28.7-64-64V64c0-35.3 28.7-64 64-64zM476 106.7C471.5 100 464 96 456 96s-15.5 4-20 10.7l-56 84L362.7 169c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6h80 48H552c8.9 0 17-4.9 21.2-12.7s3.7-17.3-1.2-24.6l-96-144zM336 96a32 32 0 1 0 -64 0 32 32 0 1 0 64 0zM64 128h96V384v32c0 17.7 14.3 32 32 32H320c17.7 0 32-14.3 32-32V384H512v64c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V192c0-35.3 28.7-64 64-64zm8 64c-8.8 0-16 7.2-16 16v16c0 8.8 7.2 16 16 16H88c8.8 0 16-7.2 16-16V208c0-8.8-7.2-16-16-16H72zm0 104c-8.8 0-16 7.2-16 16v16c0 8.8 7.2 16 16 16H88c8.8 0 16-7.2 16-16V312c0-8.8-7.2-16-16-16H72zm0 104c-8.8 0-16 7.2-16 16v16c0 8.8 7.2 16 16 16H88c8.8 0 16-7.2 16-16V416c0-8.8-7.2-16-16-16H72zm336 16v16c0 8.8 7.2 16 16 16h16c8.8 0 16-7.2 16-16V416c0-8.8-7.2-16-16-16H424c-8.8 0-16 7.2-16 16z" /></svg>`,
    };
  }

  /**
   * @param {EmbedData} data - embed data
   * @param {RegExp} [data.regex] - pattern of source URLs
   * @param {string} [data.embedUrl] - URL scheme to embedded page. Use '<%= remote_id %>' to define a place to insert resource id
   * @param {string} [data.html] - iframe which contains embedded content
   * @param {number} [data.height] - iframe height
   * @param {number} [data.width] - iframe width
   * @param {string} [data.caption] - caption
   */
  set data(data) {
    if (!(data instanceof Object)) {
      throw Error("Embed Tool data should be object");
    }

    const { service, source, embed, width, height, caption = "" } = data;

    this._data = {
      service: service || this.data.service,
      source: source || this.data.source,
      embed: embed || this.data.embed,
      width: width || this.data.width,
      height: height || this.data.height,
      caption: caption || this.data.caption || "",
    };

    const oldView = this.element;

    if (oldView) {
      oldView.parentNode.replaceChild(this.render(), oldView);
    }
  }

  /**
   * @returns {EmbedData}
   */
  get data() {
    if (this.element) {
      //   const manualCaption = this.element.querySelector(".manage-embed-url");
      //   if (manualCaption) {
      //     this._data.source = manualCaption.value;
      //   }

      const caption = this.element.querySelector(`.${this.api.styles.input}`);

      this._data.caption = caption ? caption.innerHTML : "";
    }

    return this._data;
  }

  /**
   * Get plugin styles
   *
   * @returns {object}
   */
  get CSS() {
    return {
      baseClass: this.api.styles.block,
      input: this.api.styles.input,
      container: "embed-tool",
      containerLoading: "embed-tool--loading",
      preloader: "embed-tool__preloader",
      caption: "embed-tool__caption",
      url: "embed-tool__url",
      content: "embed-tool__content",
    };
  }

  /**
   * Render Embed tool content
   *
   * @returns {HTMLElement}
   */
  render() {
    if (!this.data.service) {
      const container = document.createElement("div");

      const input = document.createElement("input");
      input.placeholder = "Paste a URL to embed content";
      input.classList.add(this.CSS.input, "manage-embed-url");

      input.addEventListener("input", (event) => {
        const { value } = event.target;
        const pattern = this.getVideoPattern(value);
        if (pattern) {
          this.onPaste({
            detail: {
              key: pattern.key,
              data: pattern.data,
            },
          });
        }
      });

      const heading = document.createElement("p");
      heading.textContent = "Supported services: ";
      heading.style = "margin-top: 1rem;";

      Object.entries(Embed.services).forEach(([key]) => {
        key = key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, " ");
        if (
          Object.keys(Embed.services).indexOf(key) !==
          Object.keys(Embed.services).length - 1
        ) {
          heading.textContent += key + ", ";
        } else {
          heading.textContent += key + ".";
        }
      });

      container.appendChild(input);
      container.appendChild(heading);

      this.element = container;
      return container;
    }

    const { html } = Embed.services[this.data.service];
    const container = document.createElement("div");
    const caption = document.createElement("div");
    const template = document.createElement("template");
    const preloader = this.createPreloader();

    container.classList.add(
      this.CSS.baseClass,
      this.CSS.container,
      this.CSS.containerLoading,
    );
    caption.classList.add(this.CSS.input, this.CSS.caption);

    container.appendChild(preloader);

    caption.contentEditable = !this.readOnly;
    caption.dataset.placeholder = this.api.i18n.t("Enter a caption");
    caption.placeholder = this.api.i18n.t("Enter a caption");
    caption.innerHTML = this.data.caption || "";

    template.innerHTML = html;
    template.content.firstChild.setAttribute("src", this.data.embed);
    template.content.firstChild.classList.add(this.CSS.content);

    const embedIsReady = this.embedIsReady(container);

    container.appendChild(template.content.firstChild);
    container.appendChild(caption);

    embedIsReady.then(() => {
      container.classList.remove(this.CSS.containerLoading);
    });

    this.element = container;

    return container;
  }

  /**
   * Creates preloader to append to container while data is loading
   *
   * @returns {HTMLElement}
   */
  createPreloader() {
    const preloader = document.createElement("preloader");
    const url = document.createElement("div");

    url.textContent = this.data.source;

    preloader.classList.add(this.CSS.preloader);
    url.classList.add(this.CSS.url);

    preloader.appendChild(url);

    return preloader;
  }

  /**
   * Save current content and return EmbedData object
   *
   * @returns {EmbedData}
   */
  save() {
    return this.data;
  }

  /**
   * Handle pasted url and return Service object
   *
   * @param {PasteEvent} event - event with pasted data
   */
  onPaste(event) {
    // console.log("event", event);
    const { key: service, data: url } = event.detail;
    const {
      regex,
      embedUrl,
      width,
      height,
      id = (ids) => ids.shift(),
    } = Embed.services[service];
    const result = regex.exec(url).slice(1);
    const embed = embedUrl.replace(/<%= remote_id %>/g, id(result));

    this.data = {
      service,
      source: url,
      embed,
      width,
      height,
    };
  }

  /**
   * Analyze provided config and make object with services to use
   *
   * @param {EmbedConfig} config - configuration of embed block element
   */
  static prepare({ config = {} }) {
    const { services = {} } = config;

    let entries = Object.entries(SERVICES);

    const enabledServices = Object.entries(services)
      .filter(([key, value]) => {
        return typeof value === "boolean" && value === true;
      })
      .map(([key]) => key);

    const userServices = Object.entries(services)
      .filter(([key, value]) => {
        return typeof value === "object";
      })
      .filter(([key, service]) => Embed.checkServiceConfig(service))
      .map(([key, service]) => {
        const { regex, embedUrl, html, height, width, id } = service;

        return [
          key,
          {
            regex,
            embedUrl,
            html,
            height,
            width,
            id,
          },
        ];
      });

    if (enabledServices.length) {
      entries = entries.filter(([key]) => enabledServices.includes(key));
    }

    entries = entries.concat(userServices);

    Embed.services = entries.reduce((result, [key, service]) => {
      if (!(key in result)) {
        result[key] = service;

        return result;
      }

      result[key] = Object.assign({}, result[key], service);

      return result;
    }, {});

    Embed.patterns = entries.reduce((result, [key, item]) => {
      result[key] = item.regex;

      return result;
    }, {});

    // console.log("Embed.patterns", Embed.patterns);
  }

  /**
   * Check if Service config is valid
   *
   * @param {Service} config - configuration of embed block element
   * @returns {boolean}
   */
  static checkServiceConfig(config) {
    const { regex, embedUrl, html, height, width, id } = config;

    let isValid =
      regex &&
      regex instanceof RegExp &&
      embedUrl &&
      typeof embedUrl === "string" &&
      html &&
      typeof html === "string";

    isValid = isValid && (id !== undefined ? id instanceof Function : true);
    isValid =
      isValid && (height !== undefined ? Number.isFinite(height) : true);
    isValid = isValid && (width !== undefined ? Number.isFinite(width) : true);
    return isValid;
  }

  /**
   * Paste configuration to enable pasted URLs processing by Editor
   *
   * @returns {object} - object of patterns which contain regx for pasteConfig
   */
  static get pasteConfig() {
    return {
      patterns: Embed.patterns,
    };
  }

  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Checks that mutations in DOM have finished after appending iframe content
   *
   * @param {HTMLElement} targetNode - HTML-element mutations of which to listen
   * @returns {Promise<any>} - result that all mutations have finished
   */
  embedIsReady(targetNode) {
    const PRELOADER_DELAY = 450;

    let observer = null;

    return new Promise((resolve, reject) => {
      observer = new MutationObserver(this.#debounce(resolve, PRELOADER_DELAY));
      observer.observe(targetNode, {
        childList: true,
        subtree: true,
      });
    }).then(() => {
      observer.disconnect();
    });
  }

  getVideoPattern(text) {
    if (!Object.keys(Embed.patterns).length) return undefined;

    const pattern = Object.entries(Embed.patterns).find(([key, expression]) => {
      const execResult = expression.exec(text);
      if (!execResult) return false;

      const valid = text === execResult.shift();

      return valid;
    });

    if (!pattern) {
      return;
    }

    // console.log("pattern", pattern);

    return {
      data: text,
      key: pattern[0],
    };
  }
}
