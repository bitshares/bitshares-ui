import React from "react";
import classNames from "classnames";
import FormattedAsset from "../Utility/FormattedAsset";
import AssetStore from "actions/AccountActions";
import AssetStore from "stores/AssetStore";
import AccountStore from "stores/AccountStore";
import ConfirmModal from "../Modal/ConfirmModal";
import AccountSelect from "../Account/AccountSelect"

let invoice = {
    "to" : "merchant_account_name",
    "to_label" : "Merchant Name",
    "memo" : "Invoice #1234",
    "line_items" : [
        { "label" : "Something to Buy", "quantity": 1, "price" : "1000.00 TEST" },
        { "label" : "10 things to Buy", "quantity": 10, "price" : "1000.00 TEST" }
    ],
    "note" : "Something the merchant wants to say to the user",
    "callback" : "https://merchant.org/complete"
};


class Invoice extends React.Component {
    constructor() {
        super();
        this.state = {invoice: invoice};
    }

    parsePrice(price) {
        let m = price.match(/([\d\,\.\s]+)\s?(\w+)/);
        if(!m || m.length < 3) return [0, null];
        return [parseFloat(m[1].replace(/[\,\s]/g,"")), m[2]];
    }

    getTotal(items) {
        if(!items || items.length === 0) return 0.0;
        let [_, price_symbol] = this.parsePrice(items[0].price);
        let total_amount = items.reduce( (total, item) => {
            let [price, symbol] = this.parsePrice(item.price);
            console.log("[Invoice.jsx:34] ----- price, symbol ----->", price, symbol);
            if(!symbol || !price || symbol !== price_symbol) return total;
            return total + item.quantity * price;
        }, 0.0);
        return [total_amount, price_symbol];
    }

    onPayClick(e) {
        e.preventDefault();
        let [total_amount, total_symbol] = this.getTotal(this.state.invoice.line_items);
        let content = `Pay ${total_amount} ${total_symbol} to ${this.state.invoice.to} from account ${this.refs.pay_from.value()}`;
        this.refs.confirm_modal.show(content, "Confirm Payment", this.onConfirmPayment);
    }

    onConfirmPayment() {
        let [total_amount, total_symbol] = this.getTotal(this.state.invoice.line_items);
        // TODO: finish transfer and redirect to transfer confirmation page
        //AccountActions.transfer(t.from_id, t.to_id, t.amount * precision, t.asset, t.memo).then(() => {
        //    ZfApi.publish("confirm_transaction", "close");
        //    this.setState({confirmation: false, done: true, error: null});
        //}).catch(error => {
        //    ZfApi.publish("confirm_transaction", "close");
        //    this.setState({confirmation: false, done: false});
        //    this.props.addNotification({
        //        message: "Transfer failed",
        //        level: "error",
        //        autoDismiss: 10
        //    });
        //});
    }

    render() {
        let invoice = this.state.invoice;
        let [total_amount, total_symbol] = this.getTotal(invoice.line_items);
        let asset = AssetStore.getAsset(total_symbol);
        let items = invoice.line_items.map( i => {
            let [price, symbol] = this.parsePrice(i.price);
            let amount = i.quantity * price;
            return (
                <tr>
                    <td>{i.label}</td>
                    <td>{i.quantity}</td>
                    <td>{i.price}</td>
                    <td><FormattedAsset amount={amount} asset={asset} exact_amount={true} /></td>
                </tr>
            );
        });
        let accounts = AccountStore.getState().linkedAccounts.map(name => name);
        console.log("[Invoice.jsx:75] ----- render ----->", accounts);
        return (
            <div className="grid-block vertical">
                <div className="grid-content">
                    <div className="content-block">
                        <br/>
                        <h3>{invoice.memo}</h3>
                        <br/>
                        <div>
                            Pay to <b>{invoice.to_label}</b> ({invoice.to})
                            <br/>
                            <br/>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Item</th>
                                        <th>Quantity</th>
                                        <th>Price</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items}
                                    <tr>
                                        <td colSpan="3" className="text-right">Total</td>
                                        <td><FormattedAsset amount={total_amount} asset={asset} exact_amount={true} /></td>
                                    </tr>
                                </tbody>
                            </table>
                            <br/>
                            Pay from account
                            <div className="medium-2"><AccountSelect ref="pay_from" account_names={accounts}/></div>
                            <br/>
                            <a href className="button" onClick={this.onPayClick.bind(this)}>
                                Pay <FormattedAsset amount={total_amount} asset={asset} exact_amount={true} /> to {invoice.to}
                            </a>
                        </div>
                    </div>
                </div>
                <ConfirmModal modalId="confirm_modal" ref="confirm_modal"/>
            </div>
        );
    }
}

export default Invoice;
