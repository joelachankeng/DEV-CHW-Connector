import { Fragment, useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { CheckIcon, ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import {
  classNames,
  classNamesOverride,
  iClassNamesOverride,
} from "~/utilities/main";
import { FORM_CLASSES } from "./FormFields";

interface iListBoxFieldProps {
  classes?: {
    parent?: iClassNamesOverride;
    label?: iClassNamesOverride;
    labelOptional?: iClassNamesOverride;
    container?: iClassNamesOverride;
    select?: iClassNamesOverride;
  };
  defaultValue?: string;
  onChange?: (value: string) => void;
  label: string;
  name: string;
  error?: string;
  options: { label: string; value: string }[];
  position?: "left" | "right";
}
export const ListBoxField = ({
  classes = {},
  defaultValue,
  onChange,
  label,
  name,
  options,
  error,
  position = "left",
}: iListBoxFieldProps) => {
  const initializeSelected = (): iListBoxFieldProps["options"][0] => {
    const defaultOption = options[0];
    if (defaultValue) {
      const getOption = options.find((option) => option.value === defaultValue);
      if (getOption) {
        return getOption;
      }
    }
    return defaultOption;
  };

  const [selectedItem, setSelectedItem] = useState(initializeSelected());

  useEffect(() => {
    if (onChange) {
      onChange(selectedItem.value);
    }
  }, [selectedItem.value]);

  return (
    <div className={classNamesOverride("w-full", classes.parent)}>
      <label
        htmlFor={name}
        className={classNamesOverride(
          FORM_CLASSES.LABEL.DEFAULT,
          classes.label,
        )}
      >
        {label}
      </label>
      <Listbox value={selectedItem} onChange={setSelectedItem}>
        <div className={classNamesOverride("relative", classes.container)}>
          {error && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className={classNames("h-5 w-5", FORM_CLASSES.ERROR.COLOR)}
                aria-hidden="true"
              />
            </div>
          )}
          <Listbox.Button
            className={classNamesOverride(
              classNames(
                error ? FORM_CLASSES.ERROR.BORDER : "",
                "relative w-full cursor-point default rounded-lg pr-8 text-left focus:outline-none focus-visible:border-chw-light-purple focus-visible:ring-2 focus-visible:ring-chw-black-shadows focus-visible:ring-offset-2 focus-visible:ring-offset-chw-yellow",
              ),
              classes.select,
            )}
          >
            <span className="inline truncate">{selectedItem.label}</span>
            <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronUpDownIcon
                className="h-5 w-5 text-[#032525]"
                aria-hidden="true"
              />
            </span>
          </Listbox.Button>
          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options
              className={classNames(
                position === "left" ? "left-0" : "right-0",
                "absolute z-20 mt-1 max-h-60 w-auto overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none",
              )}
            >
              {options.map((opt, optIdx) => (
                <Listbox.Option
                  key={optIdx}
                  className={({ active }) =>
                    `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                      active
                        ? "bg-chw-light-purple text-white"
                        : "text-[#032525]"
                    }`
                  }
                  value={opt}
                >
                  {({ selected }) => (
                    <>
                      <span
                        className={`block truncate ${
                          selected === true ? "font-semibold" : "font-normal"
                        }`}
                      >
                        {opt.label}
                      </span>
                      {selected === true ? (
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#FABE46]">
                          <CheckIcon className="h-5 w-5" aria-hidden="true" />
                        </span>
                      ) : null}
                    </>
                  )}
                </Listbox.Option>
              ))}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
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
