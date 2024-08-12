import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import {
  classNames,
  classNamesOverride,
  iClassNamesOverride,
} from "~/utilities/main";
import { FORM_CLASSES } from "./FormFields";

interface iSelectFieldProps {
  classes?: {
    parent?: iClassNamesOverride;
    label?: iClassNamesOverride;
    labelOptional?: iClassNamesOverride;
    container?: iClassNamesOverride;
    select?: iClassNamesOverride;
  };
  defaultValue?: string;
  onChange?: (value: string) => void;
  label?: string;
  name: string;
  error?: string;
  options: { label: string; value: string }[];
  [x: string]: any; // For any other props we want to pass in
}

export const SelectField = ({
  classes = {},
  defaultValue,
  onChange,
  label,
  name,
  options,
  error,
  ...x
}: iSelectFieldProps) => {
  return (
    <div
      className={classNamesOverride(
        "flex w-2/5 flex-grow flex-col space-y-1",
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
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center  pr-3">
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className={classNames("h-5 w-5", FORM_CLASSES.ERROR.COLOR)}
              aria-hidden="true"
            />
          </div>
        )}
        <select
          id={name}
          name={name}
          className={classNamesOverride(
            classNames(
              error ? FORM_CLASSES.ERROR.BORDER : "border-gray-300",
              FORM_CLASSES.SELECT.DEFAULT.replace("border-gray-300", ""),
            ),
            classes.select,
          )}
          defaultValue={defaultValue}
          {...x}
          onChange={(e) => {
            if (onChange) {
              onChange(e.target.value);
            }
          }}
        >
          {options?.map((option, index) => (
            <option
              key={name + option.label + option.value + index}
              value={option.value}
              {...{
                disabled: option.value === "" ? true : false,
              }}
            >
              {option.label}
            </option>
          ))}
        </select>
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
