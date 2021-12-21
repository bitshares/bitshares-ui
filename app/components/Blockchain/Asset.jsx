import React from "react";
import {Link} from "react-router-dom";
import Translate from "react-translate-component";
import LinkToAccountById from "../Utility/LinkToAccountById";
import LinkToAssetById from "../Utility/LinkToAssetById";
import AssetWrapper from "../Utility/AssetWrapper";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedPrice from "../Utility/FormattedPrice";
import AssetName from "../Utility/AssetName";
import TimeAgo from "../Utility/TimeAgo";
import HelpContent from "../Utility/HelpContent";
import assetUtils from "common/asset_utils";
import utils from "common/utils";
import FormattedTime from "../Utility/FormattedTime";
import {ChainStore} from "bitsharesjs";
import {Apis} from "bitsharesjs-ws";
import {CallOrder, CollateralBid, FeedPrice} from "common/MarketClasses";
import Page404 from "../Page404/Page404";
import FeePoolOperation from "../Account/FeePoolOperation";
import AccountStore from "stores/AccountStore";
import {connect} from "alt-react";
import counterpart from "counterpart";
import AssetOwnerUpdate from "./AssetOwnerUpdate";
import AssetPublishFeed from "./AssetPublishFeed";
import AssetResolvePrediction from "./AssetResolvePrediction";
import BidCollateralOperation from "./BidCollateralOperation";
import {Tooltip, Icon, Table, Tabs, Collapse} from "bitshares-ui-style-guide";
const {Panel} = Collapse;

class AssetFlag extends React.Component {
    render() {
        let {isSet, name} = this.props;
        if (!isSet) {
            return <span />;
        }

        return (
            <span className="asset-flag">
                <span className="label info">
                    <Translate content={"account.user_issued_assets." + name} />
                </span>
            </span>
        );
    }
}

//-------------------------------------------------------------
class AssetPermission extends React.Component {
    render() {
        let {isSet, name} = this.props;

        if (!isSet) {
            return <span />;
        }

        return (
            <span className="asset-flag">
                <span className="label info">
                    <Translate content={"account.user_issued_assets." + name} />
                </span>
            </span>
        );
    }
}

