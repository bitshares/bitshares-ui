import React from "react";
import Translate from "react-translate-component";
import classnames from "classnames";
import AssetActions from "actions/AssetActions";
import HelpContent from "../Utility/HelpContent";
import utils from "common/utils";
import {ChainStore} from "bitsharesjs/es";
import FormattedAsset from "../Utility/FormattedAsset";
import FormattedFee from "../Utility/FormattedFee";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AssetWrapper from "../Utility/AssetWrapper";
import AmountSelector from "../Utility/AmountSelector";
import FormattedPrice from "../Utility/FormattedPrice";
import AccountSelector from "../Account/AccountSelector";
import AssetSelector from "../Utility/AssetSelector";
import big from "bignumber.js";
import cnames from "classnames";
import assetUtils from "common/asset_utils";
import {Tabs, Tab} from "../Utility/Tabs";
import {BitAssetOptions} from "./AccountAssetCreate";
import assetConstants from "chain/asset_constants";
import AssetWhitelist from "./AssetWhitelist";
import AssetFeedProducers from "./AssetFeedProducers";
import BaseModal from "components/Modal/BaseModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";

let GRAPHENE_MAX_SHARE_SUPPLY = new big(
    assetConstants.GRAPHENE_MAX_SHARE_SUPPLY
);

class AccountAssetUpdate extends React.Component {
    static propTypes = {
        globalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0"
    };

    constructor(props) {
        super(props);

        this.state = this.resetState(props);
    }

    _openConfirm() {
        this.refs.confirm_modal.show();
    }

    _cancelConfirm() {
        this.refs.confirm_modal.onClose();
    }

    resetState(props) {
        let asset = props.asset.toJS();
        let isBitAsset = asset.bitasset_data_id !== undefined;
        let precision = utils.get_asset_precision(asset.precision);
        let corePrecision = utils.get_asset_precision(
            props.core.get("precision")
        );

        let max_market_fee = new big(asset.options.max_market_fee)
            .div(precision)
            .toString();
        let max_supply = new big(asset.options.max_supply)
            .div(precision)
            .toString();
        let core_exchange_rate = asset.options.core_exchange_rate;
        core_exchange_rate.quote.amount =
            core_exchange_rate.quote.asset_id === asset.id
                ? new big(core_exchange_rate.quote.amount)
                      .div(precision)
                      .toString()
                : new big(core_exchange_rate.quote.amount)
                      .div(corePrecision)
                      .toString();

        core_exchange_rate.base.amount =
            core_exchange_rate.base.asset_id === asset.id
                ? new big(core_exchange_rate.base.amount)
                      .div(precision)
                      .toString()
                : new big(core_exchange_rate.base.amount)
                      .div(corePrecision)
                      .toString();

        let flagBooleans = assetUtils.getFlagBooleans(
            asset.options.flags,
            isBitAsset
        );
        let permissionBooleans = assetUtils.getFlagBooleans(
            asset.options.issuer_permissions,
            isBitAsset
        );
        asset.options.market_fee_percent /= 100;

        let coreRateQuoteAssetName = ChainStore.getAsset(
            core_exchange_rate.quote.asset_id
        ).get("symbol");
        let coreRateBaseAssetName = ChainStore.getAsset(
            core_exchange_rate.base.asset_id
        ).get("symbol");

        return {
            update: {
                max_supply: max_supply,
                max_market_fee: max_market_fee,
                market_fee_percent: asset.options.market_fee_percent,
                description: assetUtils.parseDescription(
                    asset.options.description
                )
            },
            core_exchange_rate: core_exchange_rate,
            issuer: asset.issuer,
            new_issuer_account_id: null,
            issuer_account_name: null,
            new_funder_account: props.account.get("id"),
            funder_account_name: props.account.get("name"),
            asset_to_update: asset.id,
            errors: {
                max_supply: null
            },
            new_authority_id: null,
            authority_name: null,
            isValid: true,
            flagBooleans: flagBooleans,
            permissionBooleans: permissionBooleans,
            isBitAsset: isBitAsset,
            coreRateQuoteAssetName: coreRateQuoteAssetName,
            quoteAssetInput: coreRateQuoteAssetName,
            coreRateBaseAssetName: coreRateBaseAssetName,
            baseAssetInput: coreRateBaseAssetName,
            fundPoolAmount: 0,
            claimFeesAmount: 0,
            bitasset_opts: isBitAsset ? asset.bitasset.options : null,
            original_bitasset_opts: isBitAsset
                ? props.asset.getIn(["bitasset", "options"]).toJS()
                : null,
            marketInput: "",
            whitelist_authorities: props.asset.getIn([
                "options",
                "whitelist_authorities"
            ]),
            blacklist_authorities: props.asset.getIn([
                "options",
                "blacklist_authorities"
            ]),
            whitelist_markets: props.asset.getIn([
                "options",
                "whitelist_markets"
            ]),
            blacklist_markets: props.asset.getIn([
                "options",
                "blacklist_markets"
            ]),
            maxFeedProducers: props.globalObject.getIn([
                "parameters",
                "maximum_asset_feed_publishers"
            ]),
            feedProducers: isBitAsset
                ? props.asset.getIn(["bitasset", "feeds"], []).map(a => {
                      return a.first();
                  })
                : null,
            originalFeedProducers: isBitAsset
                ? props.asset.getIn(["bitasset", "feeds"], []).map(a => {
                      return a.first();
                  })
                : null
        };
    }

    // Using JSON.stringify for (fast?) comparsion, could be improved, but seems enough here as the order is fixed
    assetChanged() {
        let s = this.state;
        let p = this.resetState(this.props);
        return (
            JSON.stringify(s.update) !== JSON.stringify(p.update) ||
            JSON.stringify(s.core_exchange_rate) !==
                JSON.stringify(p.core_exchange_rate) ||
            (s.new_issuer_account_id !== null &&
                s.new_issuer_account_id !== s.issuer) ||
            JSON.stringify(s.flagBooleans) !== JSON.stringify(p.flagBooleans) ||
            JSON.stringify(s.permissionBooleans) !==
                JSON.stringify(p.permissionBooleans) ||
            JSON.stringify(s.whitelist_authorities) !==
                JSON.stringify(p.whitelist_authorities) ||
            JSON.stringify(s.blacklist_authorities) !==
                JSON.stringify(p.blacklist_authorities) ||
            JSON.stringify(s.whitelist_markets) !==
                JSON.stringify(p.whitelist_markets) ||
            JSON.stringify(s.blacklist_markets) !==
                JSON.stringify(p.blacklist_markets)
        );
    }

