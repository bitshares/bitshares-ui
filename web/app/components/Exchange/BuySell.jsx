import React from "react";
import {PropTypes} from "react";
import classNames from "classnames";
import utils from "common/utils";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ChainTypes from "../Utility/ChainTypes";
import BindToChainState from "../Utility/BindToChainState";
import PriceText from "../Utility/PriceText";
import AssetName from "../Utility/AssetName";
import SimpleDepositWithdraw from "../Dashboard/SimpleDepositWithdraw";
import {Asset} from "common/MarketClasses";

class BuySell extends React.Component {

    static propTypes = {
        balance: ChainTypes.ChainObject,
        type: PropTypes.string,
        amountChange: PropTypes.func.isRequired,
        priceChange: PropTypes.func.isRequired,
        onSubmit: PropTypes.func.isRequired
    };

    static defaultProps = {
        type: "bid"
    };

    shouldComponentUpdate(nextProps) {
        return (
                nextProps.amount !== this.props.amount ||
                nextProps.total !== this.props.total ||
                nextProps.currentPrice !== this.props.currentPrice ||
                nextProps.price !== this.props.price ||
                nextProps.balance !== this.props.balance ||
                nextProps.account !== this.props.account ||
                nextProps.className !== this.props.className ||
                (nextProps.fee && this.props.fee ? nextProps.fee.ne(this.props.fee) : false) ||
                nextProps.isPredictionMarket !== this.props.isPredictionMarket ||
                nextProps.feeAsset !== this.props.feeAsset ||
                nextProps.isOpen !== this.props.isOpen
            );
    }

    _addBalance(balance) {
        console.log("_addBalance:", balance);
        if (this.props.type === "bid") {
            this.props.totalChange({target: {value: balance.getAmount({real: true}).toString()}});
        } else {
            this.props.amountChange({target: {value: balance.getAmount({real: true}).toString()}});
        }
    }

    _setPrice(price) {
        this.props.priceChange({target: {value: price.toString()}});
    }

    _onDeposit(e) {
        e.preventDefault();
        this.refs.deposit_modal.show();
    }

