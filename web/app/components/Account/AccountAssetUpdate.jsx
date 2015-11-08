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
class AccountAssetUpdate extends React.Component {

    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    static propTypes = {
        asset: ChainTypes.ChainAsset.isRequired,
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
        let asset = props.asset.toJS();
        let isBitAsset = asset.bitasset_id !== undefined;
        let precision = utils.get_asset_precision(asset.precision);
        let corePrecision = utils.get_asset_precision(props.core.get("precision"));

        let max_market_fee = (new big(asset.options.max_market_fee)).div(precision).toString();
        let max_supply = (new big(asset.options.max_supply)).div(precision).toString();
        let core_exchange_rate = asset.options.core_exchange_rate;
        core_exchange_rate.quote.amount = core_exchange_rate.quote.asset_id === asset.id ?
            (new big(core_exchange_rate.quote.amount)).div(precision).toString() :
            (new big(core_exchange_rate.quote.amount)).div(corePrecision).toString();

        core_exchange_rate.base.amount = core_exchange_rate.base.asset_id === asset.id ?
            (new big(core_exchange_rate.base.amount)).div(precision).toString() :
            (new big(core_exchange_rate.base.amount)).div(corePrecision).toString();


        let flagBooleans = assetUtils.getFlagBooleans(asset.options.flags);
        let permissionBooleans = assetUtils.getFlagBooleans(asset.options.issuer_permissions);
        let flags = assetUtils.getFlags(flagBooleans);
        let permissions = assetUtils.getPermissions(permissionBooleans, isBitAsset);

        asset.options.market_fee_percent /= 100;

        let coreRateQuoteAssetName = ChainStore.getAsset(core_exchange_rate.quote.asset_id).get("symbol");
        let coreRateBaseAssetName = ChainStore.getAsset(core_exchange_rate.base.asset_id).get("symbol");

        return {
            update: {
                max_supply: max_supply,
                max_market_fee: max_market_fee,
                market_fee_percent: asset.options.market_fee_percent,
                description: asset.options.description
            },
            core_exchange_rate: core_exchange_rate,
            issuer: asset.issuer,
            new_issuer_account: null,
            issuer_account_name: null,
            asset_to_update: asset.id,
            errors: {
                max_supply: null
            },
            isValid: true,
            quoteName: asset.symbol,
            baseName: core,
            flagBooleans: flagBooleans,
            permissionBooleans: permissionBooleans,
            isBitAsset: isBitAsset,
            coreRateQuoteAssetName: coreRateQuoteAssetName,
            quoteAssetInput: coreRateQuoteAssetName,
            coreRateBaseAssetName: coreRateBaseAssetName,
            baseAssetInput: coreRateBaseAssetName,
            activeTab: props.tab
        };
    }



