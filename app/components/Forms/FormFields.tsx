import React, { useCallback, useEffect, useState } from "react";
import { InputField } from "./InputField";
import { SelectField } from "./SelectField";
import { SwitchGroup } from "./SwitchGroup";
import { TextAreaField } from "./TextAreaField";
import type { ZodRawShape, ZodTypeAny } from "zod";
import { z } from "zod";
import _ from "lodash";
import { MultiInputField } from "./MultiInputField";
import { type TypedResponse, json } from "@remix-run/server-runtime";
import type { iClassNamesOverride } from "~/utilities/main";
import { PasswordField } from "./PasswordField";
import type { iRadioButtonFieldInput } from "./RadioButtonField";
import { RadioButtonField } from "./RadioButtonField";
import type { iGenericError } from "~/models/appContext.model";

export const FORM_CLASSES = {
  LABEL: {
    DEFAULT: "block text-md font-medium text-gray-700 mb-2",
    OPTIONAL: "text-gray-700 italic",
  },
  ERROR: {
    DEFAULT: "text-red-500 text-sm italic",
    COLOR: "text-red-500",
    BORDER: "text-red-500",
  },
  INPUT: {
    TEXT: "block w-full text-chw-dark-green text-base bg-chw-floral-white border px-5 py-2.5 rounded-3xl border-solid border-chw-black-shadows placeholder:text-chw-dim-gray focus:border-chw-light-purple focus:ring-chw-light-purple disabled:pointer-events-none disabled:opacity-25",
  },
  TEXTAREA: {
    DEFAULT:
      "block w-full rounded-md shadow-sm focus:border-chw-light-purple focus:ring-chw-light-purple disabled:pointer-events-none disabled:opacity-25 sm:text-sm border-gray-300",
  },
  SELECT: {
    DEFAULT:
      "block w-full rounded-md shadow-sm focus:border-chw-light-purple focus:ring-chw-light-purple disabled:pointer-events-none disabled:opacity-25 border-gray-300",
  },
  SWITCH: {
    DEFAULT:
      "relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent ring-0 transition-colors duration-200 ease-in-out border-gray-300",
  },
  BUTTON: {
    DISABLED: "cursor-not-allowed bg-chw-dim-gray text-chw-black-shadows",
  },
};

export type iFormField = {
  classes?: {
    parent?: iClassNamesOverride;
    label?: iClassNamesOverride;
    labelOptional?: iClassNamesOverride;
    container?: iClassNamesOverride;
    input?: iClassNamesOverride;
    textarea?: iClassNamesOverride;
    select?: iClassNamesOverride;
  };
  label: string;
  name: string;
  required?: boolean;
  value: string | number | boolean | string[];
  error?: string;
  placeholder?: string;
  autoComplete?: string;
} & (
  | iFormField_Default
  | iFormField_Select
  | iFormField_Checkbox
  | iFormField_MultiInput
  | iFormField_Radio
);

type iFormField_Default = {
  type: "text" | "email" | "password" | "number" | "textarea" | "price";
};

type iFormField_Select = {
  type: "select";
  options: { label: string; value: string }[];
};

type iFormField_Checkbox = {
  type: "checkbox";
  description?: string | React.ReactNode;
  switchStyles: {
    enabled?: string;
    disabled?: string;
  };
};

type iFormField_MultiInput = {
  type: "multi-input";
  onKeys?: string[];
};

type iFormField_Radio = {
  type: "radio";
  options: iRadioButtonFieldInput[];
};

export interface iFormFieldChange {
  key: string;
  value: iFormField["value"];
}

export type FormFieldsProps = {
  fields: iFormField[];
  schema: ZodRawShape;
  onFieldChange?: (change: iFormFieldChange) => void;
  onFieldsChange?: (fields: iFormField[]) => void;
};

export interface iFormFieldValidation {
  key: string | number;
  value: iFormField["value"];
  error?: string;
}

export interface iFormFieldsValidation {
  fields: iFormField[];
  errors: iFormFieldValidation[];
}

const convertFieldValueToType = (field: iFormField): iFormField["value"] => {
  if (!("type" in field)) return "NOVALUE";

  if (field.type === "number") {
    return Number(field.value);
  }

  if (field.type === "price") {
    return Number(field.value);
  }

  return field.value;
};

export const validateFormFields = (
  formFields: iFormField[],
  schemaObject: ZodRawShape,
): iFormFieldValidation[] => {
  const validationFields: Record<string, string | number | boolean | string[]> =
    {};

  formFields.forEach((formField) => {
    const value = convertFieldValueToType(formField);
    validationFields[formField.name] = value;
  });

  const zObject = z.object(schemaObject);
  const errors = zObject.safeParse(validationFields);

  const validationErrors: iFormFieldValidation[] = [];

  if (!errors.success) {
    errors.error.issues.forEach((issue) => {
      issue.path.forEach((path) => {
        let errorMessage = issue.message;
        if (errorMessage?.toLowerCase() === "required")
          errorMessage = `${_.capitalize(path as string)} is required.`;

        validationErrors.push({
          key: path,
          value: validationFields[path],
          error: errorMessage,
        });
      });
    });
  }
  return validationErrors;
};

