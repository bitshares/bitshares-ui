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
import utils from "common/utils";

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
            this.state.newOpinionParameters.opinion === "yes"
                ? "buy"
                : "shortAndSell";
        const feeID = this.props.baseAsset.get("id");

        let date = new Date();
        date.setFullYear(date.getFullYear() + 1);
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

        let current = type === "buy" ? ask : bid;

        if (type === "buy") {
            const buy = new LimitOrderCreate({
                for_sale: new Asset({
                    asset_id: this.props.baseAsset.get("id"),
                    precision: this.props.baseAsset.get("precision"),
                    amount: utils.convert_typed_to_satoshi(
                        this.state.newOpinionParameters.amount,
                        this.props.baseAsset
                    )
                }),
                expiration: null,
                to_receive: new Asset({
                    asset_id: this.props.quoteAsset.get("id"),
                    precision: this.props.quoteAsset.get("precision"),
                    amount:
                        utils.convert_typed_to_satoshi(
                            this.state.newOpinionParameters.amount,
                            this.props.quoteAsset
                        ) /
                        parseFloat(this.state.newOpinionParameters.probability)
                }),
                seller: this.props.currentAccount.get("id"),
                fee: {
                    asset_id: feeID,
                    amount: 0
                }
            });

            return MarketsActions.createLimitOrder2(buy)
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

        if (type === "shortAndSell") {
            const sell = new LimitOrderCreate({
                for_sale: new Asset({
                    asset_id: this.props.quoteAsset.get("id"),
                    precision: this.props.quoteAsset.get("precision"),
                    amount: utils.convert_typed_to_satoshi(
                        this.state.newOpinionParameters.amount,
                        this.props.quoteAsset
                    )
                }),
                expiration: null,
                to_receive: new Asset({
                    asset_id: this.props.baseAsset.get("id"),
                    precision: this.props.baseAsset.get("precision"),
                    amount:
                        utils.convert_typed_to_satoshi(
                            this.state.newOpinionParameters.amount,
                            this.props.baseAsset
                        ) *
                        parseFloat(this.state.newOpinionParameters.probability)
                }),
                seller: this.props.currentAccount.get("id"),
                fee: {
                    asset_id: feeID,
                    amount: 0
                }
            });
            let collateral = new Asset({
                amount: sell.amount_for_sale.getAmount(),
                asset_id: this.props.baseAsset.get("id"),
                precision: this.props.baseAsset.get("precision")
            });
            MarketsActions.createPredictionShort(sell, collateral).then(
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
        }
    }

    componentDidUpdate(prevProps) {
        if (
            this.props.preselectedOpinion !== prevProps.preselectedOpinion ||
            this.props.preselectedAmount !== prevProps.preselectedAmount ||
            this.props.preselectedProbability !==
                prevProps.preselectedProbability
        ) {
            this._updateStateFromProps();
        }
    }

    componentDidMount() {
        this._updateStateFromProps();
    }

    _updateStateFromProps() {
        let newOpinionParameters = this.state.newOpinionParameters;
        newOpinionParameters = Object.assign({}, newOpinionParameters);
        newOpinionParameters.opinion = this.props.preselectedOpinion;
        newOpinionParameters.amount =
            this.props.preselectedAmount /
                Math.pow(10, this.props.baseAsset.get("precision")) || " ";
        newOpinionParameters.probability =
            this.props.preselectedProbability || null;
        this.setState({
            newOpinionParameters,
            selectedOpinion: this.props.preselectedOpinion
        });
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
        this.setState({
            newOpinionParameter: newOpinion,
            wrongProbability: !this._isProbabilityValid(newOpinion)
        });
    }

    _isProbabilityValid(newOpinion = null) {
        if (newOpinion == null) {
            newOpinion = this.state.newOpinionParameters;
        }
        if (
            !newOpinion.probability ||
            newOpinion.probability <= 0.01 ||
            newOpinion.probability >= 0.99
        ) {
            return false;
        } else {
            return true;
        }
    }

    _isFormValid() {
        return (
            this._isProbabilityValid() &&
            parseFloat(this.state.newOpinionParameters.amount) > 0
        );
    }

    _getPotentialWinnings() {
        if (
            this.state.newOpinionParameters.probability &&
            this.state.newOpinionParameters.amount
        ) {
            if (this.state.newOpinionParameters.opinion === "yes") {
                return utils.format_number(
                    this.state.newOpinionParameters.amount /
                        parseFloat(this.state.newOpinionParameters.probability),
                    this.props.baseAsset.get("precision"),
                    false
                );
            } else {
                return utils.format_number(
                    this.state.newOpinionParameters.amount *
                        (1 +
                            (this.state.newOpinionParameters.probability
                                ? parseFloat(
                                      this.state.newOpinionParameters
                                          .probability
                                  )
                                : 0)),
                    this.props.baseAsset.get("precision"),
                    false
                );
            }
        } else {
            return 0;
        }
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
                <div className="prediction-markets--add-prediction-offer">
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
                                <Translate content="prediction.details.prediction" />
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
                                    <Translate content="prediction.details.predicated_likelihood" />
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
                        <Form.Item style={{marginBottom: "1rem"}}>
                            <span>
                                <label className="left-label">
                                    <Translate content="prediction.details.i_think_that" />
                                </label>
                            </span>
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
                            <span>
                                <label className="left-label">
                                    <Translate content="prediction.details.premium" />
                                    <AmountSelector
                                        onChange={this.handleAmountChange}
                                        placeholder="0.0"
                                        tabIndex={6}
                                        amount={
                                            this.state.newOpinionParameters
                                                .amount
                                        }
                                        asset={this.props.baseAsset.get("id")}
                                    />
                                </label>
                            </span>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.details.commission" />
                                <AmountSelector
                                    disabled
                                    amount={Math.min(
                                        this.props.predictionMarket
                                            .max_market_fee,
                                        (this.state.newOpinionParameters
                                            .amount *
                                            this.props.predictionMarket
                                                .market_fee) /
                                            10000
                                    )}
                                    asset={this.props.baseAsset.get("id")}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.details.potential_profit" />
                                <AmountSelector
                                    disabled
                                    amount={this._getPotentialWinnings()}
                                    asset={this.props.baseAsset.get("id")}
                                />
                            </label>
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
