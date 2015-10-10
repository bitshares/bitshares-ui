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
import counterpart from "counterpart";
import HelpContent from "../Utility/HelpContent";
import Immutable from "immutable";

let wallet_api = new WalletApi();

/**
 *  Given an account and an asset id, render a modal allowing modification of a margin position for that asset
 *
 *  Expected Properties:
 *     quote_asset:  asset id, must be a bitasset
 *     account: full_account object for the account to use
 *
 */

@BindToChainState({keep_updating: true})
class BorrowModalContent extends React.Component {

    static propTypes = {
        quote_asset: ChainTypes.ChainAsset.isRequired,
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
            isValid: false,
            original_position: {
                debt: 0,
                collateral: 0
            }
        };
    }

    componentDidMount() {
        let currentPosition = this._getCurrentPosition();
        let debt = utils.get_asset_amount(currentPosition.debt, this.props.quote_asset);
        let collateral = utils.get_asset_amount(currentPosition.collateral, this.props.backing_asset);

        if (currentPosition.collateral) {
            let newState = {
                short_amount: debt ? debt.toString() : null,
                collateral: collateral ? collateral.toString() : null,
                collateral_ratio: this._getCollateralRatio(debt, collateral),
                original_position: {
                    debt: debt,
                    collateral: collateral
                }
            };

            this.setState(newState);
            this._setUpdatedPosition(newState);
        }
    }

    shouldComponentUpdate(nextProps, nextState) {
        // console.log("nextProps:", nextProps);
        // console.log("state not equal:", !utils.are_equal_shallow(nextState, this.state));
        // console.log("props equal:", utils.are_equal_shallow(nextProps, this.props));
        // console.log("bitasset not equal:", !Immutable.is(nextProps.quote_asset.get("bitasset"), this.props.quote_asset.get("bitasset")))
        // console.log("backing asset not equal:", !nextProps.backing_asset.get("symbol") === this.props.backing_asset.get("symbol"))
        return (
            !utils.are_equal_shallow(nextState, this.state) ||
            !Immutable.is(nextProps.quote_asset.get("bitasset"), this.props.quote_asset.get("bitasset")) ||
            !nextProps.backing_asset.get("symbol") === this.props.backing_asset.get("symbol")
        );
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
        this._setUpdatedPosition(newState);
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
        this._setUpdatedPosition(newState);
    }

    _onRatioChange(e) {
        let feed_price = this._getFeedPrice();

        let ratio = e.target.value;

        let newState = {
            short_amount: this.state.short_amount,
            collateral: ((this.state.short_amount / feed_price) * ratio).toString(),
            collateral_ratio: ratio
        }

        this.setState(newState);
        this._validateFields(newState);
        this._setUpdatedPosition(newState);
    }

    _setUpdatedPosition(newState) {
        this.setState({
            newPosition: (parseFloat(newState.short_amount) / parseFloat(newState.collateral))
        });
    }


    _validateFields(newState) {
        let errors = this._getInitialErrors();
        let {original_position} = this.state;
        let backing_balance = !this.props.backing_balance ? {balance: 0} : this.props.backing_balance.toJS();


        if ( (parseFloat(newState.collateral)-original_position.collateral) > utils.get_asset_amount(backing_balance.balance, this.props.backing_asset.toJS())) {
            errors.collateral_balance = counterpart.translate("borrow.errors.collateral");
        }

        let isValid = (newState.short_amount > 0 && newState.collateral > 0) && (newState.short_amount != original_position.debt || newState.collateral != original_position.collateral);

        if (parseFloat(newState.collateral_ratio) < (this.props.quote_asset.getIn(["bitasset", "current_feed", "maintenance_collateral_ratio"]) / 1000)) {
            errors.below_maintenance = counterpart.translate("borrow.errors.below");
        }

        this.setState({errors, isValid});
    }

    _onSubmit(e) {
        e.preventDefault();
        
        let quotePrecision = utils.get_asset_precision(this.props.quote_asset.get("precision"));
        let backingPrecision = utils.get_asset_precision(this.props.backing_asset.get("precision"));
        let currentPosition = this._getCurrentPosition();

        var tr = wallet_api.new_transaction();
        // console.log("tr object:", {
        //     "fee": {
        //         amount: 0,
        //         asset_id: 0
        //     },
        //     "funding_account": this.props.account.get("id"),
        //     "delta_collateral": {
        //         "amount": parseInt(this.state.collateral * backingPrecision - currentPosition.collateral, 10),
        //         "asset_id": this.props.backing_asset.get("id")
        //     },
        //     "delta_debt": {
        //         "amount": parseInt(this.state.short_amount * quotePrecision - currentPosition.debt, 10),
        //         "asset_id": this.props.quote_asset.get("id")
        // }});
        tr.add_type_operation("call_order_update", {
            "fee": {
                amount: 0,
                asset_id: 0
            },
            "funding_account": this.props.account.get("id"),
            "delta_collateral": {
                "amount": parseInt(this.state.collateral * backingPrecision - currentPosition.collateral, 10),
                "asset_id": this.props.backing_asset.get("id")
            },
            "delta_debt": {
                "amount": parseInt(this.state.short_amount * quotePrecision - currentPosition.debt, 10),
                "asset_id": this.props.quote_asset.get("id")
            }});
        WalletDb.process_transaction(tr, null, true);

        ZfApi.publish(this.props.modalId, "close"); 
    }

    _getCurrentPosition() {
        let currentPosition = {
            collateral: null,
            debt: null
        };

        for (let key in this.props.call_orders) {
            if (this.props.call_orders.hasOwnProperty(key)) {
                if (this.props.quote_asset.get("id") === this.props.call_orders[key].getIn(["call_price", "quote", "asset_id"])) {
                    currentPosition = this.props.call_orders[key].toJS();
                }
            }
        }
        return currentPosition;
    }

    _getFeedPrice() {
        return 1 / utils.get_asset_price(
            this.props.quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "quote", "amount"]),
            this.props.backing_asset,
            this.props.quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "base", "amount"]),
            this.props.quote_asset
        );
    }

    _getCollateralRatio(debt, collateral) {
        return collateral / (debt / this._getFeedPrice());
    }

    render() {
        let {quote_asset, bitasset_balance, backing_asset, backing_balance} = this.props;
        let {short_amount, collateral, collateral_ratio, errors, isValid} = this.state;
        let quotePrecision = utils.get_asset_precision(this.props.quote_asset.get("precision"));
        let backingPrecision = utils.get_asset_precision(this.props.backing_asset.get("precision"));

        if (!collateral_ratio || isNaN(collateral_ratio) || !(collateral_ratio > 0.0 && collateral_ratio < 1000.0)) collateral_ratio = 0;
        bitasset_balance = !bitasset_balance ? {balance: 0, id: null} : bitasset_balance.toJS();
        backing_balance = !backing_balance ? {balance: 0, id: null} : backing_balance.toJS();

        let collateralClass = classNames("form-group", {"has-error": errors.collateral_balance});
        let collateralRatioClass = classNames("form-group", {"has-error": errors.below_maintenance});
        let buttonClass = classNames("button", {disabled: errors.collateral_balance || !isValid});
        
        let bitAssetBalanceText = <span><Translate component="span" content="transfer.available"/>: {bitasset_balance.id ? <BalanceComponent balance={bitasset_balance.id}/> : <FormattedAsset amount={0} asset={quote_asset.get("id")} />}</span>;
        let backingBalanceText = <span><Translate component="span" content="transfer.available"/>: {backing_balance.id ? <BalanceComponent balance={backing_balance.id}/> : <FormattedAsset amount={0} asset={backing_asset.get("id")} />}</span>;
        
        let feed_price = this._getFeedPrice();

        let maintenanceRatio = this.props.quote_asset.getIn(["bitasset", "current_feed", "maintenance_collateral_ratio"]) / 1000;
        let squeezeRatio = this.props.quote_asset.getIn(["bitasset", "current_feed", "maximum_short_squeeze_ratio"]) / 1000;

        if (isNaN(feed_price)) {
            return (
                <div>
                    <form className="grid-container text-center no-overflow" noValidate>
                        <Translate component="h3" content="borrow.no_valid" asset_symbol={quote_asset.get("symbol")} />
                    </form>
                    <div className="grid-content button-group text-center no-overflow">
                        <Trigger close={this.props.modalId}>
                            <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                        </Trigger>
                    </div>
                </div>)
        }



        return (
            <div>
                <form className="grid-container small-10 small-offset-1 no-overflow" noValidate>
                    <Translate component="h3" content="borrow.title" asset_symbol={quote_asset.get("symbol")} />
                    <HelpContent path="components/BorrowModal" debt={quote_asset.get('symbol')} collateral={backing_asset.get('symbol')} borrower={this.props.account.get('name')} />
                    <div style={{paddingBottom: "1rem"}}>
                        <div className="borrow-price-feeds">
                            <span className="borrow-price-label"><Translate content="transaction.feed_price" />:&nbsp;</span>
                            <FormattedPrice
                                style={{fontWeight: "bold"}}
                                quote_amount={quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "base", "amount"])}
                                quote_asset={quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "base", "asset_id"])}
                                base_asset={quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "quote", "asset_id"])}
                                base_amount={quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "quote", "amount"])}
                                />
                        </div>
                        <div className="borrow-price-feeds">
                            <span className="borrow-price-label"><Translate content="exchange.squeeze" />:&nbsp;</span>
                            <FormattedPrice
                                style={{fontWeight: "bold"}}
                                quote_amount={quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "base", "amount"])}
                                quote_asset={quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "base", "asset_id"])}
                                base_asset={quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "quote", "asset_id"])}
                                base_amount={squeezeRatio * quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "quote", "amount"])}
                                />
                        </div>
                        <div className="borrow-price-feeds">
                            <span className="borrow-price-label"><Translate content="exchange.maintenance" />:&nbsp;</span>
                            <FormattedPrice
                                style={{fontWeight: "bold"}}
                                quote_amount={quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "base", "amount"])}
                                quote_asset={quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "base", "asset_id"])}
                                base_asset={quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "quote", "asset_id"])}
                                base_amount={maintenanceRatio * quote_asset.getIn(["bitasset", "current_feed", "settlement_price", "quote", "amount"])}
                                />
                        </div>
                        <b/>
                        <div className="borrow-price-final">
                            <span className="borrow-price-label"><Translate content="exchange.your_price" />:&nbsp;</span>
                            {this.state.newPosition ?
                                <FormattedPrice
                                style={{fontWeight: "bold"}}
                                quote_amount={this.state.short_amount * quotePrecision}
                                quote_asset={quote_asset.get("id")}
                                base_asset={backing_asset.get("id")}
                                base_amount={this.state.collateral * backingPrecision}
                                /> : null}
                        </div>
                    </div>
                    <div className="form-group">
                        <AmountSelector label="transaction.borrow_amount"
                                        amount={short_amount}
                                        onChange={this._onBorrowChange.bind(this)}
                                        asset={quote_asset.get("id")}
                                        assets={[quote_asset.get("id")]}
                                        display_balance={bitAssetBalanceText}
                                        placeholder="0.0"
                                        tabIndex={1}/>
                    </div>
                    <div className={collateralClass}>
                        <AmountSelector label="transaction.collateral"
                                        amount={collateral}
                                        onChange={this._onCollateralChange.bind(this)}
                                        asset={backing_asset.get("id")}
                                        assets={[backing_asset.get("id")]}
                                        display_balance={backingBalanceText}
                                        placeholder="0.0"
                                        tabIndex={1}/>
                        {errors.collateral_balance ? <div style={{paddingTop: "0.5rem"}}>{errors.collateral_balance}</div> : null}
                    </div>
                    <div className={collateralRatioClass}>
                        <Translate component="label" content="borrow.coll_ratio" />
                        <input min="0" max="6" step="0.05" onChange={this._onRatioChange.bind(this)} value={collateral_ratio} type="range" disabled={!short_amount}/>
                        {errors.below_maintenance ? <div className="float-right">{errors.below_maintenance}</div> : null}
                        <div>{utils.format_number(collateral_ratio, 2)}</div>
                    </div>
                    <div className="grid-content button-group no-overflow">
                        <a onClick={this._onSubmit.bind(this)} href className={buttonClass}><Translate content="borrow.adjust" /></a>
                        <Trigger close={this.props.modalId}>
                            <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                        </Trigger>
                    </div>
                </form>
            </div>
        );
    }
}

