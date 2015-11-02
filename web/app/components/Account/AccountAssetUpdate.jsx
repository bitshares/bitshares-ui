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
import LinkToAccountById from "../Blockchain/LinkToAccountById";
import AccountInfo from "./AccountInfo";
import big from "bignumber.js";

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
        let asset = props.asset.toJS();
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

        asset.options.market_fee_percent /= 100;
        this.state = {
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
            isValid: true
        };
    }

    _updateAsset(e) {
        e.preventDefault();
        let {update, issuer, new_issuer_account, core_exchange_rate} = this.state;

        AssetActions.updateAsset(issuer, new_issuer_account, update, core_exchange_rate, this.props.asset, this.props.core).then(result => {
            console.log("... AssetActions.createAsset(account_id, update)", issuer, new_issuer_account, this.props.asset.get("id"), update)
        });
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
            this._validateCreateFields(update);
        }
    }

    _validateCreateFields( new_state ) {

        let errors = {
            max_supply: null
        };
        // errors.symbol = validation.is_valid_symbol_error(new_state.symbol);
        // let existingAsset = ChainStore.getAsset(new_state.symbol);
        // if (existingAsset) {
        //     errors.symbol = counterpart.translate("account.user_issued_assets.exists");
        // }
        errors.max_supply = new_state.max_supply <= 0 ? counterpart.translate("account.user_issued_assets.max_positive") : null;
        let isValid = errors.max_supply === null;

        this.setState({isValid: isValid, errors: errors});
    }

    _onCoreRateChange(type, amount) {
        let rate = this.state.core_exchange_rate;
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

    render() {
        let {account, account_name, globalObject, asset, core} = this.props;
        let {errors, isValid, update, assets, core_exchange_rate} = this.state;

        // Estimate the asset creation fee from the symbol character length
        let symbol = asset.get("symbol");
        let symbolLength = symbol.length, updateFee = "N/A";

        updateFee = <FormattedAsset amount={utils.estimateFee("asset_update", [], globalObject)} asset={"1.3.0"} />;

        let precision = utils.get_asset_precision(asset.get("precision"));
        let corePrecision = utils.get_asset_precision(core.get("precision"));

        let cr_quote_amount = core_exchange_rate.quote.asset_id === asset.get("id") ?
            (new big(core_exchange_rate.quote.amount)).times(precision).toString() :
            (new big(core_exchange_rate.quote.amount)).times(corePrecision).toString();

        let cr_base_amount = core_exchange_rate.base.asset_id === asset.get("id") ?
            (new big(core_exchange_rate.base.amount)).times(precision).toString() :
            (new big(core_exchange_rate.base.amount)).times(corePrecision).toString();

        return (
            <div className="grid-block">
                <div className="grid-content">
                    <h3><Translate content="header.update_asset" />: {symbol}</h3>

                    <form onSubmit={this._updateAsset.bind(this)} noValidate>
                        <div className="grid-block shrink small-vertical medium-horizontal">
                            <div className="small-12 medium-6 grid-content">
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
                                            <AmountSelector
                                                label="account.user_issued_assets.quote"
                                                amount={core_exchange_rate.quote.amount}
                                                onChange={this._onCoreRateChange.bind(this, "quote")}
                                                asset={core_exchange_rate.quote.asset_id}
                                                assets={[core_exchange_rate.quote.asset_id]}
                                                placeholder="0.0"
                                                tabIndex={1}
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
                                            />
                                        </div>
                                    </div>
                                    <div>
                                    <h5>Price: <FormattedPrice
                                            style={{fontWeight: "bold"}}
                                            quote_amount={cr_quote_amount} 
                                            quote_asset={core_exchange_rate.quote.asset_id}
                                            base_asset={core_exchange_rate.base.asset_id}
                                            base_amount={cr_base_amount}
                                        /></h5> 
                                    </div>
                                </label>

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

                            <div className="small-12 medium-6 grid-content">
                                <h3><Translate content="account.user_issued_assets.optional" /></h3>

                                <label><Translate content="account.user_issued_assets.description" />
                                    <input type="text" value={update.description} onChange={this._onUpdateInput.bind(this, "description")} />
                                </label>

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
                        </div>

                        <div className="grid-content button-group no-overflow" style={{paddingTop: "2rem"}}>
                            <input type="submit" className={classnames("button", {success: isValid}, {disabled: !isValid})} onClick={this._updateAsset.bind(this)} value="Update Asset" />

                            <span><Translate content="account.user_issued_assets.approx_fee" />: {updateFee}</span>
                        </div>
                    </form>
                </div>
            </div>
    );
    }

}

class AssetUpdateWrapper extends React.Component {
    static contextTypes = {
        router: React.PropTypes.func.isRequired
    };

    render() {
        let asset = this.context.router.getCurrentParams().asset;
        return <AccountAssetUpdate asset={asset} {...this.props} />;
    }   
}

export default AssetUpdateWrapper;