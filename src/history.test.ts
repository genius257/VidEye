import History from "./history";
import { it, expect } from "vitest";

it("gets default viewtime, without crashing", function () {
    let uniqueObject = {};
    expect(
        //@ts-expect-error
        History.getWatchTime("series", "season", "episode", uniqueObject)
    ).toBe(uniqueObject);
});
