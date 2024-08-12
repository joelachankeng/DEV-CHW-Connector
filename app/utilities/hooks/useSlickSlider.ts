import { useState, useEffect } from "react";
import type Slider from "react-slick";

export const useSlickSlider = () => {
  const [Slider, setSlider] = useState<Slider | undefined>(undefined);

  useEffect(() => {
    (async () => {
      if (window.SlickJS) {
        setSlider(() => window.SlickJS);
        return;
      }
      await import("react-slick").then((Module: any) => {
        const slick = Module.default.default;
        setSlider(() => slick);
        window.SlickJS = slick;
      });
    })().catch(console.error);
  }, []);

  return Slider;
};
