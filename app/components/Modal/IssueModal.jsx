import React from "react";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import utils from "common/utils";
import counterpart from "counterpart";
import ApplicationApi from "api/ApplicationApi";
import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";
import {Notification, Modal, Button} from "bitshares-ui-style-guide";

class IssueModal extends React.Component {
    static propTypes = {
        asset_to_issue: ChainTypes.ChainAsset.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            amount: props.amount,
            to: props.to,
            to_id: null,
            memo: ""
        };
    }

    onAmountChanged({amount}) {
        this.setState({amount: amount});
    }

    onToAccountChanged(to) {
        let state = to
            ? {to: to.get("name"), to_id: to.get("id")}
            : {to_id: null};
        this.setState(state);
    }

    onToChanged(to) {
        this.setState({to: to, to_id: null});
    }

    onSubmit() {
        this.props.hideModal();
        let {asset_to_issue} = this.props;
        let precision = utils.get_asset_precision(
            asset_to_issue.get("precision")
        );
        let amount = this.state.amount.toString().replace(/,/g, "");
        amount *= precision;

        ApplicationApi.issue_asset(
            this.state.to_id,
            asset_to_issue.get("issuer"),
            asset_to_issue.get("id"),
            amount,
            this.state.memo
                ? new Buffer(this.state.memo, "utf-8")
                : this.state.memo
        ).catch(err => {
            console.log("issue error caught here:", err);
            Notification.error({
                message: counterpart.translate(
                    "notifications.asset_issue_failure"
                ) //: ${this.state.wallet_public_name}
            });
        });

        this.setState({
            amount: 0,
            to: "",
            to_id: null,
            memo: ""
        });
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
    }

    render() {
        let asset_to_issue = this.props.asset_to_issue.get("id");
        let tabIndex = 1;

        let footer = [
            <Button
                type="primary"
                key="submit"
                onClick={this.onSubmit.bind(
                    this,
                    this.state.to,
                    this.state.amount
                )}
                disabled={!this.state.to_id || !this.state.amount}
            >
                {counterpart.translate("modal.issue.submit")}
            </Button>,
            <Button key="cancel" onClick={this.props.hideModal}>
                {counterpart.translate("cancel")}
            </Button>
        ];

        return (
            <Modal
                title={counterpart.translate("modal.issue.submit")}
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                footer={footer}
            >
                <form className="grid-block vertical full-width-content">
                    <div className="grid-container ">
                        {/* T O */}
                        <div className="content-block">
                            <AccountSelector
                                label={"modal.issue.to"}
                                accountName={this.state.to}
                                onAccountChanged={this.onToAccountChanged.bind(
                                    this
                                )}
                                typeahead={true}
                                onChange={this.onToChanged.bind(this)}
                                account={this.state.to}
                                tabIndex={tabIndex++}
                            />
                        </div>

                        {/* A M O U N T */}
                        <div className="content-block">
                            <AmountSelector
                                label="modal.issue.amount"
                                amount={this.state.amount}
                                onChange={this.onAmountChanged.bind(this)}
                                asset={asset_to_issue}
                                assets={[asset_to_issue]}
                                tabIndex={tabIndex++}
                            />
                        </div>

                        {/*  M E M O  */}
                        <div className="content-block">
                            <label>
                                <Translate
                                    component="span"
                                    content="transfer.memo"
                                />{" "}
                                (<Translate content="transfer.optional" />)
                            </label>
                            <textarea
                                rows="3"
                                value={this.state.memo}
                                tabIndex={tabIndex++}
                                onChange={this.onMemoChanged.bind(this)}
                            />
                        </div>
                    </div>
                </form>
            </Modal>
        );
    }
}

export default BindToChainState(IssueModal);
