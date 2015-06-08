import React from "react";
import SessionActions from "actions/SessionActions";
import SessionStore from "stores/SessionStore";
import BaseComponent from "./BaseComponent";

class Logout extends BaseComponent {
    constructor(props) {
        super(props, SessionStore);
    }

    componentWillMount() {
        SessionStore.listen(this.onChange.bind(this));
        SessionActions.lock();
        if (!this.state.isUnlocked) {
            this.context.router.transitionTo("/");
        }
    }

    componentWillUpdate(nextProps, nextState) {
        if (!nextState.isUnlocked) {
            this.context.router.transitionTo("/");
        }
    }

    render() {
        return (
            <div className="block-grid small-offset-4 small-4">
              {this.state.lockInProgress ? <span>POSSIBLE UNLOCK SPINNER HERE</span> : null}
            </div>
        );
    }
}

Logout.contextTypes = {router: React.PropTypes.func.isRequired};

export default Logout;
