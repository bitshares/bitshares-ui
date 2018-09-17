import alt from "alt-instance";

class LogsActions {
    setLog(log) {
        return this.getLogs().then(data => {
            let logs = data || [];

            if (logs.length == 20) {
                logs.splice(0, 1);
            }

            logs.push(log);

            localStorage.setItem("logs", JSON.stringify(logs));
        });
    }

    getLogs() {
        return new Promise(resolve => {
            resolve(JSON.parse(localStorage.getItem("logs")));
        });
    }
}

export default alt.createActions(LogsActions);