    _updateAsset(e) {
        e.preventDefault();
        let {update, issuer, new_issuer_account, core_exchange_rate, flagBooleans, permissionBooleans} = this.state;

        let flags = assetUtils.getFlags(flagBooleans);
        let permissions = assetUtils.getPermissions(permissionBooleans);

        let cr_quote_asset = ChainStore.getAsset(core_exchange_rate.quote.asset_id);
        let cr_base_asset = ChainStore.getAsset(core_exchange_rate.base.asset_id);

        AssetActions.updateAsset(issuer, new_issuer_account, update, core_exchange_rate, this.props.asset, flags, permissions).then(result => {
            console.log("... AssetActions.updateAsset(account_id, update)", issuer, new_issuer_account, this.props.asset.get("id"), update)
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
        let precision = utils.get_asset_precision(this.props.asset.get("precision"));

        switch (value) {
            case "market_fee_percent":
                update[value] = this._forcePositive(e.target.value);
                break;

            case "max_market_fee":
                let marketFee = e.amount.replace(/,/g, "");
                if ((new big(marketFee)).times(precision).gt(MAX_SAFE_INT)) {
                    updateState = false;
                    return this.setState({errors: {max_market_fee: "The number you tried to enter is too large"}});
                }
                update[value] = utils.limitByPrecision(marketFee, this.props.asset.get("precision"));
                break;

            case "max_supply":
                let maxSupply = e.amount.replace(/,/g, "");
                if ((new big(maxSupply)).times(precision).gt(MAX_SAFE_INT)) {
                    updateState = false;
                    return this.setState({errors: {max_supply: "The number you tried to enter is too large"}});
                }
                update[value] = utils.limitByPrecision(maxSupply, this.props.asset.get("precision"));
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
        let cer = new_state.core_exchange_rate;
        let {asset, core} = this.props;

        let errors = {
            max_supply: null,
            quote_asset: null,
            base_asset: null
        };

        errors.max_supply = new_state.max_supply <= 0 ? counterpart.translate("account.user_issued_assets.max_positive") : null;

        if (cer) {
            if (cer.quote.asset_id !== asset.get("id") && cer.base.asset_id !== asset.get("id")) {
                errors.quote_asset = counterpart.translate("account.user_issued_assets.need_asset", {name: asset.get("symbol")});
            }

            if (cer.quote.asset_id !== core.get("id") && cer.base.asset_id !== core.get("id")) {
                errors.base_asset = counterpart.translate("account.user_issued_assets.need_asset", {name: core.get("symbol")});
            }
        }
        let isValid = !errors.max_supply && !errors.base_asset && !errors.quote_asset;

        this.setState({isValid: isValid, errors: errors});
    }

    _onCoreRateChange(type, amount) {
        let updateObject = {};
        updateObject[type] = {$set: {amount: amount.amount.replace(/,/g, ""), asset_id: amount.asset.get("id")}};
        this.setState({core_exchange_rate: React.addons.update(this.state.core_exchange_rate, updateObject)});
    }

    onIssuerAccountChanged(account) {
        // console.log("onIssuerAccountChanged", account.get("symbol"));
        this.setState({
            new_issuer_account: account ? account.get("id") : null
        });
    }

    issuerNameChanged(name) {
        this.setState({
            issuer_account_name: name
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
            updateAssetTab: value
        });
        this.setState({activeTab: value});
    }

    render() {
        let {account, account_name, globalObject, asset, core} = this.props;
        let {errors, isValid, update, assets, core_exchange_rate, flagBooleans, permissionBooleans, activeTab} = this.state;

        // Estimate the asset update fee
        let symbol = asset.get("symbol");
        let updateFee = "N/A";

        updateFee = <FormattedAsset amount={utils.estimateFee("asset_update", [], globalObject)} asset={"1.3.0"} />;

        let cr_quote_asset = ChainStore.getAsset(core_exchange_rate.quote.asset_id);
        let precision = utils.get_asset_precision(cr_quote_asset.get("precision"));
        let cr_base_asset = ChainStore.getAsset(core_exchange_rate.base.asset_id);
        let basePrecision = utils.get_asset_precision(cr_base_asset.get("precision"));

        let cr_quote_amount = (new big(core_exchange_rate.quote.amount)).times(precision).toString();
        let cr_base_amount = (new big(core_exchange_rate.base.amount)).times(basePrecision).toString();

        // console.log("flags:", assetUtils.getFlags(flagBooleans), "permissions:", assetUtils.getPermissions(permissionBooleans));

        let primaryTabClass = cnames("tab-item", {"is-active": activeTab === "primary"});
        let ownerTabClass = cnames("tab-item", {"is-active": activeTab === "owner"});
        let flagsTabClass = cnames("tab-item", {"is-active": activeTab === "flags"});
        let permTabClass = cnames("tab-item", {"is-active": activeTab === "permissions"});

        let originalPermissions = assetUtils.getFlagBooleans(asset.getIn(["options", "issuer_permissions"]));
        
        // Loop over flags        
        let flags = [];
        for (let key in originalPermissions) {
            if (originalPermissions[key] && key !== "charge_market_fee") {
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
        for (let key in originalPermissions) {
            if (originalPermissions[key]) {
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
        }

        return (
            <div className="grid-block">
                <div className="grid-content">
                    <h3><Translate content="header.update_asset" />: {symbol}</h3>

                    <div className="grid-content button-group no-overflow" style={{paddingTop: "2rem"}}>
                        <input type="submit" className={classnames("button", {success: isValid}, {disabled: !isValid})} onClick={this._updateAsset.bind(this)} value={counterpart.translate("header.update_asset")} />
                        <input type="submit" className="button info" onClick={this._reset.bind(this)} value={counterpart.translate("account.perm.reset")} />

                        <div><Translate content="account.user_issued_assets.approx_fee" />: {updateFee}</div>
                    </div>

                    <div className="tabs" style={{maxWidth: "800px"}}>
                        <div className={primaryTabClass} onClick={this._changeTab.bind(this, "primary")}>
                            <Translate content="account.user_issued_assets.primary" />
                        </div>
                        <div className={ownerTabClass} onClick={this._changeTab.bind(this, "owner")}>
                            <Translate content="account.user_issued_assets.update_owner" />
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
                      
                                    <label>
                                        <AmountSelector
                                            label="account.user_issued_assets.max_supply"
                                            amount={update.max_supply}
                                            onChange={this._onUpdateInput.bind(this, "max_supply")}
                                            asset={this.props.asset.get("id")}
                                            assets={[this.props.asset.get("id")]}
                                            placeholder="0.0"
                                            tabIndex={1}
                                        />
                                    </label>
                                    { errors.max_supply ? <p className="grid-content has-error">{errors.max_supply}</p> : null}

                                    <Translate component="h3" content="account.user_issued_assets.core_exchange_rate" />
                                    <label>                                    
                                        <div className="grid-block no-margin">
                                            <div className="grid-block no-margin small-12 medium-6">
                                                <AssetSelector
                                                    label="account.user_issued_assets.quote_name"
                                                    onChange={this._onInputCoreAsset.bind(this, "quote")}
                                                    asset={this.state.quoteAssetInput}
                                                    assetInput={this.state.quoteAssetInput}
                                                    tabIndex={1}
                                                    style={{width: "100%", paddingRight: "10px"}}
                                                    onFound={this._onFoundCoreAsset.bind(this, "quote")}
                                                />
                                            </div>
                                            <div className="grid-block no-margin small-12 medium-6">
                                                <AssetSelector
                                                    label="account.user_issued_assets.base_name"
                                                    onChange={this._onInputCoreAsset.bind(this, "base")}
                                                    asset={this.state.baseAssetInput}
                                                    assetInput={this.state.baseAssetInput}
                                                    tabIndex={1}
                                                    style={{width: "100%", paddingLeft: "10px"}}
                                                    onFound={this._onFoundCoreAsset.bind(this, "base")}
                                                />
                                            </div>
                                            {errors.quote_asset ? <p className="grid-content has-error">{errors.quote_asset}</p> : null}
                                            {errors.base_asset ? <p className="grid-content has-error">{errors.base_asset}</p> : null}
                                            <div className="grid-block no-margin small-12 medium-6">
                                                <AmountSelector
                                                    label="account.user_issued_assets.quote"
                                                    amount={core_exchange_rate.quote.amount}
                                                    onChange={this._onCoreRateChange.bind(this, "quote")}
                                                    asset={core_exchange_rate.quote.asset_id}
                                                    assets={[core_exchange_rate.quote.asset_id]}
                                                    placeholder="0.0"
                                                    tabIndex={1}
                                                    style={{width: "100%", paddingRight: "10px"}}
                                                />
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
                                            <h5><Translate content="exchange.price" />: <FormattedPrice
                                                style={{fontWeight: "bold"}}
                                                quote_amount={cr_quote_amount} 
                                                quote_asset={core_exchange_rate.quote.asset_id}
                                                base_asset={core_exchange_rate.base.asset_id}
                                                base_amount={cr_base_amount}
                                            /></h5> 
                                        </div>
                                    </label>

                                        <Translate component="h3" content="account.user_issued_assets.description" />
                                        <label>
                                            <textarea style={{height: "7rem"}} rows="1" value={update.description} onChange={this._onUpdateInput.bind(this, "description")} />
                                        </label>

                                </div>) : null}

                                {activeTab === "owner" ? (
                                    <div className="small-12 large-6 grid-content">
                                        <Translate component="h3" content="account.user_issued_assets.update_owner" />
                                        <div style={{paddingBottom: "1rem"}}>
                                            <AccountSelector
                                                label="account.user_issued_assets.current_issuer"
                                                accountName={this.props.account.get("name")}
                                                account={this.props.account.get("name")}
                                                error={null}
                                                tabIndex={1}
                                             />
                                        </div>
                                        <AccountSelector
                                            label="account.user_issued_assets.new_issuer"
                                            accountName={this.state.issuer_account_name}
                                            onChange={this.issuerNameChanged.bind(this)}
                                            onAccountChanged={this.onIssuerAccountChanged.bind(this)}
                                            account={this.state.issuer_account_name}
                                            error={null}
                                            tabIndex={1}
                                         />
                                    </div>
                                 ) : null}

                                {activeTab === "flags" ? (
                                    <div className="small-12 large-6 grid-content">
                                        {originalPermissions["charge_market_fee"] ? (
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
                                                    <AmountSelector
                                                        label="account.user_issued_assets.max_market_fee"
                                                        amount={update.max_market_fee}
                                                        onChange={this._onUpdateInput.bind(this, "max_market_fee")}
                                                        asset={this.props.asset.get("id")}
                                                        assets={[this.props.asset.get("id")]}
                                                        placeholder="0.0"
                                                        tabIndex={1}
                                                    />
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
                </div>
            </div>
        );
    }

}

@connectToStores
class AssetUpdateWrapper extends React.Component {
    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    static getStores() {
        return [SettingsStore]
    }

    static getPropsFromStores() {
        return {tab: SettingsStore.getState().viewSettings.get("updateAssetTab")}
    }

    render() {
        let asset = this.context.router.getCurrentParams().asset;
        return <AccountAssetUpdate asset={asset} {...this.props} />;
    }   
}

export default AssetUpdateWrapper;