    render() {
        let {type, quote, base, amountChange, fee, isPredictionMarket,
            priceChange, onSubmit, balance, totalChange,
            balancePrecision, currentPrice, currentPriceObject,
            feeAsset, feeAssets, backedCoin} = this.props;
        let amount = 0, price = 0, total = 0;
        let caret = this.props.isOpen ? <span>&#9660;</span> : <span>&#9650;</span>;

        if (this.props.amount) amount = this.props.amount;
        if (this.props.price) price = this.props.price;
        if (this.props.total) total = this.props.total;

        let balanceAmount = new Asset({amount: balance ? balance.get("balance") : 0, precision: balancePrecision, asset_id: this.props.balanceId});
        // if (!balanceAmount) {
        //     balanceAmount = 0;
        // }

        let hasBalance = type === "bid" ? balanceAmount.getAmount() >= parseFloat(total) : balanceAmount >= parseFloat(amount);

        let buttonText = isPredictionMarket ? counterpart.translate("exchange.short") : type === "bid" ? counterpart.translate("exchange.buy") : counterpart.translate("exchange.sell");
        let forceSellText = type === "bid" ? counterpart.translate("exchange.buy") : counterpart.translate("exchange.sell");

        let noBalance = isPredictionMarket ? false : !(balanceAmount.getAmount() > 0 && hasBalance);
        let invalidPrice = !(price > 0);
        let invalidAmount = !(amount >0);

        let disabled = noBalance || invalidPrice || invalidAmount;

        let buttonClass = classNames("button buySellButton", type, {disabled: disabled});
        let balanceSymbol = type === "bid" ? base.get("symbol") : quote.get("symbol");

        let disabledText = invalidPrice ? counterpart.translate("exchange.invalid_price") :
                           invalidAmount ? counterpart.translate("exchange.invalid_amount") :
                           noBalance ? counterpart.translate("exchange.no_balance") :
                           null;

        // Fee asset selection
        if( feeAssets[1] && feeAssets[1].getIn(["options", "core_exchange_rate", "quote", "asset_id"]) === "1.3.0" && feeAssets[1].getIn(["options", "core_exchange_rate", "base", "asset_id"]) === "1.3.0" ) {
            feeAsset = feeAssets[0];
            feeAssets.splice(1, 1);
        }
        let index = 0;
        let options = feeAssets.map(asset => {
            let {name, prefix} = utils.replaceName(asset.get("symbol"), asset.get("bitasset") && !asset.getIn(["bitasset", "is_prediction_market"]) && asset.get("issuer") === "1.2.0");
            return <option key={asset.get("id")} value={index++}>{prefix}{name}</option>;
        });

        // Subtract fee from amount to sell
        let balanceToAdd;

        if (this.props.feeAsset.get("symbol") === balanceSymbol) {
            balanceToAdd = balanceAmount.clone(balanceAmount.getAmount() - fee.getAmount());
        } else {
            balanceToAdd = balanceAmount;
        }

        return (
            <div className={this.props.className}>
                <div className="exchange-bordered buy-sell-container">
                    <div className={"exchange-content-header " + type}>
                        <span>{buttonText} <AssetName name={quote.get("symbol")} /></span>
                        {this.props.onFlip ? <span onClick={this.props.onFlip} style={{cursor: "pointer", fontSize: "1rem"}}>  &#8646;</span> : null}
                        {this.props.onTogglePosition ? <span onClick={this.props.onTogglePosition} style={{cursor: "pointer", fontSize: "1rem"}}>  &#8645;</span> : null}
                        {this.props.backedCoin ? <div className="float-right buy-sell-deposit"><a onClick={this._onDeposit.bind(this)}>Deposit <span className="asset-name">{this.props.backedCoin.backingCoinType}</span></a></div> : null}
                        {<div onClick={this.props.onToggleOpen} className="float-right clickable hide-for-xlarge">{caret}</div>}
                    </div>

                    <form className={(!this.props.isOpen ? "hide-container " : "") + "order-form"} noValidate>
                        <div className="grid-block vertical no-overflow no-padding">

                                <div className="grid-block no-padding buy-sell-row">
                                    <div className="grid-block small-3 no-margin no-overflow buy-sell-label">
                                        <Translate content="exchange.price" />:
                                    </div>
                                    <div className="grid-block small-6 no-margin no-overflow buy-sell-input">
                                        <input type="number" id="buyPrice" value={price} onChange={priceChange} autoComplete="off" placeholder="0.0"/>
                                    </div>
                                    <div className="grid-block small-3 no-margin no-overflow buy-sell-box">
                                        <AssetName name={base.get("symbol")} />
                                    </div>
                                </div>

                                <div className="grid-block no-padding buy-sell-row">
                                    <div className="grid-block small-3 no-margin no-overflow buy-sell-label">
                                        <Translate content="transfer.amount" />:
                                    </div>
                                    <div className="grid-block small-6 no-margin no-overflow buy-sell-input">
                                        <input type="number" id="buyAmount" value={amount} onChange={amountChange} autoComplete="off" placeholder="0.0"/>
                                    </div>
                                    <div className="grid-block small-3 no-margin no-overflow buy-sell-box">
                                        <AssetName name={quote.get("symbol")} />
                                    </div>
                                </div>

                                <div className="grid-block buy-sell-row bottom-row">
                                    <div className="grid-block small-3 no-margin no-overflow buy-sell-label">
                                        <Translate content="exchange.total" />:
                                    </div>
                                    <div className="grid-block small-6 no-margin no-overflow buy-sell-input">
                                        <input type="number" id="buyAmount" value={total} onChange={totalChange} autoComplete="off" placeholder="0.0"/>
                                    </div>
                                    <div className="grid-block small-3 no-margin no-overflow buy-sell-box">
                                        <AssetName name={base.get("symbol")} />
                                    </div>
                                </div>

                                <div className="grid-block no-padding buy-sell-row">
                                    <div className="grid-block small-3 no-margin no-overflow buy-sell-label">
                                        <Translate content="transfer.fee" />:
                                    </div>
                                    <div className="grid-block small-6 no-margin no-overflow buy-sell-input">
                                        <input disabled type="text" id="fee" value={fee.getAmount({real: true})} autoComplete="off"/>
                                    </div>
                                    <div className="grid-block small-3 no-margin no-overflow buy-sell-box" style={{paddingLeft: feeAssets.length !== 1 ? 0 : 5}}>
                                        <select
                                            style={feeAssets.length === 1 ? {background: "none"} : null}
                                            disabled={feeAssets.length === 1}
                                            value={feeAssets.indexOf(this.props.feeAsset)}
                                            className={"form-control" + (feeAssets.length !== 1 ? " buysell-select" : "")}
                                            onChange={this.props.onChangeFeeAsset}
                                        >
                                            {options}
                                        </select>
                                    </div>

                                </div>

                            </div>
                            <div>
                                <div className="grid-content clear-fix no-padding">

                                    <table className="float-left">
                                        <tbody>
                                          <tr className="buy-sell-info">
                                                <td><Translate content="exchange.balance" />:</td>
                                                <td style={{paddingLeft: 5, textAlign: "right"}}>
                                                    <span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this._addBalance.bind(this, balanceToAdd)}>
                                                        {utils.format_number(balanceAmount.getAmount({real: true}), balancePrecision)} <AssetName name={balanceSymbol} />
                                                    </span>
                                                </td>
                                          </tr>

                                          <tr className="buy-sell-info">
                                                <td style={{paddingTop: 5}}>{this.props.type === "bid" ? <Translate content="exchange.lowest_ask" /> : <Translate content="exchange.highest_bid" />}:&nbsp;</td>
                                                {currentPrice ? (
                                                <td style={{paddingLeft: 5, textAlign: "right", paddingTop: 5, verticalAlign: "bottom"}}>
                                                    <span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={this.props.setPrice.bind(this, type, currentPriceObject.sellPrice())}>
                                                    <PriceText price={currentPrice} quote={quote} base={base} /> <AssetName name={base.get("symbol")} />
                                                    </span>
                                                </td>) : null}
                                        </tr>
                                        </tbody>
                                    </table>

                                    {/* BUY/SELL button */}
                                    {disabledText ?
                                        (<div className="float-right" data-tip={disabledText} data-place="right">
                                            <input style={{margin: 0}} className={buttonClass} type="submit" onClick={onSubmit.bind(this, true)} value={buttonText} />
                                        </div>) :
                                        (<div className="float-right" data-tip={""}>
                                            <input style={{margin: 0}} className={buttonClass} type="submit" onClick={onSubmit.bind(this, true)} value={buttonText} />
                                        </div>)
                                    }

                                {/* SHORT button */}
                                    {disabledText && isPredictionMarket ? (
                                        <div style={{paddingRight: 10}} className="float-right" data-tip={disabledText} data-place="right">
                                            <input style={{margin: 0}} className={buttonClass} type="submit" onClick={onSubmit.bind(this, false)} value={forceSellText} />
                                        </div>) : isPredictionMarket ? (
                                        <div style={{paddingRight: 10}} className="float-right" data-tip={""}>
                                            <input style={{margin: 0}} className={buttonClass} type="submit" onClick={onSubmit.bind(this, false)} value={forceSellText} />
                                        </div>) : null
                                    }

                                  </div>
                            </div>

                    </form>
                </div>
                <SimpleDepositWithdraw
                    ref="deposit_modal"
                    action="deposit"
                    fiatModal={false}
                    account={this.props.currentAccount.get("name")}
                    sender={this.props.currentAccount.get("id")}
                    asset={this.props[type === "bid" ? "base" : "quote"].get("id")}
                    modalId={"simple_deposit_modal" + (type === "bid" ? "" : "_ask")}
                    balances={[this.props.balance]}
                    {...backedCoin}
                />
            </div>
        );
    }
}

export default BindToChainState(BuySell, {keep_updating: true});
