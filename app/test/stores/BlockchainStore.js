// import alt from "alt-instance";
import BlockchainStore from "stores/BlockchainStore";
import BlockchainActions from "actions/BlockchainActions";
import assert from "assert";

describe("BlockchainStore", () => {
    it("Mounts", () => {
        assert(!!BlockchainStore);
    });

    it("Contains state", () => {});
});
