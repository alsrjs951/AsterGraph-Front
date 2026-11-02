import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import LogisticsApp from "./app/App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./styles/tokens.css";
import "./styles/app.css";
import RetailApp from "./features/retail/RetailApp";
import KnowledgeApp from "./features/knowledge/KnowledgeApp";
const demo = new URLSearchParams(location.search).get("demo");
const App =
  demo === "logistics"
    ? LogisticsApp
    : demo === "retail-case"
      ? RetailApp
      : KnowledgeApp;
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