export const handleFormChangeValidation = (
  formFieldChange: iFormFieldChange,
  formFields: iFormField[],
  schemaObject: ZodRawShape,
): iFormFieldsValidation => {
  const formField = formFields.find(
    (formField) => formField.name === formFieldChange.key,
  );

  if (!formField) {
    return { fields: formFields, errors: [] };
  }

  const clonedFormFields = _.cloneDeep(formFields);

  clonedFormFields.forEach((field) => {
    if (field.name === formFieldChange.key) {
      const value = formFieldChange.value as string;
      field.value = value;
    }
  });

  clonedFormFields.forEach((field) => {
    field.error = undefined;
  });

  const errors = validateFormFields(clonedFormFields, schemaObject);

  errors.forEach((error) => {
    if (error.key === formFieldChange.key) {
      clonedFormFields.forEach((field) => {
        if (field.name === error.key) {
          field.error = error.error;
        }
      });
    }
  });

  return { fields: clonedFormFields, errors };
};

export const handleFormFieldsValidation = (
  formFields: iFormField[],
  schemaObject: ZodRawShape,
): iFormFieldsValidation => {
  const clonedFormFields = _.cloneDeep(formFields);

  clonedFormFields.forEach((formField) => {
    formField.error = undefined;
  });

  const errors = validateFormFields(clonedFormFields, schemaObject);

  errors.forEach((error) => {
    clonedFormFields.forEach((formField) => {
      if (formField.name === error.key) {
        formField.error = error.error;
      }
    });
  });

  return { fields: clonedFormFields, errors };
};

type handleRequestFormFieldsValidationData = {
  schema: ZodRawShape;
} & (
  | handleRequestFormFieldsValidationData_Request
  | handleRequestFormFieldsValidationData_FormData
  | handleRequestFormFieldsValidationData_FormField
);
type handleRequestFormFieldsValidationData_Request = {
  request: Request;
};

type handleRequestFormFieldsValidationData_FormData = {
  formData: FormData;
};

type handleRequestFormFieldsValidationData_FormField = {
  fields: iFormField[];
};

export const handleRequestFormFieldsValidation = async (
  data: handleRequestFormFieldsValidationData,
): Promise<TypedResponse<iGenericError> | iFormFieldsValidation> => {
  const { schema } = data;

  let submittedForm: iFormField[] = [];

  if ("request" in data) {
    const request = data.request;
    const formData = await request.formData();
    const formSubmission = formData.get("form") as string;
    submittedForm = JSON.parse(formSubmission) as iFormField[];
  } else if ("formData" in data) {
    const formData = data.formData;
    const formSubmission = formData.get("form") as string;
    submittedForm = JSON.parse(formSubmission) as iFormField[];
  } else {
    const fields = data.fields;
    submittedForm = fields;
  }
  const formValidation = handleFormFieldsValidation(submittedForm, schema);

  if (formValidation.errors.length) {
    return json(
      {
        error:
          formValidation.errors[0].error ||
          "There was an error with the form submission.",
      },
      { status: 400 },
    );
  }

  return formValidation;
};

export const handleDisabledSubmit = (formFields: iFormField[]): boolean => {
  if (formFields.some((formField) => formField.error)) return true;

  if (
    formFields.some(
      (formField) =>
        (formField.value === "" ||
          formField.value === null ||
          formField.value === undefined ||
          (Array.isArray(formField.value) && formField.value.length === 0)) &&
        formField.required,
    )
  )
    return true;

  return false;
};

export const handleFormFieldsSubmit = (
  formFields: iFormField[],
  schema: ZodRawShape,
  e?: React.MouseEvent<HTMLButtonElement>,
):
  | {
      error: iFormField[];
    }
  | {
      formData: FormData;
    } => {
  e?.preventDefault();
  let newFormFields = _.cloneDeep(formFields);
  newFormFields = handleFormFieldsValidation(formFields, schema).fields;
  if (handleDisabledSubmit(newFormFields)) return { error: newFormFields };

  const formData = new FormData();
  formData.append("form", JSON.stringify(formFields));
  return { formData: formData };
};

