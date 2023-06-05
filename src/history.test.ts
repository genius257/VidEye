import History from "./history";

it("gets default viewtime, without crashing", function () {
  let uniqueObject = {};
  expect(
    History.getWatchTime("series", "season", "episode", uniqueObject)
  ).toBe(uniqueObject);
});
