console.log("Mobiloud script loaded");
window.CHW = {
  Mobiloud: {
    isReady: false,
  },
};

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
        window.CHW.Mobiloud = {
          isReady: true,
        };
        console.log("Native functions are ready to be used");
      }
    }
  } catch (ex) {
    console.error(`Error in runNativeFunctions`, ex);
  }
}
