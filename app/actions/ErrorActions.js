import alt from "alt-instance";

class ErrorActions {
    setError(directory, error, errorInfo) {
        const newData = {
            directory,
            error,
            length
        };
        let errors = [];

        this.getErrors().then(data => {
            errors = data;
        });

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
        return new Promise(resolve => {
            resolve(JSON.parse(localStorage.getItem("errors")));
        });
    }
}

export default alt.createActions(ErrorActions);
