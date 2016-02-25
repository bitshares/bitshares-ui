import React from "react";
import WalletDb from "stores/WalletDb";
import WalletUnlockActions from "actions/WalletUnlockActions";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import connectToStores from "alt/utils/connectToStores";
import WalletUnlockStore from "stores/WalletUnlockStore";
import utils from "common/utils";

class PubKey extends React.Component {

    static defaultProps = {
        fullLength: false
    };

    constructor(props) {
        super();
        this.state = {fullLength: props.fullLength};
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextProps.value !== this.props.value ||
               nextProps.wallet_locked !== this.props.wallet_locked ||
               nextState.fullLength !== this.state.fullLength;
    }

    _toggleLock(e) {
        e.preventDefault();
        WalletUnlockActions.unlock();
    }

    _selectElementText(el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }

    _copyToClipboard(e) {
        e.preventDefault();
        this.setState({fullLength: true});
        setTimeout(() => {
            const el = this.refs.value;
            this._selectElementText(el);
            document.execCommand("copy");
            window.getSelection().removeAllRanges();
        }, 500);
    }

    render() {
        let {wallet_locked, fullLength} = this.props;
        if (this.state.fullLength) fullLength = true;

        if (wallet_locked) {
            return (
                <div className="pubkey">
                    <span>{counterpart.translate("transfer.pubkey_unlock")} </span>
                    <a href onClick={this._toggleLock.bind(this)}>
                        <Icon name="locked"/>
                    </a>
                </div>
            );
        }

        let value = this.props.getValue();

        let full_value = value;
        if (value && !fullLength && value.length > 35) {
            value = value.substr(0, 35) + "...";
        }

        return (
            <div className="pubkey" data-tip={full_value !== value ? full_value : null} data-place="top" data-type="light">
                <code ref="value">
                    {value}
                </code>
                <a href onClick={this._copyToClipboard.bind(this)} data-tip="Copy to Clipboard" data-type="light"><Icon name="clipboard-copy"/></a>
            </div>
        );
    }
}

@connectToStores
class PubKeyWrapper extends React.Component {

    static getStores() {
        return [WalletUnlockStore]
    }

    static getPropsFromStores() {
        return {
            wallet_locked: WalletUnlockStore.getState().locked
        }
    }

    render() {
        return <PubKey {...this.props}/>
    }
}

export default PubKeyWrapper;
