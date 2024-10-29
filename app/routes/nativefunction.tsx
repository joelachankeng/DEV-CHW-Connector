import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";

export const loader: LoaderFunction = ({ request }) => {
  return json({ message: "Hello, World!" });
};

export default function NativeFunction() {
  return (
    <>
      <h1>{JSON.stringify(window.CHW)}</h1>
      <div
        dangerouslySetInnerHTML={{
          __html: `
         <script type="text/javascript">
      // Check if the user agent matches the app's user agent
      const isApp = navigator.userAgent.toLowerCase().indexOf("canvas") > -1;

      // Add the event listener that will trigger once the native functions are ready to be used
      window.addEventListener(
        "message",
        (event) => {
          runNativeFunctions(event);
        },
        false,
      );

      // Run when the event listener is triggered
      function runNativeFunctions(event) {
        try {
          if (isApp) {
            if (event.data && event.data == "nativeFunctionsLoaded") {
              // Set the external user ID
              let externalUserId = new Date();
              let doesWork = document.querySelector(".doesWork");
              let app = document.querySelector(".inApp");

              app.innerHTML = "yes, we are in the app";

              if (window.nativeFunctions != undefined) {
                nativeFunctions.onesignalSetExternalUserId(externalUserId);
                doesWork.innerHTML =
                  "yes, the native function triggered successfully";
              } else {
                doesWork.innerHTML = "window.nativeFunctions check failed";
              }
            }
          }
        } catch (ex) {
          var span = document.getElementById("response");
          span.textContent = "Error: " + ex.message;
          console.log(span.textContent);
          doesWork.innerHTML = "no, something went wrong";
        }
      }
    </script>
 

    <h1>Are native functions working?</h1>
    <h3 class="doesWork">No</h3>
    <br /><br />

    <h1>Are we in the app?</h1>
    <h3 class="inApp">No</h3>
    <br /><br />
    `,
        }}
      ></div>
    </>
  );
}
