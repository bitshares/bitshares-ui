import React from "react";
import Translate from "react-translate-component";
import classnames from "classnames";
import AssetActions from "actions/AssetActions";
import HelpContent from "../Utility/HelpContent";
import utils from "common/utils";
import {ChainStore, ChainValidation} from "bitsharesjs/es";
import FormattedAsset from "../Utility/FormattedAsset";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import AssetSelector from "../Utility/AssetSelector";
import big from "bignumber.js";
import cnames from "classnames";
import assetUtils from "common/asset_utils";
import {Tabs, Tab} from "../Utility/Tabs";
import AmountSelector from "../Utility/AmountSelector";
import assetConstants from "chain/asset_constants";

let MAX_SAFE_INT = new big("9007199254740991");

class BitAssetOptions extends React.Component {

    static propTypes = {
        backingAsset: ChainTypes.ChainAsset.isRequired,
        isUpdate: React.PropTypes.bool
    };

    static defaultProps = {
        isUpdate: false
    };

    constructor(props) {
        super(props);
        this.state = {
            backingAsset: props.backingAsset.get("symbol"),
            error: null
        };
    }

    _onInputBackingAsset(asset) {
        this.setState({
            backingAsset: asset.toUpperCase(),
            error: null
        });
    }

    _onFoundBackingAsset(asset) {
        if (asset) {
            if (asset.get("id") === "1.3.0" || (asset.get("bitasset_data_id") && !asset.getIn(["bitasset", "is_prediction_market"]))) {
                if (asset.get("precision") !== parseInt(this.props.assetPrecision, 10)) {
                    this.setState({
                        error: counterpart.translate("account.user_issued_assets.error_precision", {asset: this.props.assetSymbol})
                    });
                } else {
                    this.props.onUpdate("short_backing_asset", asset.get("id"));
                }
            } else {
                this.setState({
                    error: counterpart.translate("account.user_issued_assets.error_invalid")
                });
            }
        }
    }

    render() {
        let {bitasset_opts} = this.props;
        let {error} = this.state;

        return (
            <div>
                <label><Translate content="account.user_issued_assets.feed_lifetime_sec" />
                    <input type="number" value={bitasset_opts.feed_lifetime_sec / 60} onChange={this.props.onUpdate.bind(this, "feed_lifetime_sec")}/>
                </label>

                <label><Translate content="account.user_issued_assets.minimum_feeds" />
                    <input type="number" value={bitasset_opts.minimum_feeds} onChange={this.props.onUpdate.bind(this, "minimum_feeds")}/>
                </label>

                <label><Translate content="account.user_issued_assets.force_settlement_delay_sec" />
                    <input type="number" value={bitasset_opts.force_settlement_delay_sec / 60} onChange={this.props.onUpdate.bind(this, "force_settlement_delay_sec")}/>
                </label>

                <label><Translate content="account.user_issued_assets.force_settlement_offset_percent" />
                    <input type="number" value={bitasset_opts.force_settlement_offset_percent / assetConstants.GRAPHENE_1_PERCENT} onChange={this.props.onUpdate.bind(this, "force_settlement_offset_percent")}/>
                </label>

                <label><Translate content="account.user_issued_assets.maximum_force_settlement_volume" />
                    <input type="number" value={bitasset_opts.maximum_force_settlement_volume / assetConstants.GRAPHENE_1_PERCENT} onChange={this.props.onUpdate.bind(this, "maximum_force_settlement_volume")}/>
                </label>

                <div className="grid-block no-margin small-12">
                    <AssetSelector
                        label="account.user_issued_assets.backing"
                        onChange={this._onInputBackingAsset.bind(this)}
                        asset={this.state.backingAsset}
                        assetInput={this.state.backingAsset}
                        tabIndex={1}
                        style={{width: "100%", paddingRight: "10px"}}
                        onFound={this._onFoundBackingAsset.bind(this)}
                    />
                    {error ? <div className="content-block has-error">{error}</div> : null}
                </div>
            </div>
        );
    }
}
BitAssetOptions = BindToChainState(BitAssetOptions);

