import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css"; 
import { StudentProvider } from "./context/StudentContext.jsx";

// Fix for external browser extension error: "TypeError: can't access property 'then', localStorage.setItem(...) is undefined"
// This monkey-patches setItem to return a Promise, satisfying the buggy extension.
const originalSetItem = localStorage.setItem;
localStorage.setItem = function(key, value) {
  originalSetItem.call(localStorage, key, value);
  return Promise.resolve();
};

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <StudentProvider>
        <App />
      </StudentProvider>
    </BrowserRouter>
  </React.StrictMode>
);