export const FormFields = ({
  fields,
  schema,
  onFieldChange,
  onFieldsChange,
}: FormFieldsProps) => {
  const renderFormField = useCallback(
    (
      field: iFormField,
      onChange: (change: iFormFieldChange) => void,
    ): React.ReactNode => {
      if (!("type" in field)) return <>A type is required for all fields.</>;

      const computedClasses = (): iFormField["classes"] => {
        let filteredClasses: iFormField["classes"] = field.classes;
        if (
          filteredClasses?.parent === undefined ||
          filteredClasses?.parent?.className === undefined ||
          filteredClasses?.parent?.className === ""
        ) {
          let defaultParentClassNames = "w-2/5 flex-grow";
          if (field.type === "checkbox") {
            defaultParentClassNames += " gap-4 w-full";
          }
          filteredClasses = {
            ...filteredClasses,
            parent: {
              className: defaultParentClassNames,
            },
          };
        }

        return filteredClasses;
      };

      switch (field.type) {
        case "radio":
          return (
            <RadioButtonField
              classes={computedClasses()}
              options={field.options as iRadioButtonFieldInput[]}
              // defaultChecked={true}
              onChange={(e) => {
                onChange({
                  key: field.name,
                  value: e,
                });
              }}
              label={field.label}
              error={field.error}
              name={field.name}
            />
          );

        case "number":
          return (
            <InputField
              classes={computedClasses()}
              label={field.label}
              name={field.name}
              type="number"
              required={field.required}
              error={field.error}
              defaultValue={field.value as string}
              placeholder={field.placeholder}
              onChange={(e) => {
                onChange({
                  key: field.name,
                  value: e.target.value,
                });
              }}
            />
          );
        case "price":
          return (
            <InputField
              classes={computedClasses()}
              label={field.label}
              name={field.name}
              type="number"
              min="0"
              step="0.01"
              required={field.required}
              error={field.error}
              defaultValue={field.value as string}
              placeholder={field.placeholder}
              onChange={(e) => {
                onChange({
                  key: field.name,
                  value: e.target.value,
                });
              }}
            />
          );
        case "textarea":
          return (
            <TextAreaField
              classes={computedClasses()}
              label={field.label}
              name={field.name}
              required={field.required}
              error={field.error}
              defaultValue={field.value as string}
              placeholder={field.placeholder}
              onChange={(e) => {
                onChange({
                  key: field.name,
                  value: e,
                });
              }}
            />
          );
        case "select":
          return (
            <SelectField
              classes={computedClasses()}
              label={field.label}
              name={field.name}
              required={field.required}
              error={field.error}
              options={field.options || []}
              defaultValue={field.value as string}
              onChange={(e) => {
                onChange({
                  key: field.name,
                  value: e,
                });
              }}
            />
          );
        case "checkbox":
          return (
            <SwitchGroup
              classes={{
                ...computedClasses(),
                enabled: field.switchStyles.enabled,
                disabled: field.switchStyles.disabled,
              }}
              label={field.label}
              error={field.error}
              description={field.description}
              checked={field.value as boolean}
              onChange={(checkState: boolean) => {
                onChange({
                  key: field.name,
                  value: checkState,
                });
              }}
            />
          );
        case "email":
          return (
            <InputField
              classes={computedClasses()}
              label={field.label}
              name={field.name}
              type="email"
              required={field.required}
              error={field.error}
              defaultValue={field.value as string}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              onChange={(e) => {
                onChange({
                  key: field.name,
                  value: e.target.value,
                });
              }}
            />
          );
        case "password":
          return (
            <PasswordField
              classes={computedClasses()}
              label={field.label}
              name={field.name}
              type="password"
              required={field.required}
              error={field.error}
              defaultValue={field.value as string}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              onChange={(e) => {
                onChange({
                  key: field.name,
                  value: e.target.value,
                });
              }}
            />
          );
        case "multi-input":
          return (
            <MultiInputField
              classes={computedClasses()}
              label={field.label}
              name={field.name}
              required={field.required}
              error={field.error}
              value={field.value as string[]}
              placeholder={field.placeholder}
              validationFunction={(value) => {
                const zObject = schema[field.name as keyof typeof schema];

                if (!zObject || typeof zObject !== "object")
                  return {
                    isValid: false,
                    message: "SCHEMA ERROR",
                  };

                const result = (zObject as ZodTypeAny).safeParse([value]);

                if (!result.success) {
                  return {
                    isValid: false,
                    message: result.error.issues[0].message,
                  };
                }

                return { isValid: result.success };
              }}
              onKeys={field.onKeys}
              onValuesChange={(value) => {
                onChange({
                  key: field.name,
                  value: value,
                });
                return value;
              }}
            />
          );
        default:
          return (
            <InputField
              classes={computedClasses()}
              label={field.label}
              name={field.name}
              type="text"
              required={field.required}
              error={field.error}
              defaultValue={field.value as string}
              placeholder={field.placeholder}
              autoComplete={field.autoComplete}
              onChange={(e) => {
                onChange({
                  key: field.name,
                  value: e.target.value,
                });
              }}
            />
          );
      }
    },
    [schema],
  );

  const getFormDOM = useCallback(
    (fields: iFormField[]): React.ReactNode => {
      return fields.map((field, index) => (
        <React.Fragment key={field.name.concat(index as unknown as string)}>
          {renderFormField(field, (formFieldChange) => {
            field.value = formFieldChange.value;

            if (onFieldChange !== undefined)
              return onFieldChange(formFieldChange);

            const newFormFields = handleFormChangeValidation(
              formFieldChange,
              fields,
              schema,
            ).fields;

            if (onFieldsChange !== undefined)
              return onFieldsChange(newFormFields);

            setFormDOM(getFormDOM(newFormFields));
          })}
        </React.Fragment>
      ));
    },
    [onFieldChange, onFieldsChange, renderFormField, schema],
  );

  const [formDOM, setFormDOM] = useState<React.ReactNode>(getFormDOM(fields));

  useEffect(() => {
    setFormDOM(getFormDOM(fields));
  }, [fields, getFormDOM]);

  return <>{formDOM}</>;
};