class AccountAssetCreate extends React.Component {

    static propTypes = {
        core: ChainTypes.ChainAsset.isRequired,
        globalObject: ChainTypes.ChainObject.isRequired
    };

    static defaultProps = {
        globalObject: "2.0.0",
        core: "1.3.0"
    }

    constructor(props) {
        super(props);

        this.state = this.resetState(props);
    }

    resetState(props) {
        // let asset = props.asset.toJS();
        let isBitAsset = false;
        let precision = utils.get_asset_precision(4);
        let corePrecision = utils.get_asset_precision(props.core.get("precision"));

        let {flagBooleans, permissionBooleans} = this._getPermissions({isBitAsset});

        // let flags = assetUtils.getFlags(flagBooleans);
        // let permissions = assetUtils.getPermissions(permissionBooleans, isBitAsset);
        // console.log("all permissions:", permissionBooleans, permissions)

        let coreRateBaseAssetName = ChainStore.getAsset("1.3.0").get("symbol");

        return {

            update: {
                symbol: "",
                precision: 4,
                max_supply: 100000,
                max_market_fee: 0,
                market_fee_percent: 0,
                description: {main: ""}
            },
            errors: {
                max_supply: null
            },
            isValid: true,
            flagBooleans: flagBooleans,
            permissionBooleans: permissionBooleans,
            isBitAsset: isBitAsset,
            is_prediction_market: false,
            core_exchange_rate: {
                quote: {
                    asset_id: null,
                    amount: 1
                },
                base: {
                    asset_id: "1.3.0",
                    amount: 1
                }
            },
            bitasset_opts: {
                "feed_lifetime_sec" : 60 * 60 * 24,
                "minimum_feeds" : 7,
                "force_settlement_delay_sec" : 60 * 60 * 24,
                "force_settlement_offset_percent" : 1 * assetConstants.GRAPHENE_1_PERCENT,
                "maximum_force_settlement_volume" : 20 * assetConstants.GRAPHENE_1_PERCENT,
                "short_backing_asset" : "1.3.0"
            },
            marketInput: ""
        };
    }

    _getPermissions(state) {
        let flagBooleans = assetUtils.getFlagBooleans(0, state.isBitAsset);
        let permissionBooleans = assetUtils.getFlagBooleans("all", state.isBitAsset);

        return {
            flagBooleans,
            permissionBooleans
        }
    }

    _createAsset(e) {
        e.preventDefault();
        let {update, flagBooleans, permissionBooleans, core_exchange_rate,
            isBitAsset, is_prediction_market, bitasset_opts} = this.state;

        let {account} = this.props;

        let flags = assetUtils.getFlags(flagBooleans, isBitAsset);
        let permissions = assetUtils.getPermissions(permissionBooleans, isBitAsset);

        if (this.state.marketInput !== update.description.market) {
            update.description.market = "";
        }
        let description = JSON.stringify(update.description);

        AssetActions.createAsset(account.get("id"), update, flags, permissions, core_exchange_rate, isBitAsset, is_prediction_market, bitasset_opts, description).then(result => {
            console.log("... AssetActions.createAsset(account_id, update)", account.get("id"),  update, flags, permissions)
        });
    }

    _hasChanged() {
        return !utils.are_equal_shallow(this.state, this.resetState(this.props));
    }

    _reset(e) {
        e.preventDefault();

        this.setState(
            this.resetState(this.props)
        );
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
                bitasset_opts[value] = parseFloat(e.target.value) * assetConstants.GRAPHENE_1_PERCENT;
                break;

            case "feed_lifetime_sec":
            case "force_settlement_delay_sec":
                console.log(e.target.value, parseInt(parseFloat(e.target.value) * 60, 10));
                bitasset_opts[value] = parseInt(parseFloat(e.target.value) * 60, 10);
                break;

            case "short_backing_asset":
                bitasset_opts[value] = e;
                break;

            default:
                bitasset_opts[value] = e.target.value;
                break;
        }

