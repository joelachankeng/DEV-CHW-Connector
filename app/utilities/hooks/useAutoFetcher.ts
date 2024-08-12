import type { SubmitOptions } from "@remix-run/react";
import { useFetcher } from "@remix-run/react";
import { useEffect } from "react";

export const useAutoFetcher = <Type>(
  url: string,
  // options: Omit<SubmitOptions, "replace" | "state"> | "GET" | "POST",
  // data: { [key: string]: string | Blob },
  onFetched: (data: Type) => void,
) => {
  // const callbackRef = useRef(onFetched);
  // const x = onFetched;

  const fetcher = useFetcher();

  useEffect(() => {
    if (fetcher.state !== "idle") return;
    if (!fetcher.data) return;

    const data = fetcher.data as Type;
    onFetched(data);
  }, [fetcher.data, fetcher.state]);

  const submit = (
    data: { [key: string]: string | Blob },
    options: Omit<SubmitOptions, "replace" | "state"> | "GET" | "POST",
  ) => {
    const formData = new FormData();
    for (const key in data) {
      formData.append(key, data[key]);
    }

    let fetchOptions: SubmitOptions = {};

    if (options === "GET") {
      fetchOptions = { method: "GET" };
    } else if (options === "POST") {
      fetchOptions = { method: "POST" };
    } else {
      fetchOptions = options;
    }

    fetchOptions.action = url;

    fetcher.submit(formData, fetchOptions);
  };

  return { state: fetcher.state, submit };
};