class Asset extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            callOrders: [],
            collateralBids: [],
            marginTableSort: "ratio",
            collateralTableSort: "price",
            sortDirection: true,
            showCollateralBidInInfo: false,
            cumulativeGrouping: false,
            activeFeedTab: "margin",
            activeAssetTab: "info"
        };
    }

    componentWillMount() {
        this._getMarginCollateral();
    }

    updateOnCollateralBid() {
        this._getMarginCollateral();
    }

    _getMarginCollateral() {
        if (this.props.asset.has("bitasset")) {
            const assets = {
                [this.props.asset.get("id")]: this.props.asset.toJS(),
                [this.props.backingAsset.get(
                    "id"
                )]: this.props.backingAsset.toJS()
            };

            const isPredictionMarket = this.props.asset.getIn(
                ["bitasset", "is_prediction_market"],
                false
            );

            let feedPrice = this._getFeedPrice();

            if (!!feedPrice) {
                try {
                    let mcr = this.props.asset.getIn([
                        "bitasset",
                        "current_feed",
                        "maintenance_collateral_ratio"
                    ]);

                    Apis.instance()
                        .db_api()
                        .exec("get_call_orders", [
                            this.props.asset.get("id"),
                            300
                        ])
                        .then(call_orders => {
                            let callOrders = call_orders.map(c => {
                                return new CallOrder(
                                    c,
                                    assets,
                                    this.props.asset.get("id"),
                                    feedPrice,
                                    mcr,
                                    isPredictionMarket
                                );
                            });
                            this.setState({callOrders});
                        });
                } catch (e) {
                    // console.log(err);
                }
                try {
                    Apis.instance()
                        .db_api()
                        .exec("get_collateral_bids", [
                            this.props.asset.get("id"),
                            100,
                            0
                        ])
                        .then(coll_orders => {
                            let collateralBids = coll_orders.map(c => {
                                return new CollateralBid(
                                    c,
                                    assets,
                                    this.props.asset.get("id"),
                                    feedPrice
                                );
                            });
                            this.setState({collateralBids});
                        });
                } catch (e) {
                    console.log("get_collateral_bids Error: ", e);
                }
            }
        }
    }

    _getFeedPrice() {
        const assets = {
            [this.props.asset.get("id")]: this.props.asset.toJS(),
            [this.props.backingAsset.get("id")]: this.props.backingAsset.toJS()
        };

        const isPredictionMarket = this.props.asset.getIn(
            ["bitasset", "is_prediction_market"],
            false
        );
        let sqr = this.props.asset.getIn([
            "bitasset",
            "current_feed",
            "maximum_short_squeeze_ratio"
        ]);

        let feedPriceRaw = assetUtils.extractRawFeedPrice(this.props.asset);

        // if there has been no feed price, settlePrice has 0 amount
        if (
            feedPriceRaw.getIn(["base", "amount"]) == 0 &&
            feedPriceRaw.getIn(["quote", "amount"]) == 0
        ) {
            return null;
        }

        let feedPrice;

        /* Prediction markets don't need feeds for shorting, so the settlement price can be set to 1:1 */
        if (
            isPredictionMarket &&
            feedPriceRaw.getIn(["base", "asset_id"]) ===
                feedPriceRaw.getIn(["quote", "asset_id"])
        ) {
            if (!assets[this.props.backingAsset.get("id")]) {
                assets[this.props.backingAsset.get("id")] = {
                    precision: this.props.asset.get("precision")
                };
            }
            feedPriceRaw = feedPriceRaw.setIn(["base", "amount"], 1);
            feedPriceRaw = feedPriceRaw.setIn(
                ["base", "asset_id"],
                this.props.backingAsset.get("id")
            );
            feedPriceRaw = feedPriceRaw.setIn(["quote", "amount"], 1);
            feedPriceRaw = feedPriceRaw.setIn(
                ["quote", "asset_id"],
                this.props.asset.get("id")
            );
            sqr = 1000;
        }

        // Catch Invalid SettlePrice object
        if (feedPriceRaw.toJS) {
            let settleObject = feedPriceRaw.toJS();
            if (!assets[settleObject.base.asset_id]) return;
        }

        feedPrice = new FeedPrice({
            priceObject: feedPriceRaw,
            market_base: this.props.asset.get("id"),
            sqr,
            assets
        });

        return feedPrice;
    }

    _toggleCumulativeGrouping() {
        this.setState({
            cumulativeGrouping: !this.state.cumulativeGrouping
        });
    }

    _assetType(asset) {
        return "bitasset" in asset
            ? asset.bitasset.is_prediction_market
                ? "Prediction"
                : "Smart"
            : "Simple";
    }

    formattedPrice(
        price,
        hide_symbols = false,
        hide_value = false,
        factor = 0,
        negative_invert = false
    ) {
        if (typeof price == "number" && isNaN(price)) {
            return "-";
        }
        var base = price.base;
        var quote = price.quote;
        return (
            <FormattedPrice
                base_amount={base.amount}
                base_asset={base.asset_id}
                quote_amount={quote.amount}
                quote_asset={quote.asset_id}
                hide_value={hide_value}
                hide_symbols={hide_symbols}
                factor={factor}
                negative_invert={negative_invert}
            />
        );
    }

    renderFlagIndicators(flags, names) {
        return (
            <div>
                {names.map(name => {
                    return (
                        <AssetFlag
                            key={`flag_${name}`}
                            name={name}
                            isSet={flags[name]}
                        />
                    );
                })}
            </div>
        );
    }

    renderPermissionIndicators(permissions, names) {
        return (
            <div>
                {names.map(name => {
                    return (
                        <AssetPermission
                            key={`perm_${name}`}
                            name={name}
                            isSet={permissions[name]}
                        />
                    );
                })}
            </div>
        );
    }

    renderAuthorityList(authorities) {
        return authorities.map(function(authority) {
            return (
                <span key={authority}>
                    <LinkToAccountById account={authority} />
                    &nbsp;
                </span>
            );
        });
    }

    renderMarketList(asset, markets) {
        var symbol = asset.symbol;
        return markets.map(
            function(market) {
                if (market == symbol) return null;
                var marketID = market + "_" + symbol;
                var marketName = market + "/" + symbol;
                return (
                    <span key={marketID}>
                        <Link to={`/market/${marketID}`}>{marketName}</Link>
                        &nbsp;
                    </span>
                );
            }.bind(this)
        );
    }

    renderAboutBox(asset, originalAsset) {
        var issuer = ChainStore.getObject(asset.issuer, false, false);
        var issuerName = issuer ? issuer.get("name") : "";

        // Add <a to any links included in the description
        let description = assetUtils.parseDescription(
            asset.options.description
        );
        let desc = description.main;
        let short_name = description.short_name ? description.short_name : null;

        let urlTest = /(http?):\/\/(www\.)?[a-z0-9\.:].*?(?=\s)/g;

        // Regexp needs a whitespace after a url, so add one to make sure
        desc = desc && desc.length > 0 ? desc + " " : desc;
        let urls = desc.match(urlTest);

        // Add market link
        const core_asset = this.props.coreAsset;
        const core_asset_symbol = core_asset.get("symbol");
        let preferredMarket = description.market
            ? description.market
            : core_asset_symbol;
        if (asset.bitasset) {
            preferredMarket = ChainStore.getAsset(
                asset.bitasset.options.short_backing_asset
            );
            if (!!preferredMarket && preferredMarket.get) {
                preferredMarket = preferredMarket.get("symbol");
            } else {
                preferredMarket = core_asset_symbol;
            }
        }
        if (asset.symbol === core_asset_symbol) preferredMarket = "USD";
        if (urls && urls.length) {
            urls.forEach(url => {
                let markdownUrl = `<a target="_blank" class="external-link" rel="noopener noreferrer" href="${url}">${url}</a>`;
                desc = desc.replace(url, markdownUrl);
            });
        }

        let {name, prefix} = utils.replaceName(originalAsset);
        return (
            <div style={{overflow: "visible"}}>
                <HelpContent
                    path={"assets/" + asset.symbol}
                    alt_path="assets/Asset"
                    section="summary"
                    symbol={(prefix || "") + name}
                    description={desc}
                    issuer={issuerName}
                    hide_issuer="true"
                />
                {short_name ? <p>{short_name}</p> : null}

                <Link
                    className="button market-button"
                    to={`/market/${asset.symbol}_${preferredMarket}`}
                >
                    <Translate content="exchange.market" />
                </Link>
            </div>
        );
    }

    renderSummary(asset) {
        // TODO: confidential_supply: 0 USD   [IF NOT ZERO OR NOT DISABLE CONFIDENTIAL]
        let dynamic = this.props.getDynamicObject(asset.dynamic_asset_data_id);
        if (dynamic) dynamic = dynamic.toJS();
        var options = asset.options;

        let flagBooleans = assetUtils.getFlagBooleans(
            asset.options.flags,
            this.props.asset.has("bitasset_data_id")
        );

        let bitNames = Object.keys(flagBooleans);

        let isPrediction =
            "bitasset" in asset && asset.bitasset.is_prediction_market;
        let predictionRows = null;
        if (isPrediction) {
            let description = assetUtils.parseDescription(
                asset.options.description
            );
            predictionRows = (
                <React.Fragment>
                    <tr>
                        <td>
                            <Tooltip
                                title={counterpart.translate(
                                    "explorer.asset.prediction_market_asset.tooltip_prediction"
                                )}
                            >
                                <Translate content="explorer.asset.prediction_market_asset.prediction" />
                            </Tooltip>
                        </td>
                        <td>
                            <Tooltip
                                title={counterpart.translate(
                                    "explorer.asset.prediction_market_asset.tooltip_prediction"
                                )}
                            >
                                {description.condition}
                            </Tooltip>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <Tooltip
                                title={counterpart.translate(
                                    "explorer.asset.prediction_market_asset.tooltip_resolution_date"
                                )}
                            >
                                <Translate content="explorer.asset.prediction_market_asset.resolution_date" />
                            </Tooltip>
                        </td>
                        <td>
                            <Tooltip
                                title={counterpart.translate(
                                    "explorer.asset.prediction_market_asset.tooltip_resolution_date"
                                )}
                            >
                                {description.expiry}
                            </Tooltip>
                        </td>
                    </tr>
                </React.Fragment>
            );
        }

        var currentSupply = dynamic ? (
            <tr>
                <td>
                    <Translate content="explorer.asset.summary.current_supply" />
                </td>
                <td>
                    <FormattedAsset
                        amount={dynamic.current_supply}
                        asset={asset.id}
                    />
                </td>
            </tr>
        ) : null;

        var stealthSupply = dynamic ? (
            <tr>
                <td>
                    <Translate content="explorer.asset.summary.stealth_supply" />
                </td>
                <td>
                    <FormattedAsset
                        amount={dynamic.confidential_supply}
                        asset={asset.id}
                    />
                </td>
            </tr>
        ) : null;

        var marketFee = flagBooleans["charge_market_fee"] ? (
            <tr>
                <td>
                    <Translate content="explorer.asset.summary.market_fee" />
                </td>
                <td> {options.market_fee_percent / 100.0} % </td>
            </tr>
        ) : null;

        // options.max_market_fee initially a string
        var marketFeeReferralReward =
            flagBooleans["charge_market_fee"] &&
            options.extensions &&
            options.extensions.reward_percent >= 0 ? (
                <tr>
                    <td>
                        <Tooltip
                            title={counterpart.translate(
                                "account.user_issued_assets.reward_percent_tooltip"
                            )}
                        >
                            <Translate content="explorer.asset.summary.market_fee_referral_reward_percent" />{" "}
                            <Icon type="question-circle" theme="filled" />
                        </Tooltip>
                    </td>
                    <td> {options.extensions.reward_percent / 100.0} % </td>
                </tr>
            ) : null;
            
        var marketFeeTaker =
            flagBooleans["charge_market_fee"] &&
            options.extensions &&
            options.extensions.taker_fee_percent >= 0 ? (
                <tr>
                    <td>
                        <Tooltip
                            title={counterpart.translate(
                                "account.user_issued_assets.taker_fee_percent_tooltip"
                            )}
                        >
                            <Translate content="explorer.asset.summary.market_fee_referral_taker_fee_percent" />{" "}
                            <Icon type="question-circle" theme="filled" />
                        </Tooltip>
                    </td>
                    <td> {options.extensions.taker_fee_percent / 100.0} % </td>
                </tr>
            ) : null;

        return (
            <div className="asset-card no-padding">
                <div className="card-divider">
                    <AssetName name={asset.symbol} />
                </div>
                <table className="table key-value-table table-hover">
                    <tbody>
                        <tr>
                            <td>
                                <Translate content="explorer.asset.summary.asset_type" />
                            </td>
                            <td> {this._assetType(asset)} </td>
                        </tr>
                        {isPrediction && predictionRows}
                        <tr>
                            <td>
                                <Translate content="explorer.asset.summary.issuer" />
                            </td>
                            <td>
                                <LinkToAccountById account={asset.issuer} />
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Translate content="explorer.assets.precision" />
                            </td>
                            <td> {asset.precision} </td>
                        </tr>
                        {asset.bitasset ? (
                            <tr>
                                <td>
                                    <Translate content="explorer.assets.backing_asset" />
                                </td>
                                <td>
                                    <LinkToAssetById
                                        asset={
                                            asset.bitasset.options
                                                .short_backing_asset
                                        }
                                    />
                                </td>
                            </tr>
                        ) : null}
                        {currentSupply}
                        {stealthSupply}
                        {marketFee}
                        {marketFeeReferralReward}
                        {marketFeeTaker}
                    </tbody>
                </table>
                <br />
                {this.renderFlagIndicators(flagBooleans, bitNames)}
            </div>
        );
    }

    renderPriceFeed(asset) {
        var bitAsset = asset.bitasset;
        if (!("current_feed" in bitAsset)) return <div header={title} />;
        var currentFeed = bitAsset.current_feed;

        var feedPrice = this.formattedPrice(
            assetUtils.extractRawFeedPrice(asset)
        );

        var title = (
            <div>
                <Translate content="explorer.asset.price_feed.title" />
                <span className="float-right">{feedPrice}</span>
            </div>
        );

        return (
            <Panel header={title}>
                <table
                    className="table key-value-table table-hover"
                    style={{padding: "1.2rem"}}
                >
                    <tbody>
                        <tr>
                            <td>
                                <Translate content="explorer.asset.price_feed.external_feed_price" />
                            </td>
                            <td>{feedPrice}</td>
                        </tr>
                        <tr>
                            <td>
                                <Translate content="explorer.asset.price_feed.feed_lifetime" />
                            </td>
                            <td>
                                {bitAsset.options.feed_lifetime_sec / 60 / 60}
                            </td>
                        </tr>
                        <tr>
                            <td>
                                <Translate content="explorer.asset.price_feed.min_feeds" />
                            </td>
                            <td>{bitAsset.options.minimum_feeds}</td>
                        </tr>
                        <tr>
                            <td>
                                <Translate content="explorer.asset.price_feed.maintenance_collateral_ratio" />
                            </td>
                            <td>
                                {currentFeed.maintenance_collateral_ratio /
                                    1000}
                            </td>
                        </tr>

                        <tr>
                            <td>
                                <Translate content="explorer.asset.price_feed.maximum_short_squeeze_ratio" />
                            </td>
                            <td>
                                {currentFeed.maximum_short_squeeze_ratio / 1000}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </Panel>
        );
    }

    _analyzeBids(settlement_fund_debt) {
        // Convert supply to calculable values
        let current_supply_value = settlement_fund_debt;

        let bids_collateral_value = 0;
        let bids_debt_value = 0;

        let sorted_bids = this.state.collateralBids.sort((a, b) => {
            return b.bid.toReal() - a.bid.toReal();
        });

        sorted_bids.forEach(bid => {
            let collateral = bid.collateral;
            let debt = bid.debt;
            if (bids_debt_value < current_supply_value) {
                if (bids_debt_value + debt >= current_supply_value) {
                    debt = current_supply_value - bids_debt_value;
                    collateral = (debt / bid.debt) * collateral;
                    bid.consideredIfRevived = 2;
                } else {
                    bid.consideredIfRevived = 1;
                }
                bids_collateral_value = bids_collateral_value + collateral;
                bids_debt_value = bids_debt_value + debt;
            } else {
                bid.consideredIfRevived = 0;
            }
        });

        return {
            collateral: bids_collateral_value,
            debt: bids_debt_value
        };
    }

    renderSettlement(asset) {
        var bitAsset = asset.bitasset;
        if (!("current_feed" in bitAsset)) return <div header={title} />;

        let dynamic = this.props.getDynamicObject(asset.dynamic_asset_data_id);
        if (dynamic) dynamic = dynamic.toJS();
        var currentSupply = dynamic ? dynamic.current_supply : 0;

        var currentFeed = bitAsset.current_feed;
        var isGlobalSettle = asset.bitasset.settlement_fund > 0 ? true : false;

        let settlement_fund_collateral_ratio = null;
        let total_collateral_ratio = null;
        let revive_price_with_bids = null;

        if (isGlobalSettle) {
            /***
             * Global Settled Assets
             */
            var settlementFund = bitAsset.settlement_fund;

            /**
             * In globally settled assets the force settlement offset is 0
             *
             */
            var settlementPrice = this.formattedPrice(
                bitAsset.settlement_price
            );
            var revivePrice = this.formattedPrice(
                bitAsset.settlement_price,
                false,
                false,
                currentFeed.maintenance_collateral_ratio / 1000,
                true
            );

            const assets = {
                [this.props.asset.get("id")]: this.props.asset.toJS(),
                [this.props.backingAsset.get(
                    "id"
                )]: this.props.backingAsset.toJS()
            };

            // Convert supply to calculable values
            let current_supply_value = currentSupply;
            let current_collateral_value = bitAsset.settlement_fund;

            let bids = this._analyzeBids(current_supply_value);

            revive_price_with_bids = (
                <FormattedPrice
                    base_amount={bitAsset.settlement_fund / 1 + bids.collateral} // /1 is implicit type conversion
                    base_asset={assets[bitAsset.options.short_backing_asset].id}
                    quote_amount={bids.debt}
                    quote_asset={asset.id}
                    hide_value={false}
                    hide_symbols={false}
                    factor={currentFeed.maintenance_collateral_ratio / 1000}
                    negative_invert={true}
                />
            );

            current_supply_value =
                current_supply_value / Math.pow(10, asset.precision);
            current_collateral_value =
                current_collateral_value /
                Math.pow(
                    10,
                    assets[bitAsset.options.short_backing_asset].precision
                );

            let bids_collateral =
                bids.collateral /
                Math.pow(
                    10,
                    assets[bitAsset.options.short_backing_asset].precision
                );

            let feedPrice = this._getFeedPrice();
            if (feedPrice) {
                settlement_fund_collateral_ratio =
                    current_collateral_value /
                    feedPrice.toReal() /
                    current_supply_value;

                total_collateral_ratio =
                    (current_collateral_value + bids_collateral) /
                    feedPrice.toReal() /
                    current_supply_value;
            }
        } else {
            /***
             * Non Global Settlement Assets
             */
            var globalSettlementPrice = this.getGlobalSettlementPrice();
            var globalSettlementTriggerPrice = this.getGlobalSettlementPrice(
                currentFeed.maximum_short_squeeze_ratio / 1000
            );
            var currentSettled = bitAsset.force_settled_volume;
            var settlementOffset =
                bitAsset.options.force_settlement_offset_percent;
            var settlementDelay = bitAsset.options.force_settlement_delay_sec;
            var maxSettlementVolume =
                bitAsset.options.maximum_force_settlement_volume;

            var msspPrice = this.formattedPrice(
                assetUtils.extractRawFeedPrice(asset),
                false,
                false,
                currentFeed.maximum_short_squeeze_ratio / 1000
            );
            var settlePrice = this.formattedPrice(
                assetUtils.extractRawFeedPrice(asset),
                false,
                false,
                1 - settlementOffset / 10000
            );
        }

        var title = (
            <div>
                <Translate content="explorer.asset.settlement.title" />
                <span className="float-right">
                    {isGlobalSettle ? settlementPrice : settlePrice}
                </span>
            </div>
        );

        return (
            <Panel header={title}>
                {isGlobalSettle && (
                    <Translate
                        component="p"
                        content="explorer.asset.settlement.gs_description"
                    />
                )}
                {isGlobalSettle && (
                    <p>
                        <Translate content="explorer.asset.settlement.gs_revive" />
                        &nbsp;(
                        <Translate content="explorer.asset.settlement.gs_see_actions" />
                        , &nbsp;
                        <Translate content="explorer.asset.settlement.gs_or" />
                        &nbsp;
                        <a
                            onClick={() => {
                                this.setState({
                                    showCollateralBidInInfo: !this.state
                                        .showCollateralBidInInfo
                                });
                            }}
                        >
                            <Translate content="explorer.asset.settlement.gs_place_bid" />
                        </a>
                        ).
                    </p>
                )}

                <table
                    className="table key-value-table table-hover"
                    style={{padding: "1.2rem"}}
                >
                    {isGlobalSettle ? (
                        <tbody>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.settlement.settlement_price" />
                                </td>
                                <td>{settlementPrice}</td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.settlement.settlement_funds" />
                                </td>
                                <td>
                                    <FormattedAsset
                                        asset={
                                            bitAsset.options.short_backing_asset
                                        }
                                        amount={settlementFund}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.settlement.settlement_funds_collateral_ratio" />
                                </td>
                                <td>
                                    {settlement_fund_collateral_ratio
                                        ? settlement_fund_collateral_ratio.toFixed(
                                              6
                                          )
                                        : "-"}
                                </td>
                            </tr>
                            <tr>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate
                                        style={{
                                            fontWeight: "bold"
                                        }}
                                        content="explorer.asset.settlement.gs_revert"
                                    />
                                </td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.settlement.gs_auto_revive_price" />
                                </td>
                                <td>
                                    {revivePrice} / {revive_price_with_bids}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate
                                        content="explorer.asset.settlement.gs_collateral_valuation"
                                        mcr={
                                            currentFeed.maintenance_collateral_ratio /
                                            1000
                                        }
                                    />
                                </td>
                                <td>
                                    {total_collateral_ratio
                                        ? total_collateral_ratio.toFixed(6)
                                        : "-"}
                                </td>
                            </tr>
                        </tbody>
                    ) : (
                        <tbody>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.price_feed.maximum_short_squeeze_price" />
                                </td>
                                <td>{msspPrice}</td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.price_feed.global_settlement_trigger" />
                                </td>
                                <td>
                                    {globalSettlementTriggerPrice
                                        ? globalSettlementTriggerPrice
                                        : "-"}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.price_feed.global_settlement_price" />
                                </td>
                                <td>
                                    {globalSettlementPrice
                                        ? globalSettlementPrice
                                        : "-"}
                                </td>
                            </tr>
                            <tr>
                                <td>&nbsp;</td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate
                                        style={{
                                            fontWeight: "bold"
                                        }}
                                        content="explorer.asset.settlement.force_settlement"
                                    />
                                </td>
                                <td>&nbsp;</td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.settlement.price" />
                                    &nbsp; ({settlementOffset / 100}%{" "}
                                    <Translate content="explorer.asset.settlement.offset" />
                                    )
                                </td>
                                <td>{settlePrice}</td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.settlement.delay" />
                                </td>
                                <td>
                                    <FormattedTime time={settlementDelay} />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.settlement.max_settle_volume" />
                                    &nbsp;(
                                    {maxSettlementVolume / 100}
                                    %)
                                </td>
                                <td>
                                    <FormattedAsset
                                        asset={asset.id}
                                        amount={
                                            currentSupply *
                                            (maxSettlementVolume / 10000)
                                        }
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.settlement.current_settled" />
                                </td>
                                <td>
                                    <FormattedAsset
                                        asset={asset.id}
                                        amount={currentSettled}
                                    />
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.settlement.settle_remaining_volume" />
                                </td>
                                <td>
                                    {currentSettled == 0
                                        ? 100
                                        : Math.round(
                                              100 -
                                                  (currentSettled /
                                                      (currentSupply *
                                                          (maxSettlementVolume /
                                                              10000))) *
                                                      100,
                                              2
                                          )}
                                    %
                                </td>
                            </tr>
                        </tbody>
                    )}
                </table>
            </Panel>
        );
    }

    renderFeePool(asset) {
        let dynamic = this.props.getDynamicObject(asset.dynamic_asset_data_id);
        if (dynamic) dynamic = dynamic.toJS();
        var options = asset.options;
        const core = this.props.coreAsset;

        return (
            <Panel
                header={
                    <div>
                        <Translate content="explorer.asset.fee_pool.title" />
                        {dynamic ? (
                            <span className="float-right">
                                <FormattedAsset
                                    asset="1.3.0"
                                    amount={dynamic.fee_pool}
                                />
                            </span>
                        ) : null}
                    </div>
                }
            >
                <div>
                    <Translate
                        component="p"
                        content="explorer.asset.fee_pool.pool_text"
                        unsafe
                        asset={asset.symbol}
                        core={core.get("symbol")}
                    />
                    <table
                        className="table key-value-table"
                        style={{padding: "1.2rem"}}
                    >
                        <tbody>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.fee_pool.core_exchange_rate" />
                                </td>
                                <td>
                                    {this.formattedPrice(
                                        options.core_exchange_rate
                                    )}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.fee_pool.pool_balance" />
                                </td>
                                <td>
                                    {dynamic ? (
                                        <FormattedAsset
                                            asset="1.3.0"
                                            amount={dynamic.fee_pool}
                                        />
                                    ) : null}
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <Translate content="explorer.asset.fee_pool.unclaimed_issuer_income" />
                                </td>
                                <td>
                                    {dynamic ? (
                                        <FormattedAsset
                                            asset={asset.id}
                                            amount={dynamic.accumulated_fees}
                                        />
                                    ) : null}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </Panel>
        );
    }

    renderAssetOwnerUpdate(asset) {
        return (
            <Panel
                header={
                    <Translate content="account.user_issued_assets.update_owner" />
                }
            >
                <Translate
                    component="p"
                    content="account.user_issued_assets.update_owner_text"
                    asset={asset.symbol}
                />
                <AssetOwnerUpdate
                    asset={asset}
                    account={this.props.currentAccount}
                    currentOwner={asset.issuer}
                />
            </Panel>
        );
    }

    renderFeedPublish(asset) {
        return (
            <Panel
                header={
                    <Translate content="transaction.trxTypes.asset_publish_feed" />
                }
            >
                <Translate
                    component="p"
                    content="explorer.asset.feed_producer_text"
                />
                <AssetPublishFeed
                    asset={asset.id}
                    account={this.props.currentAccount}
                    currentOwner={asset.issuer}
                />
            </Panel>
        );
    }

    renderCollateralBid(asset) {
        return (
            <Panel
                header={<Translate content="explorer.asset.collateral.bid" />}
            >
                <Translate
                    component="p"
                    content="explorer.asset.collateral.bid_text"
                    asset={asset.symbol}
                />

                <Translate
                    component="p"
                    content="explorer.asset.settlement.gs_included_on_revival"
                />

                <Translate
                    component="p"
                    content="explorer.asset.collateral.remove_bid"
                />

                <BidCollateralOperation
                    asset={asset.symbol}
                    core={asset.bitasset.options.short_backing_asset}
                    funderAccountName={this.props.currentAccount}
                    onUpdate={this.updateOnCollateralBid.bind(this)}
                    hideBalance
                />
            </Panel>
        );
    }

    renderFeePoolFunding(asset) {
        return (
            <Panel
                header={<Translate content="explorer.asset.fee_pool.fund" />}
            >
                <Translate
                    component="p"
                    content="explorer.asset.fee_pool.fund_text"
                    asset={asset.symbol}
                />
                <FeePoolOperation
                    asset={asset.symbol}
                    funderAccountName={this.props.currentAccount}
                    hideBalance
                />
            </Panel>
        );
    }

    renderFeePoolClaiming(asset) {
        let dynamic = this.props.getDynamicObject(asset.dynamic_asset_data_id);
        if (dynamic) dynamic = dynamic.toJS();
        return (
            <Panel
                header={
                    <Translate content="explorer.asset.fee_pool.claim_balance" />
                }
            >
                <FeePoolOperation
                    asset={asset.symbol}
                    funderAccountName={this.props.currentAccount}
                    dynamic={dynamic}
                    hideBalance
                    type="claim"
                />
            </Panel>
        );
    }

    renderFeesClaiming(asset) {
        let dynamic = this.props.getDynamicObject(asset.dynamic_asset_data_id);
        if (dynamic) dynamic = dynamic.toJS();
        return (
            <Panel
                header={
                    <Translate content="transaction.trxTypes.asset_claim_fees" />
                }
            >
                <FeePoolOperation
                    asset={asset.symbol}
                    dynamic={dynamic}
                    funderAccountName={this.props.currentAccount}
                    hideBalance
                    type="claim_fees"
                />
            </Panel>
        );
    }

    // TODO: Blacklist Authorities: <Account list like Voting>
    // TODO: Blacklist Market: Base/Market, Base/Market
    renderPermissions(asset) {
        //var dynamic = asset.dynamic;

        var options = asset.options;

        let permissionBooleans = assetUtils.getFlagBooleans(
            asset.options.issuer_permissions,
            this.props.asset.has("bitasset_data_id")
        );

        let bitNames = Object.keys(permissionBooleans);

        // options.blacklist_authorities = ["1.2.3", "1.2.4"];
        // options.whitelist_authorities = ["1.2.1", "1.2.2"];
        // options.blacklist_markets = ["JPY", "RUB"];
        // options.whitelist_markets = ["USD", "EUR", "GOLD"];

        // options.max_market_fee initially a string
        var maxMarketFee = permissionBooleans["charge_market_fee"] ? (
            <tr>
                <td>
                    <Translate content="explorer.asset.permissions.max_market_fee" />
                </td>
                <td>
                    <FormattedAsset
                        amount={+options.max_market_fee}
                        asset={asset.id}
                    />
                </td>
            </tr>
        ) : null;

        // options.max_supply initially a string
        var maxSupply = (
            <tr>
                <td>
                    <Translate content="explorer.asset.permissions.max_supply" />
                </td>
                <td>
                    <FormattedAsset
                        amount={+options.max_supply}
                        asset={asset.id}
                    />
                </td>
            </tr>
        );

        var whiteLists = permissionBooleans["white_list"] ? (
            <div>
                <br />
                {!!options.blacklist_authorities &&
                    !!options.blacklist_authorities.length && (
                        <React.Fragment>
                            <Translate content="explorer.asset.permissions.blacklist_authorities" />
                            : &nbsp;
                            {this.renderAuthorityList(
                                options.blacklist_authorities
                            )}
                        </React.Fragment>
                    )}
                {!!options.blacklist_markets &&
                    !!options.blacklist_markets.length && (
                        <React.Fragment>
                            <br />
                            <Translate content="explorer.asset.permissions.blacklist_markets" />
                            : &nbsp;
                            {this.renderMarketList(
                                asset,
                                options.blacklist_markets
                            )}
                        </React.Fragment>
                    )}
                {!!options.whitelist_authorities &&
                    !!options.whitelist_authorities.length && (
                        <React.Fragment>
                            <br />
                            <Translate content="explorer.asset.permissions.whitelist_authorities" />
                            : &nbsp;
                            {this.renderAuthorityList(
                                options.whitelist_authorities
                            )}
                        </React.Fragment>
                    )}
                {!!options.whitelist_markets &&
                    !!options.whitelist_markets.length && (
                        <React.Fragment>
                            <br />
                            <Translate content="explorer.asset.permissions.whitelist_markets" />
                            : &nbsp;
                            {this.renderMarketList(
                                asset,
                                options.whitelist_markets
                            )}
                        </React.Fragment>
                    )}
            </div>
        ) : null;

        let whitelist_market_fee_sharing = asset.options.extensions
            .whitelist_market_fee_sharing && (
            <React.Fragment>
                <br />
                <Translate content="explorer.asset.permissions.accounts_in_whitelist_market_fee_sharing" />
                : &nbsp;
                {this.renderAuthorityList(
                    asset.options.extensions.whitelist_market_fee_sharing
                )}
            </React.Fragment>
        );

        return (
            <Panel
                header={
                    <Translate content="explorer.asset.permissions.title" />
                }
            >
                <div>
                    <table
                        className="table key-value-table table-hover"
                        style={{padding: "1.2rem"}}
                    >
                        <tbody>
                            {maxMarketFee}
                            {maxSupply}
                        </tbody>
                    </table>

                    <br />
                    {this.renderPermissionIndicators(
                        permissionBooleans,
                        bitNames
                    )}
                    <br />

                    {whiteLists}
                    {whitelist_market_fee_sharing}
                </div>
            </Panel>
        );
    }

    // the global settlement price is defined as the
    // the price at which the least collateralize short's
    // collateral no longer enough to back the debt
    // he/she owes.
    getGlobalSettlementPrice(mssr = 1) {
        if (!this.state.callOrders) {
            return null;
        }

        // first get the least collateralized short position
        var leastColShort = null;
        var leastColShortRatio = null;
        var len = this.state.callOrders.length;
        for (var i = 0; i < len; i++) {
            let call_order = this.state.callOrders[i];

            if (leastColShort == null) {
                leastColShort = call_order;
                leastColShortRatio = call_order.getRatio();
            } else if (call_order.getRatio() < leastColShortRatio) {
                leastColShortRatio = call_order.getRatio();
                leastColShort = call_order;
            }
        }

        if (leastColShort == null) {
            // couldn't find the least colshort?
            return null;
        }

        // this price will happen when the CR is 1.
        // The CR is 1 if collateral / (debt x feed_ price) == 1
        // Rearranging, this means that the CR is 1 if
        // feed_price == collateral / debt
        //
        // Default is to return the global settlement price
        // Use mssr to calculate in when an event happens
        // based on an assets MSSR

        let debt = leastColShort.debt * mssr;
        let collateral = leastColShort.collateral;

        return (
            <FormattedPrice
                base_amount={collateral}
                base_asset={leastColShort.call_price.base.asset_id}
                quote_amount={debt}
                quote_asset={leastColShort.call_price.quote.asset_id}
            />
        );
    }

    _renderFeedTable(asset) {
        var bitAsset = asset.bitasset;
        if (
            !("feeds" in bitAsset) ||
            bitAsset.feeds.length == 0 ||
            bitAsset.is_prediction_market ||
            !bitAsset.feeds.length
        ) {
            return null;
        }

        var feeds = bitAsset.feeds;
        var feed_price_header = assetUtils.extractRawFeedPrice(feeds[0][1][1]);
        var core_exchange_rate_header = feeds[0][1][1].core_exchange_rate;

        // Filter by valid feed lifetime, Sort by published date
        let now = new Date().getTime();
        let oldestValidDate = new Date(
            now - asset.bitasset.options.feed_lifetime_sec * 1000
        );
        feeds = feeds
            .filter(a => {
                return new Date(a[1][0]) > oldestValidDate;
            })
            .sort(function(feed1, feed2) {
                return new Date(feed2[1][0]) - new Date(feed1[1][0]);
            });

        let currentFeed = assetUtils.extractRawFeedPrice(asset);
        let currentFeedPrice =
            currentFeed.base.amount / currentFeed.quote.amount;

        let dataSource = [];
        let columns = [];

        columns = [
            {
                key: "publisher",
                fixed: "left",
                width: 150,
                title: (
                    <Translate content="explorer.asset.price_feed_data.publisher" />
                ),
                dataIndex: "publisher",
                sorter: (a, b) => {
                    let nameA = ChainStore.getAccount(a.publisher, false);
                    if (nameA) nameA = nameA.get("name");
                    let nameB = ChainStore.getAccount(b.publisher, false);
                    if (nameB) nameB = nameB.get("name");
                    if (nameA > nameB) return 1;
                    if (nameA < nameB) return -1;
                    return 0;
                },
                render: item => {
                    return <LinkToAccountById account={item} />;
                }
            },
            {
                key: "feed_price",
                title: (
                    <React.Fragment>
                        <Translate content="explorer.asset.price_feed_data.feed_price" />{" "}
                        ({this.formattedPrice(feed_price_header, false, true)})
                    </React.Fragment>
                ),
                dataIndex: "feed_price",
                sorter: (a, b) => {
                    let a_price = parseFloat(
                        a.feed_price.base.amount / a.feed_price.quote.amount
                    );
                    let b_price = parseFloat(
                        b.feed_price.base.amount / b.feed_price.quote.amount
                    );

                    if (a_price > b_price) return 1;
                    if (a_price < b_price) return -1;
                    return 0;
                },
                render: item => {
                    let price = parseFloat(
                        item.base.amount / item.quote.amount
                    );
                    let median_offset = (
                        (price / currentFeedPrice) * 100 -
                        100
                    ).toFixed(2);
                    return (
                        <React.Fragment>
                            {this.formattedPrice(item, true)}(
                            <span
                                className={
                                    median_offset > 0
                                        ? "txtlabel success"
                                        : median_offset < 0
                                            ? "txtlabel warning"
                                            : "txtlabel"
                                }
                            >
                                {median_offset}%
                            </span>
                            )
                        </React.Fragment>
                    );
                }
            },
            {
                key: "core_exchange_rate",
                title: (
                    <React.Fragment>
                        <Translate content="explorer.asset.price_feed_data.core_exchange_rate" />{" "}
                        (
                        {this.formattedPrice(
                            core_exchange_rate_header,
                            false,
                            true
                        )}
                        )
                    </React.Fragment>
                ),
                dataIndex: "core_exchange_rate",
                render: item => {
                    return this.formattedPrice(item, true);
                }
            },
            {
                key: "maintenance_collateral_ratio",
                title: (
                    <Translate content="explorer.asset.price_feed_data.maintenance_collateral_ratio" />
                ),
                dataIndex: "maintenance_collateral_ratio",
                render: item => {
                    return item;
                }
            },
            {
                key: "maximum_short_squeeze_ratio",
                title: (
                    <Translate content="explorer.asset.price_feed_data.maximum_short_squeeze_ratio" />
                ),
                dataIndex: "maximum_short_squeeze_ratio",
                render: item => {
                    return item;
                }
            },
            {
                key: "publishDate",
                fixed: "right",
                width: 150,
                title: (
                    <Translate content="explorer.asset.price_feed_data.published" />
                ),
                dataIndex: "publishDate",
                sorter: (a, b) => {
                    if (a.publishDate.getTime() > b.publishDate.getTime())
                        return 1;
                    if (a.publishDate.getTime() < b.publishDate.getTime())
                        return -1;
                    return 0;
                },
                render: item => {
                    return <TimeAgo time={item} />;
                }
            }
        ];

        for (var i = 0; i < feeds.length; i++) {
            var feed = feeds[i];
            var publisher = feed[0];
            var publishDate = new Date(feed[1][0] + "Z");
            var feed_price = assetUtils.extractRawFeedPrice(feed[1][1]);
            var core_exchange_rate = feed[1][1].core_exchange_rate;
            var maintenance_collateral_ratio =
                "" + feed[1][1].maintenance_collateral_ratio / 1000;
            var maximum_short_squeeze_ratio =
                "" + feed[1][1].maximum_short_squeeze_ratio / 1000;

            dataSource.push({
                publisher: publisher,
                feed_price: feed_price,
                core_exchange_rate: core_exchange_rate,
                maintenance_collateral_ratio: maintenance_collateral_ratio,
                maximum_short_squeeze_ratio: maximum_short_squeeze_ratio,
                publishDate: publishDate
            });
        }

        return (
            <Table
                style={{width: "100%"}}
                rowKey="feedPublisher"
                columns={columns}
                dataSource={dataSource}
                pagination={false}
                locale={{
                    emptyText: (
                        <Translate content="explorer.asset.price_feed_data.empty" />
                    )
                }}
            />
        );
    }

    _renderMarginTable() {
        let {cumulativeGrouping} = this.state;
        let columns = [];
        let dataSource = [];

        if (this.state.callOrders && this.state.callOrders.length > 0) {
            const cummulativeSuffix = cumulativeGrouping ? (
                <span>
                    &nbsp;(
                    <Translate content="explorer.asset.cumulative" />)
                </span>
            ) : (
                <span>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</span>
            );

            let debt_cum = 0;
            let coll_cum = 0;

            this.state.callOrders.map(c => {
                debt_cum += c.debt;
                coll_cum += c.collateral;

                dataSource.push({
                    borrower: c.borrower,
                    collateral: {
                        amount: cumulativeGrouping ? coll_cum : c.collateral,
                        asset: c.getCollateral().asset_id
                    },
                    debt: {
                        amount: cumulativeGrouping ? debt_cum : c.debt,
                        asset: c.amountToReceive().asset_id
                    },
                    call: c.call_price,
                    tcr: c.order.target_collateral_ratio,
                    cr: {
                        ratio: c.getRatio(),
                        status: c.getStatus()
                    }
                });
            });
            const unitInfo = key => {
                let item = dataSource[0][key];
                return dataSource.length ? (
                    <span>
                        <br />
                        {item.base ? (
                            this.formattedPrice(item, false, true)
                        ) : (
                            <FormattedAsset
                                asset={item.asset}
                                amount={item.amount}
                                hide_amount={true}
                            />
                        )}
                    </span>
                ) : null;
            };

            columns = [
                {
                    key: "borrower",
                    fixed: "left",
                    width: 200,
                    title: <Translate content="transaction.borrower" />,
                    dataIndex: "borrower",
                    sorter: (a, b) => {
                        let nameA = ChainStore.getAccount(a.borrower, false);
                        if (nameA) nameA = nameA.get("name");
                        let nameB = ChainStore.getAccount(b.borrower, false);
                        if (nameB) nameB = nameB.get("name");
                        if (nameA > nameB) return 1;
                        if (nameA < nameB) return -1;
                        return 0;
                    },
                    render: item => {
                        return <LinkToAccountById account={item} />;
                    }
                },
                {
                    key: "collateral",
                    title: (
                        <React.Fragment>
                            <Translate content="transaction.collateral" />
                            {cummulativeSuffix}
                            {unitInfo("collateral")}
                        </React.Fragment>
                    ),
                    dataIndex: "collateral",
                    sorter: (a, b) => {
                        if (a.collateral.amount > b.collateral.amount) return 1;
                        if (a.collateral.amount < b.collateral.amount)
                            return -1;
                        return 0;
                    },
                    render: item => {
                        return (
                            <Tooltip
                                title={counterpart.translate(
                                    "explorer.asset.margin_positions.click_to_switch_to_cumulative"
                                )}
                                mouseEnterDelay={0.5}
                            >
                                <span
                                    onClick={this._toggleCumulativeGrouping.bind(
                                        this
                                    )}
                                    style={{cursor: "pointer"}}
                                >
                                    <FormattedAsset
                                        amount={item.amount}
                                        asset={item.asset}
                                        hide_asset={true}
                                    />
                                </span>
                            </Tooltip>
                        );
                    }
                },
                {
                    key: "debt",
                    title: (
                        <React.Fragment>
                            <Translate content="transaction.borrow_amount" />
                            {cummulativeSuffix}
                            {unitInfo("debt")}
                        </React.Fragment>
                    ),
                    dataIndex: "debt",
                    sorter: (a, b) => {
                        if (a.debt.amount > b.debt.amount) return 1;
                        if (a.debt.amount < b.debt.amount) return -1;
                        return 0;
                    },
                    render: item => {
                        return (
                            <div
                                onClick={this._toggleCumulativeGrouping.bind(
                                    this
                                )}
                                style={{cursor: "pointer"}}
                            >
                                <Tooltip
                                    title={counterpart.translate(
                                        "explorer.asset.margin_positions.click_to_switch_to_cumulative"
                                    )}
                                    mouseEnterDelay={0.5}
                                >
                                    <FormattedAsset
                                        amount={item.amount}
                                        asset={item.asset}
                                        hide_asset={true}
                                    />
                                </Tooltip>
                            </div>
                        );
                    }
                },

                {
                    key: "call",
                    title: (
                        <span>
                            <Translate content="exchange.call" />
                            {unitInfo("call")}
                        </span>
                    ),
                    dataIndex: "call",
                    render: item => {
                        return this.formattedPrice(item, true, false);
                    }
                },
                {
                    key: "tcr",
                    title: (
                        <Tooltip
                            title={counterpart.translate(
                                "borrow.target_collateral_ratio_explanation"
                            )}
                        >
                            <Translate content="borrow.target_collateral_ratio_short" />
                        </Tooltip>
                    ),
                    dataIndex: "tcr",
                    render: item => {
                        return !!item ? (item / 1000).toFixed(3) : "-";
                    }
                },
                {
                    key: "cr",
                    title: <Translate content="borrow.coll_ratio" />,
                    dataIndex: "cr",
                    fixed: "right",
                    width: 100,
                    sorter: (a, b) => {
                        if (a.cr.ratio > b.cr.ratio) return 1;
                        if (a.cr.ratio < b.cr.ratio) return -1;
                        return 0;
                    },
                    render: item => {
                        let classNames = "margin-ratio " + item.status;

                        return (
                            <React.Fragment>
                                <div className={classNames}>
                                    {item.ratio.toFixed(3)}
                                </div>
                            </React.Fragment>
                        );
                    }
                }
            ];
        }

        return (
            <Table
                style={{width: "100%"}}
                rowKey="feedMargins"
                columns={columns}
                dataSource={dataSource}
                rowClassName="margin-row"
                pagination={{
                    pageSize: Number(25)
                }}
                locale={{
                    emptyText: (
                        <Translate content="explorer.asset.margin_positions.empty" />
                    )
                }}
            />
        );
    }

    _renderCollBidTable() {
        let columns = [];
        let dataSource = [];

        columns = [
            {
                key: "bidder",
                title: <Translate content="transaction.bidder" />,
                dataIndex: "bidder",
                fixed: "left",
                width: 200,
                render: item => {
                    return <LinkToAccountById account={item} />;
                }
            },
            {
                key: "collateral",
                title: <Translate content="transaction.collateral" />,
                dataIndex: "collateral",
                render: item => {
                    return (
                        <FormattedAsset
                            amount={item.amount}
                            asset={item.asset_id}
                            hide_asset
                        />
                    );
                }
            },
            {
                key: "debt",
                title: <Translate content="transaction.borrow_amount" />,
                dataIndex: "debt",
                render: item => {
                    return (
                        <FormattedAsset
                            amount={item.amount}
                            asset={item.asset_id}
                            hide_asset
                        />
                    );
                }
            },
            {
                key: "debt_cum",
                title: (
                    <Translate content="transaction.cumulative_borrow_amount" />
                ),
                dataIndex: "debt_cum",
                render: item => {
                    return (
                        <FormattedAsset
                            amount={item.amount}
                            asset={item.asset_id}
                            hide_asset
                        />
                    );
                }
            },
            {
                key: "price",
                title: (
                    <Translate content="explorer.asset.collateral_bid.bid" />
                ),
                dataIndex: "price",
                render: item => {
                    return (
                        <FormattedPrice
                            base_amount={item.base.amount}
                            base_asset={item.base.asset_id}
                            quote_amount={item.quote.amount}
                            quote_asset={item.quote.asset_id}
                            hide_symbols
                        />
                    );
                }
            },
            {
                key: "cr",
                title: <Translate content="borrow.coll_ratio" />,
                dataIndex: "cr",
                render: item => {
                    return item.toFixed(3);
                }
            },
            {
                key: "included",
                title: <Translate content="borrow.considered_on_revival" />,
                dataIndex: "included",
                render: item => {
                    if (item == 2)
                        return (
                            <Translate content="explorer.asset.collateral_bid.included.partial" />
                        );
                    else if (item == 1)
                        return (
                            <Translate content="explorer.asset.collateral_bid.included.yes" />
                        );
                    else
                        return (
                            <Translate content="explorer.asset.collateral_bid.included.no" />
                        );
                }
            }
        ];

        let debt_cum = 0;
        this.state.collateralBids.map(c => {
            debt_cum += c.debt;

            dataSource.push({
                bidder: c.bidder,
                collateral: {
                    amount: c.bid.base.amount,
                    asset: c.bid.base.asset_id
                },
                debt: {
                    amount: c.bid.quote.amount,
                    asset: c.bid.quote.asset_id
                },
                debt_cum: {
                    amount: debt_cum,
                    asset: c.bid.quote.asset_id
                },
                price: c.bid,
                cr: c.getRatio(),
                included: c.consideredIfRevived
            });
        });

        return (
            <Table
                style={{width: "100%"}}
                rowKey="feedCollBid"
                columns={columns}
                dataSource={dataSource}
                pagination={{
                    pageSize: Number(25)
                }}
                locale={{
                    emptyText: (
                        <Translate content="explorer.asset.collateral_bid.empty" />
                    )
                }}
            />
        );
    }

    _setFeedTab(tab) {
        this.setState({
            activeFeedTab: tab
        });
    }

    _setAssetTab(tab) {
        this.setState({
            activeAssetTab: tab
        });
    }

    renderFeedTables(asset) {
        var bitAsset = asset.bitasset;
        if (
            !("feeds" in bitAsset) ||
            bitAsset.feeds.length == 0 ||
            bitAsset.is_prediction_market ||
            !bitAsset.feeds.length
        ) {
            return null;
        }

        let isGlobalSettlement = bitAsset.settlement_fund > 0 ? true : false;

        return (
            <Tabs
                onChange={this._setFeedTab.bind(this)}
                activeKey={this.state.activeFeedTab}
            >
                <Tabs.TabPane
                    tab={counterpart.translate(
                        isGlobalSettlement
                            ? "explorer.asset.collateral_bid.title"
                            : "explorer.asset.margin_positions.title"
                    )}
                    key="margin"
                >
                    {this.state.activeFeedTab == "margin"
                        ? isGlobalSettlement
                            ? this._renderCollBidTable()
                            : this._renderMarginTable()
                        : null}
                </Tabs.TabPane>
                <Tabs.TabPane
                    tab={counterpart.translate(
                        "explorer.asset.price_feed_data.title"
                    )}
                    key="feed"
                >
                    {this.state.activeFeedTab == "feed"
                        ? this._renderFeedTable(asset)
                        : null}
                </Tabs.TabPane>
            </Tabs>
        );
    }

    renderAssetResolvePrediction(asset) {
        return (
            <Panel
                header={
                    <Translate content="account.user_issued_assets.resolve_prediction" />
                }
            >
                <Translate
                    component="p"
                    content="account.user_issued_assets.resolve_prediction_text"
                />
                <AssetResolvePrediction
                    asset={asset}
                    account={this.props.currentAccount}
                />
            </Panel>
        );
    }

    render() {
        if (this.props.backingAsset === null) {
            return <Page404 subtitle="asset_not_found_subtitle" />;
        }
        if (!this.props.backingAsset.get || !this.props.coreAsset.get) {
            return null;
        }

        var asset = this.props.asset.toJS();
        var priceFeed =
            "bitasset" in asset ? this.renderPriceFeed(asset) : null;
        var priceFeedData =
            "bitasset" in asset ? this.renderFeedTables(asset) : null;

        return (
            <div className="grid-container asset-page">
                <div className="grid-block page-layout">
                    <div className="grid-block main-content wrap">
                        <div
                            className="grid-block medium-up-1"
                            style={{width: "100%"}}
                        >
                            {this.renderAboutBox(asset, this.props.asset)}
                        </div>

                        <Tabs
                            onChange={this._setAssetTab.bind(this)}
                            activeKey={this.state.activeAssetTab}
                            className="grid-block vertical"
                        >
                            <Tabs.TabPane
                                tab={counterpart.translate(
                                    "explorer.asset.info"
                                )}
                                key="info"
                            >
                                <div
                                    className="grid-block vertical large-horizontal medium-up-1 large-up-2"
                                    style={{paddingTop: "1rem"}}
                                >
                                    <div className="grid-content small-no-padding">
                                        {this.renderSummary(asset)}
                                    </div>
                                    <div>
                                        <Collapse className="asset-collapse">
                                            {this.renderPermissions(asset)}

                                            {this.renderFeePool(asset)}

                                            {priceFeed
                                                ? this.renderPriceFeed(asset)
                                                : null}

                                            {priceFeed
                                                ? this.renderSettlement(asset)
                                                : null}

                                            {this.state.showCollateralBidInInfo
                                                ? this.renderCollateralBid(
                                                      asset
                                                  )
                                                : null}
                                        </Collapse>
                                    </div>
                                </div>
                                {priceFeedData ? priceFeedData : null}
                            </Tabs.TabPane>
                            <Tabs.TabPane
                                tab={counterpart.translate(
                                    "explorer.asset.actions"
                                )}
                                key="actions"
                            >
                                <Collapse className="asset-collapse">
                                    {this.renderFeePoolFunding(asset)}
                                    {this.renderFeePoolClaiming(asset)}
                                    {this.renderFeesClaiming(asset)}
                                    {this.renderAssetOwnerUpdate(asset)}
                                    {"bitasset" in asset &&
                                        !asset.bitasset.is_prediction_market &&
                                        this.renderFeedPublish(asset)}
                                    {this.state.collateralBids.length > 0 &&
                                        this.renderCollateralBid(asset)}
                                    {"bitasset" in asset &&
                                        asset.bitasset.is_prediction_market &&
                                        this.renderAssetResolvePrediction(
                                            asset
                                        )}
                                </Collapse>
                            </Tabs.TabPane>
                        </Tabs>
                    </div>
                </div>
            </div>
        );
    }
}

Asset = connect(
    Asset,
    {
        listenTo() {
            return [AccountStore];
        },
        getProps() {
            return {
                currentAccount:
                    AccountStore.getState().currentAccount ||
                    AccountStore.getState().passwordAccount
            };
        }
    }
);

Asset = AssetWrapper(Asset, {
    propNames: ["backingAsset", "coreAsset"]
});

class AssetContainer extends React.Component {
    render() {
        if (this.props.asset === null) {
            return <Page404 subtitle="asset_not_found_subtitle" />;
        }
        if (!this.props.asset.get) {
            return null;
        }
        let backingAsset = this.props.asset.has("bitasset")
            ? this.props.asset.getIn([
                  "bitasset",
                  "options",
                  "short_backing_asset"
              ])
            : "1.3.0";
        return (
            <Asset
                {...this.props}
                backingAsset={backingAsset}
                coreAsset={"1.3.0"}
            />
        );
    }
}
AssetContainer = AssetWrapper(AssetContainer, {
    withDynamic: true
});

export default class AssetSymbolSplitter extends React.Component {
    render() {
        let symbol = this.props.match.params.symbol.toUpperCase();
        return <AssetContainer {...this.props} asset={symbol} />;
    }
}
