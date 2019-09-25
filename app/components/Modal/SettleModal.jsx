import React, {Fragment} from "react";
import Immutable from "immutable";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import AssetName from "../Utility/AssetName";
import MarketLink from "../Utility/MarketLink";
import BalanceComponent from "../Utility/BalanceComponent";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import counterpart from "counterpart";
import {ChainStore} from "tuscjs";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import withWorthLessSettlementFlag from "../Utility/withWorthLessSettlementFlag";
import TranslateWithLinks from "../Utility/TranslateWithLinks";
import {Alert, Form, Modal, Button, Tooltip} from "bitshares-ui-style-guide";
import utils from "common/utils";
import AssetWrapper from "../Utility/AssetWrapper";

const WorthLessSettlementWarning = withWorthLessSettlementFlag(
    ({
        worthLessSettlement,
        asset,
        shortBackingAsset,
        marketPrice,
        settlementPrice
    }) => {
        marketPrice = utils.format_number(marketPrice, asset.get("precision"));
        settlementPrice = utils.format_number(
            settlementPrice,
            asset.get("precision")
        );
        switch (worthLessSettlement) {
            case true:
                return (
                    <div>
                        <Translate
                            component="h2"
                            content="exchange.settle_better_marketprice"
                        />
                        <span>
                            <TranslateWithLinks
                                string="exchange.worth_less_settlement_warning"
                                keys={[
                                    {
                                        value: (
                                            <MarketLink
                                                base={asset.get("id")}
                                                quote={shortBackingAsset.get(
                                                    "id"
                                                )}
                                            />
                                        ),
                                        arg: "market_link"
                                    }
                                ]}
                            />
                            <br />
                            &nbsp;&nbsp;
                            <Translate content="exchange.price_market" />
                            :&nbsp;&nbsp;
                            {marketPrice}
                            <br />
                            &nbsp;&nbsp;
                            <Translate content="exchange.settle" />
                            :&nbsp;&nbsp;
                            {settlementPrice}
                        </span>
                    </div>
                );
            case undefined:
                return (
                    <Translate content="exchange.checking_for_worth_less_settlement" />
                );
            default:
                return (
                    <div>
                        <Translate
                            component="h2"
                            content="exchange.settle_better_settleprice"
                        />
                        <span>
                            <TranslateWithLinks
                                string="exchange.settlement_hint"
                                keys={[
                                    {
                                        value: (
                                            <MarketLink
                                                base={asset.get("id")}
                                                quote={shortBackingAsset.get(
                                                    "id"
                                                )}
                                            />
                                        ),
                                        arg: "market_link"
                                    },
                                    {
                                        value: (
                                            <AssetName
                                                name={asset.get("symbol")}
                                            />
                                        ),
                                        arg: "long"
                                    }
                                ]}
                            />
                            <br />
                            &nbsp;&nbsp;
                            <Translate content="exchange.price_market" />
                            :&nbsp;&nbsp;
                            {marketPrice}
                            <br />
                            &nbsp;&nbsp;
                            <Translate content="exchange.settle" />
                            :&nbsp;&nbsp;
                            {settlementPrice}
                        </span>
                    </div>
                );
        }
    }
);

class ModalContent extends React.Component {
    static propTypes = {
        asset: PropTypes.instanceOf(Immutable.Map),
        core: PropTypes.instanceOf(Immutable.Map),
        account: PropTypes.instanceOf(Immutable.Map)
    };

    static defaultProps = {
        asset: Immutable.Map(),
        core: Immutable.Map(),
        account: Immutable.Map()
    };

    constructor() {
        super();
        this.state = {
            amount: 0
        };

        this.onSubmit = this.onSubmit.bind(this);
    }

    componentWillReceiveProps(np) {
        if (
            !!np.asset &&
            !!this.props.asset &&
            np.asset.get("id") !== this.props.asset.get("id")
        ) {
            this.setState({
                amount: 0
            });
        }
    }

    getSettlementInfo() {
        const {getDynamicObject, asset, core} = this.props;
        const dynamic = getDynamicObject(asset.get("dynamic_asset_data_id"));
        const currentSupply =
            dynamic && dynamic.size ? dynamic.get("current_supply") : 0;
        const maintenanceInterval =
            core && core.size
                ? core.getIn(["parameters", "maintenance_interval"])
                : 0;
        const bitAsset = asset.get("bitasset").toJS();
        const currentSettled = bitAsset.force_settled_volume;
        const maxSettlementVolume =
            currentSupply *
            (bitAsset.options.maximum_force_settlement_volume / 10000);
        const remainingVolume = !currentSettled
            ? maxSettlementVolume
            : maxSettlementVolume - currentSettled;
        const settlementDelay = bitAsset.options.force_settlement_delay_sec;
        return {
            maxSettlementVolume,
            remainingVolume,
            maintenanceInterval,
            settlementDelay
        };
    }

    onAmountChanged({amount, asset}) {
        this.setState({amount: amount});
    }

    onSubmit(e) {
        let {amount} = this.state;
        e.preventDefault();

        this.props.hideModal();

        amount = parseInt(
            amount * Math.pow(10, this.props.asset.get("precision"))
        );

        var tr = WalletApi.new_transaction();
        tr.add_type_operation("asset_settle", {
            fee: {
                amount: 0,
                asset_id: 0
            },
            account: this.props.account.get("id"),
            amount: {
                amount: amount,
                asset_id: this.props.asset.get("id")
            }
        });
        return WalletDb.process_transaction(tr, null, true)
            .then(result => {
                // console.log("asset settle result:", result);
                // this.dispatch(account_id);
                return true;
            })
            .catch(error => {
                console.error("asset settle error: ", error);
                return false;
            });
    }

