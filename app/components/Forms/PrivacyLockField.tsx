import { faLock, faLockOpen } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Tooltip } from "react-tooltip";
import { classNames } from "~/utilities/main";

export default function PrivacyLockField({
  name,
  value,
  onChange,
  className,
}: {
  name: string;
  value?: boolean;
  onChange: (value: boolean) => void;
  className?: string;
}) {
  const checked = value || false;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(!e.target.checked);
  };
  return (
    <>
      <Tooltip id={`tooltip-privacy-${name}`} />
      <div className={className}>
        <div
          data-tooltip-id={`tooltip-privacy-${name}`}
          data-tooltip-content={`${checked ? "Set Public" : "Set Private"}`}
          data-tooltip-place="top"
          className="px-2 py-0.5 rounded-[40px] text-chw-light-purple hover:bg-chw-light-purple hover:text-white transition duration-300 ease-in-out"
        >
          <div className="relative">
            <input
              type="checkbox"
              name={name}
              // defaultChecked={defaultValue}
              value={value ? "true" : "false"}
              checked={checked ? true : false}
              onChange={handleChange}
              className={classNames(
                "w-full h-full opacity-0 absolute cursor-pointer",
              )}
            />
            <span className="sr-only">
              {checked ? "Set Public" : "Set Private"}
            </span>
            {checked ? (
              <FontAwesomeIcon icon={faLock} />
            ) : (
              <FontAwesomeIcon icon={faLockOpen} />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
