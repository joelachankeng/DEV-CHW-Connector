import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";
import {
  useState,
  type HTMLInputTypeAttribute,
  type ChangeEvent,
  useRef,
} from "react";
import {
  classNames,
  classNamesOverride,
  iClassNamesOverride,
} from "~/utilities/main";

interface iMultiInputFieldProps {
  classes?: {
    parent?: iClassNamesOverride;
    label?: iClassNamesOverride;
    container?: iClassNamesOverride;
    input?: iClassNamesOverride;
  };
  defaultValue?: string;
  value?: string[];
  onChange?: (value: string) => string;
  label?: string;
  name: string;
  error?: string;
  autoComplete?: string;
  type?: HTMLInputTypeAttribute | undefined;
  accept?: string;
  disabled?: boolean;
  optional?: boolean;
  placeholder?: string;
  required?: boolean;
  validationFunction: (value: string) => {
    isValid: boolean;
    message?: string;
  };
  onValuesChange?: (value: string[]) => void;
  onKeys?: string[];
}

export const MultiInputField = ({
  defaultValue,
  value = [],
  classes = {},
  onChange,
  label,
  name,
  error,
  autoComplete,
  type = "text",
  disabled = false,
  accept = undefined,
  optional = false,
  placeholder,
  required,
  validationFunction,
  onValuesChange,
  onKeys = ["Enter"],
}: iMultiInputFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentValue, setCurrentValue] = useState<string>(defaultValue ?? "");
  const [values, setValues] = useState<string[]>(value);
  const [validationError, setValidationError] = useState<string | undefined>(
    undefined,
  );
  const [addButtonDisabled, setAddButtonDisabled] = useState<boolean>(true);

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    let fieldValue = e.target.value;
    if (onChange !== undefined) {
      fieldValue = onChange?.(e.target.value);
    }
    if (fieldValue === undefined) fieldValue = "";

    setCurrentValue(fieldValue);

    const result = validationFunction(fieldValue);
    if (result.isValid) {
      setValidationError(undefined);
      setAddButtonDisabled(false);
    } else {
      if (result.message !== undefined) {
        setValidationError(result.message);
      }
      setAddButtonDisabled(true);
    }
  };

  const addValue = () => {
    if (currentValue == "" && currentValue == undefined && currentValue == null)
      return;

    const result = validationFunction(currentValue);
    if (result.isValid) {
      const newValues = [...values, currentValue];

      if (onValuesChange !== undefined) onValuesChange(newValues);
      setValues(newValues);
      setCurrentValue("");
      setValidationError(undefined);
      setAddButtonDisabled(true);
    } else {
      if (result.message !== undefined) {
        setValidationError(result.message);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (onKeys.includes(e.key)) {
      e.preventDefault();
      addValue();
    }
    if (e.key === "Backspace" && currentValue === "") {
      const newValues = [...values];
      newValues.pop();

      if (onValuesChange !== undefined) onValuesChange(newValues);
      setValues(newValues);
    }
  };

  const handleDeleteValue = (index: number) => () => {
    const newValues = [...values];
    newValues.splice(index, 1);

    if (onValuesChange !== undefined) onValuesChange(newValues);
    setValues(newValues);
  };

  const handleContainerClick = () => {
    if (inputRef.current !== null) inputRef.current.focus();
  };

  const handleAddSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (addButtonDisabled) return;
    addValue();
  };

  return (
    <div className={classNamesOverride("", classes.parent)}>
      {label && (
        <label
          htmlFor={name}
          className={classNamesOverride(
            "block text-sm font-medium text-gray-700",
            classes.label,
          )}
        >
          {label}{" "}
          {optional ? (
            <span className="italic text-gray-400">(Optional)</span>
          ) : (
            ``
          )}
        </label>
      )}
      <div
        className={classNamesOverride(
          classNames(
            error
              ? "border-red-500 focus-within:border-2 focus-within:border-red-500  focus-within:ring-red-500 focus:border-red-500 focus:ring-red-500"
              : "focus-within:border-chw-black-shadows  focus-within:ring-chw-light-purple focus:border-chw-light-purple focus:ring-chw-light-purple ",
            "flex w-full flex-wrap items-center gap-3 overflow-hidden rounded-md border border-chw-black-shadows bg-white px-2.5 py-1 shadow-sm disabled:pointer-events-none disabled:opacity-25 sm:text-sm",
          ),
          classes.container,
        )}
        onClick={handleContainerClick}
      >
        {values.map((value, index) => (
          <div
            key={index}
            className="flex items-center gap-2 rounded-md bg-chw-light-purple px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-chw-dark-purple focus-visible:bg-chw-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
          >
            {value}
            <button onClick={handleDeleteValue(index)}>
              <FontAwesomeIcon
                icon={faCircleXmark}
                className="text-bg-white h-5 w-5 hover:scale-125 hover:fill-red-500 hover:text-white"
              />
            </button>
          </div>
        ))}
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            type={type}
            id={name}
            name={name}
            disabled={disabled}
            accept={accept}
            className={classNamesOverride(
              "m-0 w-auto rounded-none border-none shadow-none placeholder:text-gray-400 focus:border-transparent focus:ring-0 sm:text-sm",
              classes.input,
            )}
            autoComplete={autoComplete}
            value={currentValue}
            onChange={handleOnChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            required={required}
          />
          {error && (
            <div
              className={classNames(
                "pointer-events-none flex items-center p-0",
              )}
            >
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className="h-5 w-5 text-red-500"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
        <button
          className={classNames(
            addButtonDisabled
              ? "cursor-not-allowed bg-chw-floral-white text-chw-dim-gray opacity-50"
              : "cursor-pointer bg-chw-light-purple text-white opacity-100 hover:bg-chw-dark-purple",
            "ml-auto flex items-center gap-2 rounded-md  px-2.5 py-1.5 text-sm font-semibold  shadow-sm  focus-visible:bg-chw-yellow focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
          )}
          disabled={addButtonDisabled}
          onClick={handleAddSubmit}
        >
          <FontAwesomeIcon icon={faPlus} className="h-5 w-5" />
          <span>Add</span>
        </button>
      </div>
      {(validationError || error) && (
        <p className="mt-2 text-sm text-red-600" id={`${name}-error`}>
          {validationError || error}
        </p>
      )}
    </div>
  );
};
