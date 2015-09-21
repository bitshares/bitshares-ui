import React from "react";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "../Utility/FormattedAsset";
import utils from "common/utils";
import classNames from "classnames";
import AmountSelector from "../Utility/AmountSelector";
import BalanceComponent from "../Utility/BalanceComponent";
import WalletApi from "rpc_api/WalletApi";
import WalletDb from "stores/WalletDb";
import FormattedPrice from "../Utility/FormattedPrice";
let wallet_api = new WalletApi();

@BindToChainState({keep_updating: true})
class BorrowModalContent extends React.Component {

    static propTypes = {
        asset: ChainTypes.ChainAsset.isRequired,
        bitasset_data: ChainTypes.ChainObject.isRequired,
        bitasset_balance: ChainTypes.ChainObject,
        backing_asset: ChainTypes.ChainAsset.isRequired,
        backing_balance: ChainTypes.ChainObject,
        call_orders: ChainTypes.ChainObjectsList
    }

    constructor() {
        super();
        this.state = {
            short_amount: 0,
            collateral: 0,
            collateral_ratio: 0,
            errors: this._getInitialErrors(),
            isValid: false
        };
    }

    componentDidMount() {
        let currentPosition = this._getCurrentPosition();
        let debt = utils.get_asset_amount(currentPosition.debt, this.props.asset);
        let collateral = utils.get_asset_amount(currentPosition.collateral, this.props.backing_asset);
        this.setState({short_amount: debt.toString(), collateral: collateral.toString(), collateral_ratio: this._getCollateralRatio(debt, collateral)});
    }

    _getInitialErrors() {
        return {
            collateral_balance: null,
            ratio_too_high: null
        };
    }

    confirmClicked(e) {
        e.preventDefault();
        ZfApi.publish(this.props.modalId, "close");       
        // this.state.callback();   
    }

    _onBorrowChange(e) {
        let feed_price = this._getFeedPrice();
        let amount = e.amount.replace( /,/g, "" );
        let newState = {
            short_amount: amount,
            collateral: this.state.collateral,
            collateral_ratio: this.state.collateral / (amount / feed_price)
        }

        this.setState(newState);
        this._validateFields(newState);
    }
    
    _onCollateralChange(e) {
        let amount = e.amount.replace( /,/g, "" );

        let feed_price = this._getFeedPrice();

        let newState = {
            short_amount: this.state.short_amount,
            collateral: amount,
            collateral_ratio: amount / (this.state.short_amount / feed_price)
        }

        this.setState(newState);
        this._validateFields(newState);
    }

    _onRatioChange(e) {
        let feed_price = this._getFeedPrice();

        let ratio = e.target.value;

        // let short_amount = this.state.short_amount.replace( /,/g, "" );
        // let collateral = this.state.collateral.replace( /,/g, "" );

        let newState = {
            short_amount: this.state.short_amount,
            collateral: ((this.state.short_amount / feed_price) * ratio).toString(),
            collateral_ratio: ratio
        }

        this.setState(newState);
        this._validateFields(newState);
    }


    _validateFields(newState) {
        let errors = this._getInitialErrors();
        let backing_balance = !this.props.backing_balance ? {balance: 0} : this.props.backing_balance.toJS();
        if (parseFloat(newState.collateral) > utils.get_asset_amount(backing_balance.balance, this.props.backing_asset.toJS())) {
            errors.collateral_balance = "Insufficient collateral";
        }

        let isValid = newState.short_amount > 0 && newState.collateral > 0;

        this.setState({errors, isValid});
    }

    _onSubmit(e) {
        e.preventDefault();
        console.log("e:", this.props);
        
        let quotePrecision = utils.get_asset_precision(this.props.asset.get("precision"));
        let backingPrecision = utils.get_asset_precision(this.props.backing_asset.get("precision"));
        let currentPosition = this._getCurrentPosition();

        var tr = wallet_api.new_transaction();
        console.log("tr object:", {
            "fee": {
                amount: 0,
                asset_id: 0
            },
            "funding_account": this.props.account,
            "delta_collateral": {
                "amount": parseInt(this.state.collateral * backingPrecision - currentPosition.collateral, 10),
                "asset_id": this.props.backing_asset.get("id")
            },
            "delta_debt": {
                "amount": parseInt(this.state.short_amount * quotePrecision - currentPosition.debt, 10),
                "asset_id": this.props.asset.get("id")
            }});
        tr.add_type_operation("call_order_update", {
            "fee": {
                amount: 0,
                asset_id: 0
            },
            "funding_account": this.props.account,
            "delta_collateral": {
                "amount": parseInt(this.state.collateral * backingPrecision - currentPosition.collateral, 10),
                "asset_id": this.props.backing_asset.get("id")
            },
            "delta_debt": {
                "amount": parseInt(this.state.short_amount * quotePrecision - currentPosition.debt, 10),
                "asset_id": this.props.asset.get("id")
            }});
        WalletDb.process_transaction(tr, null, true);

        ZfApi.publish(this.props.modalId, "close"); 
    }

