import alt from "alt-instance";
import SettingsStore from "stores/SettingsStore";
// import SettingsActions from "actions/SettingsActions";
import assert from "assert";

describe("SettingsStore", () => {
    it("Mounts", () => {
        assert(!!SettingsStore);
    });

    // it("Contains state", () => {
    //     assert.equal(SettingsStore.getState().defaultSettings.size, 0);
    // });
});
