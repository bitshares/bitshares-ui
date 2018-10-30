import React from "react";
import {
    Modal,
    Form,
    Input,
    Button,
    Icon,
    Select
} from "bitshares-ui-style-guide";
import {PRICE_ALERT_TYPES} from "../../services/Exchange";
import counterpart from "counterpart";

class PriceAlert extends React.Component {
    constructor(props) {
        super(props);

        const testRules = [
            {
                type: PRICE_ALERT_TYPES.HIGHER_THAN,
                amount: 10.3254
            },
            {
                type: PRICE_ALERT_TYPES.HIGHER_THAN,
                amount: 15.55555
            },
            {
                type: PRICE_ALERT_TYPES.LOWER_THAN,
                amount: 8.88888
            }
        ];

        this.state = {
            rules: [...testRules]
        };

        this.handleAddRule = this.handleAddRule.bind(this);
        this.handleTypeChange = this.handleTypeChange.bind(this);
        this.handleDeleteRule = this.handleDeleteRule.bind(this);
        this.handleAmountChange = this.handleAmountChange.bind(this);
    }

    handleTypeChange(key) {
        return value => {
            let rules = this.state.rules.map((rule, ruleKey) => {
                if (Number(key) !== Number(ruleKey)) return rule;

                return {
                    ...rule,
                    type: String(value)
                };
            });

            this.setState({
                rules: rules
            });
        };
    }

    handleAmountChange(key) {
        return event => {
            let rules = this.state.rules.map((rule, ruleKey) => {
                if (Number(key) !== Number(ruleKey)) return rule;

                return {
                    ...rule,
                    amount: event.target.value
                };
            });

            this.setState({
                rules: rules
            });
        };
    }

    handleAddRule() {
        let rules = [...this.state.rules];

        rules.push({
            type: PRICE_ALERT_TYPES.HIGHER_THAN,
            amount: null
        });

        this.setState({
            rules
        });
    }

    handleDeleteRule(key) {
        return () => {
            let rules = this.state.rules.filter(
                (item, ruleKey) => Number(ruleKey) !== Number(key)
            );

            this.setState({
                rules: rules
            });
        };
    }

    render() {
        const footer = [
            <Button key="submit" type="primary">
                {counterpart.translate("modal.save")}
            </Button>,
            <Button key="cancel" onClick={this.props.hideModal}>
                {counterpart.translate("modal.cancel")}
            </Button>
        ];

        return (
            <Modal
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                title={"Price Alert"}
                footer={footer}
            >
                <div className="exchange--price-alert">
                    <div className="exchange--price-alert--description">
                        Alert me when then btc/bitUSD price:
                        <Form layout="vertical">
                            <div className="exchange--price-alert--items">
                                {this.state.rules.map((rule, key) => (
                                    <Input.Group
                                        className={
                                            "exchange--price-alert--item"
                                        }
                                        compact
                                    >
                                        <Select
                                            value={rule.type}
                                            style={{width: "200px"}}
                                            onChange={this.handleTypeChange(
                                                key
                                            )}
                                        >
                                            <Select.Option
                                                value={
                                                    PRICE_ALERT_TYPES.HIGHER_THAN
                                                }
                                                key={"1"}
                                            >
                                                {counterpart.translate(
                                                    "exchange.price_alert.higher_than"
                                                )}
                                            </Select.Option>
                                            <Select.Option
                                                value={
                                                    PRICE_ALERT_TYPES.LOWER_THAN
                                                }
                                                key={"2"}
                                            >
                                                {counterpart.translate(
                                                    "exchange.price_alert.lower_than"
                                                )}
                                            </Select.Option>
                                        </Select>

                                        <Input
                                            style={{
                                                width:
                                                    "calc(100% - 200px - 32px)",
                                                marginTop: "1px"
                                            }}
                                            onChange={this.handleAmountChange(
                                                key
                                            )}
                                            value={rule.amount}
                                            className="exchange--price-alert--item--amount"
                                            placeholder={counterpart.translate(
                                                "exchange.price_alert.amount"
                                            )}
                                            addonAfter={"bitEUR"}
                                        />

                                        <Button
                                            style={{width: "32px"}}
                                            onClick={this.handleDeleteRule(key)}
                                            className="exchange--price-alert--item--control"
                                            type="icon"
                                            icon="delete"
                                        />
                                    </Input.Group>
                                ))}
                            </div>

                            <div className="exchange--price-alert--items--add">
                                <a
                                    href="javascript:void(0)"
                                    onClick={this.handleAddRule}
                                >
                                    {counterpart.translate(
                                        "exchange.price_alert.add_rule"
                                    )}
                                </a>
                            </div>
                        </Form>
                    </div>
                </div>
            </Modal>
        );
    }
}

export default PriceAlert;
