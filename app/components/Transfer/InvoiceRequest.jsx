import React from "react";
import AccountSelector from "../Account/AccountSelector";
import {compress} from "lzma";
import bs58 from "common/base58";
import Translate from "react-translate-component";
import {Button, Row, Col, Form, Input} from "bitshares-ui-style-guide";
import counterpart from "counterpart";

let id = 1;

class InvoiceRequest extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            invoice: null,
            recipient_name: null,
            recipient_name_account: null
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
                let a = bs58;
                console.log(bs58.encode(Buffer.from(result)));
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
            "currency",
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

        form.setFieldsValue({
            keys: keys.filter(key => key !== k)
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
        e.preventDefault();
        this.props.form.validateFields((err, values) => {
            if (!err) {
                const {currency, line_items, memo, note, to_label} = values;
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

    render() {
        const {getFieldValue, getFieldDecorator} = this.props.form;
        getFieldDecorator("keys", {initialValue: [0]});
        let keys = getFieldValue("keys");
        const formItems = (
            <React.Fragment>
                <Row>
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
                                    {k == keys.length - 1 ? (
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
                        label={counterpart.translate(
                            "invoice.request.identifier"
                        )}
                    >
                        {getFieldDecorator("memo")(<Input />)}
                    </Form.Item>
                    <Form.Item
                        className="invoice-request-input"
                        label={counterpart.translate(
                            "invoice.request.currency"
                        )}
                    >
                        {getFieldDecorator("currency")(<Input />)}
                    </Form.Item>

                    <Form.Item
                        className="invoice-request-input"
                        label={counterpart.translate(
                            "invoice.request.recipient_name"
                        )}
                    >
                        {getFieldDecorator("to_label")(<Input />)}
                    </Form.Item>
                    <Form.Item
                        className="invoice-request-input"
                        label={counterpart.translate("invoice.request.note")}
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
                            <Translate content="invoice.request.submit" />
                        </Button>
                    </Form.Item>
                </Form>
            </div>
        );
    }
}

InvoiceRequest = Form.create({name: "invoice_request"})(InvoiceRequest);

export default InvoiceRequest;