    _getCurrentPosition() {
        let currentPosition = {
            collateral: 0,
            debt: 0
        };

        for (let key in this.props.call_orders) {
            if (this.props.call_orders.hasOwnProperty(key)) {
                if (this.props.asset.get("id") === this.props.call_orders[key].getIn(["call_price", "quote", "asset_id"])) {
                    currentPosition = this.props.call_orders[key].toJS();
                }
            }
        }

        return currentPosition;
    }

    _getFeedPrice() {
        return utils.get_asset_price(
            this.props.bitasset_data.getIn(["current_feed", "settlement_price", "quote", "amount"]),
            this.props.backing_asset,
            this.props.bitasset_data.getIn(["current_feed", "settlement_price", "base", "amount"]),
            this.props.asset
        );
    }

    _getCollateralRatio(debt, collateral) {
        return collateral / (debt / this._getFeedPrice());
    }

    render() {
        let {asset, bitasset_data, bitasset_balance, backing_asset, backing_balance} = this.props;
        let {short_amount, collateral, collateral_ratio, errors, isValid} = this.state;

        // console.log("asset:", asset.toJS(), "bitasset_data:", bitasset_data.toJS(), "bitasset_balance:", bitasset_balance);
        
        // let currentPosition = this._getCurrentPosition();
        bitasset_balance = !bitasset_balance ? {balance: 0, id: null} : bitasset_balance.toJS();
        backing_balance = !backing_balance ? {balance: 0, id: null} : backing_balance.toJS();

        let collateralClass = classNames("form-group", {"has-error": errors.collateral_balance});
        let buttonClass = classNames("button", {disabled: errors.collateral_balance || !isValid});
        
        let bitAssetBalanceText = <span><Translate component="span" content="transfer.available"/>: {bitasset_balance.id ? <BalanceComponent balance={bitasset_balance.id}/> : <FormattedAsset amount={0} asset={asset.get("id")} />}</span>;
        let backingBalanceText = <span><Translate component="span" content="transfer.available"/>: {backing_balance.id ? <BalanceComponent balance={backing_balance.id}/> : <FormattedAsset amount={0} asset={backing_asset.get("id")} />}</span>;
        
        let feed_price = this._getFeedPrice();

        if (isNaN(feed_price)) {
            return (
                <div>
                    <h3>No valid feeds for {asset.get("symbol")}</h3>
                </div>)
        }

        return (
            <div>
                <h3>Borrow {asset.get("symbol")}</h3>
                <form className="grid-container no-overflow" noValidate>
                    <div style={{paddingBottom: "1rem"}}>
                        <div>Feed price:&nbsp;
                            <FormattedPrice
                                style={{fontWeight: "bold"}}
                                quote_amount={bitasset_data.getIn(["current_feed", "settlement_price", "quote", "amount"])}
                                quote_asset={bitasset_data.getIn(["current_feed", "settlement_price", "quote", "asset_id"])}
                                base_asset={bitasset_data.getIn(["current_feed", "settlement_price", "base", "asset_id"])}
                                base_amount={bitasset_data.getIn(["current_feed", "settlement_price", "base", "amount"])}
                            />
                        </div>
                    </div>
                    <div style={{width: "75%"}} className="form-group">
                        <AmountSelector label="transaction.borrow_amount"
                                        amount={short_amount}
                                        onChange={this._onBorrowChange.bind(this)}
                                        asset={asset.get("id")}
                                        assets={[asset.get("id")]}
                                        display_balance={bitAssetBalanceText}
                                        tabIndex={1}/>
                    </div>
                    <div style={{width: "75%"}} className={collateralClass}>
                        <AmountSelector label="transaction.collateral"
                                        amount={collateral}
                                        onChange={this._onCollateralChange.bind(this)}
                                        asset={backing_asset.get("id")}
                                        assets={[backing_asset.get("id")]}
                                        display_balance={backingBalanceText}
                                        tabIndex={1}/>
                        <div>{errors.collateral_balance}</div>
                    </div>
                    <div style={{width: "75%"}} className="form-group">
                        <label>Collateral ratio:</label>
                        <input min="0" max="6" step="0.05" onChange={this._onRatioChange.bind(this)} value={collateral_ratio} type="range"/>
                        <span>{utils.format_number(collateral_ratio, 2)}</span>
                    </div>
                    <div className="grid-content button-group no-overflow">
                        <a onClick={this._onSubmit.bind(this)} href className={buttonClass}>BORROW</a>
                        <Trigger close={this.props.modalId}>
                            <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                        </Trigger>
                    </div>
                </form>
            </div>
        );
    }
}

/* This wrapper class is necessary because the decorator hides the show method from refs */
export default class ModalWrapper extends React.Component {

    show() {
        ZfApi.publish(this.props.modalId, "open");
    }

    render() {
        return (
            <Modal id={this.props.modalId} overlay={true}>
                <Trigger close={this.props.modalId}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical">                        
                        <BorrowModalContent {...this.props} />
                    
                </div>
            </Modal>
            );
    }
}
