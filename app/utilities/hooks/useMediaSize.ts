import { useState, useEffect } from "react";

export const useMediaSize = () => {
  const [mediaSize, setMediaSize] = useState<
    | {
        width: number;
        height: number;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    setMediaSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });

    window.addEventListener("resize", () => {
      setMediaSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    });

    return () =>
      window.removeEventListener("resize", () => {
        setMediaSize({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      });
  }, []);

  return mediaSize;
};