    // Return tab ID on change
    tabChanged(tabId) {
        let tabsChanged = this.tabsChanged();
        return tabsChanged[tabId] ? tabsChanged[tabId] : false;
    }

    tabsChanged() {
        let s = this.state;
        let p = this.resetState(this.props);

        let tabUpdateIndex = [];

        if (
            s.update.max_supply !== p.update.max_supply ||
            s.core_exchange_rate.base.amount !==
                p.core_exchange_rate.base.amount ||
            s.core_exchange_rate.quote.amount !==
                p.core_exchange_rate.quote.amount
        )
            tabUpdateIndex["0"] = true;

        if (
            JSON.stringify(s.whitelist_authorities) !==
                JSON.stringify(p.whitelist_authorities) ||
            JSON.stringify(s.blacklist_authorities) !==
                JSON.stringify(p.blacklist_authorities) ||
            JSON.stringify(s.whitelist_markets) !==
                JSON.stringify(p.whitelist_markets) ||
            JSON.stringify(s.blacklist_markets) !==
                JSON.stringify(p.blacklist_markets)
        )
            tabUpdateIndex["1"] = true;

        if (
            s.update.description.main !== p.update.description.main ||
            s.update.description.short_name !==
                p.update.description.short_name ||
            s.update.description.market !== p.update.description.market
        )
            tabUpdateIndex["2"] = true;

        if (
            JSON.stringify(s.bitasset_opts) !==
            JSON.stringify(p.original_bitasset_opts)
        )
            tabUpdateIndex["3"] = true;

        if (
            s.new_issuer_account_id !== null &&
            s.new_issuer_account_id !== s.issuer
        )
            tabUpdateIndex["4"] = true;

        if (
            JSON.stringify(s.permissionBooleans) !==
            JSON.stringify(p.permissionBooleans)
        )
            tabUpdateIndex["5"] = true;

        if (
            JSON.stringify(s.flagBooleans) !== JSON.stringify(p.flagBooleans) ||
            s.update.market_fee_percent !== p.update.market_fee_percent ||
            s.update.max_market_fee !== p.update.max_market_fee
        )
            tabUpdateIndex["6"] = true;

        // Tab 7 == Fee Pool

        if (
            JSON.stringify(s.feedProducers) !==
            JSON.stringify(p.originalFeedProducers)
        )
            tabUpdateIndex["8"] = true;

        return tabUpdateIndex;
    }

    pageChanged() {
        let {
            isBitAsset,
            bitasset_opts,
            original_bitasset_opts,
            feedProducers,
            originalFeedProducers
        } = this.state;
        return (
            this.assetChanged() ||
            (isBitAsset &&
                (JSON.stringify(bitasset_opts) !==
                    JSON.stringify(original_bitasset_opts) ||
                    !utils.are_equal_shallow(
                        feedProducers.toJS(),
                        originalFeedProducers.toJS()
                    )))
        );
    }

    _updateAsset(e) {
        e.preventDefault();

        // Close confirm_modal if it's open
        this.refs.confirm_modal.onClose();

        let {
            update,
            issuer,
            new_issuer_account_id,
            core_exchange_rate,
            flagBooleans,
            permissionBooleans,
            isBitAsset,
            bitasset_opts,
            original_bitasset_opts,
            feedProducers,
            originalFeedProducers
        } = this.state;

        let flags = assetUtils.getFlags(flagBooleans);

        // Handle incorrect flag from genesis
        if (
            this.props.asset.getIn(["options", "flags"]) & 128 &&
            !(this.props.asset.getIn(["options", "issuer_permissions"]) & 128)
        ) {
            flags += 128;
        }
        let permissions = assetUtils.getPermissions(
            permissionBooleans,
            isBitAsset
        );

        if (this.state.marketInput !== update.description.market) {
            update.description.market = "";
        }
        let description = JSON.stringify(update.description);

        let auths = {
            whitelist_authorities: this.state.whitelist_authorities,
            blacklist_authorities: this.state.blacklist_authorities,
            whitelist_markets: this.state.whitelist_markets,
            blacklist_markets: this.state.blacklist_markets
        };

        let feedProducersJS = isBitAsset ? feedProducers.toJS() : null;
        let originalFeedProducersJS = isBitAsset
            ? originalFeedProducers.toJS()
            : null;

        AssetActions.updateAsset(
            issuer,
            new_issuer_account_id,
            update,
            core_exchange_rate,
            this.props.asset,
            flags,
            permissions,
            isBitAsset,
            bitasset_opts,
            original_bitasset_opts,
            description,
            auths,
            feedProducersJS,
            originalFeedProducersJS,
            this.assetChanged()
        ).then(() => {
            console.log(
                "... AssetActions.updateAsset(account_id, update)",
                issuer,
                new_issuer_account_id,
                this.props.asset.get("id"),
                update
            );
            setTimeout(() => {
                ChainStore.getAsset(this.props.asset.get("id"));
                this.setState(this.resetState(this.props));
            }, 3000);
        });
    }

    _reset(e) {
        e.preventDefault();

        this.setState(this.resetState(this.props));
    }

    _forcePositive(number) {
        return parseFloat(number) < 0 ? "0" : number;
    }

    _onUpdateDescription(value, e) {
        let {update} = this.state;
        let updateState = true;

        switch (value) {
            case "condition":
                if (e.target.value.length > 60) {
                    updateState = false;
                    return;
                }
                update.description[value] = e.target.value;
                break;

            case "short_name":
                if (e.target.value.length > 32) {
                    updateState = false;
                    return;
                }
                update.description[value] = e.target.value;
                break;

            case "market":
                update.description[value] = e;
                break;

            case "visible":
                update.description[value] = !update.description[value];
                break;

            default:
                update.description[value] = e.target.value;
                break;
        }

        if (updateState) {
            this.forceUpdate();
            this._validateEditFields(update);
        }
    }

