import React from "react";
import classNames from "classnames";
import FormattedAsset from "../Utility/FormattedAsset";
import AccountActions from "actions/AccountActions";
import AssetStore from "stores/AssetStore";
import AccountStore from "stores/AccountStore";
import ConfirmModal from "../Modal/ConfirmModal";
import AccountSelect from "../Forms/AccountSelect";
import AccountInfo from "../Account/AccountInfo";
import BaseComponent from "../BaseComponent";
import lzma from "lzma";
import bs58 from "common/base58";

// invoice example:
//{
//    "to" : "merchant_account_name",
//    "to_label" : "Merchant Name",
//    "currency": "TEST",
//    "memo" : "Invoice #1234",
//    "line_items" : [
//        { "label" : "Something to Buy", "quantity": 1, "price" : "1000.00" },
//        { "label" : "10 things to Buy", "quantity": 10, "price" : "1000.00" }
//    ],
//    "note" : "Something the merchant wants to say to the user",
//    "callback" : "https://merchant.org/complete"
//}
// http://localhost:8080/#/invoice/8Cv8ZjMa8XCazX37XgNhj4jNc4Z5WgZFM5jueMEs2eEvL3pEmELjAVCWZEJhj9tEG5RuinPCjY1Fi34ozb8Cg3H5YBemy9JoTRt89X1QaE76xnxWPZzLcUjvUd4QZPjCyqZNxvrpCN2mm1xVRY8FNSVsoxsrZwREMyygahYz8S23ErWPRVsfZXTwJNCCbqjWDTReL5yytTKzxyKhg4YrnntYG3jdyrBimDGBRLU7yRS9pQQLcAH4T7j8LXkTocS7w1Zj4amckBmpg5EJCMATTRhtH8RSycfiXWZConzqqzxitWCxZK846YHNh

class Invoice extends BaseComponent {

    constructor(props) {
        super(props, AccountStore);
        this.state = {invoice: null, pay_from_account: null};
    }

    shouldComponentUpdate(nextProps, nextState) {
        return nextState.searchAccounts !== this.state.searchAccounts
    }

    findAccountId(account_name) {
        let account_id = this.state.searchAccounts.findKey(a => a === account_name);
        return account_id;
    }

    componentDidMount() {
        let compressed_data = bs58.decode(this.props.params.data);
        lzma.decompress(compressed_data, result => {
            let invoice = JSON.parse(result);
            AccountActions.accountSearch(invoice.to);
            this.setState({invoice: invoice});
        });
    }

    parsePrice(price) {
        let m = price.match(/([\d\,\.\s]+)/);
        if(!m || m.length < 2) 0.0;
        return parseFloat(m[1].replace(/[\,\s]/g,""));
    }

    getTotal(items) {
        if(!items || items.length === 0) return 0.0;
        let total_amount = items.reduce( (total, item) => {
            let price = this.parsePrice(item.price);
            if(!price) return total;
            return total + item.quantity * price;
        }, 0.0);
        return total_amount;
    }

    onPayClick(e) {
        e.preventDefault();
        let total_amount = this.getTotal(this.state.invoice.line_items);
        let content = `Pay ${total_amount} ${this.state.invoice.currency} to ${this.state.invoice.to} from account ${this.refs.pay_from.value()}`;
        this.refs.confirm_modal.show(content, "Confirm Payment", this.onConfirmPayment.bind(this));
    }

    onConfirmPayment() {
        let total_amount = this.getTotal(this.state.invoice.line_items);
        let asset = AssetStore.getAsset(this.state.invoice.currency);
        let precision = utils.get_asset_precision(asset.precision);
        // TODO: finish transfer and redirect to transfer confirmation page
        let account_store_state = AccountStore.getState();
        let from_id = account_store_state.account_name_to_id[this.state.pay_from_account];
        let to_id = this.findAccountId(this.state.invoice.to);
        let memo = this.state.invoice.memo;
        console.log("[Invoice.jsx:89] ----- onConfirmPayment ----->", from_id, to_id, total_amount * precision, asset.id, memo);
        AccountActions.transfer(from_id, to_id, total_amount * asset.preciosion, asset.id, memo).then(() => {
            console.log("[Invoice.jsx:91] ----- success ----->");
            //this.setState({confirmation: false, done: true, error: null});
        }).catch(error => {
            console.log("[Invoice.jsx:94] ----- error ----->");
        });
    }

    onAccountChange(account_name) {
        this.setState({pay_from_account: account_name});
    }

    render() {
        if(!this.state.invoice) return (<div>Reading invoice data...</div>);
        let invoice = this.state.invoice;
        let total_amount = this.getTotal(invoice.line_items);
        let asset = AssetStore.getAsset(this.state.invoice.currency);
        let account_id = this.findAccountId(invoice.to);
        console.log("[Invoice.jsx:93] ----- render ----->", total_amount, asset, account_id);
        let items = invoice.line_items.map( i => {
            let price = this.parsePrice(i.price);
            let amount = i.quantity * price;
            return (
                <tr>
                    <td>
                        <div className="item-name">{i.label}</div>
                        <div className="item-description">{i.quantity} x {<FormattedAsset amount={i.price} asset={asset} exact_amount={true}/>}</div>
                    </td>
                    <td><FormattedAsset amount={amount} asset={asset} exact_amount={true} /></td>
                </tr>
            );
        });
        let account_store_state = AccountStore.getState();
        let accounts = account_store_state.myAccounts.map(name => name);
        let payButtonClass = classNames("button", {disabled: !this.state.pay_from_account || !account_id});
        return (
            <div className="grid-block vertical">
                <div className="grid-content">
                    <div className="content-block invoice">
                        <br/>
                        <h3>{invoice.memo}</h3>
                        <br/>
                        <div>
                            {account_id ? <AccountInfo title={invoice.to_label} account_name={invoice.to} account_id={account_id} image_size={{height: 120, width: 120}}/> : null}
                            <br/>
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Items</th>
                                        <th>Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items}
                                    <tr>
                                        <td className="text-right">Total:</td>
                                        <td><FormattedAsset amount={total_amount} asset={asset} exact_amount={true} /></td>
                                    </tr>
                                </tbody>
                            </table>
                            <br/>
                            <form>
                                <label>Pay from account</label>
                                <AccountSelect ref="pay_from" account_names={accounts} onChange={this.onAccountChange.bind(this)}/>
                                <a href className={payButtonClass} onClick={this.onPayClick.bind(this)}>
                                    Pay <FormattedAsset amount={total_amount} asset={asset} exact_amount={true} /> to {invoice.to}
                                </a>
                            </form>
                        </div>
                    </div>
                </div>
                <ConfirmModal modalId="confirm_modal" ref="confirm_modal"/>
            </div>
        );
    }
}

export default Invoice;
