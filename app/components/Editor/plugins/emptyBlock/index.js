/**
 * @class EmptyBlock
 * @classdesc Does nothing, fix for Editor.js adding a paragraph on read-only mode
 *
 */
export default class EmptyBlock {
  readOnly;
  /**
   * @param {{data: object, config: object, api: object}}
   *   data — previously saved data
   *   config - user config for Tool
   *   api - Editor.js API
   *   readOnly - read-only mode flag
   */
  constructor({ data, api, config, readOnly }) {
    this.api = api;
    this.data = data;
    this.config = config;
    this.readOnly = readOnly;
  }

  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  render() {
    return document.createElement("div");
  }
}