// /* Wrapping the modal here in order to access the bitasset_data_id object inside the model */
// @BindToChainState({keep_updating: true})
// class QuoteAssetWrapper extends React.Component {
    
//     static propTypes = {
//         quote_asset: ChainTypes.ChainAsset.isRequired
//     }

//     render() {
//         return React.cloneElement(this.props.children,
//             {
//                 quote_asset: this.props.quote_asset,
//                 bitasset_data: this.props.quote_asset.get("bitasset_data_id")
//             }
//         );
//     }
// }

/* This wrapper class appears to be necessary because the decorator eats the show method from refs */
export default class ModalWrapper extends React.Component {

    show() {
        let modalId = "borrow_modal_" + this.props.quote_asset;
        ZfApi.publish(modalId, "open");
    }

    render() {

        let modalId = "borrow_modal_" + this.props.quote_asset;
        let accountBalance = this.props.account.get("balances").toJS();
        let coreBalance, bitAssetBalance;

        if (accountBalance) {
            for (var id in accountBalance) {

                if (id === "1.3.0") {
                    coreBalance = accountBalance[id];
                }

                if (id === this.props.quote_asset) {
                    bitAssetBalance = accountBalance[id];
                }                
            }
        }
              
        return (
            <Modal id={modalId} overlay={true}>
                <Trigger close={modalId}>
                    <a href="#" className="close-button">&times;</a>
                </Trigger>
                <div className="grid-block vertical">
                        <BorrowModalContent
                            {...this.props}
                            quote_asset={this.props.quote_asset}
                            call_orders={this.props.account.get("call_orders")}
                            modalId={modalId}
                            bitasset_balance={bitAssetBalance}
                            backing_balance={coreBalance}
                            backing_asset={"1.3.0"}
                        />
                </div>
            </Modal>
            );
    }
}
