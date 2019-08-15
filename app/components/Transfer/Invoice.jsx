import React from "react";
import {Card, Tabs} from "bitshares-ui-style-guide";
import counterpart from "counterpart";
import InvoiceRequest from "./InvoiceRequest";
import InvoicePay from "./InvoicePay";
import {bindToCurrentAccount} from "../Utility/BindToCurrentAccount";
import {validate} from "jsonschema";
import "../../assets/stylesheets/components/_merchant.scss";

class Invoice extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            tabs: [
                {
                    name: "Request",
                    link: "/invoice/request",
                    translate: "invoice.request.title",
                    content: (
                        <InvoiceRequest
                            {...props}
                            validateFormat={this._validateFormat.bind(this)}
                        />
                    )
                },
                {
                    name: "Pay",
                    link: "/invoice/pay",
                    translate: "invoice.pay.title",
                    content: (
                        <InvoicePay
                            {...props}
                            validateFormat={this._validateFormat.bind(this)}
                        />
                    )
                }
            ]
        };
    }

    _validateFormat(invoice) {
        const schema = {
            type: "object",
            properties: {
                to: {type: "string"},
                to_label: {type: "string"},
                currency: {type: "string"},
                memo: {type: "string"},
                line_items: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            label: {type: "string"},
                            quantity: {type: "float", minimum: 1},
                            price: {type: "float"}
                        }
                    }
                },
                note: {type: "string"},
                required: ["to", "currency", "line_items"]
            }
        };
        const errors = validate(invoice, schema).errors;
        return !errors.length;
    }
    componentDidMount() {
        const isTab = this.state.tabs.some(
            tab => tab.link === this.props.match.url
        );
        if (!isTab) this.props.history.push("/invoice/pay");
    }
    onTabChange(value) {
        this.props.history.push(value);
    }
    render() {
        return (
            <div className="merchant-protocol center">
                <Card>
                    <Tabs
                        activeKey={this.props.location.pathname}
                        animated={false}
                        onChange={this.onTabChange.bind(this)}
                    >
                        {this.state.tabs.map(tab => {
                            return (
                                <Tabs.TabPane
                                    key={tab.link}
                                    tab={counterpart.translate(tab.translate)}
                                >
                                    <div className="padding">{tab.content}</div>
                                </Tabs.TabPane>
                            );
                        })}
                    </Tabs>
                </Card>
            </div>
        );
    }
}

Invoice = bindToCurrentAccount(Invoice);
export default Invoice;
