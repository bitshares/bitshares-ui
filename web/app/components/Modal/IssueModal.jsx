import React from "react";
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
import AssetActions from "actions/AssetActions";
import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";

@BindToChainState()
export default class IssueModal extends React.Component {

    static propTypes = {
        asset_to_issue: ChainTypes.ChainAsset.isRequired
    };

    constructor(props) {
        super(props);
        this.state = {
            amount: props.amount,
            to: props.to,
            to_id: null,
            memo: null
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
        let {asset_to_issue} = this.props;
        let precision = utils.get_asset_precision(asset_to_issue.get("precision"));
        let amount = this.state.amount.replace(/,/g, "");
        amount *= precision;

        AssetActions.issueAsset(
            this.state.to_id,
            asset_to_issue.get("issuer"),
            asset_to_issue.get("id"),
            amount,
            this.state.memo ? new Buffer(this.state.memo, "utf-8") : this.state.memo
        );

        this.setState({
            amount: null,
            to_id: null,
            memo: null
        });
    }

    onMemoChanged(e) {
        this.setState({memo: e.target.value});
    }

    render() {
        let asset_to_issue = this.props.asset_to_issue.get('id');
        let tabIndex = 1;

        return ( <form className="grid-block vertical full-width-content">
            <div className="grid-container " style={{paddingTop: "2rem"}}>
                {/* T O */}
                <div className="content-block">
                    <AccountSelector
                        label={"modal.issue.to"}
                        accountName={this.state.to}
                        onAccountChanged={this.onToAccountChanged.bind(this)}
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
                        asset={ asset_to_issue  }
                        assets={[asset_to_issue]}
                        tabIndex={tabIndex++}
                    />
                </div>

                {/*  M E M O  */}
                <div className="content-block">
                    <label><Translate component="span" content="transfer.memo"/> (<Translate content="transfer.optional" />)</label>
                    <textarea rows="1" value={this.state.memo} tabIndex={tabIndex++} onChange={this.onMemoChanged.bind(this)} />

                </div>

                <div className="content-block button-group">
                    <input
                        type="submit"
                        className="button success"
                        onClick={this.onSubmit.bind(this, this.state.to, this.state.amount )}
                        value={counterpart.translate("modal.issue.submit")}
                        tabIndex={tabIndex++}
                    />

                    <div
                        className="button"
                        onClick={this.props.onClose}
                        tabIndex={tabIndex++}
                    >
                        {counterpart.translate("cancel")}
                    </div>


                </div>
            </div>
        </form> );
    }
}

export default IssueModal
