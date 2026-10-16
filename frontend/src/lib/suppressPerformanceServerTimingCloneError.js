window.addEventListener("error", (event) => {
  if (event.error instanceof DOMException && event.error.name === "DataCloneError" &&
      event.message?.includes("PerformanceServerTiming")) {
    event.stopImmediatePropagation();
    event.preventDefault();
  }
}, true);
