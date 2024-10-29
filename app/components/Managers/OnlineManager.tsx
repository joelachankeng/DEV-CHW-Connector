import { useCallback, useContext, useEffect, useRef } from "react";
import { AppContext } from "~/contexts/appContext";
import type { iGenericError } from "~/models/appContext.model";
import axios from "axios";

export default function OnlineManager() {
  const { User } = useContext(AppContext);
  const isFetching = useRef(false);

  const postOnline = useCallback(async (): Promise<void | iGenericError> => {
    const formData = new FormData();
    return axios
      .post("/api/user/online", formData)
      .then((res) => {
        return res.data as ReturnType<typeof postOnline>;
      })
      .catch((err) => {
        return { error: err.message };
      });
  }, []);

  useEffect(() => {
    const interval = setInterval(function () {
      if (!User.user) return;
      if (isFetching.current) return;

      isFetching.current = true;
      postOnline()
        .catch((e) => {
          console.error(e);
        })
        .finally(() => {
          isFetching.current = false;
        });
    }, 1000);
    return () => clearInterval(interval);
  }, [User.user, postOnline]);

  return <></>;
}
