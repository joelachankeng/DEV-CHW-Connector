import { useState } from "react";
import { Switch } from "@headlessui/react";
import type { iClassNamesOverride } from "~/utilities/main";
import { classNames, classNamesOverride } from "~/utilities/main";
import { FORM_CLASSES } from "./FormFields";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { type } from "node_modules/cypress/types/jquery";

interface iSwitchGroupProps {
  classes?: {
    parent?: iClassNamesOverride;
    label?: iClassNamesOverride;
    labelOptional?: iClassNamesOverride;
    container?: iClassNamesOverride;
    description?: iClassNamesOverride;
    switch?: iClassNamesOverride;
    enabled?: string;
    disabled?: string;
  };
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string | React.ReactNode;
  error?: string;
  name?: string;
}

export const SwitchGroup = ({
  classes = {},
  checked,
  onChange,
  label,
  description,
  error,
  name,
}: iSwitchGroupProps) => {
  const [enabled, setEnabled] = useState(checked);

  return (
    <div className="">
      <Switch.Group
        as="div"
        className={classNamesOverride(
          "flex items-center justify-between",
          classes.parent,
        )}
      >
        <span className="mr-2 flex flex-grow flex-col">
          <Switch.Label
            as="span"
            className={classNamesOverride(
              FORM_CLASSES.LABEL.DEFAULT,
              classes.label,
            )}
            passive
          >
            {label}
          </Switch.Label>
          <Switch.Description
            as="span"
            className={classNamesOverride(
              "text-sm text-gray-500",
              classes.description,
            )}
          >
            {description}
          </Switch.Description>
        </span>
        <div className="flex items-center gap-[0.5rem]">
          {error && (
            <div
              className={classNames(
                "relative flex items-center justify-center",
              )}
            >
              <FontAwesomeIcon
                icon={faCircleExclamation}
                className={classNames("h-5 w-5", FORM_CLASSES.ERROR.COLOR)}
                aria-hidden="true"
              />
            </div>
          )}
          <Switch
            checked={enabled}
            onChange={(value: boolean) => {
              setEnabled(!enabled);
              onChange(value === true ? true : false);
            }}
            className={classNamesOverride(
              classNames(
                enabled
                  ? classes.enabled || "bg-chw-light-purple"
                  : classes.disabled || "border-gray-300",
                FORM_CLASSES.SWITCH.DEFAULT.replace("border-gray-300", ""),
              ),
              classes.switch,
            )}
          >
            <span className="sr-only">Use {label}</span>

            <span
              className={classNames(
                enabled ? "translate-x-5" : "translate-x-0",
                "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
              )}
            >
              <span
                className={classNames(
                  enabled
                    ? "opacity-0 duration-100 ease-out"
                    : "opacity-100 duration-200 ease-in",
                  "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity",
                )}
                aria-hidden="true"
              >
                <svg
                  className="h-3 w-3 text-gray-400"
                  fill="none"
                  viewBox="0 0 12 12"
                >
                  <path
                    d="M4 8l2-2m0 0l2-2M6 6L4 4m2 2l2 2"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span
                className={classNames(
                  enabled
                    ? "opacity-100 duration-200 ease-in"
                    : "opacity-0 duration-100 ease-out",
                  "absolute inset-0 flex h-full w-full items-center justify-center transition-opacity",
                )}
                aria-hidden="true"
              >
                <svg
                  className="h-3 w-3 text-chw-light-purple"
                  fill="currentColor"
                  viewBox="0 0 12 12"
                >
                  <path d="M3.707 5.293a1 1 0 00-1.414 1.414l1.414-1.414zM5 8l-.707.707a1 1 0 001.414 0L5 8zm4.707-3.293a1 1 0 00-1.414-1.414l1.414 1.414zm-7.414 2l2 2 1.414-1.414-2-2-1.414 1.414zm3.414 2l4-4-1.414-1.414-4 4 1.414 1.414z" />
                </svg>
              </span>
            </span>
          </Switch>
        </div>
      </Switch.Group>
      {error && (
        <p
          className={classNames(
            "form-field-error",
            "mb-2 text-sm",
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
