import alt from "alt-instance";
import ls from "common/localStorage";

const STORAGE_KEY = "__graphene__";
let ss = new ls(STORAGE_KEY);

class LogsActions {
    async setLog(log) {
        return await ss.set("logs", JSON.stringify(log));
    }
    getLogs() {
        return new Promise(resolve => {
            try {
                resolve(JSON.parse(ss.get("logs", [])));
            } catch (err) {
                resolve(["Error loading logs from localStorage"]);
            }
        });
    }
}

export default alt.createActions(LogsActions);