        this.forceUpdate();
    }

    _onUpdateInput(value, e) {
        let {update} = this.state;
        let updateState = true;
        let precision = utils.get_asset_precision(this.state.update.precision);

        switch (value) {
            case "market_fee_percent":
                update[value] = this._forcePositive(e.target.value);
                break;

            case "max_market_fee":
                if ((new big(e.target.value)).times(precision).gt(MAX_SAFE_INT)) {
                    return this.setState({errors: {max_market_fee: "The number you tried to enter is too large"}});
                }
                e.target.value = utils.limitByPrecision(e.target.value, this.state.update.precision);
                update[value] = e.target.value;
                break;

            case "precision":
                // Enforce positive number
                update[value] = this._forcePositive(e.target.value);
                break;

            case "max_supply":
                if ((new big(e.target.value)).times(precision).gt(MAX_SAFE_INT)) {
                    return this.setState({errors: {max_supply: "The number you tried to enter is too large"}});
                }
                e.target.value = utils.limitByPrecision(e.target.value, this.state.update.precision);
                update[value] = e.target.value;
                break;

            case "symbol":
                // Enforce uppercase
                e.target.value = e.target.value.toUpperCase();
                // Enforce characters
                let regexp = new RegExp("^[\.A-Z]+$");
                if (e.target.value !== "" && !regexp.test(e.target.value)) {
                    break;
                }
                ChainStore.getAsset(e.target.value);
                update[value] = this._forcePositive(e.target.value);
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

    _validateEditFields( new_state ) {
        let {core} = this.props;

        let errors = {
            max_supply: null
        };

        errors.symbol = ChainValidation.is_valid_symbol_error(new_state.symbol);
        let existingAsset = ChainStore.getAsset(new_state.symbol);
        if (existingAsset) {
            errors.symbol = counterpart.translate("account.user_issued_assets.exists");
        }

        errors.max_supply = new_state.max_supply <= 0 ? counterpart.translate("account.user_issued_assets.max_positive") : null;

        let isValid = !errors.symbol && !errors.max_supply;

        this.setState({isValid: isValid, errors: errors});
    }

    _onFlagChange(key) {
        let booleans = this.state.flagBooleans;
        booleans[key] = !booleans[key];
        this.setState({
            flagBooleans: booleans
        });
    }

    _onPermissionChange(key) {
        let booleans = this.state.permissionBooleans;
        booleans[key] = !booleans[key];
        this.setState({
            permissionBooleans: booleans
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

    _onCoreRateChange(type, e) {
        let amount, asset;
        if (type === "quote") {
            amount = utils.limitByPrecision(e.target.value, this.state.update.precision);
            asset = null;
        } else {
            if (!e || !("amount" in e)) {
                return;
            }
            amount = e.amount == "" ? "0" : utils.limitByPrecision(e.amount.toString().replace(/,/g, ""), this.props.core.get("precision"));
            asset = e.asset.get("id");
        }

        let {core_exchange_rate} = this.state;
        core_exchange_rate[type] = {
            amount: amount,
            asset_id: asset
        };
        this.forceUpdate();
    }

    _onToggleBitAsset() {
        let {update} = this.state;
        this.state.isBitAsset = !this.state.isBitAsset;
        if (!this.state.isBitAsset) {
            this.state.is_prediction_market = false;
        }

        let {flagBooleans, permissionBooleans} = this._getPermissions(this.state);
        this.state.flagBooleans = flagBooleans;
        this.state.permissionBooleans = permissionBooleans;

        this.forceUpdate();
    }

    _onTogglePM() {
        this.state.is_prediction_market = !this.state.is_prediction_market;
        this.state.update.precision = this.props.core.get("precision");
        this.state.core_exchange_rate.base.asset_id = this.props.core.get("id");
        this.forceUpdate();
    }

    render() {
        let {globalObject, core} = this.props;
        let {errors, isValid, update, flagBooleans, permissionBooleans,
            core_exchange_rate, is_prediction_market, isBitAsset, bitasset_opts} = this.state;

        // Estimate the asset creation fee from the symbol character length
        let symbolLength = update.symbol.length, createFee = "N/A";

        if(symbolLength === 3) {
            createFee = <FormattedAsset amount={utils.estimateFee("asset_create", ["symbol3"], globalObject)} asset={"1.3.0"} />;
        }
        else if(symbolLength === 4) {
            createFee = <FormattedAsset amount={utils.estimateFee("asset_create", ["symbol4"], globalObject)} asset={"1.3.0"} />;
        }
        else if(symbolLength > 4) {
            createFee = <FormattedAsset amount={utils.estimateFee("asset_create", ["long_symbol"], globalObject)} asset={"1.3.0"} />;
        }

        // Loop over flags
        let flags = [];
        for (let key in permissionBooleans) {
            if (permissionBooleans[key] && key !== "charge_market_fee") {
                flags.push(
                    <table key={"table_" + key} className="table">
                        <tbody>
                            <tr>
                                <td style={{border: "none", width: "80%"}}><Translate content={`account.user_issued_assets.${key}`} />:</td>
                                <td style={{border: "none"}}>
                                    <div className="switch" style={{marginBottom: "10px"}} onClick={this._onFlagChange.bind(this, key)}>
                                        <input type="checkbox" checked={flagBooleans[key]} />
                                        <label />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )
            }
        }

        // Loop over permissions
        let permissions = [];
        for (let key in permissionBooleans) {
                permissions.push(
                    <table key={"table_" + key} className="table">
                        <tbody>
                            <tr>
                                <td style={{border: "none", width: "80%"}}><Translate content={`account.user_issued_assets.${key}`} />:</td>
                                <td style={{border: "none"}}>
                                    <div className="switch" style={{marginBottom: "10px"}} onClick={this._onPermissionChange.bind(this, key)}>
                                        <input type="checkbox" checked={permissionBooleans[key]} onChange={() => {}}/>
                                        <label />
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                )
        }

        return (
            <div className="grid-block">
                <div className="grid-content">
                    <h3><Translate content="header.create_asset" /></h3>
                    <Tabs setting="createAssetTab" style={{maxWidth: "800px"}} contentClass="grid-block shrink small-vertical medium-horizontal">

                        <Tab title="account.user_issued_assets.primary">
                            <div className="small-12 grid-content">
                                <h3><Translate content="account.user_issued_assets.primary" /></h3>
                                <label><Translate content="account.user_issued_assets.symbol" />
                                    <input type="text" value={update.symbol} onChange={this._onUpdateInput.bind(this, "symbol")}/>
                                </label>
                                { errors.symbol ? <p className="grid-content has-error">{errors.symbol}</p> : null}


                                <label><Translate content="account.user_issued_assets.max_supply" /> {update.symbol ? <span>({update.symbol})</span> : null}
                                    <input type="number" value={update.max_supply} onChange={this._onUpdateInput.bind(this, "max_supply")} />
                                </label>
                                { errors.max_supply ? <p className="grid-content has-error">{errors.max_supply}</p> : null}

                                <label>
                                    <Translate content="account.user_issued_assets.decimals" />
                                    <input min="0" max="8" step="1" type="range" value={update.precision} onChange={this._onUpdateInput.bind(this, "precision")} />
                                </label>
                                <p>{update.precision}</p>

                                <div style={{marginBottom: 10}} className="txtlabel cancel"><Translate content="account.user_issued_assets.precision_warning" /></div>

                                <table className="table" style={{width: "inherit"}}>
                                    <tbody>
                                        <tr>
                                            <td style={{border: "none"}}><Translate content={"account.user_issued_assets.mpa"} />:</td>
                                            <td style={{border: "none"}}>
                                                <div className="switch" style={{marginBottom: "10px"}} onClick={this._onToggleBitAsset.bind(this)}>
                                                    <input type="checkbox" checked={isBitAsset} />
                                                    <label />
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>

                                {isBitAsset ? (
                                <table className="table" style={{width: "inherit"}}>
                                    <tbody>
                                        <tr>
                                            <td style={{border: "none"}}><Translate content={"account.user_issued_assets.pm"} />:</td>
                                            <td style={{border: "none"}}>
                                                <div className="switch" style={{marginBottom: "10px"}} onClick={this._onTogglePM.bind(this)}>
                                                    <input type="checkbox" checked={is_prediction_market} />
                                                    <label />
                                                </div>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>) : null}

                                {/* CER */}
                                <Translate component="h3" content="account.user_issued_assets.core_exchange_rate" />

                                <label>
                                    <div className="grid-block no-margin">
                                        {errors.quote_asset ? <p className="grid-content has-error">{errors.quote_asset}</p> : null}
                                        {errors.base_asset ? <p className="grid-content has-error">{errors.base_asset}</p> : null}
                                        <div className="grid-block no-margin small-12 medium-6">
                                            <div className="amount-selector" style={{width: "100%", paddingRight: "10px"}}>
                                                <Translate component="label" content="account.user_issued_assets.quote"/>
                                                <div className="inline-label">
                                                    <input
                                                        type="text"
                                                        placeholder="0.0"
                                                        onChange={this._onCoreRateChange.bind(this, "quote")}
                                                        value={core_exchange_rate.quote.amount}
                                                    />
                                                </div>
                                            </div>

                                        </div>
                                        <div className="grid-block no-margin small-12 medium-6">
                                            <AmountSelector
                                                label="account.user_issued_assets.base"
                                                amount={core_exchange_rate.base.amount}
                                                onChange={this._onCoreRateChange.bind(this, "base")}
                                                asset={core_exchange_rate.base.asset_id}
                                                assets={[core_exchange_rate.base.asset_id]}
                                                placeholder="0.0"
                                                tabIndex={1}
                                                style={{width: "100%", paddingLeft: "10px"}}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <h5>
                                            <Translate content="exchange.price" />
                                            <span>: {utils.format_number(utils.get_asset_price(
                                                core_exchange_rate.quote.amount * utils.get_asset_precision(update.precision),
                                                {precision: update.precision},
                                                core_exchange_rate.base.amount * utils.get_asset_precision(core),
                                                core
                                            ), 2 + (parseInt(update.precision, 10) || 8))}</span>
                                            <span> {update.symbol}/{core.get("symbol")}</span>
                                        </h5>
                                    </div>
                                </label>
                            </div>
                        </Tab>

                        <Tab title="account.user_issued_assets.description">
                            <div className="small-12 grid-content">
                                <Translate component="h3" content="account.user_issued_assets.description" />
                                <label>
                                    <textarea
                                        style={{height: "7rem"}}
                                        rows="1"
                                        value={update.description.main}
                                        onChange={this._onUpdateDescription.bind(this, "main")}
                                    />
                                </label>

                                <Translate component="h3" content="account.user_issued_assets.short" />
                                <label>
                                    <input
                                        type="text"
                                        rows="1"
                                        value={update.description.short_name}
                                        onChange={this._onUpdateDescription.bind(this, "short_name")}
                                    />
                                </label>

                                <Translate component="h3" content="account.user_issued_assets.market" />
                                    <AssetSelector
                                        label="account.user_issued_assets.name"
                                        onChange={this._onInputMarket.bind(this)}
                                        asset={this.state.marketInput}
                                        assetInput={this.state.marketInput}
                                        style={{width: "100%", paddingRight: "10px"}}
                                        onFound={this._onFoundMarketAsset.bind(this)}
                                    />

                                {is_prediction_market ? (
                                <div>
                                    <Translate component="h3" content="account.user_issued_assets.condition" />
                                    <label>
                                        <input
                                            type="text"
                                            rows="1"
                                            value={update.description.condition}
                                            onChange={this._onUpdateDescription.bind(this, "condition")}
                                        />
                                    </label>

                                    <Translate component="h3" content="account.user_issued_assets.expiry" />
                                    <label>
                                        <input
                                            type="date"
                                            value={update.description.expiry}
                                            onChange={this._onUpdateDescription.bind(this, "expiry")}
                                        />
                                    </label>
                                </div>) : null}

                            </div>
                        </Tab>

                        {isBitAsset ? (
                            <Tab title="account.user_issued_assets.bitasset_opts">
                                <BitAssetOptions
                                    bitasset_opts={bitasset_opts}
                                    onUpdate={this.onChangeBitAssetOpts.bind(this)}
                                    backingAsset={bitasset_opts.short_backing_asset}
                                    assetPrecision={update.precision}
                                    assetSymbol={update.symbol}
                                />
                            </Tab>) : null}

                        <Tab title="account.permissions">
                            <div className="small-12 grid-content">
                                <div style={{maxWidth: 800}}>
                                <HelpContent
                                    path = {"components/AccountAssetCreate"}
                                    section="permissions"
                                />
                                </div>
                                {permissions}
                            </div>
                        </Tab>

                        <Tab title="account.user_issued_assets.flags">
                            <div className="small-12 grid-content">
                                <div style={{maxWidth: 800}}>
                                    <HelpContent
                                        path = {"components/AccountAssetCreate"}
                                        section="flags"
                                    />
                                </div>
                                {permissionBooleans["charge_market_fee"] ? (
                                    <div>
                                        <Translate component="h3" content="account.user_issued_assets.market_fee" />
                                        <table className="table">
                                            <tbody>
                                                <tr>
                                                    <td style={{border: "none", width: "80%"}}><Translate content="account.user_issued_assets.charge_market_fee" />:</td>
                                                    <td style={{border: "none"}}>
                                                        <div className="switch" style={{marginBottom: "10px"}} onClick={this._onFlagChange.bind(this, "charge_market_fee")}>
                                                            <input type="checkbox" checked={flagBooleans.charge_market_fee} />
                                                            <label />
                                                        </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        <div className={cnames({disabled: !flagBooleans.charge_market_fee})}>
                                        <label><Translate content="account.user_issued_assets.market_fee" /> (%)
                                            <input type="number" value={update.market_fee_percent} onChange={this._onUpdateInput.bind(this, "market_fee_percent")}/>
                                        </label>

                                        <label><Translate content="account.user_issued_assets.max_market_fee" /> ({update.symbol})
                                             <input type="number" value={update.max_market_fee} onChange={this._onUpdateInput.bind(this, "max_market_fee")}/>
                                        </label>
                                        { errors.max_market_fee ? <p className="grid-content has-error">{errors.max_market_fee}</p> : null}
                                        </div>
                                    </div>) : null}

                                <h3><Translate content="account.user_issued_assets.flags" /></h3>
                                {flags}
                            </div>
                        </Tab>
                    </Tabs>

                    <hr/>
                    <div style={{paddingTop: "0.5rem"}}>
                        <button className={classnames("button", {disabled: !isValid})} onClick={this._createAsset.bind(this)}>
                            <Translate content="header.create_asset" />
                        </button>
                        <button className="button outline" onClick={this._reset.bind(this)} value={counterpart.translate("account.perm.reset")}>
                            <Translate content="account.perm.reset" />
                        </button>
                        <br/>
                        <br/>
                        <p><Translate content="account.user_issued_assets.approx_fee" />: {createFee}</p>
                    </div>

                </div>
            </div>
        );
    }

}

AccountAssetCreate = BindToChainState(AccountAssetCreate);

export {AccountAssetCreate, BitAssetOptions};
