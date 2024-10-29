export {};

declare global {
  interface Window {
    emojiMart: Module;
    SlickJS: Slider | undefined;
    OneSignal: OneSignal | undefined;
    nativeFunctions: nativeFunctions | undefined;
    CHW: {
      Mobiloud: {
        isReady: boolean;
        nativeFunctions?: {
          login(): void;
          logout(): void;
          onesignalSendTags: (tags: Record<string, string>) => void;
          onesignalDeleteTags: (tags: Record<string, string>) => void;
          onesignalSetEmail: (email: string) => void;
          onesignalLogoutEmail: void;
          onesignalRemoveExternalUserId: (userId: string) => void;
          onesignalSetExternalUserId: (userId: string) => void;
        };
      };
    };
  }

  namespace JSX {
    interface IntrinsicElements {
      "em-emoji": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      >;
    }
  }
}
