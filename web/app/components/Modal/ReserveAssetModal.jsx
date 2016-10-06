import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import utils from "common/utils";
import classNames from "classnames";
import BalanceComponent from "../Utility/BalanceComponent";
import counterpart from "counterpart";
import AccountSelector from "../Account/AccountSelector";
import AmountSelector from "../Utility/AmountSelector";
import AssetActions from "actions/AssetActions";

export default class ReserveAssetModal extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            amount: 0
        };
    }

    onAmountChanged({amount, asset}) {
        this.setState({amount, asset});
    }

    onSubmit() {
        let precision = utils.get_asset_precision(this.state.asset.get("precision"));
        let amount = this.state.amount.replace(/,/g, "");
        amount *= precision;
        AssetActions.reserveAsset(amount, this.props.assetId, this.props.account.get("id"))
        this.props.onClose();
    }

    render() {
        let assetId = this.props.assetId;
       
        return (
            <form className="grid-block vertical full-width-content">
                <Translate component="h3" content="modal.reserve.title" />
                <div className="grid-container " style={{paddingTop: "2rem"}}>
                    <div className="content-block">
                        <AmountSelector 
                            label="modal.reserve.amount"
                            amount={this.state.amount}
                            onChange={this.onAmountChanged.bind(this)}
                            asset={ assetId  }
                            assets={[assetId]}
                            display_balance={<BalanceComponent balance={this.props.account.getIn(["balances", assetId])}/>}
                            tabIndex={1}
                        />
                    </div>

                    <div className="content-block button-group">

                        <input
                            type="submit"
                            className="button success"
                            onClick={this.onSubmit.bind(this)}
                            value={counterpart.translate("modal.reserve.submit")}
                            tabIndex={2}
                        />

                        <div
                            className="button"
                            onClick={this.props.onClose}
                            tabIndex={3}
                        >
                            {counterpart.translate("cancel")}
                        </div>

                    </div>
                </div>
            </form>
        );
    }
}
