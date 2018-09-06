import alt from "alt-instance";

class ErrorActions {
    setError(directory, error, errorInfo) {
        const newData = {
            directory,
            error,
            errorInfo
        };
        const errors = this.getErrors() || [];

        if (errors.length == 20) {
            errors.slice(0, 1);
        }

        errors.push(newData);

        localStorage.setItem("errors", JSON.stringify(errors));

        return dispatch => {
            return new Promise(() => {
                dispatch(errors);
            });
        };
    }

    getErrors() {
        return JSON.parse(localStorage.getItem("errors"));
    }
}

export default alt.createActions(ErrorActions);
