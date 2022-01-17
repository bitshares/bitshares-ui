import React from "react";
import FormattedAsset from "../Utility/FormattedAsset";
import AccountActions from "actions/AccountActions";
import AccountSelector from "../Account/AccountSelector";
import BalanceComponent from "../Utility/BalanceComponent";
import {ChainStore, FetchChain, FetchChainObjects} from "bitsharesjs/es";
import NotificationActions from "actions/NotificationActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import {decompress, compress} from "lzma";
import bs58 from "common/base58";
import PrintReceiptButton from "./PrintReceiptButton.jsx";
import Translate from "react-translate-component";
import {
    Button,
    Row,
    Col,
    Icon,
    Tooltip,
    Switch
} from "bitshares-ui-style-guide";
import utils from "common/utils";
import counterpart from "counterpart";
import {hasLoaded} from "../Utility/BindToCurrentAccount";
import Operation from "../Blockchain/Operation";
import QRCode from "qrcode.react";
import ScanOrEnterText from "./ScanOrEnterText";

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

class InvoicePay extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            invoice: null,
            pay_from_name: null,
            pay_from_account: null,
            pay_to_account: null,
            error: null,
            blockNum: null,
            invoiceQr: false,
            rawDataInputValue: "",
            isRawDataInputVisible: false
        };
        this.onBroadcastAndConfirm = this.onBroadcastAndConfirm.bind(this);
        this.getTotal = this.getTotal.bind(this);
        // this._printExampleInvoice();
    }

    _printExampleInvoice() {
        let invoice = {
            to: "sschiessl",
            to_label: "Stefan S.",
            currency: "BTS",
            memo: "Invoice #1234",
            line_items: [
                {label: "Something to Buy", quantity: 1, price: "0.1"},
                {label: "10 things to Buy", quantity: 10, price: "0.02"}
            ],
            note: "Something the merchant wants to say to the user"
        };
        compress(JSON.stringify(invoice), 9, (result, error) => {
            let a = bs58;
            console.log(bs58.encode(Buffer.from(result)));
        });
    }

    async componentDidMount() {
        let compressed_data = bs58.decode(this.props.match.params.data);
        TransactionConfirmStore.unlisten(this.onBroadcastAndConfirm);
        TransactionConfirmStore.listen(this.onBroadcastAndConfirm);
        try {
            const data = await this.decompressRawData(compressed_data);
            await this.parseInvoiceData(data);
        } catch (e) {
            this.setState({isRawDataInputVisible: true});
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps, nextContext) {
        if (this.state.pay_from_name == null && this.props.currentAccount) {
            // check if current account has already paid
            let paymentOperation = this._findPayment();

            this.setState({
                pay_from_name: this.props.currentAccount.get("name"),
                paymentOperation
            });
        }
    }

    decompressRawData = data => {
        return new Promise((resolve, reject) => {
            decompress(data, (result, error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    };

    async parseInvoiceData(data) {
        try {
            data = utils.sanitize(data, {
                whiteList: [], // empty, means filter out all tags
                stripIgnoreTag: true // filter out all HTML not in the whilelist
            });

            let invoice = JSON.parse(data);
            if (this.props.validateFormat(invoice)) {
                let assetsArray = await FetchChainObjects(ChainStore.getAsset, [
                    invoice.currency
                ]);
                let pay_to_account = await FetchChain(
                    "getAccount",
                    invoice.to,
                    undefined,
                    {
                        [invoice.to]: false
                    }
                );
                this.setState(
                    {
                        invoice,
                        asset: assetsArray[0],
                        pay_to_account,
                        pay_from_name: this.props.currentAccount.get("name"),
                        error: null,
                        isRawDataInputVisible: false
                    },
                    this.getTotal
                );
            } else {
                this.setState({
                    error: counterpart.translate("invoice.invalid_format")
                });
            }
        } catch (error) {
            this.setState({error: error.message});
        }
    }

    handleRawInvoiceDataChange = e => {
        const value = e.target.value.replace(/\s/g, "");
        this.setState({rawDataInputValue: value}, async () => {
            try {
                const compressedData = bs58.decode(value);
                const decompressedData = await this.decompressRawData(
                    compressedData
                );
                this.parseInvoiceData(decompressedData);
            } catch (e) {
                console.log(e);
                this.setState({error: e.message});
            }
        });
    };

    handleQrScanSuccess = async ({address}) => {
        try {
            const compressedData = bs58.decode(address);
            const decompressedData = await this.decompressRawData(
                compressedData
            );
            this.parseInvoiceData(decompressedData);
        } catch (e) {
            console.log(e);
            this.setState({error: e.message});
        }
    };

    parsePrice(price) {
        let m = price.match(/([\d\,\.\s]+)/);
        if (!m || m.length < 2) 0.0;
        return parseFloat(m[1].replace(/[\,\s]/g, ""));
    }

    _findPayment() {
        if (
            hasLoaded(this.props.currentAccount) &&
            this.state.total_amount &&
            this.state.pay_to_account
        ) {
            const find_to = this.state.pay_to_account.get("id");
            const find_asset_id = this.state.asset.get("id");
            const find_amount =
                this.state.total_amount *
                Math.pow(10, this.state.asset.get("precision"));

            let transaction = null;
            this.props.currentAccount
                .get("history")
                .toJS()
                .forEach(_op => {
                    const op = _op.op;
                    if (op[0] == 0) {
                        const from = op[1].from;
                        const to = op[1].to;
                        const amount = op[1].amount.amount;
                        const asset_id = op[1].amount.asset_id;

                        const invoice = this.state.invoice;

                        console.log(
                            find_to,
                            to,
                            find_asset_id,
                            asset_id,
                            find_amount,
                            amount
                        );

                        if (
                            find_to == to &&
                            find_asset_id == asset_id &&
                            find_amount == amount
                        ) {
                            transaction = _op;
                        }
                    }
                });
            return transaction;
        }
    }

    getTotal() {
        const items = this.state.invoice.line_items;
        if (!items || items.length === 0) return 0.0;
        let total_amount = items.reduce((total, item) => {
            let price = this.parsePrice(item.price);
            if (!price) return total;
            return total + item.quantity * price;
        }, 0.0);

        // check if current account has already paid
        let paymentOperation = this._findPayment();

        this.setState({
            total_amount: parseFloat(
                total_amount.toFixed(this.state.asset.get("precision"))
            ),
            paymentOperation
        });
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

    onToAccountChanged(pay_to_account) {
        this.setState({pay_to_account: pay_to_account});
    }

    render() {
        const {data} = this.props.match.params;
        if (this.state.isRawDataInputVisible) {
            return (
                <div>
                    <ScanOrEnterText
                        labelContent={
                            <Translate
                                component="span"
                                content="invoice.raw_invoice_data"
                            />
                        }
                        submitBtnText={counterpart.translate(
                            "invoice.use_invoice_data"
                        )}
                        dataFoundText={
                            counterpart.translate(
                                "invoice.invoice_data_found"
                            ) + ":"
                        }
                        onInputChange={this.handleRawInvoiceDataChange}
                        inputValue={this.state.rawDataInputValue}
                        handleQrScanSuccess={this.handleQrScanSuccess}
                    />
                    <br />
                    <h4 className="has-error text-center">
                        {this.state.error}
                    </h4>
                </div>
            );
        }
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

        if (invoice.to_label) {
            invoice.to_name = invoice.to_label;
        }

        const receiptData = {
            ...invoice,
            total_amount: total_amount ? total_amount.toString() : 0,
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
                <Row key={"invoice_item_" + index}>
                    <Col span={10}>
                        <div className="item-name">{i.label}</div>
                        <div className="item-description" />
                    </Col>
                    <Col span={3}>{i.quantity} x</Col>
                    <Col span={5}>
                        <FormattedAsset
                            amount={i.price}
                            asset={asset}
                            exact_amount={true}
                        />
                    </Col>
                    <Col span={5}>
                        <FormattedAsset
                            amount={amount}
                            asset={asset}
                            exact_amount={true}
                        />
                    </Col>
                </Row>
            );
        });
        const invoiceData =
            data !== "pay" ? data : this.state.rawDataInputValue;

        let qrcode = null;
        if (this.state.invoiceQr) {
            qrcode = invoiceData;
        } else {
            if (
                this.state.pay_from_name &&
                invoice.to !== this.state.pay_from_name
            ) {
                qrcode =
                    `bitshares:operation/transfer?to=${invoice.to}&from=${this.state.pay_from_name}&asset=${asset}&amount=${total_amount}` +
                    (invoice.memo ? `&memo=${invoice.memo}` : "");
            }
        }

        return (
            <div className="merchant-protocol--pay">
                <div style={{float: "right"}}>
                    <PrintReceiptButton
                        data={receiptData}
                        parsePrice={this.parsePrice}
                    />
                </div>
                <Translate component="h3" content="invoice.payment_request" />
                <br />
                <Row>
                    <Col
                        span={10}
                        style={{
                            width: "30rem"
                        }}
                    >
                        <h4>{invoice.memo}</h4>
                        <AccountSelector
                            label="invoice.paid_by"
                            accountName={this.state.pay_from_name}
                            onChange={this.fromChanged.bind(this)}
                            onAccountChanged={this.onFromAccountChanged.bind(
                                this
                            )}
                            account={this.state.pay_from_name}
                            typeahead={true}
                            size={32}
                        />

                        <AccountSelector
                            label="invoice.pay_to"
                            accountName={invoice.to}
                            disabled={true}
                            onAccountChanged={this.onToAccountChanged.bind(
                                this
                            )}
                            account={this.state.pay_to_account}
                            size={32}
                        />
                    </Col>
                    <Col span={6} offset={4}>
                        <div className="inline-block">
                            <Translate
                                component="h4"
                                content="invoice.pay.barcode"
                            />
                            <Button
                                type="secondary"
                                style={{
                                    width: "180px",
                                    marginBottom: "20px"
                                }}
                                onClick={() => {
                                    this.setState({
                                        invoiceQr: !this.state.invoiceQr
                                    });
                                }}
                            >
                                <Translate
                                    component="span"
                                    content={
                                        this.state.invoiceQr
                                            ? "invoice.pay.invoice_qr_code"
                                            : "invoice.pay.payment_qr_code"
                                    }
                                />
                            </Button>
                        </div>
                        <QRCode
                            size={180}
                            value={qrcode ? qrcode : ""}
                            bgColor={qrcode ? undefined : "#000000"}
                        />
                    </Col>
                </Row>
                {invoice.to_name && (
                    <div>
                        <Translate content="invoice.request.recipient_name" />
                        <p>{invoice.to_name}</p>
                    </div>
                )}
                {invoice.note && (
                    <div>
                        <Translate content="invoice.note" />
                        <p>{invoice.note}</p>
                    </div>
                )}
                <Row>
                    <Col span={10}>
                        <Translate component="span" content="invoice.items" />
                    </Col>
                    <Col span={3}>
                        <Translate component="span" content="invoice.amount" />
                    </Col>
                    <Col span={5}>
                        <Translate component="span" content="invoice.unit" />
                    </Col>
                    <Col span={5}>
                        <Translate component="span" content="invoice.total" />
                    </Col>
                </Row>
                <div className="divider" />
                {items}
                <div className="divider" />
                <Row>
                    <Col span={18}>
                        <Translate component="span" content="invoice.total" />
                    </Col>
                    <Col span={5}>
                        <FormattedAsset
                            amount={total_amount}
                            asset={asset}
                            exact_amount={true}
                        />
                    </Col>
                </Row>
                {this.state.paymentOperation ? (
                    <div>
                        <h3>
                            {counterpart.translate("invoice.payment_proof")}
                            &nbsp;
                            <Tooltip
                                title={counterpart.translate(
                                    "invoice.tooltip_payment_proof"
                                )}
                                mouseEnterDelay={0.5}
                            >
                                <Icon type="question-circle" />
                            </Tooltip>
                        </h3>

                        <table className="table">
                            <tbody>
                                <Operation
                                    includeOperationId={true}
                                    key={this.state.paymentOperation.id}
                                    operationId={this.state.paymentOperation.id}
                                    op={this.state.paymentOperation.op}
                                    result={this.state.paymentOperation.result}
                                    block={
                                        this.state.paymentOperation.block_num
                                    }
                                    current={this.props.currentAccount.get(
                                        "id"
                                    )}
                                />
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <Button
                        type="primary"
                        style={{marginTop: "30px"}}
                        disabled={!this.state.pay_from_account}
                        onClick={this.onPayClick.bind(this)}
                    >
                        <Translate
                            content="invoice.pay_button"
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
                )}
            </div>
        );
    }
}

export default InvoicePay;
