import React from "react";
import PrivateKeyStore from "stores/PrivateKeyStore";
import WalletUnlockActions from "actions/WalletUnlockActions";
import counterpart from "counterpart";
import Icon from "../Icon/Icon";
import {connect} from "alt-react";
import WalletUnlockStore from "stores/WalletUnlockStore";
import utils from "common/utils";
import ReactTooltip from "react-tooltip";
import {Tooltip} from "bitshares-ui-style-guide";

class MemoText extends React.Component {
    static defaultProps = {
        fullLength: false
    };

    shouldComponentUpdate(nextProps) {
        return (
            !utils.are_equal_shallow(nextProps.memo, this.props.memo) ||
            nextProps.wallet_locked !== this.props.wallet_locked
        );
    }

    componentDidMount() {
        ReactTooltip.rebuild();
    }

    _toggleLock(e) {
        e.preventDefault();
        WalletUnlockActions.unlock()
            .then(() => {
                ReactTooltip.rebuild();
            })
            .catch(() => {});
    }

    render() {
        let {memo, fullLength} = this.props;
        if (!memo) {
            return null;
        }

        let {text, isMine} = PrivateKeyStore.decodeMemo(memo);

        if (!text && isMine) {
            return (
                <div className="memo">
                    <span>
                        {counterpart.translate("transfer.memo_unlock")}{" "}
                    </span>
                    <a onClick={this._toggleLock.bind(this)}>
                        <Icon name="locked" title="icons.locked.action" />
                    </a>
                </div>
            );
        }

        text = utils.sanitize(text);

        let full_memo = text;
        if (text && !fullLength && text.length > 35) {
            text = text.substr(0, 35) + "...";
        }

        if (text) {
            return (
                <div className="memo" style={{paddingTop: 5, cursor: "help"}}>
                    <Tooltip
                        placement="bottom"
                        title={full_memo !== text ? full_memo : null}
                    >
                        <span
                            className="inline-block"
                            data-class="memo-tip"
                            data-offset="{'bottom': 10}"
                        >
                            {text}
                        </span>
                    </Tooltip>
                </div>
            );
        } else {
            return null;
        }
    }
}

class MemoTextStoreWrapper extends React.Component {
    render() {
        return <MemoText {...this.props} />;
    }
}

export default connect(MemoTextStoreWrapper, {
    listenTo() {
        return [WalletUnlockStore];
    },
    getProps() {
        return {
            wallet_locked: WalletUnlockStore.getState().locked
        };
    }
});
