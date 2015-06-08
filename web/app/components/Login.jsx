import React from "react/addons";
import SessionActions from "actions/SessionActions";
import SessionStore from "stores/SessionStore";
import BaseComponent from "./BaseComponent";

class Login extends BaseComponent {

    constructor(props) {
        super(props, SessionStore);
        this.state.user = "";
        this.state.pass = "";

        this._bind("_onSubmit", "_userChange", "_passChange", "_transition");
    }

    componentWillMount() {
        SessionStore.listen(this.onChange.bind(this)); 
        var { router } = this.context;
        var nextPath = router.getCurrentQuery().nextPath;
        this.setState({nextPath: nextPath});
        if (this.state.isUnlocked) {
            this._transition(nextPath);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.isUnlocked !== this.state.isUnlocked ||
                nextState.inProgress !== this.state.inProgress ||
                nextState.failed !== this.state.failed;
    }

    componentWillUpdate(nextProps, nextState) {
        if (nextState.isUnlocked) {
            this._transition(this.state.nextPath);
        }
    }

    _onSubmit(e) {
        e.preventDefault();
        // console.log("submitting", this.state);
        SessionActions.unlock(this.state);
    }

    _userChange(e) {
        this.setState({user: e.target.value});
    }

    _passChange(e) {
        this.setState({pass: e.target.value});
    }

    _transition(path) {
        if (path) {
            this.context.router.transitionTo(path);
        } else {
            this.context.router.transitionTo("/");
        }
    }

    render() {
        return (
            <div className="grid-block medium-offset-2 medium-8 large-offset-3 large-6">
                <div className="grid-content">
                    <div className="card">
                        <div className="card-divider">
                            Login! 
                        </div>
                        <div className="card-section">
                            <form onSubmit={this._onSubmit}>
                                <label>
                                    Username
                                    <input type="text" onChange={this._userChange}/>
                                </label>
                                <label>
                                    Password
                                    <input type="password" onChange={this._passChange}/>
                                </label>
                                <button className="button">LOGIN</button>
                                {this.state.inProgress ? <span>LOGIN PROGRESS SPINNER</span> : null}
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

Login.contextTypes = {router: React.PropTypes.func.isRequired};

export default Login;
