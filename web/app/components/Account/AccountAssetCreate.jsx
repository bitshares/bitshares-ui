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
import AmountSelector from "../Utility/AmountSelector";
import FormattedPrice from "../Utility/FormattedPrice";
import AccountSelector from "../Account/AccountSelector";
import AssetSelector from "../Utility/AssetSelector";
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import AccountInfo from "./AccountInfo";
import big from "bignumber.js";
import cnames from "classnames";
import Tabs from "react-foundation-apps/src/tabs";
import connectToStores from "alt/utils/connectToStores";
import SettingsActions from "actions/SettingsActions";
import SettingsStore from "stores/SettingsStore";
import assetUtils from "common/asset_utils";

let MAX_SAFE_INT = new big("9007199254740991");

@BindToChainState()
class AccountAssetCreate extends React.Component {

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

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
            activeTab: props.tab || "primary"
        };
    }



    _createAsset(e) {
        e.preventDefault();
        let {update, flagBooleans, permissionBooleans} = this.state;
        let {account} = this.props;

        let flags = assetUtils.getFlags(flagBooleans);
        let permissions = assetUtils.getPermissions(permissionBooleans);

        AssetActions.createAsset(account.get("id"), update, flags, permissions).then(result => {
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

    _changeTab(value) {
        SettingsActions.changeViewSetting({
            createAssetTab: value
        });
        this.setState({activeTab: value});
    }

    render() {
        let {account, account_name, globalObject, core} = this.props;
        let {errors, isValid, update, assets, flagBooleans, permissionBooleans, activeTab} = this.state;

        // Estimate the asset update fee
        let symbol = update.symbol;
        let updateFee = "N/A";

        updateFee = <FormattedAsset amount={utils.estimateFee("asset_update", [], globalObject)} asset={"1.3.0"} />;

        // let cr_quote_asset = ChainStore.getAsset(core_exchange_rate.quote.asset_id);
        // let precision = utils.get_asset_precision(cr_quote_asset.get("precision"));
        // let cr_base_asset = ChainStore.getAsset(core_exchange_rate.base.asset_id);
        // let basePrecision = utils.get_asset_precision(cr_base_asset.get("precision"));

        // let cr_quote_amount = (new big(core_exchange_rate.quote.amount)).times(precision).toString();
        // let cr_base_amount = (new big(core_exchange_rate.base.amount)).times(basePrecision).toString();

        // console.log("flags:", assetUtils.getFlags(flagBooleans), "permissions:", assetUtils.getPermissions(permissionBooleans));

        let primaryTabClass = cnames("tab-item", {"is-active": activeTab === "primary"});
        let ownerTabClass = cnames("tab-item", {"is-active": activeTab === "owner"});
        let flagsTabClass = cnames("tab-item", {"is-active": activeTab === "flags"});
        let permTabClass = cnames("tab-item", {"is-active": activeTab === "permissions"});

        // Loop over flags        
        let flags = [];
        for (let key in permissionBooleans) {
            if (permissionBooleans[key] && key !== "charge_market_fee") {
                flags.push(
                    <table key={"table_" + key} className="table">
                        <tr>
                            <td style={{border: "none", width: "80%"}}><Translate content={`account.user_issued_assets.${key}`} />:</td>
                            <td style={{border: "none"}}>
                                <div className="switch" style={{marginBottom: "10px"}} onClick={this._onFlagChange.bind(this, key)}>
                                    <input type="checkbox" checked={flagBooleans[key]} />
                                    <label />
                                </div>
                            </td>
                        </tr>
                    </table>
                )
            }
        }

        // Loop over permissions
        let permissions = [];
        for (let key in permissionBooleans) {
                permissions.push(
                    <table key={"table_" + key} className="table">
                        <tr>
                            <td style={{border: "none", width: "80%"}}><Translate content={`account.user_issued_assets.${key}`} />:</td>
                            <td style={{border: "none"}}>
                                <div className="switch" style={{marginBottom: "10px"}} onClick={this._onPermissionChange.bind(this, key)}>
                                    <input type="checkbox" checked={permissionBooleans[key]} />
                                    <label />
                                </div>
                            </td>
                        </tr>
                    </table>
                )
        }

        return (
            <div className="grid-block">
                <div className="grid-content">
                    <h3><Translate content="header.create_asset" /></h3>

                    <div className="tabs" style={{maxWidth: "800px"}}>
                        <div className={primaryTabClass} onClick={this._changeTab.bind(this, "primary")}>
                            <Translate content="account.user_issued_assets.primary" />
                        </div>
                        <div className={flagsTabClass} onClick={this._changeTab.bind(this, "flags")}>
                            <Translate content="account.user_issued_assets.flags" />
                        </div>
                        <div className={permTabClass} onClick={this._changeTab.bind(this, "permissions")}>
                            <Translate content="account.permissions" />
                        </div>
                    </div>

                    {/* Tab content */}

                        
                            <div className="grid-block shrink small-vertical medium-horizontal">
                            {activeTab === "primary" ? (
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

                                    <Translate component="h3" content="account.user_issued_assets.description" />
                                    <label>
                                        <textarea style={{height: "7rem"}} rows="1" value={update.description} onChange={this._onUpdateInput.bind(this, "description")} />
                                    </label>

                                </div>) : null}

                                {activeTab === "flags" ? (
                                    <div className="small-12 large-6 grid-content">
                                        {permissionBooleans["charge_market_fee"] ? (
                                            <div>
                                                <Translate component="h3" content="account.user_issued_assets.market_fee" />
                                                <table className="table">
                                                    <tr>
                                                        <td style={{border: "none", width: "80%"}}><Translate content="account.user_issued_assets.charge_market_fee" />:</td>
                                                        <td style={{border: "none"}}>
                                                            <div className="switch" style={{marginBottom: "10px"}} onClick={this._onFlagChange.bind(this, "charge_market_fee")}>
                                                                <input type="checkbox" checked={flagBooleans.charge_market_fee} />
                                                                <label />
                                                            </div>
                                                        </td>
                                                    </tr>
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
                                    </div>) : null}

                                {activeTab === "permissions" ? (

                                    <div className="small-12 large-6 grid-content">
                                        <p className="grid-content has-error"><Translate content="account.user_issued_assets.perm_warning" /></p>
                                        {permissions}
                                    </div>) : null}
                            </div>

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
                        <p><Translate content="account.user_issued_assets.approx_fee" />: {updateFee}</p>
                    </div>

                </div>
            </div>
        );
    }

}

@connectToStores
class AssetCreateWrapper extends React.Component {
    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    static getStores() {
        return [SettingsStore]
    }

    static getPropsFromStores() {
        return {tab: SettingsStore.getState().viewSettings.get("createAssetTab")}
    }

    render() {
        return <AccountAssetCreate {...this.props} />;
    }   
}

export default AssetCreateWrapper;
