import React from "react";
import classNames from "classnames";
import FormattedAsset from "../Utility/FormattedAsset";
import AccountActions from "actions/AccountActions";
import AccountSelector from "../Account/AccountSelector";
import AccountInfo from "../Account/AccountInfo";
import BalanceComponent from "../Utility/BalanceComponent";
import {ChainStore, FetchChainObjects} from "graphenejs-lib";;
import NotificationActions from "actions/NotificationActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import {decompress} from "lzma";
import bs58 from "common/base58";
import utils from "common/utils";

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

class Invoice extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            invoice: null,
            pay_from_name: null,
            pay_from_account: null,
            error: null
        };
        this.onBroadcastAndConfirm = this.onBroadcastAndConfirm.bind(this);
    }

    componentDidMount() {
        let compressed_data = bs58.decode(this.props.params.data);
        try {
            decompress(compressed_data, result => {
                let invoice = JSON.parse(result);
                FetchChainObjects(ChainStore.getAsset, [invoice.currency]).then(assets_array => {
                    this.setState({invoice, asset: assets_array[0]});
                });
            });
        } catch(error) {
            console.dir(error);
            this.setState({error: error.message});
        }
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

    onBroadcastAndConfirm(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            TransactionConfirmStore.unlisten(this.onBroadcastAndConfirm);
            TransactionConfirmStore.reset();
            if(this.state.invoice.callback) {
                let trx =  confirm_store_state.broadcasted_transaction;
                let url = `${this.state.invoice.callback}?block=${trx.ref_block_num}&trx=${trx.id()}`;
                window.location.href = url;
            }
        }
    }

    onPayClick(e) {
        e.preventDefault();
        let asset = this.state.asset;
        let precision = utils.get_asset_precision(asset.get("precision"));
        let amount = this.getTotal(this.state.invoice.line_items);
        let to_account = ChainStore.getAccount(this.state.invoice.to);
        if(!to_account) {
            NotificationActions.error(`Account ${this.state.invoice.to} not found`);
            return;
        }
        AccountActions.transfer(
            this.state.pay_from_account.get("id"),
            to_account.get("id"),
            parseInt(amount * precision, 10),
            asset.get("id"),
            this.state.invoice.memo
        ).then( () => {
                TransactionConfirmStore.listen(this.onBroadcastAndConfirm);
            }).catch( e => {
                console.log( "error: ",e)
            } );
    }

    fromChanged(pay_from_name) {
        this.setState({pay_from_name});
    }

    onFromAccountChanged(pay_from_account) {
        this.setState({pay_from_account});
    }

    render() {
        console.log("-- Invoice.render -->", this.state.invoice);
        if(this.state.error) return(<div><br/><h4 className="has-error text-center">{this.state.error}</h4></div>);
        if(!this.state.invoice) return null;
        if(!this.state.asset) return (<div><br/><h4 className="has-error text-center">Asset {this.state.invoice.currency} is not supported by this blockchain.</h4></div>);

        let invoice = this.state.invoice;
        let total_amount = this.getTotal(invoice.line_items);
        let asset = this.state.invoice.currency;
        let balance = null;
        if(this.state.pay_from_account) {
            let balances = this.state.pay_from_account.get("balances");
            console.log("-- Invoice.render balances -->", balances.get(this.state.asset.get("id")));
            balance = balances.get(this.state.asset.get("id"));
        }
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
        let payButtonClass = classNames("button", {disabled: !this.state.pay_from_account});
        return (
            <div className="grid-block vertical">
                <div className="grid-content">
                    <div className="content-block invoice">
                        <br/>
                        <h3>Pay Invoice</h3>
                        <h4>{invoice.memo}</h4>
                        <br/>
                        <div>
                            <AccountInfo title={invoice.to_label} account={invoice.to} image_size={{height: 80, width: 80}}/>
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
                            <br/>

                            <form>
                                <div className="grid-block">
                                    <div className="grid-content medium-4">
                                        {/*<AccountSelect ref="pay_from" account_names={accounts} onChange={this.onAccountChange.bind(this)}/>*/}
                                        <AccountSelector label="transfer.pay_from"
                                                         accountName={this.state.pay_from_name}
                                                         onChange={this.fromChanged.bind(this)}
                                                         onAccountChanged={this.onFromAccountChanged.bind(this)}
                                                         account={this.state.pay_from_name}/>
                                    </div>
                                    {this.state.pay_from_account ?
                                        <div className="grid-content medium-1">
                                            <label>Balance</label>
                                            <BalanceComponent balance={balance}/>
                                        </div> : null
                                    }
                                </div>
                                <br/>
                                <a href className={payButtonClass} onClick={this.onPayClick.bind(this)}>
                                    Pay <FormattedAsset amount={total_amount} asset={asset} exact_amount={true}/> to {invoice.to}
                                </a>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

export default Invoice;
