import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
import BaseModal from "./BaseModal";
import {ChainStore} from "bitsharesjs";
import AccountStore from "stores/AccountStore";
import {Asset} from "common/MarketClasses";
import {debounce, isNaN} from "lodash-es";
import {
    checkFeeStatusAsync,
    checkBalance,
    shouldPayFeeWithAssetAsync
} from "common/trxHelper";
import ErrorActions from "actions/ErrorActions";

import {connect} from "alt-react";

class ReportModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
        this.nestedRef = null;

        ZfApi.subscribe("transaction_confirm_actions", (name, msg) => {
            if (msg == "close") {
                this.setState({hidden: false});
            }
        });
    }

    componentDidCatch(error, errorInfo) {
        ErrorActions.setError("ReportModal", error, errorInfo);
    }

    getInitialState() {
        return {
            from_name: "",
            to_name: "",
            from_account: null,
            to_account: null,
            orig_account: null,
            amount: "",
            asset_id: null,
            asset: null,
            memo: "",
            error: null,
            knownScammer: null,
            propose: false,
            propose_account: "",
            feeAsset: null,
            fee_asset_id: "1.3.0",
            feeAmount: new Asset({amount: 0}),
            feeStatus: {},
            maxAmount: false,
            hidden: false
        };
    }

    show() {
        this.setState({open: true, hidden: false}, () => {
            ZfApi.publish(this.props.id, "open");
            // this._initForm();
        });
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
    }

    onClose = (publishClose = true) => {
        ZfApi.unsubscribe("transaction_confirm_actions");
        this.setState(
            {
                open: false,
                from_name: "",
                to_name: "",
                from_account: null,
                to_account: null,
                orig_account: null,
                amount: "",
                asset_id: null,
                asset: null,
                memo: "",
                error: null,
                knownScammer: null,
                propose: false,
                propose_account: "",
                feeAsset: null,
                fee_asset_id: "1.3.0",
                feeAmount: new Asset({amount: 0}),
                feeStatus: {},
                maxAmount: false,
                hidden: false
            },
            () => {
                if (publishClose) ZfApi.publish(this.props.id, "close");
            }
        );
    };

    componentWillReceiveProps(np) {
        // if (
        //     np.currentAccount !== this.state.from_name &&
        //     np.currentAccount !== this.props.currentAccount
        // ) {
        this.setState({
            // from_name: np.from_name,
            from_account: ChainStore.getAccount(np.from_name),
            to_name: np.to_name ? np.to_name : "",
            // to_account: np.to_name
            //     ? ChainStore.getAccount(np.to_name)
            //     : null,
            feeStatus: {},
            fee_asset_id: "1.3.0",
            feeAmount: new Asset({amount: 0})
        });
        // }
    }

    render() {
        let {open, hidden, memo} = this.state;

        return !open ? null : (
            <div id="report_modal" className={hidden || !open ? "hide" : ""}>
                <BaseModal
                    id={this.props.id}
                    overlay={true}
                    onClose={() => this.onClose(this, false)}
                >
                    <div className="grid-block vertical no-overflow">
                        {/*  M E M O  */}
                        <div className="content-block transfer-input">
                            {memo && memo.length ? (
                                <label className="right-label">
                                    {memo.length}
                                </label>
                            ) : null}
                            <Translate
                                className="left-label tooltip"
                                component="label"
                                content="transfer.memo"
                            />
                            <textarea
                                style={{marginBottom: 0}}
                                rows="3"
                                value={memo}
                                onChange={this.onMemoChanged.bind(this)}
                            />
                            {/* warning */}
                            {this.state.propose ? (
                                <div
                                    className="error-area"
                                    style={{position: "absolute"}}
                                >
                                    <Translate
                                        content="transfer.warn_name_unable_read_memo"
                                        name={this.state.from_name}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>
                </BaseModal>
            </div>
        );
    }
}

class ReportModalConnectWrapper extends React.Component {
    render() {
        return <ReportModal {...this.props} ref={this.props.refCallback} />;
    }
}

ReportModalConnectWrapper = connect(
    ReportModalConnectWrapper,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps(props) {
            return {
                currentAccount: AccountStore.getState().currentAccount,
                passwordAccount: AccountStore.getState().passwordAccount,
                tabIndex: props.tabIndex || 0
            };
        }
    }
);

export default ReportModalConnectWrapper;
