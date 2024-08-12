import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import type { iClassNamesOverride } from "~/utilities/main";
import { classNames, classNamesOverride } from "~/utilities/main";
import { FORM_CLASSES } from "./FormFields";

interface iTextAreaFieldProps {
  classes?: {
    parent?: iClassNamesOverride;
    label?: iClassNamesOverride;
    labelOptional?: iClassNamesOverride;
    container?: iClassNamesOverride;
    textarea?: iClassNamesOverride;
  };
  defaultValue?: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  name: string;
  cols?: number;
  rows?: number;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [x: string]: any; // For any other props we want to pass in
}

export const TextAreaField = ({
  classes = {},
  defaultValue,
  value,
  onChange,
  label,
  name,
  cols = 40,
  rows = 5,
  error,
  ...x
}: iTextAreaFieldProps) => {
  return (
    <div
      className={classNamesOverride(
        "flex w-full flex-grow flex-col space-y-1",
        classes.parent,
      )}
    >
      {label && (
        <label
          htmlFor={name}
          className={classNamesOverride(
            FORM_CLASSES.LABEL.DEFAULT,
            classes.label,
          )}
        >
          {label}
        </label>
      )}

      <div
        className={classNamesOverride(
          "relative mt-1 rounded-md shadow-sm",
          classes.container,
        )}
      >
        {error && (
          <div className="pointer-events-none absolute  right-0 top-0 flex items-center pr-3 pt-1">
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className={classNames("h-5 w-5", FORM_CLASSES.ERROR.COLOR)}
              aria-hidden="true"
            />
          </div>
        )}
        <textarea
          id={name}
          name={name}
          className={classNamesOverride(
            classNames(
              error ? FORM_CLASSES.ERROR.BORDER + " pr-6" : "border-gray-300",
              FORM_CLASSES.TEXTAREA.DEFAULT.replace("border-gray-300", ""),
            ),
            classes.textarea,
          )}
          cols={cols}
          rows={rows}
          defaultValue={defaultValue}
          value={value}
          onChange={(e) => {
            if (onChange) {
              onChange(e.target.value);
            }
          }}
          {...x}
        />
      </div>
      {error && (
        <p
          className={classNames("mt-2 text-sm", FORM_CLASSES.ERROR.COLOR)}
          id={`${name}-error`}
        >
          {error}
        </p>
      )}
    </div>
  );
};
