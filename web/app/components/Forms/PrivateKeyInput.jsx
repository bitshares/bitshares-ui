import React from "react";
import ReactDOM from "react-dom";
import {PropTypes, Component} from "react";
import classNames from "classnames";
// import AccountActions from "actions/AccountActions";
// import AccountStore from "stores/AccountStore";
import { validation } from "@graphene/chain";
import Translate from "react-translate-component";
import counterpart from "counterpart";

class PrivateKeyInput extends React.Component {

    static propTypes = {
        onChange: PropTypes.func,
        onEnter: PropTypes.func
    };

    constructor(props) {
        super(props);
        this.state = { private_key: "", public_key: "", error: null };
        this._handleChange = this._handleChange.bind(this);
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onCreatePrivateKey = this._onCreatePrivateKey.bind(this);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.private_key !== this.state.private_key
            || nextState.public_key !== this.state.public_key
            || nextState.error !== this.state.error;
    }

    componentDidUpdate() {
        if (this.props.onChange) this.props.onChange(this.state);
    }

    clear() {
        this.setState({ private_key: "", public_key: "", error: null });
    }

    focus() {
        ReactDOM.findDOMNode(this.refs.input).focus();
    }

    _validate(value) {
        //this.state.error = value === "" ?
        //    "Please enter valid account name" :
        //    validation.is_account_name_error(value)
        //
        //this.state.warning = null
        //if(this.props.cheapNameOnly) {
        //    if( !this.state.error && !validation.is_cheap_name( value ))
        //        this.state.error = counterpart.translate("account.name_input.premium_name_faucet");
        //} else {
        //    if( !this.props.labelMode && !this.state.error && !validation.is_cheap_name( value ))
        //        this.state.warning = counterpart.translate("account.name_input.premium_name_warning");
        //}
        //this.setState({value: value, error: this.state.error, warning: this.state.warning});
        //if (this.props.onChange) this.props.onChange({value: value, valid: !this.getError()});
        //if (this.props.accountShouldExist || this.props.accountShouldNotExist) AccountActions.accountSearch(value);
    }

    _handleChange(e) {
        e.preventDefault();
        var private_key = e.target.value.toUpperCase();
        this.setState({ private_key });
        //this.validateKey(value);
    }

    _onKeyDown(e) {
        if (this.props.onEnter && event.keyCode === 13) this.props.onEnter(e);
    }

    _onCreatePrivateKey(e) {
        console.log("-- KeyInput._onCreatePrivateKey -->");
        this.setState({private_key: "5JfttGJJGqyv4JsSYtb6spk7ZGFHYS29GrEk7g1gVz98jq2NFst", public_key: "BTS6bkAeJnEU7i6Hd1YWTNTKW1aqDoxpruezGxqLDunFV1qGANfxM"});
    }

    render() {
        const class_name = classNames("form-group", {"has-error": false});
        const label_content_key = this.props.privateKeyMode ? "account.private_key" : "account.public_key";
        return (
            <div>
                <div className={class_name}>
                    <label>
                        <Translate content="account.private_key"/>
                        <span className="inline-label">
                           <input name="private-key" type="text" autoComplete="off"
                               onChange={this._handleChange} onKeyDown={this._onKeyDown}
                               value={this.state.private_key}
                           />
                        <button className="button" onClick={this._onCreatePrivateKey}>
                            {/* <Translate content={this.props.action_label}/> */} NEW
                        </button>
                        </span>
                    </label>
                    <div className="facolor-error">{this.state.error}</div>
                </div>
                <div className="form-group">
                    <label>
                        <Translate content="account.public_key"/>
                        <input type="text" onKeyDown={this._onKeyDown} value={this.state.public_key}/>
                    </label>
                </div>
            </div>
        );
    }
}

export default PrivateKeyInput;