    _useMaxValue(amount) {
        this.setState({
            amount: amount / Math.pow(10, this.props.asset.get("precision"))
        });
    }

    render() {
        let {asset, account} = this.props;
        let {amount} = this.state;

        if (!asset) {
            return null;
        }

        let options =
            asset && asset.getIn(["bitasset", "options"])
                ? asset.getIn(["bitasset", "options"]).toJS()
                : null;

        let isGlobalSettled =
            asset.get("bitasset").get("settlement_fund") > 0 ? true : false;

        let offset = 0;
        if (!isGlobalSettled) {
            offset =
                asset
                    .get("bitasset")
                    .get("options")
                    .get("force_settlement_offset_percent") / 100;
        }

        // TODO
        // Check if force_settled_volume exceeds maximum_force_settlement_volume
        // Requires Dynamic Object for Total Supply
        // var maxSettlementVolume = asset.get("bitasset").get("options").get("maximum_force_settlement_volume");
        // var currentSettled = asset.get("bitasset").get("force_settled_volume");

        let assetID = asset.get("id");

        let account_balances = account.get("balances");

        const {name: assetName, prefix} = utils.replaceName(asset);
        const assetFullName = (prefix ? prefix : "") + assetName;

        let currentBalance = null,
            balanceAmount = 0;

        account_balances &&
            account_balances.forEach(balance => {
                let balanceObject = ChainStore.getObject(balance);
                if (!balanceObject.get("balance")) {
                    return null;
                }
                if (balanceObject.get("asset_type") === assetID) {
                    currentBalance = balance;
                    balanceAmount = balanceObject.get("balance");
                }
            });

        let balanceText = (
            <span>
                <Translate content="exchange.balance" />
                :&nbsp;
                {currentBalance ? (
                    <span
                        className="underline"
                        onClick={this._useMaxValue.bind(this, balanceAmount)}
                    >
                        <BalanceComponent balance={currentBalance} />
                    </span>
                ) : (
                    "0 " + asset.get("symbol")
                )}
            </span>
        );

        let isFundsToLow = false;
        if (
            amount >
            balanceAmount / Math.pow(10, this.props.asset.get("precision"))
        ) {
            isFundsToLow = true;
        }

        const footer = [
            <Tooltip
                title={
                    isFundsToLow
                        ? counterpart.translate("tooltip.lack_funds")
                        : null
                }
            >
                <Button
                    key={"submit"}
                    type="primary"
                    onClick={this.onSubmit}
                    disabled={isFundsToLow}
                >
                    {counterpart.translate("modal.settle.submit")}
                </Button>
            </Tooltip>,
            <Button key={"close"} onClick={this.props.hideModal}>
                {counterpart.translate("modal.close")}
            </Button>
        ];

        const {
            maxSettlementVolume,
            remainingVolume,
            settlementDelay,
            maintenanceInterval
        } = this.getSettlementInfo();

        const estimatedDelay = !isGlobalSettled
            ? (settlementDelay +
                  Math.floor(amount / maxSettlementVolume) *
                      maintenanceInterval) /
              3600
            : 0;

        return (
            <Modal
                title={counterpart.translate("modal.settle.title", {
                    asset: assetFullName
                })}
                visible={this.props.visible}
                id={this.props.modalId}
                footer={footer}
                onCancel={this.props.hideModal}
                overlay={true}
                ref="settlement_modal"
            >
                {isGlobalSettled ? (
                    <Alert
                        message={counterpart.translate(
                            "exchange.settle_delay_globally_settled"
                        )}
                        type="warning"
                        showIcon
                    />
                ) : (
                    <Alert
                        message={counterpart.translate(
                            "exchange.settle_delay",
                            {
                                hours: options.force_settlement_delay_sec / 3600
                            }
                        )}
                        description={
                            estimatedDelay
                                ? counterpart.translate("modal.settle.delay", {
                                      amount: estimatedDelay
                                  })
                                : null
                        }
                        type="info"
                        showIcon
                    />
                )}
                <WorthLessSettlementWarning asset={assetID} />
                <br />
                {!isGlobalSettled ? (
                    <Translate
                        component="div"
                        content="exchange.settle_offset"
                        offset={offset}
                    />
                ) : null}
                <br />
                <Form className="full-width" layout="vertical">
                    <AmountSelector
                        label="modal.settle.amount"
                        amount={amount}
                        onChange={this.onAmountChanged.bind(this)}
                        display_balance={balanceText}
                        asset={assetID}
                        assets={[assetID]}
                        tabIndex={1}
                        style={
                            amount > remainingVolume
                                ? {"margin-bottom": "0"}
                                : {}
                        }
                    />
                    {amount > remainingVolume ? (
                        <Fragment>
                            <Translate
                                className="facolor-info"
                                content="modal.settle.max_volume"
                                amount={maxSettlementVolume}
                                asset={assetFullName}
                            />
                            <br />
                            <Translate
                                className="facolor-info"
                                content="modal.settle.remaining_volume"
                                amount={remainingVolume}
                                asset={assetFullName}
                            />
                        </Fragment>
                    ) : null}
                </Form>
            </Modal>
        );
    }
}

ModalContent = AssetWrapper(ModalContent, {
    propNames: ["asset", "core"],
    withDynamic: true,
    defaultProps: {core: "2.0.0"}
});

class SettleModal extends React.Component {
    render() {
        return <ModalContent {...this.props} />;
    }
}

export default SettleModal;
