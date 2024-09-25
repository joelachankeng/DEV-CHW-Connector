/**
 * @class GIPHY
 * @classdesc Add GIPHY GIFs to your content
 *
 */
export default class GIPHY {
  data;
  _data;
  isSearch;
  element;
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
    this._data = {};
    this.isSearch = true;
    this.element = null;
    this.config = config;
    this.readOnly = readOnly;

    if (this.readOnly) {
      this.isSearch = false;
    }
  }

  /**
   * Notify core that read-only mode is supported
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  static get toolbox() {
    return {
      title: "GIF",
      icon: `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-6">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12.75 8.25v7.5m6-7.5h-3V12m0 0v3.75m0-3.75H18M9.75 9.348c-1.03-1.464-2.698-1.464-3.728 0-1.03 1.465-1.03 3.84 0 5.304 1.03 1.464 2.699 1.464 3.728 0V12h-1.5M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>`,
    };
  }

  cloneData() {
    if (!(this.data instanceof Object)) {
      throw Error("GIPHY Tool data should be object");
    }

    const { giphyUrl } = this.data;

    this._data = {
      giphyUrl: giphyUrl || "",
    };

    if (giphyUrl) {
      this.isSearch = false;
    }

    // if (this.isSearch) {
    //   this.isSearch = false;
    //   this.element.innerHTML = this.render().innerHTML;
    // }
  }

  render() {
    const container = document.createElement("div");
    this.cloneData();

    if (this.isSearch) {
      const searchInput = document.createElement("input");
      searchInput.placeholder = "Search For GIFs";
      searchInput.classList.add("giphy-search");
      searchInput.classList.add("cdx-input");

      const collection = document.createElement("div");
      collection.classList.add("giphy-collection");

      let lastScrollTop = 0;
      let fetching = false;

      collection.onscroll = () => {
        if (fetching) return;
        if (collection.scrollTop < lastScrollTop) {
          // upscroll
          return;
        }
        lastScrollTop = collection.scrollTop <= 0 ? 0 : collection.scrollTop;
        if (
          collection.scrollTop + collection.offsetHeight >=
          collection.scrollHeight - 100
        ) {
          const search = searchInput.value;
          let images = [];
          const totalImages = collection.querySelectorAll("img").length;
          if (search) {
            images = this.fetchSearchResults(search, totalImages);
          } else {
            images = this.fetchTrendingResults(totalImages);
          }

          fetching = true;
          images.then((images) => {
            this.appendImagesToCollection(images, collection);
            fetching = false;
          });
        }
      };

      const trendingImages = this.fetchTrendingResults();
      trendingImages
        .then((images) => {
          this.replaceImagesInCollection(images, collection);
        })
        .catch((e) => {
          console.error(e);
        });

      searchInput.addEventListener("input", (e) => {
        (async () => {
          const search = e.target.value;

          if (search.length > 0) {
            const images = await this.fetchSearchResults(search);
            const row =
              container.parentElement.querySelector(".giphy-collection");
            this.replaceImagesInCollection(images, row);
          }
        })().catch((e) => {
          console.error(e);
        });
      });

      container.appendChild(searchInput);
      container.appendChild(collection);
    } else {
      const giphyUrl = this.data.giphyUrl;
      if (!giphyUrl) {
        return container;
      }
      const giphy = document.createElement("img");
      giphy.src = giphyUrl;
      giphy.classList.add("giphy-image");
      container.appendChild(giphy);
    }

    this.element = container;

    return container;
  }

  save() {
    return this.data;
  }

  fetchSearchResults = async (search, offset = 0) => {
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/search?api_key=${this.config.apiKey}&q=${search}&limit=25&offset=${offset}`,
    );
    const data = await response.json();

    return data.data;
  };

  fetchTrendingResults = async (offset = 0) => {
    const response = await fetch(
      `https://api.giphy.com/v1/gifs/trending?api_key=${this.config.apiKey}&limit=25&offset=${offset}`,
    );
    const data = await response.json();

    return data.data;
  };

  replaceImagesInCollection = (images, collection) => {
    collection.innerHTML = "";
    if (!images.length) {
      collection.innerHTML = `<p style="text-align: center;width: 100%;margin-top: 10px;">No GIFs found.</p>`;
      return;
    }

    const cols = 4;
    const colsCollection = {};

    // Create number of columns
    for (let i = 1; i <= cols; i++) {
      colsCollection[`col${i}`] = document.createElement("div");
      colsCollection[`col${i}`].classList.add("column");
    }

    let imageIndex = 0;
    // Add images to each column
    for (var i = 0; i < cols; i++) {
      if (!images.length || !images[i]) break;
      const itemContainer = document.createElement("div");
      itemContainer.classList.add("item");
      const item = document.createElement("img");
      item.src = images[i].images.preview_gif.url;
      item.dataset.url = images[i].images.original.url;
      item.dataset.index = imageIndex;

      item.addEventListener("click", () => {
        const giphyUrl = item.dataset.url;
        this.data = { giphyUrl };
        this.isSearch = false;
        this.element.innerHTML = this.render().innerHTML;
      });

      itemContainer.appendChild(item);
      colsCollection[`col${i + 1}`].appendChild(itemContainer);

      if (i === cols - 1) {
        images.splice(0, cols);
        // reset i
        i = -1;
      }
      imageIndex++;
    }

    Object.values(colsCollection).forEach((column) => {
      collection.appendChild(column);
    });
  };

  appendImagesToCollection = (images, collection) => {
    const formatImages = [];
    const currentImages = collection.querySelectorAll("img");

    currentImages.forEach((img) => {
      const index = img.dataset.index;
      if (!index || isNaN(index)) {
        console.error("Index not found on image");
        return;
      }

      formatImages[index] = {
        images: {
          preview_gif: {
            url: img.src,
          },
          original: {
            url: img.dataset.url,
          },
        },
      };
    });

    const allImages = formatImages.concat(images);

    this.replaceImagesInCollection(allImages, collection);
  };
}
