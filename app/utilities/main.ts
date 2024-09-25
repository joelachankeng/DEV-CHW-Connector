import { DateTime } from "luxon";
import { APP_DATE_FORMAT, APP_TIMEZONE } from "~/constants";
import crypto from "crypto";
import GraphemeSplitter from "grapheme-splitter";
import _ from "lodash";

export interface iClassNamesOverride {
  className: string;
  override?: boolean;
}
export const classNames = (...classes: string[]) => {
  return classes.filter(Boolean).join(" ");
};

export const classNamesOverride = (
  defaultClassNames: string,
  classObject: iClassNamesOverride | undefined,
): string => {
  if (!classObject) return defaultClassNames;
  if (classObject.override) return classObject.className;
  return classNames(defaultClassNames, classObject.className);
};

export const getRequestDomain = (request: Request): string => {
  const currentUrl = request.url;
  console.log("currentUrl", currentUrl);

  if (!currentUrl) return "";

  const url = new URL(currentUrl);
  return url.origin;
};

export const generatePassword = (
  length = 20,
  characters = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz~!@-#$",
): string => {
  return Array.from(crypto.getRandomValues(new Uint32Array(length)))
    .map((x) => characters[x % characters.length])
    .join("");
};

export const convertDateTimeForACF = (date: Date): string => {
  const formatDate = DateTime.fromJSDate(date)
    .setZone(APP_TIMEZONE)
    // Formatting guidelines: https://moment.github.io/luxon/#/formatting?id=table-of-tokens
    .toFormat(APP_DATE_FORMAT); // ACF always stores dates in this format
  return formatDate;
};

export const parseDateTimeGraphql = (
  date: string,
): DateTime<true> | DateTime<false> => {
  /***
   * Graphql returns dates in ISO 8601 format
   * However, it converts the date to our local timezone twice
   * Convert the date back to UTC to get the original date
   * You can check it here: https://www.timestamp-converter.com/
   */
  const utcDate = DateTime.fromISO(date).toUTC();
  const formattedDate = DateTime.fromFormat(
    utcDate.toFormat(APP_DATE_FORMAT),
    APP_DATE_FORMAT,
    {
      setZone: false,
    },
  );
  return formattedDate;
};

export const formatDateTimeGraphql = (date: DateTime): string => {
  return date.toFormat(APP_DATE_FORMAT);
};

export const getCurrentDateTime = (): DateTime => {
  return DateTime.now()
    .setZone("America/New_York")
    .setZone("system", { keepLocalTime: true });
};

export const getRequestParams = (request: Request): URLSearchParams => {
  const url = request.url;
  let urlParams = new URLSearchParams(url);
  if (url.includes("?")) {
    urlParams = new URLSearchParams(url.split("?")[1]);
  }
  return urlParams;
};

/**
 * Format bytes as human-readable text.
 *
 * @param bytes Number of bytes.
 * @param si True to use metric (SI) units, aka powers of 1000. False to use
 *           binary (IEC), aka powers of 1024.
 * @param dp Number of decimal places to display.
 *
 * @return Formatted string.
 */
export const formatFileSize = (bytes: number, si = false, dp = 1): string => {
  const thresh = si ? 1000 : 1024;

  if (Math.abs(bytes) < thresh) {
    return bytes + " B";
  }

  const units = si
    ? ["kB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"]
    : ["KiB", "MiB", "GiB", "TiB", "PiB", "EiB", "ZiB", "YiB"];
  let u = -1;
  const r = 10 ** dp;

  do {
    bytes /= thresh;
    ++u;
  } while (
    Math.round(Math.abs(bytes) * r) / r >= thresh &&
    u < units.length - 1
  );

  return bytes.toFixed(dp) + " " + units[u];
};

export const isFooterInView = (footer?: Element): boolean => {
  let _footer = null;
  if (footer === undefined) {
    _footer = document.querySelector("footer");
    if (!_footer || _footer === undefined) return false;
  } else {
    _footer = footer;
  }

  const offset = 0;
  const top = _footer.getBoundingClientRect().top;
  const footerInView = top + offset >= 0 && top - offset <= window.innerHeight;

  return footerInView;
};

export const calculateOverlappingDistance = (
  elem1: Element,
  elem2: Element,
): { width: number; height: number } => {
  // Get the bounding rectangles of both elements
  const rect1 = elem1.getBoundingClientRect();
  const rect2 = elem2.getBoundingClientRect();

  // Calculate the overlapping width and height
  const overlapX = Math.max(
    0,
    Math.min(rect1.right, rect2.right) - Math.max(rect1.left, rect2.left),
  );
  const overlapY = Math.max(
    0,
    Math.min(rect1.bottom, rect2.bottom) - Math.max(rect1.top, rect2.top),
  );

  // Return the overlapping distance
  return {
    width: overlapX,
    height: overlapY,
  };
};

export const URLsMatches = (url: string, url2: string): boolean => {
  return url === url2 || url === url2 + "/" || url + "/" === url2;
};

export const encrypt = (
  plain_text: string,
  encryptionMethod: string,
  secret: crypto.CipherKey,
  iv: crypto.BinaryLike,
): string => {
  const encryptor = crypto.createCipheriv(encryptionMethod, secret, iv);
  return (
    encryptor.update(plain_text, "utf8", "base64") + encryptor.final("base64")
  );
};

export const decrypt = (
  encryptedMessage: string,
  encryptionMethod: string,
  secret: crypto.CipherKey,
  iv: crypto.BinaryLike,
): string => {
  const decryptor = crypto.createDecipheriv(encryptionMethod, secret, iv);
  return (
    decryptor.update(encryptedMessage, "base64", "utf8") +
    decryptor.final("utf8")
  );
};

