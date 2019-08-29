import React from "react";
import {ChainStore} from "bitsharesjs";
import AccountSelector from "../Account/AccountSelector";
import AssetSelect from "../Utility/AssetSelect";
import {compress} from "lzma";
import bs58 from "common/base58";
import Translate from "react-translate-component";
import {
    Button,
    Row,
    Col,
    Form,
    Input,
    Tooltip,
    Icon
} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import CopyButton from "../Utility/CopyButton";

let id = 1;

class InvoiceRequest extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            invoice: null,
            invoiceData: null,
            recipient_name: null,
            recipient_name_account: null,
            currency: "BTS",
            defaultAssets: ["BTS", "CNY", "USD"]
        };
    }

    componentDidMount() {
        this.setState({
            recipient_name: this.props.currentAccount.get("name")
        });
    }

    _printInvoice(invoice) {
        if (this.props.validateFormat(invoice)) {
            compress(JSON.stringify(invoice), 9, (result, error) => {
                const invoiceData = bs58.encode(Buffer.from(result));
                this.setState({
                    invoiceData: invoiceData
                });
                console.log("Invoice data", invoice, invoiceData);
            });
        }
    }

    componentWillReceiveProps(nextProps, nextContext) {
        if (this.state.recipient_name == null && this.props.currentAccount) {
            this.setState({
                recipient_name: this.props.currentAccount.get("name")
            });
        }
    }

    fromChanged(recipient_name) {
        this.setState({recipient_name, recipient_name_account: null});
    }

    onFromAccountChanged(recipient_name_account) {
        this.setState({recipient_name_account});
    }

    hasErrors = () => {
        let formError = false;
        const values = this.props.form.getFieldsValue([
            "line_items",
            "memo",
            "keys"
        ]);

        formError = Object.keys(values).some(field => {
            if (field !== "line_items") {
                return !values[field];
            } else {
                if (values.keys)
                    return values.keys.some(item => {
                        return (
                            !values[field][item].label ||
                            !values[field][item].price ||
                            !values[field][item].quantity
                        );
                    });
            }
        });

        return formError || !this.state.recipient_name;
    };

    remove = k => {
        const {form} = this.props;
        const keys = form.getFieldValue("keys");
        if (keys.length === 1) {
            return;
        }
        const nextKeys = keys.filter(key => key !== k);
        form.setFieldsValue({
            keys: nextKeys
        });
    };

    add = () => {
        const {form} = this.props;
        const keys = form.getFieldValue("keys");
        const nextKeys = keys.concat(id++);
        form.setFieldsValue({
            keys: nextKeys
        });
    };

    handleSubmit(e) {
        const {currency} = this.state;
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                let {line_items, memo, note, to_label} = values;
                // remove empty lines
                line_items = line_items.filter(item => !!item);
                this._printInvoice({
                    currency,
                    line_items,
                    memo,
                    note,
                    to: this.state.recipient_name,
                    to_label
                });
            }
        });
    }

    onChangeCurrency(e) {
        const asset = ChainStore.getAsset(e);
        this.setState({currency: asset.get("symbol")});
    }

    render() {
        const {getFieldValue, getFieldDecorator} = this.props.form;
        const {currency, defaultAssets} = this.state;
        getFieldDecorator("keys", {initialValue: [0]});
        let keys = getFieldValue("keys");
        const formItems = (
            <React.Fragment>
                <Row style={{marginTop: "0.5rem", marginBottom: "0.5rem"}}>
                    <Col span={12}>
                        <Translate
                            component="span"
                            content="invoice.request.items"
                        />
                    </Col>
                    <Col span={5}>
                        <Translate
                            component="span"
                            content="invoice.request.quantity"
                        />
                    </Col>
                    <Col span={5}>
                        <Translate
                            component="span"
                            content="invoice.request.price"
                        />
                    </Col>
                    <Col span={2}>
                        <Translate
                            component="span"
                            content="invoice.request.action"
                        />
                    </Col>
                </Row>
                {keys.map((k, index) => (
                    <Form.Item key={k} style={{marginBottom: "0px"}}>
                        <Input.Group compact>
                            <Row>
                                <Col span={12}>
                                    {getFieldDecorator(`line_items[${k}]label`)(
                                        <Input />
                                    )}
                                </Col>
                                <Col span={5}>
                                    {getFieldDecorator(
                                        `line_items[${k}]quantity`
                                    )(<Input type="number" />)}
                                </Col>
                                <Col span={5}>
                                    {getFieldDecorator(`line_items[${k}]price`)(
                                        <Input type="number" />
                                    )}
                                </Col>
                                <Col span={2}>
                                    {k == keys[keys.length - 1] ? (
                                        <Button
                                            type="primary"
                                            icon="plus-circle-o"
                                            onClick={() => this.add(k)}
                                        />
                                    ) : (
                                        <Button
                                            type="primary"
                                            icon="minus-circle-o"
                                            onClick={() => this.remove(k)}
                                        />
                                    )}
                                </Col>
                            </Row>
                        </Input.Group>
                    </Form.Item>
                ))}
            </React.Fragment>
        );

        const error = this.hasErrors();

        return (
            <div className="merchant-protocol--request">
                <AccountSelector
                    className="invoice-request-input"
                    label="invoice.request.recipient_account"
                    accountName={this.state.recipient_name}
                    onChange={this.fromChanged.bind(this)}
                    onAccountChanged={this.onFromAccountChanged.bind(this)}
                    account={this.state.recipient_name}
                    typeahead={true}
                    size={32}
                />
                <Form onSubmit={this.handleSubmit.bind(this)} required={true}>
                    <Form.Item
                        className="invoice-request-input"
                        label={
                            <span>
                                {counterpart.translate(
                                    "invoice.request.identifier"
                                )}
                                <Tooltip
                                    placement="topLeft"
                                    title={counterpart.translate(
                                        "invoice.request.identifier_tooltip"
                                    )}
                                >
                                    &nbsp;
                                    <Icon
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </Tooltip>
                            </span>
                        }
                    >
                        {getFieldDecorator("memo")(<Input />)}
                    </Form.Item>

                    <Form.Item
                        className="invoice-request-input"
                        label={
                            <span>
                                {counterpart.translate(
                                    "invoice.request.payment_asset"
                                )}
                                <Tooltip
                                    placement="topLeft"
                                    title={counterpart.translate(
                                        "invoice.request.payment_asset_tooltip"
                                    )}
                                >
                                    &nbsp;
                                    <Icon
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </Tooltip>
                            </span>
                        }
                    >
                        <AssetSelect
                            value={currency}
                            assets={defaultAssets}
                            onChange={this.onChangeCurrency.bind(this)}
                        />
                    </Form.Item>

                    <Form.Item
                        className="invoice-request-input"
                        label={
                            <span>
                                {counterpart.translate(
                                    "invoice.request.recipient_name"
                                )}
                                <Tooltip
                                    placement="topLeft"
                                    title={counterpart.translate(
                                        "invoice.request.recipient_name_tooltip"
                                    )}
                                >
                                    &nbsp;
                                    <Icon
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </Tooltip>
                            </span>
                        }
                    >
                        {getFieldDecorator("to_label")(<Input />)}
                    </Form.Item>
                    <Form.Item
                        className="invoice-request-input"
                        label={
                            <span>
                                {counterpart.translate("invoice.request.note")}
                                <Tooltip
                                    placement="topLeft"
                                    title={counterpart.translate(
                                        "invoice.request.note_tooltip"
                                    )}
                                >
                                    &nbsp;
                                    <Icon
                                        type="question-circle"
                                        theme="filled"
                                    />
                                </Tooltip>
                            </span>
                        }
                    >
                        {getFieldDecorator("note")(<Input.TextArea rows={3} />)}
                    </Form.Item>

                    {formItems}
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            disabled={error}
                        >
                            <Translate content="invoice.request.create_invoice_string" />
                        </Button>
                    </Form.Item>
                </Form>
                {this.state.invoiceData && (
                    <React.Fragment>
                        <div style={{marginTop: "2rem"}}>
                            <Input.TextArea
                                disabled
                                rows={4}
                                value={this.state.invoiceData}
                            />
                        </div>
                        <div style={{float: "right"}}>
                            <CopyButton
                                useDiv={false}
                                text={this.state.invoiceData}
                            />
                        </div>
                    </React.Fragment>
                )}
            </div>
        );
    }
}

InvoiceRequest = Form.create({name: "invoice_request"})(InvoiceRequest);

export default InvoiceRequest;
