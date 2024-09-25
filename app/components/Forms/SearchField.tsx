import { useEffect, useState } from "react";
import SVGSearch from "~/assets/SVGs/SVGSearch";
import { classNames } from "~/utilities/main";

export default function SearchField({
  className,
  screenReaderText,
  placeholder,
  defaultValue,
  onChange,
}: {
  className?: string;
  screenReaderText: string;
  placeholder?: string;
  defaultValue?: string;
  onChange: (e: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      onChange(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  return (
    <div
      className={classNames(
        "mt-4 flex w-full items-center gap-1 rounded-full border-none bg-[#f4ebdf] p-2.5 text-[#686867] outline-none",
        className ?? "",
      )}
    >
      <span className="sr-only">{screenReaderText}</span>
      <div className="h-5 w-5">
        <SVGSearch />
      </div>
      <input
        className="w-full bg-transparent pl-1 text-sm leading-[18px] text-[#032525] placeholder:text-[#686867] focus:outline-none"
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        // onChange={onChange}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </div>
  );
}
