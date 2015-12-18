import React from "react";
import Translate from "react-translate-component";
import classnames from "classnames";
import validation from "common/validation";
import AssetActions from "actions/AssetActions";
import HelpContent from "../Utility/HelpContent";
import utils from "common/utils";
import ChainStore from "api/ChainStore";
import FormattedAsset from "../Utility/FormattedAsset";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedPrice from "../Utility/FormattedPrice";
import AccountSelector from "../Account/AccountSelector";
import AssetSelector from "../Utility/AssetSelector";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import AccountInfo from "./AccountInfo";
import big from "bignumber.js";
import cnames from "classnames";
import assetUtils from "common/asset_utils";
import Tabs, {Tab} from "../Utility/Tabs";
import AmountSelector from "../Utility/AmountSelector";

let MAX_SAFE_INT = new big("9007199254740991");

@BindToChainState()
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

        let flagBooleans = assetUtils.getFlagBooleans(0);
        let permissionBooleans = assetUtils.getFlagBooleans(79);
        let flags = assetUtils.getFlags(flagBooleans);
        let permissions = assetUtils.getPermissions(permissionBooleans);

        let coreRateBaseAssetName = ChainStore.getAsset("1.3.0").get("symbol");

        return {

            update: {
                symbol: "",
                precision: 4,
                max_supply: 0,
                max_market_fee: 0,
                market_fee_percent: 0,
                description: ""
            },
            errors: {
                max_supply: null
            },
            isValid: true,
            flagBooleans: flagBooleans,
            permissionBooleans: permissionBooleans,
            isBitAsset: isBitAsset,
            core_exchange_rate: {
                quote: {
                    asset_id: null,
                    amount: 1
                },
                base: {
                    asset_id: "1.3.0",
                    amount: 1
                }
            }
        };
    }



    _createAsset(e) {
        e.preventDefault();
        let {update, flagBooleans, permissionBooleans, core_exchange_rate} = this.state;
        let {account} = this.props;

        let flags = assetUtils.getFlags(flagBooleans);
        let permissions = assetUtils.getPermissions(permissionBooleans);

        AssetActions.createAsset(account.get("id"), update, flags, permissions, core_exchange_rate).then(result => {
            console.log("... AssetActions.updateAsset(account_id, update)", account.get("id"),  update, flags, permissions)
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

        errors.symbol = validation.is_valid_symbol_error(new_state.symbol);
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

    _onCoreRateChange(type, e) {

        let amount, asset;
        if (type === "quote") {
            amount = utils.limitByPrecision(e.target.value, this.state.update.precision);
            asset = null;
        } else {
            amount = e.amount == "" ? "0" : utils.limitByPrecision(e.amount.replace(/,/g, ""), this.props.core.get("precision"));
            asset = e.asset.get("id")
        }
            
        let {core_exchange_rate} = this.state;
        core_exchange_rate[type] = {
            amount: amount,
            asset_id: asset
        };
        this.forceUpdate();
    }

    render() {
        let {account, account_name, globalObject, core} = this.props;
        let {errors, isValid, update, assets, flagBooleans, permissionBooleans,
            core_exchange_rate} = this.state;

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

        // let cr_quote_asset = ChainStore.getAsset(core_exchange_rate.quote.asset_id);
        // let precision = utils.get_asset_precision(cr_quote_asset.get("precision"));
        let cr_base_asset = ChainStore.getAsset(core_exchange_rate.base.asset_id);
        let basePrecision = utils.get_asset_precision(cr_base_asset.get("precision"));

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
                            <div className="small-12 large-6 grid-content">
                                <h3><Translate content="account.user_issued_assets.primary" /></h3>
                                <label><Translate content="account.user_issued_assets.symbol" />
                                    <input type="text" value={update.symbol} onChange={this._onUpdateInput.bind(this, "symbol")}/>
                                </label>
                                { errors.symbol ? <p className="grid-content has-error">{errors.symbol}</p> : null}


                                <label><Translate content="account.user_issued_assets.max_supply" /> {update.symbol ? <span>({update.symbol})</span> : null}
                                    <input type="number" value={update.max_supply} onChange={this._onUpdateInput.bind(this, "max_supply")} />
                                </label>
                                { errors.max_supply ? <p className="grid-content has-error">{errors.max_supply}</p> : null}

                                <label><Translate content="account.user_issued_assets.precision" />
                                    <input type="number" value={update.precision} onChange={this._onUpdateInput.bind(this, "precision")} />
                                </label>

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
                                            <span>: {utils.get_asset_price(core_exchange_rate.quote.amount, {precision: update.precision}, core_exchange_rate.base.amount, core)}</span>
                                            <span> {update.symbol}/{core.get("symbol")}</span>
                                        </h5> 
                                    </div>
                                </label>

                                <Translate component="h3" content="account.user_issued_assets.description" />
                                <label>
                                    <textarea style={{height: "7rem"}} rows="1" value={update.description} onChange={this._onUpdateInput.bind(this, "description")} />
                                </label>
                            </div>
                        </Tab>

                        <Tab title="account.user_issued_assets.flags">
                            <div className="small-12 large-6 grid-content">
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

                                        <label>
                                             <input type="number" value={update.max_market_fee} onChange={this._onUpdateInput.bind(this, "max_market_fee")}/>
                                        </label>
                                        { errors.max_market_fee ? <p className="grid-content has-error">{errors.max_market_fee}</p> : null}
                                        </div>
                                    </div>) : null}

                                <h3><Translate content="account.user_issued_assets.flags" /></h3>
                                {flags}
                            </div>
                        </Tab>

                        <Tab title="account.permissions">
                            <div className="small-12 large-6 grid-content">
                                <p className="grid-content has-error"><Translate content="account.user_issued_assets.perm_warning" /></p>
                                {permissions}
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

export default AccountAssetCreate;
