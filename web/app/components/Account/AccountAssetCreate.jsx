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

class AccountAssetCreate extends React.Component {

    static contextTypes = { router: React.PropTypes.func.isRequired }

    static defaultProps = {
        symbol: "",
        name: "",
        description: "",
        max_supply: 0,
        precision: 0
    }

    constructor(props) {
        super(props);

        this.state = {
            create: {
                symbol: "",
                name: "",
                description: "",
                max_supply: 0,
                precision: 4,
                common_options: {
                    market_fee_percent: 0,
                    max_market_fee: 0
                }
            },
            errors: {
                symbol: null,
                max_supply: null
            },
            isValid: false
        };
    }

    _createAsset(account_id, e) {
        console.log("account_id:", account_id);
        e.preventDefault();
        let {create} = this.state;
        let existingAsset = ChainStore.getAsset(create.symbol);
        if (existingAsset) {
            return this._validateCreateFields(create);
        }
        AssetActions.createAsset(account_id, create).then(result => {
            console.log("... AssetActions.createAsset(account_id, create)", account_id, create)
            // Notify 'Successfully created the asset' was running before transaction dialog confirm
            // if (result) {
            //     notify.addNotification({
            //         message: `Successfully created the asset ${create.symbol}`,//: ${this.state.wallet_public_name}
            //         level: "success",
            //         autoDismiss: 10
            //     });
            // } else {
            //     notify.addNotification({
            //         message: `Failed to create the asset`,//: ${this.state.wallet_public_name}
            //         level: "error",
            //         autoDismiss: 10
            //     });
            // }
        });
    }

    _forcePositive(number) {
        return parseFloat(number) < 0 ? "0" : number;
    }

    _onCreateInput(value, e) {
        let {create} = this.state;

        switch (value) {
            case "market_fee_percent":
                create.common_options[value] = this._forcePositive(e.target.value);
                break;

            case "max_market_fee":
                e.target.value = utils.limitByPrecision(e.target.value, this.state.create.precision);
                create.common_options[value] = e.target.value;
                break;

            case "max_supply":
                e.target.value = utils.limitByPrecision(e.target.value, this.state.create.precision);
                create[value] = e.target.value;
                break;

            case "precision":
                // Enforce positive number
                create[value] = this._forcePositive(e.target.value);
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
                create[value] = this._forcePositive(e.target.value);
                break;

            default:
                create[value] = e.target.value;
                break;
        }
        this.setState({create: create});
        this._validateCreateFields(create);
    }

    _validateCreateFields( new_state ) {

        let errors = {
            create: null,
            max_supply: null
        };
        errors.symbol = validation.is_valid_symbol_error(new_state.symbol);
        let existingAsset = ChainStore.getAsset(new_state.symbol);
        if (existingAsset) {
            errors.symbol = counterpart.translate("account.user_issued_assets.exists");
        }
        errors.max_supply = new_state.max_supply <= 0 ? counterpart.translate("account.user_issued_assets.max_positive") : null;
        let isValid = errors.symbol === null && errors.max_supply === null;

        this.setState({isValid: isValid, errors: errors});
    }

    render() {
        let {account, account_name} = this.props;
        let {errors, isValid, create, assets} = this.state;

        let globalObject = ChainStore.getObject("2.0.0");

        // Estimate the asset creation fee from the symbol character length
        let symbolLength = create.symbol.length, createFee = "N/A";

        if(symbolLength === 3) {
            createFee = <FormattedAsset amount={utils.estimateFee("asset_create", ["symbol3"], globalObject)} asset={"1.3.0"} />;
        }
        else if(symbolLength === 4) {
            createFee = <FormattedAsset amount={utils.estimateFee("asset_create", ["symbol4"], globalObject)} asset={"1.3.0"} />;
        }
        else if(symbolLength > 4) {
            createFee = <FormattedAsset amount={utils.estimateFee("asset_create", ["long_symbol"], globalObject)} asset={"1.3.0"} />;
        }

        return (
            <div className="grid-block">
                <div className="grid-content">
                    <Translate component="h3" content="header.create_asset" />
                    <HelpContent path="components/AccountAssetCreate" />

                    <form onSubmit={this._createAsset.bind(this, account.get("id"))} noValidate>
                        <div className="grid-block shrink">
                            <div className="small-6 grid-content">
                                <h3><Translate content="account.user_issued_assets.primary" /></h3>
                                <label><Translate content="account.user_issued_assets.symbol" />
                                    <input type="text" value={create.symbol} onChange={this._onCreateInput.bind(this, "symbol")}/>
                                </label>
                                { errors.symbol ? <p className="grid-content has-error">{errors.symbol}</p> : null}

                                <label><Translate content="account.user_issued_assets.max_supply" /> {create.symbol ? <span>({create.symbol})</span> : null}
                                    <input type="number" value={create.max_supply} onChange={this._onCreateInput.bind(this, "max_supply")} />
                                </label>
                                { errors.max_supply ? <p className="grid-content has-error">{errors.max_supply}</p> : null}

                                <label><Translate content="account.user_issued_assets.precision" />
                                    <input type="number" value={create.precision} onChange={this._onCreateInput.bind(this, "precision")} />
                                </label>

                            </div>

                            <div className="small-6 grid-content">
                                <h3><Translate content="account.user_issued_assets.optional" /></h3>

                                <label><Translate content="account.user_issued_assets.description" />
                                    <input type="text" value={create.description} onChange={this._onCreateInput.bind(this, "description")} />
                                </label>

                                <label><Translate content="account.user_issued_assets.market_fee" /> (%)
                                    <input type="number" value={create.common_options.market_fee_percent} onChange={this._onCreateInput.bind(this, "market_fee_percent")}/>
                                </label>

                                <label><Translate content="account.user_issued_assets.max_market_fee"/> {create.symbol ? <span>({create.symbol})</span> : null}
                                    <input type="number" value={create.common_options.max_market_fee} onChange={this._onCreateInput.bind(this, "max_market_fee")}/>
                                </label>
                            </div>
                        </div>

                        <div className="grid-content button-group no-overflow">
                            <input type="submit" className={classnames("button", {disabled: !isValid || create.symbol.length < 3})} onClick={this._createAsset.bind(this, account.get("id"))} value="Create Asset" />

                            <span><Translate content="account.user_issued_assets.approx_fee" />: {createFee}</span>
                        </div>
                    </form>
                </div>
            </div>
    );
    }

}

export default AccountAssetCreate;