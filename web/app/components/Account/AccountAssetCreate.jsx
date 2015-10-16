import React from "react";
import Translate from "react-translate-component";
import classnames from "classnames";
import validation from "common/validation";
import AssetActions from "actions/AssetActions";
import HelpContent from "../Utility/HelpContent";

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
                precision: 4
            },
            errors: {
                symbol: null
            },
            isValid: false
        };
    }

    _createAsset(account_id, e) {
        console.log("account_id:", account_id);
        e.preventDefault();
        let {create} = this.state;
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

    _onCreateInput(value, e) {
        let {create} = this.state;
        if (value === "symbol") {
            e.target.value = e.target.value.toUpperCase();
            // console.log(e.target.value, "is valid symbol", validation.is_valid_symbol(e.target.value));
        }
        create[value] = e.target.value;
        this.setState({create: create});
        this._validateCreateFields(create);
    }

    _validateCreateFields( new_state ) {

        let errors = {
            create: null
        };
        errors.create = validation.is_valid_symbol_error(new_state.symbol);

        let isValid = errors.create === null;

        this.setState({isValid: isValid, errors: errors});
    }

    render() {
        let {account, account_name} = this.props;
        let {errors, isValid, create, assets} = this.state;
        return (
            <div className="grid-block small-12 vertical">
                <Translate component="h3" content="header.create_asset" />
                <HelpContent path="components/AccountAssetCreate" />
                    
                <form className="grid-block vertical" onSubmit={this._createAsset.bind(this, account.get("id"))} noValidate>
                    <div className="grid-block shrink">
                        <div className="small-6 grid-content">
                            <label><Translate content="account.user_issued_assets.symbol" />
                                <input type="text" value={create.symbol} onChange={this._onCreateInput.bind(this, "symbol")}/>
                            </label>
                            { errors.create ? <p className="grid-content has-error">{errors.create}</p> : null}

                            <label><Translate content="account.user_issued_assets.description" />
                            <input type="text" value={create.description} onChange={this._onCreateInput.bind(this, "description")} /></label>

                            <label><Translate content="account.user_issued_assets.max_supply" />
                            <input type="number" value={create.max_supply} onChange={this._onCreateInput.bind(this, "max_supply")} /></label>

                            <label><Translate content="account.user_issued_assets.precision" />
                            <input type="number" value={create.precision} onChange={this._onCreateInput.bind(this, "precision")} /></label>

                        </div>

                        {/*<div className="small-6 grid-content">
                            <label><Translate content="account.user_issued_assets.symbol" />
                                <input type="text" value={create.symbol} onChange={this._onCreateInput.bind(this, "symbol")}/>
                            </label>
                        </div>*/}
                    </div>

                    <div className="grid-content button-group">
                        <input type="submit" className={classnames("button", {disabled: !isValid || create.symbol.length < 3})} onClick={this._createAsset.bind(this, account.get("id"))} value="Create Asset" />
                        <a href className="secondary button">Cancel</a>
                    </div>
                </form>
            </div>
    );
    }

}

export default AccountAssetCreate;