import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { initFx } from "./fx";
import "./styles.css";
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
initFx();