    onChangeBitAssetOpts(value, e) {
        let {bitasset_opts} = this.state;

        switch (value) {
            case "force_settlement_offset_percent":
            case "maximum_force_settlement_volume":
                bitasset_opts[value] =
                    parseFloat(e.target.value) *
                    assetConstants.GRAPHENE_1_PERCENT;
                break;

            case "feed_lifetime_sec":
            case "force_settlement_delay_sec":
                console.log(
                    e.target.value,
                    parseInt(parseFloat(e.target.value) * 60, 10)
                );
                bitasset_opts[value] = parseInt(
                    parseFloat(e.target.value) * 60,
                    10
                );
                break;

            case "short_backing_asset":
                bitasset_opts[value] = e;
                break;

            default:
                bitasset_opts[value] = parseInt(e.target.value, 10);
                break;
        }

        this.forceUpdate();
    }

    _onUpdateInput(value, e) {
        let {update} = this.state;
        let updateState = true;
        let precision = utils.get_asset_precision(
            this.props.asset.get("precision")
        );

        switch (value) {
            case "market_fee_percent":
                update[value] = this._forcePositive(e.target.value);
                break;

            case "max_market_fee":
                let marketFee = e.amount.replace(/,/g, "");
                if (
                    new big(marketFee)
                        .times(precision)
                        .gt(GRAPHENE_MAX_SHARE_SUPPLY)
                ) {
                    updateState = false;
                    return this.setState({
                        errors: {
                            max_market_fee:
                                "The number you tried to enter is too large"
                        }
                    });
                }
                update[value] = utils.limitByPrecision(
                    marketFee,
                    this.props.asset.get("precision")
                );
                break;

            case "max_supply":
                let maxSupply = e.amount.replace(/,/g, "");
                // try {
                //     if ((new big(maxSupply)).times(Math.pow(10, precision)).gt(GRAPHENE_MAX_SHARE_SUPPLY)) {
                //         updateState = false;
                //         return this.setState({errors: {max_supply: "The number you tried to enter is too large"}});
                //     }
                update[value] = utils.limitByPrecision(
                    maxSupply,
                    this.props.asset.get("precision")
                );
                // } catch(e) {}
                break;

            default:
                update[value] = e.target.value;
                break;
        }

        if (updateState) {
            this.setState({update: update});
            this._validateEditFields(update);
        }
    }

    _validateEditFields(new_state) {
        let cer = new_state.core_exchange_rate;
        let feedProducers = new_state.feedProducers
            ? new_state.feedProducers
            : this.state.feedProducers;
        let flagBooleans = this.state.flagBooleans;
        let {asset, core} = this.props;

        let errors = {
            max_supply: null,
            quote_asset: null,
            base_asset: null,
            max_feed_producer: null,
            conflict_producer: null,
            invalid_market_pair: null
        };

        const p = this.props.asset.get("precision");
        try {
            errors.max_supply =
                new_state.max_supply <= 0
                    ? counterpart.translate(
                          "account.user_issued_assets.max_positive"
                      )
                    : new big(parseInt(new_state.max_supply, 10))
                          .times(Math.pow(10, p))
                          .gt(GRAPHENE_MAX_SHARE_SUPPLY)
                        ? counterpart.translate(
                              "account.user_issued_assets.too_large"
                          )
                        : null;
        } catch (err) {
            console.log("err:", err);
            errors.max_supply = counterpart.translate(
                "account.user_issued_assets.too_large"
            );
        }

        if (cer) {
            if (
                cer.quote.asset_id !== asset.get("id") &&
                cer.base.asset_id !== asset.get("id")
            ) {
                errors.quote_asset = counterpart.translate(
                    "account.user_issued_assets.need_asset",
                    {name: asset.get("symbol")}
                );
            }

            if (
                cer.quote.asset_id !== core.get("id") &&
                cer.base.asset_id !== core.get("id")
            ) {
                errors.base_asset = counterpart.translate(
                    "account.user_issued_assets.need_asset",
                    {name: core.get("symbol")}
                );
            }
        }
        if (feedProducers) {
            if (feedProducers.size > this.state.maxFeedProducers) {
                errors.max_feed_producer = counterpart.translate(
                    "account.user_issued_assets.too_many_feed",
                    {max: this.state.maxFeedProducers}
                );
            }
        }
        if (
            flagBooleans.committee_fed_asset &&
            flagBooleans.witness_fed_asset
        ) {
            errors.conflict_producer = counterpart.translate(
                "account.user_issued_assets.conflict_feed"
            );
        }

        if(this.state.marketInput == this.props.asset.get("symbol")) {
            errors.invalid_market_pair = counterpart.translate(
                "account.user_issued_assets.invalid_market_pair"
            );
        }

        let isValid =
            !errors.invalid_market_pair && 
            !errors.max_supply &&
            !errors.base_asset &&
            !errors.quote_asset &&
            !errors.max_feed_producer &&
            !errors.conflict_producer;

        this.setState({isValid: isValid, errors: errors});
    }

    _onCoreRateChange(type, amount) {
        amount.amount =
            amount.amount == "" ? "0" : amount.amount.replace(/,/g, "");

        amount.amount = utils.limitByPrecision(
            amount.amount,
            type === "quote"
                ? this.props.asset.get("precision")
                : this.props.core.get("precision")
        );

        let {core_exchange_rate} = this.state;
        core_exchange_rate[type] = {
            amount: amount.amount,
            asset_id: amount.asset.get("id")
        };
        this.forceUpdate();
    }

    onAccountChanged(key, account) {
        this.setState({
            [key]: account ? account.get("id") : null
        });
    }

    onAccountNameChanged(key, name) {
        this.setState({
            [key]: name
        });
    }

    _onInputCoreAsset(type, asset) {
        if (type === "quote") {
            this.setState({
                quoteAssetInput: asset
            });
        } else if (type === "base") {
            this.setState({
                baseAssetInput: asset
            });
        }
    }

    _onFoundCoreAsset(type, asset) {
        if (asset) {
            let core_rate = this.state.core_exchange_rate;
            core_rate[type].asset_id = asset.get("id");

            this.setState({
                core_exchange_rate: core_rate
            });

            this._validateEditFields({
                max_supply: this.state.max_supply,
                core_exchange_rate: core_rate
            });
        }
    }

    _onInputMarket(asset) {
        this.setState({
            marketInput: asset
        });
    }

    _onFoundMarketAsset(asset) {
        if (asset) {
            this._onUpdateDescription("market", asset.get("symbol"));
        }
    }

