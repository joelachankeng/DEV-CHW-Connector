export {};

declare global {
  interface Window {
    emojiMart: Module;
    SlickJS: Slider | undefined;
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
