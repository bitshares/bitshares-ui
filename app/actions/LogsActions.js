import alt from "alt-instance";

class LogsActions {
    async setLog(log) {
        return await localStorage.setItem("logs", JSON.stringify(log));
    }
    getLogs() {
        return new Promise(resolve => {
            resolve(JSON.parse(localStorage.getItem("logs")));
        });
    }
}

export default alt.createActions(LogsActions);
