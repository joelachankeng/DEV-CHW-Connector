import { memo, useCallback, useEffect, useRef } from "react";
import type { iGraphQLPageInfo } from "~/controllers/graphql.control";
import { classNames } from "../main";

export type iPagination = {
  isLoading: boolean;
  pageInfo: iGraphQLPageInfo["pageInfo"] | undefined;
};

export const usePagination = (
  containerRef: React.MutableRefObject<HTMLDivElement | null>,
  onFetch: () => void,
  options: {
    pageInfo?: iGraphQLPageInfo["pageInfo"];
    reverseScroll?: boolean;
  } = {},
) => {
  const pagination = useRef<{
    isLoading: boolean;
    pageInfo: iGraphQLPageInfo["pageInfo"] | undefined;
  }>({
    isLoading: false,
    pageInfo: options.pageInfo || undefined,
  });

  const handlePagination = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement>) => {
      e?.preventDefault();
      if (!pagination.current.pageInfo) return;
      if (!pagination.current.pageInfo.hasNextPage) return;

      pagination.current.isLoading = true;
      onFetch();
    },
    [onFetch],
  );

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    if (options.reverseScroll) {
      const containerTop = containerRef.current.getBoundingClientRect().top;
      if (containerTop > 0) {
        handlePagination();
      }
    } else {
      const windowHeight = window.innerHeight;
      const containerBottom =
        containerRef.current.getBoundingClientRect().bottom;

      if (containerBottom < windowHeight) {
        handlePagination();
      }
    }
  }, [containerRef, handlePagination, options.reverseScroll]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [handleScroll]);

  const setPagination = useCallback((paginationData: iPagination) => {
    pagination.current = {
      isLoading: paginationData.isLoading,
      pageInfo: paginationData.pageInfo,
    };
  }, []);

  const LoadMoreButtonComponent = ({
    className,
    children = "Load More",
  }: {
    className?: string;
    children?: React.ReactNode;
  }) => {
    return (
      <button
        className={classNames(
          "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
          "rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
          className || "",
        )}
        onClick={handlePagination}
      >
        {children}
      </button>
    );
  };

  const LoadMoreButton = memo(LoadMoreButtonComponent);

  return {
    pagination: pagination.current,
    setPagination,
    LoadMoreButton,
  };
};
