import { ErrorPageGeneric } from "~/components/Pages/ErrorPage";

export default function Notifications() {
  return (
    <ErrorPageGeneric
      error={{
        error: "Coming Soon",
        error_description:
          "The notifications feature is still in development. Please check back later.",
      }}
      dataType="Notifications"
      status=" "
    />
  );
}