export const encryptForWP = (
  message: string,
  secret_32_char: crypto.CipherKey,
  iv_16_char: crypto.BinaryLike,
): string => {
  return encrypt(message, "AES-256-CBC", secret_32_char, iv_16_char);
};

export const decryptForWP = (
  encryptedMessage: string,
  secret_32_char: crypto.CipherKey,
  iv_16_char: crypto.BinaryLike,
): string => {
  return decrypt(encryptedMessage, "AES-256-CBC", secret_32_char, iv_16_char);
};

export const copyKeysToObject = <T extends object, U extends object>(
  defaultObject: T,
  newObject: U,
  typeCheck = true,
): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emptyObject: any = {};

  for (const key in defaultObject) {
    emptyObject[key as unknown as keyof typeof defaultObject] =
      defaultObject[key as unknown as keyof typeof defaultObject];
    if (
      typeof defaultObject[key as unknown as keyof typeof defaultObject] ===
        "object" &&
      !Array.isArray(
        defaultObject[key as unknown as keyof typeof defaultObject],
      )
    ) {
      if (Object.prototype.hasOwnProperty.call(newObject, key)) {
        emptyObject[key as unknown as keyof typeof defaultObject] =
          copyKeysToObject(
            defaultObject[
              key as unknown as Extract<typeof defaultObject, string>
            ],
            newObject[key as unknown as Extract<typeof newObject, string>],
          );
      }

      continue;
    }

    if (Object.prototype.hasOwnProperty.call(newObject, key)) {
      let isValid = true;
      if (typeCheck) {
        // make sure keys values are the same type
        if (
          typeof defaultObject[key as unknown as keyof typeof defaultObject] !==
          typeof newObject[key as unknown as keyof typeof newObject]
        ) {
          // ignore if either keys are undefined
          if (
            typeof defaultObject[
              key as unknown as keyof typeof defaultObject
            ] !== "undefined" &&
            typeof newObject[key as unknown as keyof typeof newObject] !==
              "undefined"
          ) {
            isValid = false;
          }
        }
      }

      if (isValid) {
        emptyObject[key as unknown as keyof typeof defaultObject] =
          newObject[key as unknown as keyof typeof newObject];
      } else {
        emptyObject[key as unknown as keyof typeof defaultObject] =
          defaultObject[key as unknown as keyof typeof defaultObject];
      }
    }
  }
  return emptyObject as T;
};

export const formatPhoneNumber = (value: string): string => {
  let formattedNumber = value;
  const { length } = value;

  // Filter non numbers
  const regex = () => value.replace(/[^0-9.]+/g, "");
  // Set area code with parenthesis around it
  const areaCode = () => `(${regex().slice(0, 3)})`;

  // Set formatting for first six digits
  const firstSix = () => `${areaCode()} ${regex().slice(3, 6)}`;

  // Dynamic trail as user types
  const trailer = (start: number) => `${regex().slice(start, regex().length)}`;
  if (length < 3) {
    // First 3 digits
    formattedNumber = regex();
  } else if (length === 4) {
    // After area code
    formattedNumber = `${areaCode()} ${trailer(3)}`;
  } else if (length === 5) {
    // When deleting digits inside parenthesis
    formattedNumber = `${areaCode().replace(")", "")}`;
  } else if (length > 5 && length < 9) {
    // Before dash
    formattedNumber = `${areaCode()} ${trailer(3)}`;
  } else if (length >= 10) {
    // After dash
    formattedNumber = `${firstSix()}-${trailer(6)}`;
  }
  return formattedNumber;
};

export const phoneRegex = new RegExp(
  /^([+]?[\s0-9]+)?(\d{3}|[(]?[0-9]+[)])?([-]?[\s]?[0-9])+$/,
);

export const escapeSpecialChars = (value: string): string => {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

export const stripHtml = (html: string): string => {
  return html.replace(/<[^>]*>?/gm, "").replace(/<\/[^>]+(>|$)/g, "");
};

export const isToday = (date: DateTime) => {
  if (!date) return false;
  if (!date.isValid) return false;

  const now = DateTime.now();
  if (
    now.year === date.year &&
    now.month === date.month &&
    now.day === date.day
  )
    return true;

  return false;
};

export const isYesterday = (date: DateTime) => {
  if (!date) return false;
  if (!date.isValid) return false;

  const now = DateTime.now().setZone(APP_TIMEZONE);
  if (
    now.year === date.year &&
    now.month === date.month &&
    now.day - date.day === 1
  )
    return true;

  return false;
};

export const getStringWithEmojisLength = (text: string): number => {
  // A same emoji can have different lengths in different platforms,
  // so we need to split the string into graphemes to get the correct length
  const splitter = new GraphemeSplitter();
  return splitter.splitGraphemes(text).length;
};

export const hasSingleEmoji = (text: string): boolean => {
  const textLength = getStringWithEmojisLength(text);
  if (textLength === 1) {
    if (hasEmoji(text)) {
      return true;
    }
  }
  return false;
};

export const isAllEmojis = (text: string): boolean => {
  const splitter = new GraphemeSplitter();
  const chars = splitter.splitGraphemes(text);
  if (chars.length === 0) return false;
  for (const char of chars) {
    if (parseInt(char)) {
      return false;
    }
    if (!hasEmoji(char)) {
      return false;
    }
  }

  return true;
};

export const hasEmoji = (text: string): boolean => {
  if (!text) return false;
  const regexes = [
    /\p{Extended_Pictographic}/gu,
    /\p{Emoji}/gu,
    /\p{Emoji_Presentation}/gu,
    /\p{Emoji_Modifier}/gu,
    /\p{Emoji_Modifier_Base}/gu,
    /\p{Emoji_Component}/gu,
  ];

  for (const regex of regexes) {
    if (regex.test(text)) {
      return true;
    }
  }
  return false;
};
