import type { iEmojiPickerIcon } from "~/utilities/hooks/useEmojiMart";

export type iEmojiMartContext = {
  currentEmoji: iEmojiPickerIcon | undefined;
  showEmojiPicker: boolean;
};
