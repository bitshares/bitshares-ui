import IntlStore from "stores/IntlStore";
import IntlActions from "actions/IntlActions";
import SettingsActions from "actions/SettingsActions";
import assert from "assert";

describe("IntlStore", () => {
    it("Mounts", () => {
        assert(!!IntlStore);
    });

    it("Contains state", () => {
        assert.equal(IntlStore.getState().currentLocale, "en");
        assert.equal(Object.keys(IntlStore.getState().localesObject).length, 1);
    });

    it("Switches locale", () => {
        IntlActions.switchLocale("de");
        assert.equal(IntlStore.getState().currentLocale, "de");
        assert.equal(Object.keys(IntlStore.getState().localesObject).length, 2);
    });

    it("Reverts to default on settings clear", () => {
        SettingsActions.clearSettings();
        assert.equal(IntlStore.getState().currentLocale, "en");
    });
});
