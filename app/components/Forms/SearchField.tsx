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
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      className={classNames(
        "w-full mt-4 p-2.5 rounded-full border-none outline-none bg-[#f4ebdf] text-[#686867] flex items-center gap-1",
        className ?? "",
      )}
    >
      <span className="sr-only">{screenReaderText}</span>
      <div className="h-5 w-5">
        <SVGSearch />
      </div>
      <input
        className="bg-transparent text-sm leading-[18px] text-[#032525] placeholder:text-[#686867] w-full focus:outline-none"
        type="text"
        defaultValue={defaultValue}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
}
