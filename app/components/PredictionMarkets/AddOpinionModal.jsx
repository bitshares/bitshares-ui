import React from "react";
import {Modal, Input, Form, Switch, Button} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import counterpart from "counterpart";
import {Asset, Price, LimitOrderCreate} from "common/MarketClasses";
import MarketsActions from "actions/MarketsActions";
import {Notification, Radio} from "bitshares-ui-style-guide";
import {ChainStore, FetchChain} from "bitsharesjs";
import ExchangeInput from "components/Exchange/ExchangeInput";
import ChainTypes from "../Utility/ChainTypes";

export default class AddOpinionModal extends Modal {
    constructor(props) {
        super(props);
        this.state = {
            newOpinionParameters: {
                opinionator: null,
                opinion: this.props.preselectedOpinion,
                amount:
                    this.props.preselectedAmount /
                        Math.pow(10, this.props.baseAsset.get("precision")) ||
                    " ",
                probability: this.props.preselectedProbability || null,
                fee: null
            },
            showWarning: false,
            inProgress: false,
            selectedOpinion: this.props.preselectedOpinion,
            selectedAsset: null,
            wrongPropability: false
        };

        this.handleOpinionChange = this.handleOpinionChange.bind(this);
        this.handleAmountChange = this.handleAmountChange.bind(this);
        this.onSubmit = this.onSubmit.bind(this);
        this.handleProbabilityChange = this.handleProbabilityChange.bind(this);
    }

    _createOrder() {
        this.setState({inProgress: true});
        const type =
            this.state.newOpinionParameters.opinion === "no" ? "bid" : "ask";
        const feeID = this.props.baseAsset.get("id");

        let {description} = this.props.predictionMarket.options;
        const parsedDescription = JSON.parse(description);
        let date = new Date();
        date.setFullYear(date.getFullYear() + 1);
        let expiry = parsedDescription.expiry
            ? new Date(parsedDescription.expiry)
            : date;
        let bid = {
            for_sale: new Asset({
                asset_id: this.props.baseAsset.get("id"),
                precision: this.props.baseAsset.get("precision"),
                amount:
                    this.state.newOpinionParameters.amount *
                    Math.pow(10, this.props.quoteAsset.get("precision")) *
                    this.state.newOpinionParameters.probability
            }),
            to_receive: new Asset({
                asset_id: this.props.quoteAsset.get("id"),
                precision: this.props.quoteAsset.get("precision"),
                amount:
                    this.state.newOpinionParameters.amount *
                    Math.pow(10, this.props.quoteAsset.get("precision"))
            })
        };
        bid.price = new Price({base: bid.for_sale, quote: bid.to_receive});
        let ask = {
            for_sale: new Asset({
                asset_id: this.props.quoteAsset.get("id"),
                precision: this.props.quoteAsset.get("precision"),
                amount:
                    this.state.newOpinionParameters.amount *
                    Math.pow(10, this.props.quoteAsset.get("precision"))
            }),
            to_receive: new Asset({
                asset_id: this.props.baseAsset.get("id"),
                precision: this.props.baseAsset.get("precision"),
                amount:
                    this.state.newOpinionParameters.amount *
                    Math.pow(10, this.props.quoteAsset.get("precision")) *
                    this.state.newOpinionParameters.probability
            })
        };
        ask.price = new Price({base: ask.for_sale, quote: ask.to_receive});

        let current = type === "ask" ? ask : bid;

        const order = new LimitOrderCreate({
            for_sale: current.for_sale,
            expiration: expiry,
            to_receive: current.to_receive,
            seller: this.props.currentAccount.get("id"),
            fee: {
                asset_id: feeID,
                amount: 0
            }
        });

        if (type === "bid") {
            return MarketsActions.createLimitOrder2(order)
                .then(result => {
                    this.setState({inProgress: false});
                    if (result.error) {
                        if (result.error.message !== "wallet locked")
                            Notification.error({
                                message: counterpart.translate(
                                    "notifications.exchange_unknown_error_place_order",
                                    {
                                        amount: current.to_receive.getAmount({
                                            real: true
                                        }),
                                        symbol: current.to_receive.asset_id
                                    }
                                )
                            });
                    }
                })
                .catch(e => {
                    console.error("order failed:", e);
                });
        }

        if (type === "ask") {
            Promise.all([
                FetchChain(
                    "getAsset",
                    this.props.quoteAsset.getIn([
                        "bitasset",
                        "options",
                        "short_backing_asset"
                    ])
                )
            ]).then(assets => {
                let [backingAsset] = assets;
                let collateral = new Asset({
                    amount: order.amount_for_sale.getAmount(),
                    asset_id: backingAsset.get("id"),
                    precision: backingAsset.get("precision")
                });
                MarketsActions.createPredictionShort(order, collateral).then(
                    result => {
                        this.setState({inProgress: false});
                        if (result.error) {
                            if (result.error.message !== "wallet locked")
                                Notification.error({
                                    message: counterpart.translate(
                                        "notifications.exchange_unknown_error_place_order",
                                        {
                                            amount: buyAssetAmount,
                                            symbol: buyAsset.symbol
                                        }
                                    )
                                });
                        }
                    }
                );
            });
        }
    }

