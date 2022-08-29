import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
// import './samples/node-api'
import "antd/dist/antd.less";
import "styles/index.css";
import "styles/dark-theme.less";
import { HashRouter } from "react-router-dom";

ReactDOM.createRoot(document.getElementById("root")!).render(
  // <React.StrictMode>
  <HashRouter>
    <App />
  </HashRouter>
  // </React.StrictMode>
);

postMessage({ payload: "removeLoading" }, "*");
