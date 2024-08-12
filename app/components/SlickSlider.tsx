import { useSlickSlider } from "~/utilities/hooks/useSlickSlider";
import type { Settings } from "react-slick";
import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type iSlickSLiderProps = {
  children: ReactNode;
  settings: Settings;
  sliderRef?: React.MutableRefObject<iSliderRef | undefined>;
  className?: string;
};

export type iSliderRef = {
  slickNext(): void;
  slickPause(): void;
  slickPlay(): void;
  slickPrev(): void;
  slickGoTo(slideNumber: number, dontAnimate?: boolean): void;
};

export function SlickSlider({
  children,
  settings,
  sliderRef,
  className,
}: iSlickSLiderProps) {
  const _sliderRef = useRef<iSliderRef | undefined>(undefined);
  const Slider = useSlickSlider();

  useEffect(() => {
    if (!sliderRef) return;
    // console.log("sliderRef", sliderRef);
    // console.log("_sliderRef", _sliderRef);
    sliderRef.current = _sliderRef.current;
  }, [Slider]);

  return (
    <>
      {Slider && (
        <>
          {/* @ts-ignore: issue with typescript retrieving the components types ts(2604) */}
          <Slider
            className={className}
            ref={(slider: iSliderRef) => {
              _sliderRef.current = slider;
              // console.log("_sliderRef", _sliderRef);
            }}
            {...settings}
          >
            {children}
          </Slider>
        </>
      )}
    </>
  );
}
1;
