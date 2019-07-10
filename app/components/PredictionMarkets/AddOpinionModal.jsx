import React from "react";
import {Modal, Input, Form, Switch, Button} from "bitshares-ui-style-guide";
import PropTypes from "prop-types";
import Translate from "react-translate-component";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import counterpart from "counterpart";
import {Asset, Price, LimitOrderCreate} from "common/MarketClasses";
import MarketsActions from "actions/MarketsActions";
import {Notification} from "bitshares-ui-style-guide";
import {ChainStore} from "bitsharesjs";

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
                fee: null
            },
            showWarning: false,
            inProgress: false,
            bool_opinion:
                this.props.preselectedOpinion === "yes" ? true : false,
            selectedAsset: null
        };

        this.handleOpinionChange = this.handleOpinionChange.bind(this);
        this.handleAmountChange = this.handleAmountChange.bind(this);
        this.onOk = this.onOk.bind(this);
    }

    _createOrder(type, feeID) {
        this.setState({inProgress: true});
        if (type === "ask") this._borrow();

        //setting resolution date of the market as expiration date of the order
        let {description} = this.props.market.options;
        const parsedDescription = JSON.parse(description);
        let expiry = parsedDescription.expiry
            ? new Date(parsedDescription.expiry)
            : new Date();

        let bid = {
            for_sale: new Asset({
                asset_id: this.props.baseAsset.get("id"),
                precision: this.props.baseAsset.get("precision"),
                amount:
                    this.state.newOpinionParameters.amount *
                    Math.pow(10, this.props.baseAsset.get("precision")) //TODO
            }),
            to_receive: new Asset({
                asset_id: this.props.quoteAsset.get("id"),
                precision: this.props.quoteAsset.get("precision"),
                amount:
                    this.state.newOpinionParameters.amount *
                    Math.pow(10, this.props.quoteAsset.get("precision")) //TODO
            })
        };
        bid.price = new Price({base: bid.for_sale, quote: bid.to_receive});
        let ask = {
            for_sale: new Asset({
                asset_id: this.props.quoteAsset.get("id"),
                precision: this.props.quoteAsset.get("precision"),
                amount:
                    this.state.newOpinionParameters.amount *
                    Math.pow(10, this.props.quoteAsset.get("precision")) //TODO
            }),
            to_receive: new Asset({
                asset_id: this.props.baseAsset.get("id"),
                precision: this.props.baseAsset.get("precision"),
                amount:
                    this.state.newOpinionParameters.amount *
                    Math.pow(10, this.props.baseAsset.get("precision")) //TODO
            })
        };
        ask.price = new Price({base: ask.for_sale, quote: ask.to_receive});

        let current = type === "ask" ? ask : bid;

        const order = new LimitOrderCreate({
            for_sale: current.for_sale,
            expiration: expiry,
            to_receive: current.to_receive,
            seller: ChainStore.getAccount(this.props.currentAccount).get("id"),
            fee: {
                asset_id: feeID,
                amount: 0 //TODO
            }
        });

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

    _borrow() {
        console.log("borrow");
    }

    handleOpinionChange() {
        let newOpinion = this.state.newOpinionParameters;
        newOpinion.opinion = newOpinion.opinion === "no" ? "yes" : "no";
        newOpinion.opinionator = this.props.currentAccountId;
        this.setState({
            newOpinionParameters: newOpinion,
            bool_opinion: !this.state.bool_opinion
        });
    }

    handleAmountChange({amount, asset}) {
        let newOpinion = this.state.newOpinionParameters;
        newOpinion.amount = amount;
        newOpinion.opinionator = this.props.currentAccountId;
        this.setState({newOpinionParameter: newOpinion});

        if (typeof asset === "string") {
            this.setState({selectedAsset: asset});
        }
    }

    _isFormValid() {
        return parseFloat(this.state.newOpinionParameters.amount);
    }

    onOk() {
        const type =
            this.state.newOpinionParameters.opinion === "no" ? "bid" : "ask";
        const feeID = "1.3.0"; //TODO
        if (this._isFormValid()) {
            this._createOrder.call(this, type, feeID);
        } else {
            this.setState({showWarning: true});
        }
    }

    render() {
        const {showWarning, newOpinionParameters} = this.state;

        const footer = [
            <Button
                type="primary"
                key="submit"
                onClick={this.onOk.bind(this)}
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
                visible={this.props.show}
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
                                    value={this.props.market.symbol}
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
                                    value={this.props.market.condition}
                                />
                            </label>
                        </Form.Item>
                        <Form.Item>
                            <label className="left-label">
                                <Translate content="prediction.add_opinion_modal.opinion" />
                            </label>
                            <Translate
                                content="prediction.add_opinion_modal.no"
                                style={{marginRight: "10px"}}
                            />
                            <Switch
                                checked={this.state.bool_opinion}
                                onChange={this.handleOpinionChange}
                            />
                            <Translate
                                content="prediction.add_opinion_modal.yes"
                                style={{marginLeft: "10px"}}
                            />
                        </Form.Item>
                        <Form.Item>
                            <span
                                className={
                                    (!newOpinionParameters.amount &&
                                        showWarning) ||
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
                                        asset={this.props.baseAsset.get("id")}
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
    show: PropTypes.bool,
    onClose: PropTypes.func,
    market: PropTypes.any.isRequired,
    opinion: PropTypes.any,
    currentAccountId: PropTypes.string,
    submitNewOpinion: PropTypes.func,
    preselectedOpinion: PropTypes.string,
    preselectedAmount: PropTypes.number
};

AddOpinionModal.defaultProps = {
    show: false,
    market: null,
    opinion: {}
};
