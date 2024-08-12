import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleExclamation,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import {
  useState,
  type ChangeEventHandler,
  type HTMLInputTypeAttribute,
} from "react";
import type { iClassNamesOverride } from "~/utilities/main";
import { classNames, classNamesOverride } from "~/utilities/main";
import { FORM_CLASSES } from "./FormFields";
import { Tooltip } from "react-tooltip";

type Fields = {
  classes?: {
    parent?: iClassNamesOverride;
    label?: iClassNamesOverride;
    labelOptional?: iClassNamesOverride;
    container?: iClassNamesOverride;
    input?: iClassNamesOverride;
  };
  name: string;
  label?: string;
  error?: string;
  autoComplete?: string;
  type?: HTMLInputTypeAttribute | undefined;
  accept?: string;
  defaultValue?: string | undefined;
  value?: string | undefined;
  disabled?: boolean;
  onChange?: ChangeEventHandler<HTMLInputElement> | undefined;
  optional?: boolean;
  key?: string | number;
  placeholder?: string;
  disableErrorText?: boolean;
  required?: boolean;
  [x: string]: any;
};

export const PasswordField = ({
  classes = {},
  name,
  label,
  error,
  autoComplete,
  type = "text",
  defaultValue = undefined,
  onChange = undefined,
  value = undefined,
  disabled = false,
  accept = undefined,
  optional = false,
  placeholder,
  disableErrorText,
  required,
  ...x
}: Fields) => {
  let filteredDefaultValue = defaultValue;
  switch (filteredDefaultValue) {
    case "New":
    case "User":
      filteredDefaultValue = undefined;
      break;
  }

  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={classNamesOverride("", classes.parent)}>
      {label && (
        <label
          htmlFor={name}
          className={classNamesOverride(
            FORM_CLASSES.LABEL.DEFAULT,
            classes.label,
          )}
        >
          {label}{" "}
          {optional ? (
            <span
              className={classNamesOverride(
                FORM_CLASSES.LABEL.OPTIONAL,
                classes.labelOptional,
              )}
            >
              (Optional)
            </span>
          ) : (
            ``
          )}
        </label>
      )}
      <div
        className={classNamesOverride(
          classNames(label ? "mt-1" : "", "relative rounded-md shadow-sm"),
          classes.container,
        )}
      >
        <input
          type={showPassword ? "text" : type}
          id={name}
          name={name}
          disabled={disabled}
          accept={accept}
          className={classNamesOverride(
            classNames(
              error ? FORM_CLASSES.ERROR.BORDER : "border-gray-300",
              FORM_CLASSES.INPUT.TEXT.replace("border-gray-300", ""),
            ),
            classes.input,
          )}
          autoComplete={autoComplete}
          defaultValue={filteredDefaultValue}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          {...x}
        />
        <Tooltip id={`tooltip-password-visibility${name}`} />
        <button
          className={classNames(
            "absolute inset-y-0 right-0",
            error ? "mr-10" : "mr-5",
          )}
          onClick={(e) => {
            e.preventDefault();
            setShowPassword(!showPassword);
          }}
        >
          <div
            data-tooltip-id={`tooltip-password-visibility${name}`}
            data-tooltip-content={`${showPassword ? "Hide" : "Show"} Password`}
            data-tooltip-place="top"
            className="rounded-[40px] bg-white px-2 py-0.5 text-chw-light-purple transition duration-300 ease-in-out hover:bg-chw-light-purple hover:text-white"
          >
            <span className="sr-only">
              {showPassword ? "Hide" : "Show"} Password
            </span>

            {showPassword ? (
              <FontAwesomeIcon icon={faEyeSlash} />
            ) : (
              <FontAwesomeIcon icon={faEye} />
            )}
          </div>
        </button>
        {error && (
          <div
            className={classNames(
              "pointer-events-none absolute inset-y-0 right-0 flex items-center",
              type === "number" ? "pr-8" : "pr-3",
            )}
          >
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className={classNames("h-5 w-5", FORM_CLASSES.ERROR.COLOR)}
              aria-hidden="true"
            />
          </div>
        )}
      </div>
      {!disableErrorText && error && (
        <p
          className={classNames(
            "form-field-error",
            "mt-2 text-sm",
            FORM_CLASSES.ERROR.COLOR,
          )}
          id={`${name}-error`}
        >
          {error}
        </p>
      )}
    </div>
  );
};
