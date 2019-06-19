import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import AccountActions from "actions/AccountActions";
import AccountSelector from "../Account/AccountSelector";
import BalanceComponent from "../Utility/BalanceComponent";
import {ChainStore, FetchChainObjects} from "bitsharesjs/es";
import NotificationActions from "actions/NotificationActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import {decompress} from "lzma";
import bs58 from "common/base58";
import utils from "common/utils";
import PrintReceiptButton from "./PrintReceiptButton.jsx";
import Translate from "react-translate-component";
import {Form, Button, Row, Col, Divider} from "bitshares-ui-style-guide";
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
            error: null,
            blockNum: null
        };
        this.onBroadcastAndConfirm = this.onBroadcastAndConfirm.bind(this);
        this.getTotal = this.getTotal.bind(this);
    }

    componentDidMount() {
        let compressed_data = bs58.decode(this.props.match.params.data);

        TransactionConfirmStore.unlisten(this.onBroadcastAndConfirm);
        TransactionConfirmStore.listen(this.onBroadcastAndConfirm);

        try {
            decompress(compressed_data, result => {
                let invoice = JSON.parse(result);
                FetchChainObjects(ChainStore.getAsset, [invoice.currency]).then(
                    assets_array => {
                        this.setState(
                            {invoice, asset: assets_array[0]},
                            this.getTotal
                        );
                    }
                );
            });
        } catch (error) {
            console.dir(error);
            this.setState({error: error.message});
        }
    }

    parsePrice(price) {
        let m = price.match(/([\d\,\.\s]+)/);
        if (!m || m.length < 2) 0.0;
        return parseFloat(m[1].replace(/[\,\s]/g, ""));
    }

    getTotal() {
        const items = this.state.invoice.line_items;
        if (!items || items.length === 0) return 0.0;
        let total_amount = items.reduce((total, item) => {
            let price = this.parsePrice(item.price);
            if (!price) return total;
            return total + item.quantity * price;
        }, 0.0);
        this.setState({total_amount});
    }

    onBroadcastAndConfirm(confirm_store_state) {
        if (
            confirm_store_state.included &&
            confirm_store_state.broadcasted_transaction
        ) {
            TransactionConfirmStore.unlisten(this.onBroadcastAndConfirm);
            TransactionConfirmStore.reset();
            this.setState({blockNum: confirm_store_state.trx_block_num});

            /*  if (this.state.invoice.callback) {
                let trx = confirm_store_state.broadcasted_transaction;
                let url = `${this.state.invoice.callback}?block=${
                    trx.ref_block_num
                }&trx=${trx.id()}`;
                window.location.href = url;
            }  */
        }
    }

    onPayClick(e) {
        e.preventDefault();
        let {asset, total_amount} = this.state;
        let precision = utils.get_asset_precision(asset.get("precision"));
        let to_account = ChainStore.getAccount(this.state.invoice.to);
        if (!to_account) {
            NotificationActions.error(
                `Account ${this.state.invoice.to} not found`
            );
            return;
        }
        AccountActions.transfer(
            this.state.pay_from_account.get("id"),
            to_account.get("id"),
            parseInt(total_amount * precision, 10),
            asset.get("id"),
            this.state.invoice.memo
        )
            .then(() => {
                TransactionConfirmStore.unlisten(this.onBroadcastAndConfirm);
                TransactionConfirmStore.listen(this.onBroadcastAndConfirm);
            })
            .catch(e => {
                console.log("error: ", e);
            });
    }

    fromChanged(pay_from_name) {
        this.setState({pay_from_name, pay_from_account: null});
    }

    onFromAccountChanged(pay_from_account) {
        this.setState({pay_from_account});
    }

    render() {
        if (this.state.error)
            return (
                <div>
                    <br />
                    <h4 className="has-error text-center">
                        {this.state.error}
                    </h4>
                </div>
            );
        if (!this.state.invoice) return null;
        if (!this.state.asset)
            return (
                <div>
                    <Translate
                        className="has-error text-center"
                        component="h4"
                        content="transfer.errors.asset_unsupported"
                        currency={this.state.invoice.currency}
                    />
                </div>
            );

        let {invoice, total_amount} = this.state;
        const asset = invoice.currency;
        let balance = null;
        const receiptData = {
            ...invoice,
            total_amount,
            asset,
            from: this.state.pay_from_account,
            blockNum: this.state.blockNum
        };

        if (this.state.pay_from_account) {
            let balances = this.state.pay_from_account.get("balances");
            const balanceValue = balances.get(this.state.asset.get("id"));
            balance = (
                <span>
                    <Translate component="span" content="transfer.available" />
                    <span
                        style={{
                            borderBottom: "#A09F9F 1px dotted",
                            cursor: "pointer"
                        }}
                    >
                        <BalanceComponent balance={balanceValue} />
                    </span>
                </span>
            );
        }
        let items = invoice.line_items.map((i, index) => {
            let price = this.parsePrice(i.price);
            let amount = i.quantity * price;
            return (
                <Row>
                    <Col span={12}>
                        <div className="item-name">{i.label}</div>
                        <div className="item-description">
                            {i.quantity} x{" "}
                            {
                                <FormattedAsset
                                    amount={i.price}
                                    asset={asset}
                                    exact_amount={true}
                                />
                            }
                        </div>
                    </Col>
                    <Col span={12}>
                        <FormattedAsset
                            amount={amount}
                            asset={asset}
                            exact_amount={true}
                        />
                    </Col>
                </Row>
            );
        });

        return (
            <div className="grid-block vertical">
                <div className="grid-content">
                    <div className="content-block invoice">
                        <PrintReceiptButton
                            data={receiptData}
                            parsePrice={this.parsePrice}
                        />
                        <Form className="full-width" layout="vertical">
                            <div className="grid-block">
                                <div className="grid-content medium-4">
                                    <Translate
                                        component="h3"
                                        content="transfer.pay_invoice"
                                    />
                                    <h4>{invoice.memo}</h4>

                                    <AccountSelector
                                        label="transfer.to"
                                        accountName={invoice.to}
                                        disabled={true}
                                        account={invoice.to}
                                        size={32}
                                    />
                                    <AccountSelector
                                        label="transfer.pay_from"
                                        accountName={this.state.pay_from_name}
                                        onChange={this.fromChanged.bind(this)}
                                        onAccountChanged={this.onFromAccountChanged.bind(
                                            this
                                        )}
                                        account={this.state.pay_from_name}
                                        typeahead={true}
                                        size={32}
                                    />

                                    <Row>
                                        <Col span={12}>
                                            <Translate
                                                component="span"
                                                content="transfer.items"
                                            />
                                        </Col>
                                        <Col span={12}>
                                            <Translate
                                                component="span"
                                                content="transfer.amount"
                                            />
                                        </Col>
                                    </Row>
                                    <div className="divider" />
                                    {items}
                                    <Row>
                                        <Col span={12} offset={12}>
                                            <div>
                                                <Translate
                                                    component="span"
                                                    content="transfer.total"
                                                />

                                                <FormattedAsset
                                                    amount={total_amount}
                                                    asset={asset}
                                                    exact_amount={true}
                                                />
                                            </div>
                                        </Col>
                                    </Row>
                                    <Button
                                        type="primary"
                                        style={{marginTop: "30px"}}
                                        disabled={!this.state.pay_from_account}
                                        onClick={this.onPayClick.bind(this)}
                                    >
                                        <Translate
                                            content="transfer.pay_button"
                                            asset={
                                                <FormattedAsset
                                                    amount={total_amount}
                                                    asset={asset}
                                                    exact_amount={true}
                                                />
                                            }
                                            name={invoice.to}
                                        />
                                    </Button>
                                </div>
                            </div>
                        </Form>
                    </div>
                </div>
            </div>
        );
    }
}

export default Invoice;