    handleOpinionChange() {
        let newOpinion = this.state.newOpinionParameters;
        newOpinion.opinion = newOpinion.opinion === "no" ? "yes" : "no";
        newOpinion.opinionator = this.props.currentAccount.get("id");
        this.setState({
            newOpinionParameters: newOpinion,
            selectedOpinion: newOpinion.opinion
        });
    }

    handleAmountChange({amount, asset}) {
        let newOpinion = this.state.newOpinionParameters;
        newOpinion.amount = amount;
        newOpinion.opinionator = this.props.currentAccount.get("id");
        this.setState({newOpinionParameter: newOpinion});

        if (typeof asset === "string") {
            this.setState({selectedAsset: asset});
        }
    }

    handleProbabilityChange(e) {
        let newOpinion = this.state.newOpinionParameters;
        newOpinion.probability = e.target.value;
        this.setState({newOpinionParameter: newOpinion});
    }

    _isFormValid() {
        if (
            !this.state.newOpinionParameters.probability ||
            this.state.newOpinionParameters.probability < 0 ||
            this.state.newOpinionParameters.probability > 1
        ) {
            this.setState({wrongProbability: true});
            return false;
        } else {
            this.setState({wrongProbability: false});
        }
        return parseFloat(this.state.newOpinionParameters.amount);
    }

    onSubmit() {
        if (this._isFormValid()) {
            this._createOrder.call(this);
        } else {
            this.setState({showWarning: true});
        }
    }

    render() {
        const {
            showWarning,
            newOpinionParameters,
            wrongProbability
        } = this.state;

        const footer = [
            <Button
                type="primary"
                key="submit"
                onClick={this.onSubmit}
                disabled={this.state.inProgress}
            >
                {counterpart.translate("global.confirm")}
            </Button>,
            <Button
                key="cancel"
                onClick={this.props.onClose}
                disabled={this.state.inProgress}
            >
                {counterpart.translate("global.cancel")}
            </Button>
        ];

        return (
            <Modal
                title={
                    <Translate content="prediction.add_opinion_modal.title" />
                }
                visible={this.props.visible}
                onCancel={this.props.onClose}
                overlay={true}
                closable={!this.state.inProgress}
                footer={footer}
            >
                <div>
                    <Form className="full-width" layout="vertical">
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.add_opinion_modal.symbol" />
                                <Input
                                    type="text"
                                    disabled={true}
                                    tabIndex={1}
                                    value={this.props.predictionMarket.symbol}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.add_opinion_modal.condition" />
                                <Input
                                    type="text"
                                    disabled={true}
                                    tabIndex={2}
                                    value={
                                        this.props.predictionMarket.condition
                                    }
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.add_opinion_modal.opinion" />
                            </label>
                            <Radio.Group
                                value={this.state.selectedOpinion}
                                onChange={this.handleOpinionChange}
                            >
                                <Radio value={"yes"}>
                                    {counterpart.translate(
                                        "prediction.details.proves_true"
                                    )}
                                </Radio>
                                <Radio value={"no"}>
                                    {counterpart.translate(
                                        "prediction.details.incorrect"
                                    )}
                                </Radio>
                            </Radio.Group>
                        </Form.Item>
                        <Form.Item>
                            <span
                                className={
                                    newOpinionParameters.amount == 0 &&
                                    showWarning
                                        ? "has-error"
                                        : ""
                                }
                            >
                                <label className="left-label">
                                    <Translate content="prediction.add_opinion_modal.amount" />
                                    <AmountSelector
                                        onChange={this.handleAmountChange}
                                        placeholder="0.0"
                                        tabIndex={6}
                                        amount={
                                            this.state.newOpinionParameters
                                                .amount
                                        }
                                        asset={this.props.quoteAsset.get("id")}
                                    />
                                </label>
                            </span>
                        </Form.Item>
                        <Form.Item>
                            <span
                                className={
                                    (!newOpinionParameters.probability &&
                                        showWarning) ||
                                    wrongProbability
                                        ? "has-error"
                                        : ""
                                }
                            >
                                <label className="left-label">
                                    <Translate content="prediction.add_opinion_modal.probability" />
                                    <ExchangeInput
                                        placeholder="0.0"
                                        onChange={this.handleProbabilityChange}
                                        value={
                                            this.state.newOpinionParameters
                                                .probability
                                        }
                                    />
                                </label>
                            </span>
                        </Form.Item>
                        {this.state.inProgress ? (
                            <Translate content="footer.loading" />
                        ) : null}
                    </Form>
                </div>
            </Modal>
        );
    }
}

AddOpinionModal.propTypes = {
    visible: PropTypes.bool,
    onClose: PropTypes.func,
    predictionMarket: PropTypes.any.isRequired,
    opinion: PropTypes.any,
    currentAccount: ChainTypes.ChainAccount.isRequired,
    submitNewOpinion: PropTypes.func,
    preselectedOpinion: PropTypes.string,
    preselectedAmount: PropTypes.number,
    preselectedProbability: PropTypes.number,
    baseAsset: PropTypes.object,
    quoteAsset: PropTypes.object
};

AddOpinionModal.defaultProps = {
    visible: false,
    predictionMarket: null,
    opinion: {}
};
