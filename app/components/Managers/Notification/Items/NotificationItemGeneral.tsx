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
        className="flex items-center p-4 text-gray-500 bg-white rounded-lg shadow-md dark:text-gray-400 dark:bg-gray-800 w-auto"
        role="alert"
      >
        <div className="inline-flex items-center justify-center w-10 h-10 min-w-[2.5rem]">
          {icon}
        </div>
        <div className="mx-3 text-sm text-black font-normal">{children}</div>
        <button
          type="button"
          className="ms-auto -mx-1.5 -my-1.5 min-w-[32px] bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
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
