import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useEffect, useState, type HTMLInputTypeAttribute } from "react";
import type { iClassNamesOverride } from "~/utilities/main";
import { classNames, classNamesOverride } from "~/utilities/main";
import React from "react";
import { FORM_CLASSES } from "./FormFields";

interface iRadioButtonFieldProps {
  classes?: {
    parent?: iClassNamesOverride;
    label?: iClassNamesOverride;
    container?: iClassNamesOverride;
    input?: iClassNamesOverride;
  };
  options: iRadioButtonFieldInput[];
  onChange?: (value: string) => void;
  label: string;
  error?: string;
  name: string;
  required?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
}

export type iRadioButtonFieldInput = {
  type: HTMLInputTypeAttribute | undefined;
  id: string;
  name: string;
  value: string;
  checked?: boolean;
  label: string;
};

export const RadioButtonField = ({
  options = [],
  classes = {},
  label,
  checked,
  defaultChecked,
  error,
  name,
  required,
  onChange,
}: iRadioButtonFieldProps) => {
  const [selected, setSelected] = useState<string | undefined>(
    options.find((input) => input.checked)?.value,
  );

  useEffect(() => {
    if (!checked) return;
    setSelected(options.find((input) => input.checked)?.value);
  }, [options]);

  return (
    <>
      <fieldset className={classNamesOverride("", classes.parent)}>
        <div className="flex gap-2">
          {error && (
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className={classNames("h-5 w-5", FORM_CLASSES.ERROR.COLOR)}
              aria-hidden="true"
            />
          )}
          <legend
            className={classNamesOverride(
              FORM_CLASSES.LABEL.DEFAULT,
              classes.label,
            )}
          >
            {label}
          </legend>
        </div>
        <div
          className={classNamesOverride(
            "mt-1 flex w-full flex-wrap items-center gap-4",
            classes.container,
          )}
        >
          {options.map((input) => (
            <div className="flex cursor-pointer items-center" key={input.id}>
              <label
                htmlFor={input.id}
                className="relative flex cursor-pointer select-none flex-row-reverse gap-2"
              >
                {input.label}
                <input
                  required={required}
                  type={input.type}
                  id={input.id}
                  name={input.name}
                  value={input.value}
                  {...(defaultChecked && { defaultChecked: input.checked })}
                  {...(checked && { checked: selected === input.value })}
                  onChange={(e) => {
                    if (onChange) {
                      onChange(e.target.value);
                      setSelected(e.target.value);
                    }
                  }}
                  className={classNamesOverride(
                    "absolute h-0 w-0 opacity-0",
                    classes.input,
                  )}
                />
                <span
                  className={classNames(
                    "relative block h-5 w-5 rounded-full bg-chw-floral-white transition duration-300 ease-in-out",
                    selected === input.value
                      ? "border-[0.438rem] border-chw-light-purple"
                      : "border border-chw-black-shadows",
                  )}
                ></span>
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      {error && (
        <p
          className={classNames("my-2 text-sm", FORM_CLASSES.ERROR.COLOR)}
          id={`${name}-error`}
        >
          {error}
        </p>
      )}
    </>
  );
};
