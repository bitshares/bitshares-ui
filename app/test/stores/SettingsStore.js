import SettingsStore from "stores/SettingsStore";
import assert from "assert";

describe("SettingsStore", () => {
    it("Mounts", () => {
        assert(!!SettingsStore);
    });

    it("Contains state", () => {
        assert.equal(SettingsStore.getState().defaultSettings.size, 10);
        assert.equal(SettingsStore.getState().initDone, false);
        assert.equal(
            SettingsStore.getState().defaultSettings.get("locale"),
            "en"
        );
    });

    it("Merges in state from localStorage", function() {
        let servers = [],
            hasDuplicates = false;
        SettingsStore.getState().defaults.apiServer.forEach(s => {
            if (servers.indexOf(s.url) === -1) {
                servers.push(s.url);
            } else {
                hasDuplicates = true;
            }
        });

        assert(!hasDuplicates);
    });

    it("Does not init on mount", () => {
        assert.equal(SettingsStore.getState().initDone, false);
    });

    it("Runs init async", function() {
        return new Promise(function(resolve) {
            SettingsStore.init().then(() => {
                assert.equal(SettingsStore.getState().initDone, true);
                resolve();
            });
        });
        assert.equal(SettingsStore.getState().initDone, false);
    });
});
