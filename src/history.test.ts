import History from "./history";

it("gets default viewtime, without crashing", function () {
    let uniqueObject = {};
    expect(
        //@ts-expect-error
        History.getWatchTime("series", "season", "episode", uniqueObject)
    ).toBe(uniqueObject);
});
