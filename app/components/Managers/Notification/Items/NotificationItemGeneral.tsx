import SVGCloseButton from "~/assets/SVGs/SVGCloseButton";

export default function NotificationItemGeneral({
  icon,
  children,
  onClose,
}: {
  icon: JSX.Element;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="flex w-auto items-center rounded-lg bg-white p-4 text-gray-500 shadow-md dark:bg-gray-800 dark:text-gray-400 max-md:border max-md:border-gray-200 max-md:shadow-2xl"
        role="alert"
      >
        <div className="inline-flex h-10 w-10 min-w-[2.5rem] items-center justify-center">
          {icon}
        </div>
        <div className="mx-3 text-sm font-normal text-black">{children}</div>
        <button
          type="button"
          className="-mx-1.5 -my-1.5 ms-auto inline-flex h-8 w-8 min-w-[32px] items-center justify-center rounded-lg bg-white p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 focus:ring-2 focus:ring-gray-300 dark:bg-gray-800 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-white"
          aria-label="Close"
          onClick={onClose}
        >
          <span className="sr-only">Close</span>
          <SVGCloseButton
            bgStroke={{ default: "none", hover: "#625da6" }}
            stroke={{ default: "#686867", hover: "#fff" }}
            border={{ default: "#686867", hover: "none" }}
          />
        </button>
      </div>
    </>
  );
}
