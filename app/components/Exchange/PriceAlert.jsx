import React from "react";
import {
    Modal,
    Form,
    Input,
    Button,
    Icon,
    Select
} from "bitshares-ui-style-guide";
import {Link} from "react-router-dom";
import AssetName from "../Utility/AssetName";
import {PRICE_ALERT_TYPES} from "../../services/Exchange";
import AssetWrapper from "../Utility/AssetWrapper";
import counterpart from "counterpart";

class PriceAlert extends React.Component {
    constructor(props) {
        super(props);

        const testRules = [];

        this.state = {
            rules: [...testRules]
        };

        this.handleSave = this.handleSave.bind(this);
        this.handleAddRule = this.handleAddRule.bind(this);
        this.handleTypeChange = this.handleTypeChange.bind(this);
        this.handleDeleteRule = this.handleDeleteRule.bind(this);
        this.handlePriceChange = this.handlePriceChange.bind(this);
        this.handlePriceFieldBlur = this.handlePriceFieldBlur.bind(this);
    }

    componentDidUpdate(prevProps) {
        if (!prevProps.visible && this.props.visible) {
            let example = {
                type: PRICE_ALERT_TYPES.HIGHER_THAN,
                price: this.props.latestPrice
                    ? Number(this.props.latestPrice)
                    : null
            };

            let rules = [];

            if (!this.props.rules.length) {
                rules = !this.state.openedPreviously ? [example] : [];
            } else {
                rules = this.props.rules;
            }

            this.setState({
                rules: rules,
                openedPreviously: true
            });
        }
    }

    handleTypeChange(key) {
        return value => {
            let rules = this.state.rules.map((rule, ruleKey) => {
                if (Number(key) !== Number(ruleKey)) return rule;

                let validate = this.validatePrice(
                    value,
                    Number(rule.price),
                    Number(this.props.latestPrice)
                );

                return {
                    ...rule,
                    ...validate,
                    type: String(value)
                };
            });

            this.setState({
                rules: rules
            });
        };
    }

    validatePrice(type, price, latest) {
        if (type === PRICE_ALERT_TYPES.HIGHER_THAN && price < latest) {
            return {
                validateStatus: "error",
                help: "Price of Alert should be higher than current price"
            };
        }

        if (type === PRICE_ALERT_TYPES.LOWER_THAN && price > latest) {
            return {
                validateStatus: "error",
                help: "Price of Alert  should be lower than current price"
            };
        }

        return {
            validateStatus: "success",
            help: ""
        };
    }

    validatePriceFieldByKey(key) {
        let rules = this.state.rules.map((rule, ruleKey) => {
            if (Number(key) !== Number(ruleKey)) return rule;

            const validate = this.validatePrice(
                rule.type,
                Number(rule.price),
                Number(this.props.latestPrice)
            );

            return {
                ...rule,
                validateStatus: validate.validateStatus,
                help: validate.help
            };
        });

        this.setState({
            rules: rules
        });
    }

    handlePriceFieldBlur(key) {
        return () => {
            this.validatePriceFieldByKey(key);
        };
    }

    handlePriceChange(key) {
        return event => {
            let rules = this.state.rules.map((rule, ruleKey) => {
                if (Number(key) !== Number(ruleKey)) return rule;

                let validate = {};

                // validate on a fly if field was touched previously
                if (rule.validateStatus) {
                    validate = this.validatePrice(
                        rule.type,
                        Number(event.target.value),
                        Number(this.props.latestPrice)
                    );
                }

                return {
                    ...rule,
                    ...validate,
                    price: event.target.value
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
            price: this.props.latestPrice
                ? Number(this.props.latestPrice)
                : null
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

    handleSave() {
        this.props.onSave(this.state.rules);
    }

    render() {
        if (
            !this.props.quoteAsset ||
            !this.props.quoteAsset.get ||
            !this.props.baseAsset ||
            !this.props.baseAsset.get
        )
            return null;

        const footer = [
            <Button key="submit" type="primary" onClick={this.handleSave}>
                {counterpart.translate("modal.save")}
            </Button>,
            <Button key="cancel" onClick={this.props.hideModal}>
                {counterpart.translate("modal.cancel")}
            </Button>
        ];

        const baseAssetSymbol = this.props.baseAsset.get("symbol");
        const quoteAssetSymbol = this.props.quoteAsset.get("symbol");

        const linkToExchange = `${quoteAssetSymbol}_${baseAssetSymbol}`;

        return (
            <Modal
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                title={counterpart.translate("exchange.price_alert.title")}
                footer={footer}
            >
                <div className="exchange--price-alert">
                    <div className="exchange--price-alert--description">
                        {this.state.rules.length ? (
                            <div>
                                {counterpart.translate(
                                    "exchange.price_alert.alert_when"
                                )}{" "}
                                <Link to={linkToExchange}>
                                    <AssetName name={quoteAssetSymbol} />/
                                    <AssetName name={baseAssetSymbol} />
                                </Link>{" "}
                                price:
                            </div>
                        ) : (
                            <div>
                                {counterpart.translate(
                                    "exchange.price_alert.use_button"
                                )}
                                <Link to={linkToExchange}>
                                    <AssetName name={quoteAssetSymbol} />/
                                    <AssetName name={baseAssetSymbol} />
                                </Link>
                                :
                            </div>
                        )}

                        <Form layout="vertical">
                            <div className="exchange--price-alert--items">
                                {this.state.rules.map((rule, key) => (
                                    <Form.Item
                                        key={key}
                                        validateStatus={
                                            rule.validateStatus || null
                                        }
                                        help={rule.help || null}
                                    >
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
                                                onBlur={this.handlePriceFieldBlur(
                                                    key
                                                )}
                                                style={{
                                                    width:
                                                        "calc(100% - 200px - 32px)",
                                                    marginTop: "1px"
                                                }}
                                                onChange={this.handlePriceChange(
                                                    key
                                                )}
                                                value={rule.price}
                                                className="exchange--price-alert--item--price"
                                                placeholder={counterpart.translate(
                                                    "exchange.price_alert.price"
                                                )}
                                                addonAfter={
                                                    <AssetName
                                                        name={baseAssetSymbol}
                                                    />
                                                }
                                            />

                                            <Button
                                                style={{width: "32px"}}
                                                onClick={this.handleDeleteRule(
                                                    key
                                                )}
                                                className="exchange--price-alert--item--control"
                                                type="icon"
                                                icon="delete"
                                            />
                                        </Input.Group>
                                    </Form.Item>
                                ))}
                            </div>

                            <div className="exchange--price-alert--items--add">
                                <a
                                    href="javascript:void(0)"
                                    onClick={this.handleAddRule}
                                >
                                    <Icon type="plus" />{" "}
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

PriceAlert = AssetWrapper(PriceAlert, {
    propNames: ["quoteAsset", "baseAsset"]
});

export default PriceAlert;
