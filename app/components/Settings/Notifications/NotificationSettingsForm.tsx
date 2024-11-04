import {
  useActionData,
  useNavigation,
  useSubmit,
  Form,
} from "@remix-run/react";
import _ from "lodash";
import { useContext, useEffect, useState } from "react";
import type { ZodRawShape } from "zod";
import { z } from "zod";
import { Alert } from "~/components/Alert";
import type { iFormField } from "~/components/Forms/FormFields";
import {
  handleFormFieldsSubmit,
  handleDisabledSubmit,
  FORM_CLASSES,
  FormFields,
} from "~/components/Forms/FormFields";
import LoadingSpinner from "~/components/Loading/LoadingSpinner";
import type { iGenericError } from "~/models/appContext.model";
import type {
  iNotificationSettings,
  iNotificationSettings_Subcategory,
} from "~/models/notifications.model";
import { NOTIFICATIONS_TYPES } from "~/models/notifications.model";
import { AppContext } from "~/contexts/appContext";
import { classNames } from "~/utilities/main";

export const createFormFieldsFromSettings = (
  settings: iNotificationSettings_Subcategory,
): iFormField[] => {
  return Object.entries(settings)
    .filter(([key]) => {
      if (key == "description") return false;

      return true;
    })
    .map(([key, value]) => {
      const switchStyles = {
        disabled: "bg-chw-yellow",
      };
      const labelClassNames = "!mb-0";

      const field: iFormField = {
        classes: {
          label: {
            className: labelClassNames,
          },
        },
        switchStyles: switchStyles,
        label: findRelatedType(key)?.name || "",
        description: findRelatedType(key)?.description || "",
        name: key,
        type: "checkbox",
        required: true,
        value: value,
      };

      return field;
    });
};

export const createSchemaObjectFromSettings = (
  settings: iNotificationSettings_Subcategory,
): ZodRawShape => {
  const schemaObject: ZodRawShape = {};

  Object.entries(settings)
    .filter(([key]) => key !== "description")
    .forEach(([key]) => {
      const name = findRelatedType(key)?.name || key;
      schemaObject[key] = z.boolean({
        errorMap: () => ({
          message: `Please select true or false for ${name}`,
        }),
      });
    });

  return schemaObject;
};

type iActionData =
  | { success: iNotificationSettings }
  | iGenericError
  | undefined;

export function NotificationSettingsForm({
  settings,
  onSubmit,
}: {
  settings: iNotificationSettings_Subcategory;
  onSubmit: (formFields: iFormField[], data: FormData) => void;
}) {
  const actionData = useActionData() as iActionData;
  const navigation = useNavigation();
  const { User } = useContext(AppContext);

  const [actionDataState, setActionDataState] = useState(actionData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formFields, setFormFields] = useState(
    createFormFieldsFromSettings(settings),
  );
  const schemaObject = createSchemaObjectFromSettings(settings);

  useEffect(() => {
    if (navigation.state === "submitting") {
      setIsSubmitting(true);
      return;
    }
    if (navigation.state === "idle" && isSubmitting) {
      setIsSubmitting(false);
      setActionDataState(actionData);
    }
  }, [actionData, isSubmitting, navigation.state]);

  useEffect(() => {
    if (!actionDataState) return;

    if ("success" in actionDataState) {
      if (!User.user) return;
      const newUser = _.cloneDeep(User.user);

      newUser.userFields.notificationSettings = actionDataState.success;

      if (
        !_.isEqual(
          User.user.userFields.notificationSettings,
          actionDataState.success,
        )
      ) {
        User.set(newUser);
        // setActionDataState(undefined);
      }
    }
  }, [actionDataState]);

  const handleSubmit = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    const result = handleFormFieldsSubmit(formFields, schemaObject, e);
    if ("error" in result) return setFormFields(result.error);
    onSubmit(formFields, result.formData);
  };

  return (
    <Form
      method="post"
      encType="multipart/form-data"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      {actionDataState && (
        <>
          {"error" in actionDataState && (
            <Alert title="An error occurred" type="error" className="my-5">
              <p>{actionDataState.error}</p>
            </Alert>
          )}
          {"success" in actionDataState && (
            <Alert title="Success" type="success" className="my-5">
              <p>Your notification settings have been updated.</p>
            </Alert>
          )}
        </>
      )}
      <div className="mt-6 flex flex-col gap-4">
        <FormFields
          fields={formFields}
          schema={schemaObject}
          onFieldsChange={(fields) => setFormFields(fields)}
        />
      </div>
      <div className="mt-4 flex justify-end">
        {navigation.state !== "idle" ? (
          <LoadingSpinner className="mx-auto mb-2" />
        ) : (
          <>
            <button
              disabled={handleDisabledSubmit(formFields)}
              className={classNames(
                handleDisabledSubmit(formFields)
                  ? FORM_CLASSES.BUTTON.DISABLED
                  : "cursor-pointer bg-chw-light-purple text-white hover:bg-chw-dark-purple",
                "rounded-[40px] border-[none] px-[25px]  py-2.5 text-center text-base font-bold transition duration-300 ease-in-out",
              )}
              type="submit"
              onClick={(e) => handleSubmit(e)}
            >
              Save Changes
            </button>
          </>
        )}
      </div>
    </Form>
  );
}

function findRelatedType(
  key: string,
): (typeof NOTIFICATIONS_TYPES)[number] | undefined {
  return NOTIFICATIONS_TYPES.find(
    (type) => type.key.toLowerCase() === key.toLowerCase(),
  );
}
