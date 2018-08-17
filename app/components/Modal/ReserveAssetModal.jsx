import React from "react";
import Translate from "react-translate-component";
import BalanceComponent from "../Utility/BalanceComponent";
import counterpart from "counterpart";
import AmountSelector from "../Utility/AmountSelector";
import AssetActions from "actions/AssetActions";
import {ChainStore} from "bitsharesjs";
import {Asset} from "common/MarketClasses";
import AssetWrapper from "../Utility/AssetWrapper";

class ReserveAssetModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
    }

    componentWillReceiveProps(np) {
        if (
            np.asset &&
            this.props.asset &&
            np.asset.get("id") !== this.props.asset.get("id")
        ) {
            this.setState(this.getInitialState(np));
        }
    }

    getInitialState(props) {
        return {
            amount: 0,
            amountAsset: new Asset({
                amount: 0,
                asset_id: props.asset.get("id"),
                precision: props.asset.get("precision")
            })
        };
    }

    onAmountChanged({amount, asset}) {
        this.state.amountAsset.setAmount({real: amount});
        this.setState({amount, asset});
    }

    onSubmit() {
        AssetActions.reserveAsset(
            this.state.amountAsset.getAmount(),
            this.props.asset.get("id"),
            this.props.account.get("id")
        ).then(() => {
            this.state.amountAsset.setAmount({sats: 0});
            this.setState({amount: 0});
        });
        this.props.onClose();
    }

    render() {
        let assetId = this.props.asset.get("id");

        let currentBalance =
            this.props.account &&
            this.props.account.get("balances", []).size &&
            !!this.props.account.getIn(["balances", assetId])
                ? ChainStore.getObject(
                      this.props.account.getIn(["balances", assetId])
                  )
                : null;
        if (!currentBalance) return null;

        return (
            <form className="grid-block vertical full-width-content">
                <Translate component="h3" content="modal.reserve.title" />
                <div className="grid-container " style={{paddingTop: "2rem"}}>
                    <div className="content-block">
                        <AmountSelector
                            label="modal.reserve.amount"
                            amount={this.state.amount}
                            onChange={this.onAmountChanged.bind(this)}
                            asset={assetId}
                            assets={[assetId]}
                            display_balance={
                                <div
                                    onClick={() => {
                                        this.state.amountAsset.setAmount({
                                            sats: currentBalance.get("balance")
                                        });
                                        this.setState({
                                            amount: this.state.amountAsset.getAmount(
                                                {real: true}
                                            )
                                        });
                                    }}
                                >
                                    <BalanceComponent
                                        balance={this.props.account.getIn([
                                            "balances",
                                            assetId
                                        ])}
                                    />
                                </div>
                            }
                            tabIndex={1}
                        />
                    </div>

                    <div className="content-block button-group">
                        <input
                            type="submit"
                            className="button success"
                            onClick={this.onSubmit.bind(this)}
                            value={counterpart.translate(
                                "modal.reserve.submit"
                            )}
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

ReserveAssetModal = AssetWrapper(ReserveAssetModal, {
    propNames: ["asset"]
});

export default ReserveAssetModal;
