import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { it, expect } from "vitest";

// https://jestjs.io/docs/en/tutorial-react

it("renders without crashing", () => {
    const div = document.createElement("div");
    ReactDOM.render(<App />, div);
    ReactDOM.unmountComponentAtNode(div);
});
