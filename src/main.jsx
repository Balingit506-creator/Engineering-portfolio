import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

// React entry point. Mount components into any element with a matching id in
// index.html, e.g. <div id="react-root"></div>. The rest of the page is still
// plain HTML driven by js/main.js.
const root = document.getElementById("react-root");

if (root) {
  createRoot(root).render(
    <StrictMode>
      <></>
    </StrictMode>
  );
}