    _onFlagChange(key) {
        let booleans = this.state.flagBooleans;
        booleans[key] = !booleans[key];
        this.setState({
            flagBooleans: booleans
        });
        this._validateEditFields({});
    }

    _onPermissionChange(key) {
        let booleans = this.state.permissionBooleans;
        booleans[key] = !booleans[key];
        this.setState({
            permissionBooleans: booleans
        });
    }

    _onPoolInput(asset) {
        this.setState({
            fundPoolAmount: asset.amount
        });
    }

    _onFundPool() {
        AssetActions.fundPool(
            this.state.new_funder_account,
            this.props.core,
            this.props.asset,
            this.state.fundPoolAmount.replace(/,/g, "")
        );
    }

    _onClaimInput(asset) {
        this.setState({
            claimFeesAmount: asset.amount
        });
    }

    _onClaimFees() {
        AssetActions.claimPoolFees(
            this.props.account.get("id"),
            this.props.asset,
            this.state.claimFeesAmount.replace(/,/g, "")
        );
    }

    onChangeList(key, action = "add", id) {
        let current = this.state[key];
        if (action === "add" && !current.includes(id)) {
            current = current.push(id);
        } else if (action === "remove" && current.includes(id)) {
            current = current.remove(current.indexOf(id));
        }
        this.setState({[key]: current});
    }

    onChangeFeedProducerList(action = "add", id) {
        let current = this.state.feedProducers;
        if (action === "add" && !current.includes(id)) {
            current = current.push(id);
        } else if (action === "remove" && current.includes(id)) {
            current = current.remove(current.indexOf(id));
        }
        this.setState({feedProducers: current});
        this._validateEditFields({feedProducers: current});
    }

