import React from "react";
import AccountSelector from "../Account/AccountSelector";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import classnames from "classnames";
import AssetActions from "actions/AssetActions";
import AssetWrapper from "../Utility/AssetWrapper";
import PriceInput from "../Utility/PriceInput";
import AmountSelector from "../Utility/AmountSelector";

class AssetPublishFeed extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    constructor(props) {
        super();

        this.state = this.resetState(props);
    }

    resetState(props = this.props) {
        let publisher_id = props.account.get("id");

        const currentFeed = props.asset.getIn(["bitasset", "current_feed"]);

        /* Might need to check these default values */
        let mcr = currentFeed.get("maintenance_collateral_ratio", 1750);
        let mssr = currentFeed.get("maximum_short_squeeze_ratio", 1100);

        return {
            publisher: props.account.get("name"),
            publisher_id,
            mcr,
            mcrValue: mcr / 1000,
            mssr,
            mssrValue: mssr / 1000
        };
    }

    onAccountNameChanged(key, name) {
        this.setState({
            [key]: name
        });
    }

    onAccountChanged(key, account) {
        this.setState({
            [key]: account ? account.get("id") : null
        });
    }

    onSubmit() {
        AssetActions.publishFeed({
            publisher: this.state.publisher_id,
            asset_id: this.props.asset.get("id"),
            mcr: this.state.mcr,
            mssr: this.state.mssr,
            settlementPrice: this.state.settlementPrice,
            cer: this.state.cer
        });
        // .then(() => {
        //     this.setState(this.resetState());
        // });
    }

    onPriceChanged(key, value) {
        this.setState({
            [key]: value
        });
    }

    onSetRatio(key, {amount}) {
        /* Enforce one decimal point maximum */
        if (
            !!amount &&
            typeof amount === "string" &&
            amount.indexOf(".") !== -1 &&
            amount.indexOf(".") + 4 !== amount.length
        ) {
            amount = amount.substr(0, amount.indexOf(".") + 4);
        }
        this.setState({
            [key + "Value"]: amount,
            [key]: Math.floor(parseFloat(amount) * 1000)
        });
    }

    render() {
        const {asset} = this.props;
        const {mcrValue, mssrValue, publisher} = this.state;

        const base = asset.get("id");
        const quote = asset.getIn([
            "bitasset",
            "options",
            "short_backing_asset"
        ]);

        return (
            <div>
                <AccountSelector
                    label="explorer.asset.feed_producer"
                    accountName={publisher}
                    onChange={this.onAccountNameChanged.bind(this, "publisher")}
                    onAccountChanged={this.onAccountChanged.bind(
                        this,
                        "publisher_id"
                    )}
                    account={publisher}
                    error={null}
                    tabIndex={1}
                    typeahead={true}
                />

                {/* Core Exchange Rate */}
                <br />
                <PriceInput
                    onPriceChanged={this.onPriceChanged.bind(this, "cer")}
                    label="explorer.asset.fee_pool.core_exchange_rate"
                    quote={"1.3.0"}
                    base={base}
                />

                {/* Settlement Price */}
                <br />
                <PriceInput
                    onPriceChanged={this.onPriceChanged.bind(
                        this,
                        "settlementPrice"
                    )}
                    label="explorer.asset.price_feed.settlement_price"
                    quote={quote}
                    base={base}
                />

                {/* MCR */}
                <br />
                <AmountSelector
                    label="explorer.asset.price_feed.maintenance_collateral_ratio"
                    amount={mcrValue}
                    onChange={this.onSetRatio.bind(this, "mcr")}
                    placeholder="0.0"
                    style={{
                        width: "100%",
                        paddingRight: "10px"
                    }}
                />

                {/* MSSR */}
                <br />
                <AmountSelector
                    label="explorer.asset.price_feed.maximum_short_squeeze_ratio"
                    amount={mssrValue}
                    onChange={this.onSetRatio.bind(this, "mssr")}
                    placeholder="0.0"
                    style={{
                        width: "100%",
                        paddingRight: "10px"
                    }}
                />

                <div style={{paddingTop: "1rem"}} className="button-group">
                    <button
                        className={classnames("button", {
                            disabled: false
                        })}
                        onClick={this.onSubmit.bind(this)}
                    >
                        <Translate content="transaction.trxTypes.asset_publish_feed" />
                    </button>

                    {/* <button
                        className="button outline"
                        onClick={() => {
                            this.resetState(this.props);
                        }}
                    >
                        <Translate content="account.perm.reset" />
                    </button> */}
                </div>
            </div>
        );
    }
}

AssetPublishFeed = BindToChainState(AssetPublishFeed);
AssetPublishFeed = AssetWrapper(AssetPublishFeed);
export default AssetPublishFeed;
