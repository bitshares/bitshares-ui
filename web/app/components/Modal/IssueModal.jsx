import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "../Utility/FormattedAsset";
import utils from "common/utils";
import classNames from "classnames";
import BalanceComponent from "../Utility/BalanceComponent";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "stores/WalletDb";
import FormattedPrice from "../Utility/FormattedPrice";
import counterpart from "counterpart";

let wallet_api = new WalletApi();

import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";

@BindToChainState({keep_updating: true}) class IssueModal extends React.Component {

    static propTypes = {
        asset_to_issue: ChainTypes.ChainAsset.isRequired
    }

    constructor(props) {
        super(props);
        this.state = {
            amount: props.amount,
            to: props.to,
            to_id: null
        };
    }

    onAmountChanged({amount,asset}) {
        this.setState({amount: amount});
    }

    onToAccountChanged(to) {
        let state = to ? {to: to.get('name'), to_id: to.get('id')} : {to_id: null};
        this.setState(state);
    }

    onToChanged(to) {
        this.setState({to: to, to_id: null});
    }

    onSubmit() {
        console.log("on submit");
        let precision = utils.get_asset_precision(this.props.asset_to_issue.get("precision"));
        let amount = this.state.amount.replace(/,/g, "");
        amount *= precision;

        var tr = wallet_api.new_transaction();
        tr.add_type_operation("asset_issue", {
            fee: {
                amount: 0,
                asset_id: 0
            },
            "issuer": this.props.asset_to_issue.get("issuer"),
            "asset_to_issue": {
                "amount": amount,
                "asset_id": this.props.asset_to_issue.get("id")
            },
            "issue_to_account": this.state.to_id
        });
        return WalletDb.process_transaction(tr, null, true).then(result => {
            console.log("asset issue result:", result);
            // this.dispatch(account_id);
            return true;
        }).catch(error => {
            console.error("asset issue error: ", error);
            return false;
        });
    }

    render() {
        let asset_to_issue = this.props.asset_to_issue.get('id');
        let submit_btn_class = this.state.to_id ? "button primary" : "button primary disabled";
        return ( <form className="grid-block vertical full-width-content">
            <div className="grid-container " style={{paddingTop: "2rem"}}>
                <div className="content-block">
                    <AccountSelector
                        label={"modal.issue.to"}
                        accountName={this.state.to}
                        onAccountChanged={this.onToAccountChanged.bind(this)}
                        onChange={this.onToChanged.bind(this)}
                        account={this.state.to}
                        tabIndex={2}/>
                </div>
                <div className="content-block">
                    <AmountSelector label="modal.issue.amount"
                                    amount={this.state.amount}
                                    onChange={this.onAmountChanged.bind(this)}
                                    asset={ asset_to_issue  }
                                    assets={[asset_to_issue]}
                                    tabIndex={1}/>
                </div>
                <div className="content-block">
                    <input type="submit" className={submit_btn_class}
                           onClick={this.onSubmit.bind(this, this.state.to, this.state.amount )}
                           value={counterpart.translate("modal.issue.submit")}/>
                </div>
            </div>
        </form> );
    }
}

export default IssueModal