    render() {
        let {account, asset, core} = this.props;
        let {
            errors,
            isValid,
            update,
            core_exchange_rate,
            flagBooleans,
            permissionBooleans,
            fundPoolAmount,
            claimFeesAmount,
            isBitAsset,
            bitasset_opts
        } = this.state;

        // Estimate the asset update fee
        let symbol = asset.get("symbol");
        let updateFee = "N/A";

        updateFee = <FormattedFee opType="asset_update" />;

        let cr_quote_asset = ChainStore.getAsset(
            core_exchange_rate.quote.asset_id
        );
        let precision = utils.get_asset_precision(
            cr_quote_asset.get("precision")
        );
        let cr_base_asset = ChainStore.getAsset(
            core_exchange_rate.base.asset_id
        );
        let basePrecision = utils.get_asset_precision(
            cr_base_asset.get("precision")
        );

        let cr_quote_amount =
            parseFloat(core_exchange_rate.quote.amount) * precision;
        let cr_base_amount =
            parseFloat(core_exchange_rate.base.amount) * basePrecision;
        let originalPermissions = assetUtils.getFlagBooleans(
            asset.getIn(["options", "issuer_permissions"]),
            asset.get("bitasset") !== undefined
        );
        // Loop over flags
        let flags = [];
        let getFlag = (key, onClick, isChecked) => {
            return (
                <table key={"table_" + key} className="table">
                    <tbody>
                        <tr>
                            <td style={{border: "none", width: "80%"}}>
                                <Translate
                                    content={`account.user_issued_assets.${key}`}
                                />:
                            </td>
                            <td style={{border: "none"}}>
                                <div
                                    className="switch"
                                    style={{marginBottom: "10px"}}
                                    onClick={onClick}
                                >
                                    <input
                                        type="checkbox"
                                        checked={isChecked}
                                    />
                                    <label />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            );
        };

        for (let key in originalPermissions) {
            if (originalPermissions[key] && key !== "charge_market_fee") {
                flags.push(
                    getFlag(
                        key,
                        this._onFlagChange.bind(this, key),
                        flagBooleans[key]
                    )
                );
            }
        }

        flags.push(
            getFlag(
                "visible",
                this._onUpdateDescription.bind(this, "visible"),
                update.description.visible
                    ? false
                    : update.description.visible === false ? true : false
            )
        );

        // Loop over permissions
        let permissions = [];
        for (let key in originalPermissions) {
            if (true || originalPermissions[key]) {
                permissions.push(
                    <table key={"table_" + key} className="table">
                        <tbody>
                            <tr>
                                <td style={{border: "none", width: "80%"}}>
                                    <Translate
                                        content={`account.user_issued_assets.${key}`}
                                    />:
                                </td>
                                <td style={{border: "none"}}>
                                    <div
                                        className="switch"
                                        style={{marginBottom: "10px"}}
                                        onClick={this._onPermissionChange.bind(
                                            this,
                                            key
                                        )}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={permissionBooleans[key]}
                                            onChange={() => {}}
                                        />
                                        <label />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                );
            }
        }

        let tabsChangedCount = 0;
        this.tabsChanged().forEach(function() {
            tabsChangedCount++;
        });

        let confirmButtons = (
            <div>
                <button
                    className={classnames("button", {
                        disabled: !isValid || !this.pageChanged()
                    })}
                    style={{width: "9rem"}}
                    onClick={
                        tabsChangedCount > 1
                            ? this._openConfirm.bind(this)
                            : this._updateAsset.bind(this)
                    }
                >
                    {tabsChangedCount > 1 ? (
                        <Translate content="account.perm.save_all" />
                    ) : (
                        <Translate content="account.perm.save" />
                    )}
                </button>
                <button
                    className={classnames("button primary hollow", {
                        disabled: !this.pageChanged()
                    })}
                    onClick={this._reset.bind(this)}
                >
                    <Translate content="account.perm.reset" />
                </button>
            </div>
        );

        let balance = 0;
        if (account) {
            let coreBalanceID = account.getIn(["balances", "1.3.0"]);

            if (coreBalanceID) {
                let balanceObject = ChainStore.getObject(coreBalanceID);
                if (balanceObject) {
                    balance = balanceObject.get("balance");
                }
            }
        }

        let balanceText = (
            <span>
                <Translate component="span" content="transfer.available" />:&nbsp;
                <FormattedAsset amount={balance} asset={"1.3.0"} />
            </span>
        );

        const dynamicObject = this.props.getDynamicObject(
            asset.get("dynamic_asset_data_id")
        );
        let unclaimedBalance = dynamicObject
            ? dynamicObject.get("accumulated_fees")
            : 0;
        let validClaim =
            claimFeesAmount > 0 &&
            utils.get_asset_precision(asset.get("precision")) *
                claimFeesAmount <=
                unclaimedBalance;

        let unclaimedBalanceText = (
            <span>
                <Translate component="span" content="transfer.available" />:&nbsp;
                <FormattedAsset
                    amount={unclaimedBalance}
                    asset={asset.get("id")}
                />
            </span>
        );

        let cerValid = false;

        if (
            (cr_quote_asset.get("id") === "1.3.0" ||
                cr_base_asset.get("id") === "1.3.0") &&
            (cr_quote_asset.get("id") === asset.get("id") ||
                cr_base_asset.get("id") === asset.get("id"))
        ) {
            cerValid = true;
        }

        let isPredictionMarketAsset = asset.getIn([
            "bitasset",
            "is_prediction_market"
        ]);

        let asset_description = assetUtils.parseDescription(this.props.asset.toJS().options.description);

        return (
            <div className="grid-content app-tables no-padding" ref="appTables">
                <div className="content-block small-12">
                    <div className="tabs-container generic-bordered-box">
                        <div className="tabs-header">
                            <h3>
                                <Translate content="header.update_asset" />:{" "}
                                {symbol}
                            </h3>
                        </div>
                        <Tabs
                            setting="updateAssetTab"
                            className="account-tabs"
                            tabsClass="account-overview bordered-header content-block"
                            contentClass="grid-block padding-top shrink small-vertical medium-horizontal"
                            segmented={false}
                            actionButtons={confirmButtons}
                            onChangeTab={i => {
                                this.setState({activeTab: i});
                            }}
                        >
                            <Tab
                                title="account.user_issued_assets.primary"
                                updatedTab={this.tabChanged(0)}
                            >
                                <div className="small-12 large-8 large-offset-2 grid-content">
                                    <label>
                                        <Translate content="account.user_issued_assets.precision" />
                                        <span>: {asset.get("precision")}</span>
                                    </label>
                                    <br />

                                    <label>
                                        <AmountSelector
                                            label="account.user_issued_assets.max_supply"
                                            amount={update.max_supply}
                                            onChange={this._onUpdateInput.bind(
                                                this,
                                                "max_supply"
                                            )}
                                            asset={asset.get("id")}
                                            assets={[asset.get("id")]}
                                            placeholder="0.0"
                                            tabIndex={1}
                                        />
                                    </label>
                                    {errors.max_supply ? (
                                        <p className="grid-content has-error">
                                            {errors.max_supply}
                                        </p>
                                    ) : null}

                                    <Translate
                                        component="h3"
                                        content="account.user_issued_assets.core_exchange_rate"
                                    />
                                    <label>
                                        <div className="grid-block no-margin">
                                            {cerValid ? null : (
                                                <div className="grid-block no-margin small-12 medium-6">
                                                    <AssetSelector
                                                        label="account.user_issued_assets.quote_name"
                                                        onChange={this._onInputCoreAsset.bind(
                                                            this,
                                                            "quote"
                                                        )}
                                                        asset={
                                                            this.state
                                                                .quoteAssetInput
                                                        }
                                                        assetInput={
                                                            this.state
                                                                .quoteAssetInput
                                                        }
                                                        tabIndex={1}
                                                        style={{
                                                            width: "100%",
                                                            paddingRight: "10px"
                                                        }}
                                                        onFound={this._onFoundCoreAsset.bind(
                                                            this,
                                                            "quote"
                                                        )}
                                                    />
                                                </div>
                                            )}
                                            {cerValid ? null : (
                                                <div className="grid-block no-margin small-12 medium-6">
                                                    <AssetSelector
                                                        label="account.user_issued_assets.base_name"
                                                        onChange={this._onInputCoreAsset.bind(
                                                            this,
                                                            "base"
                                                        )}
                                                        asset={
                                                            this.state
                                                                .baseAssetInput
                                                        }
                                                        assetInput={
                                                            this.state
                                                                .baseAssetInput
                                                        }
                                                        tabIndex={1}
                                                        style={{
                                                            width: "100%",
                                                            paddingLeft: "10px"
                                                        }}
                                                        onFound={this._onFoundCoreAsset.bind(
                                                            this,
                                                            "base"
                                                        )}
                                                    />
                                                </div>
                                            )}
                                            {errors.quote_asset ? (
                                                <p className="grid-content has-error">
                                                    {errors.quote_asset}
                                                </p>
                                            ) : null}
                                            {errors.base_asset ? (
                                                <p className="grid-content has-error">
                                                    {errors.base_asset}
                                                </p>
                                            ) : null}
                                            <div className="grid-block no-margin small-12 medium-6">
                                                <AmountSelector
                                                    label="account.user_issued_assets.quote"
                                                    amount={
                                                        core_exchange_rate.quote
                                                            .amount
                                                    }
                                                    onChange={this._onCoreRateChange.bind(
                                                        this,
                                                        "quote"
                                                    )}
                                                    asset={
                                                        core_exchange_rate.quote
                                                            .asset_id
                                                    }
                                                    assets={[
                                                        core_exchange_rate.quote
                                                            .asset_id
                                                    ]}
                                                    placeholder="0.0"
                                                    tabIndex={1}
                                                    style={{
                                                        width: "100%",
                                                        paddingRight: "10px"
                                                    }}
                                                />
                                            </div>
                                            <div className="grid-block no-margin small-12 medium-6">
                                                <AmountSelector
                                                    label="account.user_issued_assets.base"
                                                    amount={
                                                        core_exchange_rate.base
                                                            .amount
                                                    }
                                                    onChange={this._onCoreRateChange.bind(
                                                        this,
                                                        "base"
                                                    )}
                                                    asset={
                                                        core_exchange_rate.base
                                                            .asset_id
                                                    }
                                                    assets={[
                                                        core_exchange_rate.base
                                                            .asset_id
                                                    ]}
                                                    placeholder="0.0"
                                                    tabIndex={1}
                                                    style={{
                                                        width: "100%",
                                                        paddingLeft: "10px"
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <h5>
                                                <Translate content="exchange.price" />:{" "}
                                                <FormattedPrice
                                                    style={{fontWeight: "bold"}}
                                                    quote_amount={
                                                        cr_quote_amount
                                                    }
                                                    quote_asset={
                                                        core_exchange_rate.quote
                                                            .asset_id
                                                    }
                                                    base_asset={
                                                        core_exchange_rate.base
                                                            .asset_id
                                                    }
                                                    base_amount={cr_base_amount}
                                                />
                                            </h5>
                                        </div>
                                    </label>
                                    <div>
                                        <Translate
                                            content="account.user_issued_assets.cer_warning_1"
                                            component="label"
                                            className="has-error"
                                        />
                                        <Translate
                                            content="account.user_issued_assets.cer_warning_2"
                                            component="p"
                                        />
                                    </div>

                                    {
                                        <p>
                                            <Translate content="account.user_issued_assets.approx_fee" />:{" "}
                                            {updateFee}
                                        </p>
                                    }
                                </div>
                            </Tab>

                            <Tab
                                title="account.whitelist.title"
                                updatedTab={this.tabChanged(1)}
                            >
                                <AssetWhitelist
                                    whiteListEnabled={
                                        flagBooleans["white_list"]
                                    }
                                    whitelist_authorities={
                                        this.state.whitelist_authorities
                                    }
                                    blacklist_authorities={
                                        this.state.blacklist_authorities
                                    }
                                    whitelist_markets={
                                        this.state.whitelist_markets
                                    }
                                    blacklist_markets={
                                        this.state.blacklist_markets
                                    }
                                    new_authority_id={
                                        this.state.new_authority_id
                                    }
                                    authority_name={this.state.authority_name}
                                    onAccountNameChanged={this.onAccountNameChanged.bind(
                                        this
                                    )}
                                    onAccountChanged={this.onAccountChanged.bind(
                                        this
                                    )}
                                    onChangeList={this.onChangeList.bind(this)}
                                >
                                    {
                                        <p>
                                            <Translate content="account.user_issued_assets.approx_fee" />:{" "}
                                            {updateFee}
                                        </p>
                                    }
                                </AssetWhitelist>
                            </Tab>

                            <Tab
                                title="account.user_issued_assets.description"
                                updatedTab={this.tabChanged(2)}
                            >
                                <div className="small-12 large-8 large-offset-2 grid-content">
                                    <label>
                                        <textarea
                                            style={{height: "7rem"}}
                                            rows="1"
                                            value={
                                                update.description.main || ""
                                            }
                                            onChange={this._onUpdateDescription.bind(
                                                this,
                                                "main"
                                            )}
                                        />
                                    </label>

                                    <Translate
                                        component="h3"
                                        content="account.user_issued_assets.short"
                                    />
                                    <label>
                                        <input
                                            type="text"
                                            rows="1"
                                            value={
                                                update.description.short_name ||
                                                ""
                                            }
                                            onChange={this._onUpdateDescription.bind(
                                                this,
                                                "short_name"
                                            )}
                                        />
                                    </label>

                                    <Translate
                                        component="h3"
                                        content="account.user_issued_assets.market"
                                    />
                                    <AssetSelector
                                        label="account.user_issued_assets.name"
                                        onChange={this._onInputMarket.bind(
                                            this
                                        )}
                                        placeholder={asset_description.market}
                                        asset={this.state.marketInput}
                                        assetInput={this.state.marketInput}
                                        style={{
                                            width: "100%",
                                            paddingRight: "10px",
                                            paddingBottom: "20px"
                                        }}
                                        onFound={this._onFoundMarketAsset.bind(
                                            this
                                        )}
                                    />
                                    {errors.invalid_market_pair ? (
                                        <p className="grid-content has-error">
                                            {errors.invalid_market_pair}
                                        </p>
                                    ) : null}

                                    {isPredictionMarketAsset ? (
                                        <div>
                                            <Translate
                                                component="h3"
                                                content="account.user_issued_assets.condition"
                                            />
                                            <label>
                                                <input
                                                    type="text"
                                                    rows="1"
                                                    value={
                                                        update.description
                                                            .condition
                                                    }
                                                    onChange={this._onUpdateDescription.bind(
                                                        this,
                                                        "condition"
                                                    )}
                                                />
                                            </label>

                                            <Translate
                                                component="h3"
                                                content="account.user_issued_assets.expiry"
                                            />
                                            <label>
                                                <input
                                                    type="date"
                                                    value={
                                                        update.description
                                                            .expiry
                                                    }
                                                    onChange={this._onUpdateDescription.bind(
                                                        this,
                                                        "expiry"
                                                    )}
                                                />
                                            </label>
                                        </div>
                                    ) : null}

                                    {
                                        <p>
                                            <Translate content="account.user_issued_assets.approx_fee" />:{" "}
                                            {updateFee}
                                        </p>
                                    }
                                </div>
                            </Tab>

                            {isBitAsset ? (
                                <Tab
                                    title="account.user_issued_assets.bitasset_opts"
                                    updatedTab={this.tabChanged(3)}
                                >
                                    <div className="small-12 large-8 large-offset-2 grid-content">
                                        <BitAssetOptions
                                            bitasset_opts={bitasset_opts}
                                            onUpdate={this.onChangeBitAssetOpts.bind(
                                                this
                                            )}
                                            backingAsset={
                                                bitasset_opts.short_backing_asset
                                            }
                                            assetPrecision={asset.get(
                                                "precision"
                                            )}
                                            assetSymbol={asset.get("symbol")}
                                        />
                                        {
                                            <p>
                                                <Translate content="account.user_issued_assets.approx_fee" />:{" "}
                                                {updateFee}
                                            </p>
                                        }
                                    </div>
                                </Tab>
                            ) : null}

                            <Tab
                                title="account.user_issued_assets.update_owner"
                                updatedTab={this.tabChanged(4)}
                            >
                                <div className="small-12 large-8 large-offset-2 grid-content">
                                    <div style={{paddingBottom: "1rem"}}>
                                        <AccountSelector
                                            label="account.user_issued_assets.current_issuer"
                                            accountName={account.get("name")}
                                            account={account.get("name")}
                                            error={null}
                                            tabIndex={1}
                                            disabled={true}
                                        />
                                    </div>
                                    <AccountSelector
                                        label="account.user_issued_assets.new_issuer"
                                        accountName={
                                            this.state.issuer_account_name
                                        }
                                        onChange={this.onAccountNameChanged.bind(
                                            this,
                                            "issuer_account_name"
                                        )}
                                        onAccountChanged={this.onAccountChanged.bind(
                                            this,
                                            "new_issuer_account_id"
                                        )}
                                        account={this.state.issuer_account_name}
                                        error={null}
                                        tabIndex={1}
                                        typeahead={true}
                                    />
                                    {
                                        <p>
                                            <Translate content="account.user_issued_assets.approx_fee" />:{" "}
                                            {updateFee}
                                        </p>
                                    }
                                </div>
                            </Tab>

                            <Tab
                                title="account.permissions"
                                updatedTab={this.tabChanged(5)}
                            >
                                <div className="small-12 large-8 large-offset-2 grid-content">
                                    <HelpContent
                                        path={"components/AccountAssetCreate"}
                                        section="permissions"
                                    />
                                    <p className="grid-content has-error">
                                        <Translate content="account.user_issued_assets.perm_warning" />
                                    </p>
                                    {permissions}
                                    {
                                        <p>
                                            <Translate content="account.user_issued_assets.approx_fee" />:{" "}
                                            {updateFee}
                                        </p>
                                    }
                                </div>
                            </Tab>

                            <Tab
                                title="account.user_issued_assets.flags"
                                updatedTab={this.tabChanged(6)}
                            >
                                <div className="small-12 large-8 large-offset-2 grid-content">
                                    <HelpContent
                                        path={"components/AccountAssetCreate"}
                                        section="flags"
                                    />
                                    {originalPermissions[
                                        "charge_market_fee"
                                    ] ? (
                                        <div>
                                            <Translate
                                                component="h3"
                                                content="account.user_issued_assets.market_fee"
                                            />
                                            <table className="table">
                                                <tbody>
                                                    <tr>
                                                        <td
                                                            style={{
                                                                border: "none",
                                                                width: "80%"
                                                            }}
                                                        >
                                                            <Translate content="account.user_issued_assets.charge_market_fee" />:
                                                        </td>
                                                        <td
                                                            style={{
                                                                border: "none"
                                                            }}
                                                        >
                                                            <div
                                                                className="switch"
                                                                style={{
                                                                    marginBottom:
                                                                        "10px"
                                                                }}
                                                                onClick={this._onFlagChange.bind(
                                                                    this,
                                                                    "charge_market_fee"
                                                                )}
                                                            >
                                                                <input
                                                                    type="checkbox"
                                                                    onChange={() => {}}
                                                                    checked={
                                                                        flagBooleans.charge_market_fee
                                                                    }
                                                                />
                                                                <label />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            <div
                                                className={cnames({
                                                    disabled: !flagBooleans.charge_market_fee
                                                })}
                                            >
                                                <label>
                                                    <Translate content="account.user_issued_assets.market_fee" />{" "}
                                                    (%)
                                                    <input
                                                        type="number"
                                                        value={
                                                            update.market_fee_percent
                                                        }
                                                        onChange={this._onUpdateInput.bind(
                                                            this,
                                                            "market_fee_percent"
                                                        )}
                                                    />
                                                </label>

                                                <label>
                                                    <AmountSelector
                                                        label="account.user_issued_assets.max_market_fee"
                                                        amount={
                                                            update.max_market_fee
                                                        }
                                                        onChange={this._onUpdateInput.bind(
                                                            this,
                                                            "max_market_fee"
                                                        )}
                                                        asset={asset.get("id")}
                                                        assets={[
                                                            asset.get("id")
                                                        ]}
                                                        placeholder="0.0"
                                                        tabIndex={1}
                                                    />
                                                </label>
                                                {errors.max_market_fee ? (
                                                    <p className="grid-content has-error">
                                                        {errors.max_market_fee}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    ) : null}

                                    <h3>
                                        <Translate content="account.user_issued_assets.flags" />
                                    </h3>
                                    {flags}
                                    {
                                        <p>
                                            <Translate content="account.user_issued_assets.approx_fee" />:{" "}
                                            {updateFee}
                                        </p>
                                    }
                                    {errors.conflict_producer ? (
                                        <p className="grid-content has-error">
                                            {errors.conflict_producer}
                                        </p>
                                    ) : null}
                                </div>
                            </Tab>

                            <Tab title="explorer.asset.fee_pool.title">
                                <div className="small-12 large-8 large-offset-2 grid-content">
                                    {/* Fund fee pool */}
                                    <Translate
                                        component="p"
                                        content="explorer.asset.fee_pool.fund_text"
                                        asset={asset.get("symbol")}
                                        core={core.get("symbol")}
                                    />

                                    <div style={{paddingBottom: "1.5rem"}}>
                                        <Translate content="explorer.asset.fee_pool.pool_balance" />
                                        <span>: </span>
                                        {dynamicObject ? (
                                            <FormattedAsset
                                                amount={dynamicObject.get(
                                                    "fee_pool"
                                                )}
                                                asset={"1.3.0"}
                                            />
                                        ) : null}
                                    </div>

                                    <AccountSelector
                                        label="transaction.funding_account"
                                        accountName={
                                            this.state.funder_account_name
                                        }
                                        onChange={this.onAccountNameChanged.bind(
                                            this,
                                            "funder_account_name"
                                        )}
                                        onAccountChanged={this.onAccountChanged.bind(
                                            this,
                                            "new_funder_account"
                                        )}
                                        account={this.state.funder_account_name}
                                        error={null}
                                        tabIndex={1}
                                    />

                                    <AmountSelector
                                        label="transfer.amount"
                                        display_balance={balanceText}
                                        amount={fundPoolAmount}
                                        onChange={this._onPoolInput.bind(this)}
                                        asset={"1.3.0"}
                                        assets={["1.3.0"]}
                                        placeholder="0.0"
                                        tabIndex={2}
                                        style={{width: "100%", paddingTop: 16}}
                                    />

                                    <div style={{paddingTop: "1rem"}}>
                                        <button
                                            className={classnames("button", {
                                                disabled: fundPoolAmount <= 0
                                            })}
                                            onClick={this._onFundPool.bind(
                                                this
                                            )}
                                        >
                                            <Translate content="transaction.trxTypes.asset_fund_fee_pool" />
                                        </button>
                                        <button
                                            className="button outline"
                                            onClick={this._reset.bind(this)}
                                        >
                                            <Translate content="account.perm.reset" />
                                        </button>
                                        <br />
                                        <br />
                                        <p>
                                            <Translate content="account.user_issued_assets.approx_fee" />:{" "}
                                            <FormattedFee opType="asset_fund_fee_pool" />
                                        </p>
                                        <hr />
                                    </div>

                                    {/* Claim fees, disabled until witness node update gets pushed to openledger*/}

                                    <Translate
                                        component="h3"
                                        content="transaction.trxTypes.asset_claim_fees"
                                    />
                                    <Translate
                                        component="p"
                                        content="explorer.asset.fee_pool.claim_text"
                                        asset={asset.get("symbol")}
                                    />
                                    <div style={{paddingBottom: "1rem"}}>
                                        <Translate content="explorer.asset.fee_pool.unclaimed_issuer_income" />:&nbsp;
                                        {dynamicObject ? (
                                            <FormattedAsset
                                                amount={dynamicObject.get(
                                                    "accumulated_fees"
                                                )}
                                                asset={asset.get("id")}
                                            />
                                        ) : null}
                                    </div>

                                    <AmountSelector
                                        label="transfer.amount"
                                        display_balance={unclaimedBalanceText}
                                        amount={claimFeesAmount}
                                        onChange={this._onClaimInput.bind(this)}
                                        asset={asset.get("id")}
                                        assets={[asset.get("id")]}
                                        placeholder="0.0"
                                        tabIndex={1}
                                        style={{width: "100%", paddingTop: 16}}
                                    />

                                    <div style={{paddingTop: "1rem"}}>
                                        <button
                                            className={classnames("button", {
                                                disabled: !validClaim
                                            })}
                                            onClick={this._onClaimFees.bind(
                                                this
                                            )}
                                        >
                                            <Translate content="explorer.asset.fee_pool.claim_fees" />
                                        </button>
                                        <button
                                            className="button outline"
                                            onClick={this._reset.bind(this)}
                                        >
                                            <Translate content="account.perm.reset" />
                                        </button>
                                    </div>
                                </div>
                            </Tab>

                            {isBitAsset ? (
                                <Tab
                                    title="account.user_issued_assets.feed_producers"
                                    updatedTab={this.tabChanged(8)}
                                >
                                    <AssetFeedProducers
                                        asset={this.props.asset}
                                        account={this.props.account}
                                        witnessFed={
                                            flagBooleans["witness_fed_asset"]
                                        }
                                        committeeFed={
                                            flagBooleans["committee_fed_asset"]
                                        }
                                        producers={this.state.feedProducers}
                                        onChangeList={this.onChangeFeedProducerList.bind(
                                            this
                                        )}
                                    />
                                    {errors.max_feed_producer ? (
                                        <p
                                            className="grid-content has-error large-8 large-offset-2"
                                            style={{marginTop: "20px"}}
                                        >
                                            {errors.max_feed_producer}
                                        </p>
                                    ) : null}
                                </Tab>
                            ) : null}
                        </Tabs>
                    </div>
                </div>
                {/* Confirmation Modal on Multiple Changes */}
                <ConfirmModal
                    modalId="asset_update_modal"
                    ref="confirm_modal"
                    tabsChanged={this.tabsChanged()}
                    _cancelConfirm={this._cancelConfirm.bind(this)}
                    _updateAsset={this._updateAsset.bind(this)}
                    {...this.props}
                />
            </div>
        );
    }
}
AccountAssetUpdate = BindToChainState(AccountAssetUpdate);
AccountAssetUpdate = AssetWrapper(AccountAssetUpdate, {
    propNames: ["asset", "core"],
    defaultProps: {
        core: "1.3.0"
    },
    withDynamic: true
});

class ConfirmModal extends React.Component {
    constructor() {
        super();
        this.state = {open: false};
    }

    show() {
        this.setState({open: true}, () => {
            ZfApi.publish(this.props.modalId, "open");
        });
    }

    onClose() {
        this.setState({open: false});
    }

    render() {
        let {tabsChanged} = this.props;

        return !this.state.open ? null : (
            <BaseModal
                id={this.props.modalId}
                overlay={true}
                modalHeader="account.confirm_asset_modal.header"
                noLoggo
            >
                <Translate
                    content="account.confirm_asset_modal.are_you_sure"
                    component="div"
                    style={{paddingBottom: "1rem"}}
                />
                <div>
                    <ul>
                        {tabsChanged["0"] ? (
                            <li>
                                <Translate content="account.user_issued_assets.primary" />
                            </li>
                        ) : null}
                        {tabsChanged["1"] ? (
                            <li>
                                <Translate content="account.whitelist.title" />
                            </li>
                        ) : null}
                        {tabsChanged["2"] ? (
                            <li>
                                <Translate content="account.user_issued_assets.description" />
                            </li>
                        ) : null}
                        {tabsChanged["3"] ? (
                            <li>
                                <Translate content="account.user_issued_assets.bitasset_opts" />
                            </li>
                        ) : null}
                        {tabsChanged["4"] ? (
                            <li>
                                <Translate content="account.user_issued_assets.update_owner" />
                            </li>
                        ) : null}
                        {tabsChanged["5"] ? (
                            <li>
                                <Translate content="account.permissions" />
                            </li>
                        ) : null}
                        {tabsChanged["6"] ? (
                            <li>
                                <Translate content="account.user_issued_assets.flags" />
                            </li>
                        ) : null}

                        {/* NEEDS CHECKING */}
                        {tabsChanged["8"] ? (
                            <li>
                                <Translate content="account.user_issued_assets.feed_producers" />
                            </li>
                        ) : null}
                    </ul>
                </div>
                <div>
                    <button
                        className="button primary"
                        onClick={this.props._updateAsset.bind(this)}
                    >
                        <Translate content="global.confirm" />
                    </button>
                    <button
                        className="button primary hollow"
                        onClick={this.props._cancelConfirm.bind(this)}
                    >
                        <Translate content="global.cancel" />
                    </button>
                </div>
            </BaseModal>
        );
    }
}

class AssetUpdateWrapper extends React.Component {
    render() {
        let asset = this.props.params.asset;
        return <AccountAssetUpdate asset={asset} {...this.props} />;
    }
}

export default AssetUpdateWrapper;
