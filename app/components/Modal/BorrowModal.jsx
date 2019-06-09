import React from "react";
import PropTypes from "prop-types";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import Translate from "react-translate-component";
import ChainTypes from "../Utility/ChainTypes";
import ReactTooltip from "react-tooltip";
import BindToChainState from "../Utility/BindToChainState";
import FormattedAsset from "../Utility/FormattedAsset";
import utils from "common/utils";
import AmountSelector from "../Utility/AmountSelectorStyleGuide";
import BalanceComponent from "../Utility/BalanceComponent";
import WalletApi from "api/WalletApi";
import WalletDb from "stores/WalletDb";
import FormattedPrice from "../Utility/FormattedPrice";
import counterpart from "counterpart";
import HelpContent from "../Utility/HelpContent";
import Immutable from "immutable";
import {ChainStore} from "bitsharesjs";
import {List} from "immutable";
import {
    Checkbox,
    Modal,
    Button,
    Tooltip,
    Form,
    Slider,
    Input,
    Icon
} from "bitshares-ui-style-guide";
import asset_utils from "../../lib/common/asset_utils";

const BorrowModalView = props => {
    const {
        // Objects
        accountObj,
        backingAssetObj,
        collateralBalanceObj,
        debtBalanceObj,
        quoteAssetObj,
        errors,

        // Strings, Floats and Numbers
        collateral,
        collateral_ratio,
        debtAmount,
        maintenanceRatio,
        remainingBackingBalance,
        target_collateral_ratio,
        unlockedInputType,

        // Bool Flags
        disableHelp,
        isRatioLocked,
        isOriginalBelowMCR,
        isPredictionMarket,
        isValid,
        useTargetCollateral
    } = props;

    let quotePrecision = utils.get_asset_precision(
        quoteAssetObj.get("precision")
    );

    const userExchangePrice = this.state.newPosition ? (
        <FormattedPrice
            noPopOver
            noTip
            quote_amount={
                maintenanceRatio * this.state.debtAmount * quotePrecision
            }
            quoteAssetObj={quoteAssetObj.get("id")}
            base_asset={backingAssetObj.get("id")}
            base_amount={this.state.collateral * backingPrecision}
        />
    ) : null;

    const noValidComponent = (
        <div style={{textAlign: "center"}}>
            <Translate
                component="h3"
                content="borrow.no_valid"
                asset_symbol={quoteAssetObj.get("symbol")}
            />
        </div>
    );

    const bitAssetBalanceText = (
        <span>
            <span>
                {collateral != 0 ? (
                    <span>
                        <Translate
                            component="a"
                            onClick={props.onPayDebt.bind(this)}
                            content="borrow.pay_max_debt"
                        />
                        &nbsp;
                    </span>
                ) : null}
                <Translate component="span" content="transfer.available" />:{" "}
                <span>
                    {debtBalanceObj.id ? (
                        <BalanceComponent balance={debtBalanceObj.id} />
                    ) : (
                        <FormattedAsset
                            amount={0}
                            asset={quoteAssetObj.get("id")}
                        />
                    )}
                </span>
            </span>
        </span>
    );

    const backingBalanceText = (
        <span>
            <span>
                <span>
                    <Translate
                        component="a"
                        onClick={props.onMaximizeCollatereal.bind(this)}
                        content="borrow.use_max"
                    />
                    &nbsp;
                </span>
                <Translate component="span" content="transfer.available" />:{" "}
                <span>
                    {collateralBalanceObj.id ? (
                        <FormattedAsset
                            amount={remainingBackingBalance}
                            asset={backingAssetObj.get("id")}
                        />
                    ) : (
                        <FormattedAsset
                            amount={0}
                            asset={backingAssetObj.get("id")}
                        />
                    )}
                </span>
            </span>
        </span>
    );

    return !isValid ? (
        noValidComponent
    ) : (
        <div style={{textAlign: "left"}}>
            {disableHelp ? null : (
                <HelpContent
                    path={
                        "components/" +
                        (isPredictionMarket
                            ? "BorrowModalPrediction"
                            : "BorrowModal")
                    }
                    debt={quoteAssetObj.get("symbol")}
                    collateral={backingAssetObj.get("symbol")}
                    borrower={accountObj.get("name")}
                    mr={maintenanceRatio}
                />
            )}

            {isOriginalBelowMCR ? (
                <Translate
                    component="h6"
                    className="has-warning"
                    content="borrow.errors.below_info"
                />
            ) : null}

            {!isPredictionMarket ? (
                <div
                    style={{
                        paddingTop: "1rem",
                        paddingBottom: "1rem"
                    }}
                >
                    <div className="borrow-price-feeds">
                        <span className="borrow-price-label">
                            <Translate content="transaction.feed_price" />
                            :&nbsp;
                        </span>
                        <FormattedPrice
                            noPopOver
                            quote_amount={asset_utils
                                .extractRawFeedPrice(quoteAssetObj)
                                .getIn(["base", "amount"])}
                            quoteAssetObj={asset_utils
                                .extractRawFeedPrice(quoteAssetObj)
                                .getIn(["base", "asset_id"])}
                            base_asset={asset_utils
                                .extractRawFeedPrice(quoteAssetObj)
                                .getIn(["quote", "asset_id"])}
                            base_amount={asset_utils
                                .extractRawFeedPrice(quoteAssetObj)
                                .getIn(["quote", "amount"])}
                        />
                    </div>
                    <b />
                    <div
                        className={
                            "borrow-price-final " +
                            (errors.below_maintenance
                                ? "has-error"
                                : errors.close_maintenance
                                    ? "has-warning"
                                    : "")
                        }
                    >
                        <span className="borrow-price-label">
                            <Translate content="exchange.your_price" />
                            :&nbsp;
                        </span>
                        {userExchangePrice}
                    </div>
                </div>
            ) : null}

            <Form className="full-width" layout="vertical">
                <AmountSelector
                    label="transaction.borrow_amount"
                    amount={debtAmount.toString()}
                    onChange={props.onBorrowChange.bind(this)}
                    asset={quoteAssetObj.get("id")}
                    assets={[quoteAssetObj.get("id")]}
                    display_balance={bitAssetBalanceText}
                    placeholder="0.0"
                    tabIndex={1}
                    lockStatus={unlockedInputType == "debt" ? false : true}
                    onLockChange={props.onLockChangeDebt.bind(this)}
                />
                <AmountSelector
                    label="transaction.collateral"
                    amount={collateral.toString()}
                    onChange={props.onCollateralChange.bind(this)}
                    asset={backingAssetObj.get("id")}
                    assets={[backingAssetObj.get("id")]}
                    display_balance={backingBalanceText}
                    placeholder="0.0"
                    tabIndex={2}
                    lockStatus={
                        unlockedInputType == "collateral" ? false : true
                    }
                    onLockChange={props.onLockChangeCollateral.bind(this)}
                    validateStatus={errors.collateral_balance ? "error" : ""}
                    help={
                        errors.collateral_balance
                            ? errors.collateral_balance
                            : null
                    }
                />
                {!isPredictionMarket ? (
                    <Form.Item
                        label={counterpart.translate("borrow.coll_ratio")}
                        validateStatus={
                            errors.close_maintenance
                                ? "warning"
                                : errors.below_maintenance
                                    ? "error"
                                    : null
                        }
                        help={
                            errors.close_maintenance
                                ? errors.close_maintenance
                                : errors.below_maintenance
                                    ? errors.below_maintenance
                                    : null
                        }
                    >
                        <Input.Group compact>
                            <Input
                                style={{width: "30%"}}
                                value={
                                    collateral_ratio == 0
                                        ? ""
                                        : collateral_ratio.toFixed(2)
                                }
                                tabIndex={3}
                                onChange={props.onRatioChange.bind(this)}
                                className="input-group-unbordered-before"
                                addonBefore={
                                    <Tooltip
                                        title="Locking Collateral Ratio will override other locked fields"
                                        placement="right"
                                    >
                                        <Icon
                                            className={
                                                !isRatioLocked
                                                    ? "green"
                                                    : "blue"
                                            }
                                            type={
                                                !isRatioLocked
                                                    ? "unlock"
                                                    : "lock"
                                            }
                                            onClick={props.onLockChangeCR.bind(
                                                this
                                            )}
                                            style={{fontSize: "20px"}}
                                        />
                                    </Tooltip>
                                }
                            />
                            <Slider
                                style={{width: "67%", marginTop: 10}}
                                step={0.01}
                                min={0}
                                max={maintenanceRatio * 6}
                                value={collateral_ratio}
                                onChange={props.onRatioChange.bind(this)}
                            />
                        </Input.Group>
                    </Form.Item>
                ) : null}
                {!isPredictionMarket ? (
                    <Form.Item
                        validateStatus={
                            errors.tcr_below_maintenance ? "error" : ""
                        }
                        help={
                            errors.tcr_below_maintenance
                                ? errors.tcr_below_maintenance
                                : null
                        }
                    >
                        <Input.Group compact>
                            <Checkbox
                                onClick={props.onSetUseTCR.bind(this)}
                                checked={useTargetCollateral}
                                tabIndex={4}
                            >
                                <Translate content="borrow.enable_target_collateral_ratio" />
                            </Checkbox>
                            <Tooltip
                                title={counterpart.translate(
                                    "tooltip.target_collateral_ratio"
                                )}
                            >
                                <Icon type="question-circle" />
                            </Tooltip>
                        </Input.Group>

                        {useTargetCollateral ? (
                            <Input
                                value={
                                    isNaN(target_collateral_ratio)
                                        ? "0"
                                        : target_collateral_ratio
                                }
                                tabIndex={5}
                                onChange={props.onTCRatioChange.bind(this)}
                            />
                        ) : null}
                    </Form.Item>
                ) : null}
            </Form>
        </div>
    );
};

/**
 *  Given an account and an asset id, render a modal allowing modification of a margin position for that asset
 *
 *  Expected Properties:
 *     quoteAssetObj:  asset id, must be a bitasset
 *     accountObj: full_account object for the account to use
 *
 */

class BorrowModalContent extends React.Component {
    static propTypes = {
        quoteAssetObj: ChainTypes.ChainAsset.isRequired,
        debtBalanceObj: ChainTypes.ChainObject,
        backingAssetObj: ChainTypes.ChainAsset.isRequired,
        collateralBalanceObj: ChainTypes.ChainObject,
        call_orders: ChainTypes.ChainObjectsList,
        hasCallOrders: PropTypes.bool
    };

    constructor(props) {
        super(props);
        this.state = this._initialState(props);

        this._onSubmit = this._onSubmit.bind(this);
    }

    _initialState(props) {
        let currentPosition = props ? this._getCurrentPosition(props) : {};

        if (currentPosition.collateral) {
            let debt = utils.get_asset_amount(
                currentPosition.debt,
                props.quoteAssetObj
            );
            let collateral = utils.get_asset_amount(
                currentPosition.collateral,
                props.backingAssetObj
            );

            let target_collateral_ratio = !isNaN(
                currentPosition.target_collateral_ratio
            )
                ? currentPosition.target_collateral_ratio / 1000
                : 0;

            return {
                debtAmount: debt ? debt.toString() : null,
                collateral: collateral ? collateral.toString() : null,
                collateral_ratio: this._getCollateralRatio(debt, collateral),
                target_collateral_ratio: target_collateral_ratio,
                errors: this._getInitialErrors(),
                useTargetCollateral: target_collateral_ratio > 0 ? true : false,
                original_position: {
                    debt: debt,
                    collateral: collateral,
                    target_collateral_ratio: target_collateral_ratio
                },
                unlockedInputType: "debt",
                isRatioLocked: true
            };
        } else {
            return {
                debtAmount: 1,
                collateral: 1,
                collateral_ratio: this._getInitialCollateralRatio(props),
                target_collateral_ratio: this._getMaintenanceRatio(),
                errors: this._getInitialErrors(),
                useTargetCollateral: false,
                original_position: {
                    debt: 0,
                    collateral: 0
                },
                unlockedInputType: "debt",
                isRatioLocked: true
            };
        }
    }

    componentDidUpdate() {
        ReactTooltip.rebuild();
    }

    componentDidMount() {
        let newState = this._initialState(this.props);

        this.setState(newState);
        this._setUpdatedPosition(newState);
    }

    shouldComponentUpdate(nextProps, nextState) {
        return (
            this.props.visible !== nextProps.visible ||
            !utils.are_equal_shallow(nextState, this.state) ||
            !Immutable.is(nextProps.quoteAssetObj, this.props.quoteAssetObj) ||
            !nextProps.backingAssetObj.get("symbol") ===
                this.props.backingAssetObj.get("symbol") ||
            !Immutable.is(nextProps.accountObj, this.props.accountObj) ||
            !Immutable.is(nextProps.call_orders, this.props.call_orders) ||
            this.state.unlockedInputType !== nextState.unlockedInputType
        );
    }

    componentWillReceiveProps(nextProps) {
        const {debtAmount, collateral, collateral_ratio} = this.state;

        if (
            nextProps.accountObj !== this.props.accountObj ||
            nextProps.hasCallOrders !== this.props.hasCallOrders ||
            nextProps.quoteAssetObj.get("id") !==
                this.props.quoteAssetObj.get("id")
        ) {
            let newState = this._initialState(nextProps);

            let revalidate = false;
            if (debtAmount || collateral || collateral_ratio) {
                newState.debtAmount = debtAmount;
                newState.collateral = collateral;
                newState.collateral_ratio = collateral_ratio;
                revalidate = true;
            }

            this.setState(newState);

            if (revalidate) {
                this._validateFields(newState);
            }
        }
    }

    _getInitialErrors() {
        return {
            collateral_balance: null,
            ratio_too_high: null
        };
    }

    _getMaintenanceRatio() {
        return (
            this.props.quoteAssetObj.getIn([
                "bitasset",
                "current_feed",
                "maintenance_collateral_ratio"
            ]) / 1000
        );
    }

    confirmClicked(e) {
        e.preventDefault();
        ZfApi.publish(this.props.modalId, "close");
    }

    _onBorrowChange(e) {
        let feed_price = this._getFeedPrice();
        let amount = e.amount.replace(/,/g, "");

        let collateral = !this.state.isRatioLocked
            ? this.state.collateral
            : (
                  this.state.collateral_ratio *
                  (amount / feed_price).toFixed(
                      this.props.backingAssetObj.get("precision")
                  )
              ).toFixed(this.props.backingAssetObj.get("precision"));

        let collateral_ratio = this.state.isRatioLocked
            ? this.state.collateral_ratio
            : this.state.collateral / (amount / feed_price);

        let newState = {
            debtAmount: amount,
            collateral: collateral,
            collateral_ratio: collateral_ratio
        };

        this.setState(newState);
        this._validateFields(newState);
        this._setUpdatedPosition(newState);
    }

    _onCollateralChange(e) {
        let {isRatioLocked, collateral_ratio} = this.state;
        let amount = e.amount.replace(/,/g, "");

        let feed_price = this._getFeedPrice();
        const collateralRatio = !isRatioLocked
            ? amount / (this.state.debtAmount / feed_price)
            : collateral_ratio;

        const debtAmount = !isRatioLocked
            ? this.state.debtAmount
            : ((amount * feed_price) / collateralRatio).toFixed(
                  this.props.backingAssetObj.get("precision")
              );

        let newState = this._isPredictionMarket(this.props)
            ? {
                  debtAmount: amount,
                  collateral: amount,
                  collateral_ratio: 1
              }
            : {
                  debtAmount: debtAmount,
                  collateral: amount,
                  collateral_ratio: collateralRatio
              };

        console.log(newState);

        this.setState(newState);
        this._validateFields(newState);
        this._setUpdatedPosition(newState);
    }

    _onTargetRatioChange(e) {
        let target = e.target.value;
        // Ensure input is valid
        const regexp_numeral = new RegExp(/[[:digit:]]/);
        if (!regexp_numeral.test(target)) {
            target = target.replace(/[^0-9.]/g, "");
        }

        let newState = {
            target_collateral_ratio: target
        };

        this.setState(newState);
        this._validateFields(newState);
        this._setUpdatedPosition(newState);
    }

    _onRatioChange(e) {
        let feed_price = this._getFeedPrice();
        let debtAmount;
        let collateral;
        let ratio = 0;

        if (e.target) {
            // Ensure input is valid
            const regexp_numeral = new RegExp(/[[:digit:]]/);
            if (!regexp_numeral.test(e.target.value)) {
                e.target.value = e.target.value.replace(/[^0-9.]/g, "");
            }
            ratio = parseFloat(e.target.value);
        } else {
            ratio = e;
        }

        if (this.state.unlockedInputType == "debt") {
            debtAmount = ((this.state.collateral * feed_price) / ratio).toFixed(
                this.props.backingAssetObj.get("precision")
            );
            collateral = this.state.collateral;
        } else {
            debtAmount = this.state.debtAmount;
            collateral = ((this.state.debtAmount / feed_price) * ratio).toFixed(
                this.props.backingAssetObj.get("precision")
            );
        }

        let newState = {
            debtAmount: debtAmount,
            collateral: collateral,
            collateral_ratio: ratio
        };

        this.setState(newState);
        this._validateFields(newState);
        this._setUpdatedPosition(newState);
    }

    _maximizeCollateral() {
        let currentPosition = this.props
            ? this._getCurrentPosition(this.props)
            : {};
        let initialCollateral = 0;

        if (currentPosition.collateral) {
            initialCollateral = utils.get_asset_amount(
                currentPosition.collateral,
                this.props.backingAssetObj
            );
        }

        // Short amount must be anyting than zero
        let debtAmount = this.state.debtAmount != 0 ? this.state.debtAmount : 1;
        let collateral = this.props.collateralBalanceObj.get("balance");
        let precision = utils.get_asset_precision(this.props.backingAssetObj);

        // Make sure we don't go over the maximum collateral ratio
        let maximizedCollateral = Math.floor(
            Math.min(
                collateral / precision + initialCollateral - 10,
                (debtAmount / this._getFeedPrice()) * 1000.0
            )
        );

        this._onCollateralChange(
            new Object({amount: maximizedCollateral.toString()})
        );
    }

    // Usage?
    _maximizeDebt() {
        let currentPosition = this.props
            ? this._getCurrentPosition(this.props)
            : {};
        let initialCollateral = 0;

        if (currentPosition.collateral) {
            initialCollateral = utils.get_asset_amount(
                currentPosition.collateral,
                this.props.backingAssetObj
            );
        }

        let maximumCollateral =
            this.props.collateralBalanceObj.get("balance") /
                utils.get_asset_precision(this.props.backingAssetObj) +
            initialCollateral -
            10;
        const debtAmount =
            (maximumCollateral / this.state.collateral_ratio) *
            this._getFeedPrice();

        const newState = {
            debtAmount: debtAmount,
            collateral: maximumCollateral,
            collateral_ratio: this.state.collateral_ratio
        };

        this.setState(newState);
        this._validateFields(newState);
        this._setUpdatedPosition(newState);
    }

    _payDebt() {
        let currentPosition = this.props
            ? this._getCurrentPosition(this.props)
            : {debt: 0};

        if (currentPosition.debt <= 0) {
            return;
        }

        const debtAmount = utils.get_asset_amount(
            Math.max(
                currentPosition.debt - this.props.debtBalanceObj.get("balance"),
                0
            ),
            this.props.quoteAssetObj
        );

        this._onBorrowChange({
            amount: debtAmount.toString()
        });
    }

    _setUpdatedPosition(newState) {
        this.setState({
            newPosition:
                parseFloat(newState.debtAmount) /
                parseFloat(newState.collateral)
        });
    }

    _validateFields(newState) {
        let errors = this._getInitialErrors();
        let {original_position} = this.state;
        let collateralBalanceObj = !this.props.collateralBalanceObj
            ? {balance: 0}
            : this.props.collateralBalanceObj.toJS();

        let maintenanceRatio = this._getMaintenanceRatio();
        let originalCR = this._getCollateralRatio(
            original_position.debt,
            original_position.collateral
        );
        let isOriginalBelowMCR =
            original_position.collateral > 0 && originalCR < maintenanceRatio;

        if (
            parseFloat(newState.collateral) - original_position.collateral >
            utils.get_asset_amount(
                collateralBalanceObj.balance,
                this.props.backingAssetObj.toJS()
            )
        ) {
            errors.collateral_balance = counterpart.translate(
                "borrow.errors.collateral"
            );
        }

        if (
            newState.target_collateral_ratio &&
            newState.target_collateral_ratio < maintenanceRatio
        ) {
            errors.tcr_below_maintenance = counterpart.translate(
                "borrow.errors.below_mcr_tcr",
                {mr: maintenanceRatio}
            );
        }

        if (
            isOriginalBelowMCR &&
            newState.debtAmount > original_position.debt
        ) {
            errors.below_maintenance = counterpart.translate(
                "borrow.errors.increased_debt_on_margin_call"
            );
        } else if (
            isOriginalBelowMCR &&
            parseFloat(newState.collateral_ratio) <= parseFloat(originalCR)
        ) {
            errors.below_maintenance = counterpart.translate(
                "borrow.errors.below_ratio_mcr_update",
                {ocr: originalCR.toFixed(4)}
            );
        } else if (
            !isOriginalBelowMCR &&
            parseFloat(newState.collateral_ratio) <
                (this._isPredictionMarket(this.props) ? 1 : maintenanceRatio)
        ) {
            errors.below_maintenance = counterpart.translate(
                "borrow.errors.below",
                {mr: maintenanceRatio}
            );
        } else if (
            parseFloat(newState.collateral_ratio) <
            (this._isPredictionMarket(this.props) ? 1 : maintenanceRatio + 0.5)
        ) {
            errors.close_maintenance = counterpart.translate(
                "borrow.errors.close",
                {mr: maintenanceRatio}
            );
        }

        this.setState({errors});
    }

    _onSubmit(e) {
        e.preventDefault();

        this.props.hideModal();

        let quotePrecision = utils.get_asset_precision(
            this.props.quoteAssetObj.get("precision")
        );
        let backingPrecision = utils.get_asset_precision(
            this.props.backingAssetObj.get("precision")
        );
        let currentPosition = this._getCurrentPosition(this.props);

        let isTCR =
            typeof this.state.target_collateral_ratio !== "undefined" &&
            this.state.target_collateral_ratio > 0 &&
            this.state.useTargetCollateral
                ? true
                : false;

        let extensionsProp = false;

        if (isTCR) {
            extensionsProp = {
                target_collateral_ratio: parseInt(
                    this.state.target_collateral_ratio * 1000,
                    10
                )
            };
        }

        var tr = WalletApi.new_transaction();
        if (extensionsProp) {
            tr.add_type_operation("call_order_update", {
                fee: {
                    amount: 0,
                    asset_id: 0
                },
                funding_accountObj: this.props.accountObj.get("id"),
                delta_collateral: {
                    amount: parseInt(
                        this.state.collateral * backingPrecision -
                            currentPosition.collateral,
                        10
                    ),
                    asset_id: this.props.backingAssetObj.get("id")
                },
                delta_debt: {
                    amount: parseInt(
                        this.state.debtAmount * quotePrecision -
                            currentPosition.debt,
                        10
                    ),
                    asset_id: this.props.quoteAssetObj.get("id")
                },
                extensions: extensionsProp
            });
        } else {
            tr.add_type_operation("call_order_update", {
                fee: {
                    amount: 0,
                    asset_id: 0
                },
                funding_accountObj: this.props.accountObj.get("id"),
                delta_collateral: {
                    amount: parseInt(
                        this.state.collateral * backingPrecision -
                            currentPosition.collateral,
                        10
                    ),
                    asset_id: this.props.backingAssetObj.get("id")
                },
                delta_debt: {
                    amount: parseInt(
                        this.state.debtAmount * quotePrecision -
                            currentPosition.debt,
                        10
                    ),
                    asset_id: this.props.quoteAssetObj.get("id")
                }
            });
        }
        WalletDb.process_transaction(tr, null, true).catch(err => {
            // console.log("unlock failed:", err);
        });

        ZfApi.publish(this.props.modalId, "close");
    }

    _getCurrentPosition(props) {
        let currentPosition = {
            collateral: null,
            debt: null
        };

        if (props && props.hasCallOrders && props.call_orders) {
            currentPosition = props.call_orders.filter(a => !!a).find(a => {
                return (
                    a.getIn(["call_price", "quote", "asset_id"]) ===
                    props.quoteAssetObj.get("id")
                );
            });

            currentPosition = !!currentPosition
                ? currentPosition.toJS()
                : {
                      collateral: null,
                      debt: null
                  };
        }
        return currentPosition;
    }

    _getFeedPrice() {
        if (!this.props) {
            return 1;
        }

        if (this._isPredictionMarket(this.props)) {
            return 1;
        }

        return (
            1 /
            utils.get_asset_price(
                asset_utils
                    .extractRawFeedPrice(this.props.quoteAssetObj)
                    .getIn(["quote", "amount"]),
                this.props.backingAssetObj,
                asset_utils
                    .extractRawFeedPrice(this.props.quoteAssetObj)
                    .getIn(["base", "amount"]),
                this.props.quoteAssetObj
            )
        );
    }

    _getInitialCollateralRatio(props) {
        return this._isPredictionMarket(props)
            ? 1
            : this._getMaintenanceRatio() * 2;
    }

    _getCollateralRatio(debt, collateral) {
        return collateral / (debt / this._getFeedPrice());
    }

    _isPredictionMarket(props) {
        return props.quoteAssetObj.getIn(["bitasset", "is_prediction_market"]);
    }

    _setUseTargetCollateral() {
        this.setState({
            useTargetCollateral: !this.state.useTargetCollateral
        });
    }

    _onLockChange(type, status) {
        this.setState({
            unlockedInputType: type
        });
    }

    _onLockCR() {
        this.setState({
            isRatioLocked: !this.state.isRatioLocked
        });
    }

    render() {
        let {
            quoteAssetObj,
            debtBalanceObj,
            backingAssetObj,
            collateralBalanceObj
        } = this.props;
        let {
            debtAmount,
            collateral,
            collateral_ratio,
            target_collateral_ratio,
            errors,
            original_position,
            useTargetCollateral
        } = this.state;

        let backingPrecision = utils.get_asset_precision(
            this.props.backingAssetObj.get("precision")
        );

        if (
            !collateral_ratio ||
            isNaN(collateral_ratio) ||
            !(collateral_ratio > 0.0 && collateral_ratio < 1000.0)
        )
            collateral_ratio = 0;
        debtBalanceObj = !debtBalanceObj
            ? {balance: 0, id: null}
            : debtBalanceObj.toJS();
        collateralBalanceObj = !collateralBalanceObj
            ? {balance: 0, id: null}
            : collateralBalanceObj.toJS();

        // Dynamically update user's remaining collateral
        let currentPosition = this._getCurrentPosition(this.props);
        let backingBalance = collateralBalanceObj.id
            ? ChainStore.getObject(collateralBalanceObj.id)
            : null;
        let backingAmount = backingBalance ? backingBalance.get("balance") : 0;
        let collateralChange = parseInt(
            this.state.collateral * backingPrecision -
                currentPosition.collateral,
            10
        );
        let remainingBackingBalance = backingAmount - collateralChange;

        let feed_price = this._getFeedPrice();

        let maintenanceRatio = this._getMaintenanceRatio();

        let isPredictionMarket = this._isPredictionMarket(this.props);

        let isOriginalBelowMCR =
            original_position.collateral > 0 &&
            this._getCollateralRatio(
                original_position.debt,
                original_position.collateral
            ) < maintenanceRatio;

        const footer = [];

        const resetModal = () => {
            this.setState(this._initialState(this.props));
        };

        if (!isPredictionMarket && isNaN(feed_price)) {
            footer.push(
                <Button tabIndex={6} onClick={this.props.hideModal}>
                    {counterpart.translate("accountObj.perm.cancel")}
                </Button>
            );
        } else {
            footer.push(
                <Button
                    tabIndex={6}
                    key="submit"
                    type="primary"
                    onClick={this._onSubmit}
                >
                    {counterpart.translate("borrow.adjust")}
                </Button>
            );
            footer.push(
                <Button tabIndex={7} key="cancel" onClick={resetModal}>
                    {counterpart.translate("wallet.reset")}
                </Button>
            );
        }

        return (
            <Modal
                title={counterpart.translate("borrow.title", {
                    asset_symbol: quoteAssetObj.get("symbol")
                })}
                visible={this.props.visible}
                onCancel={this.props.hideModal}
                footer={footer}
            >
                <BorrowModalView
                    // Objects
                    accountObj={this.props.accountObj}
                    backingAssetObj={backingAssetObj}
                    collateralBalanceObj={collateralBalanceObj}
                    debtBalanceObj={debtBalanceObj}
                    quoteAssetObj={quoteAssetObj}
                    errors={errors}
                    // Strings, Floats and Numbers
                    collateral={collateral}
                    collateral_ratio={collateral_ratio}
                    debtAmount={debtAmount}
                    maintenanceRatio={maintenanceRatio}
                    remainingBackingBalance={remainingBackingBalance}
                    target_collateral_ratio={target_collateral_ratio}
                    unlockedInputType={this.state.unlockedInputType}
                    // Bool Flags
                    disableHelp={this.props.disableHelp}
                    isRatioLocked={this.state.isRatioLocked}
                    isOriginalBelowMCR={isOriginalBelowMCR}
                    isPredictionMarket={isPredictionMarket}
                    isValid={!isPredictionMarket && !isNaN(feed_price)}
                    useTargetCollateral={useTargetCollateral}
                    // Actions
                    onBorrowChange={this._onBorrowChange.bind(this)}
                    onCollateralChange={this._onCollateralChange.bind(this)}
                    onMaximizeCollatereal={this._maximizeCollateral.bind(this)}
                    onRatioChange={this._onRatioChange.bind(this)}
                    onLockChangeCR={this._onLockCR.bind(this)}
                    onLockChangeCollateral={this._onLockChange.bind(
                        this,
                        "collateral"
                    )}
                    onLockChangeDebt={this._onLockChange.bind(this, "debt")}
                    onPayDebt={this._payDebt.bind(this)}
                    onTCRatioChange={this._onTargetRatioChange.bind(this)}
                    onSetUseTCR={this._setUseTargetCollateral.bind(this)}
                />
            </Modal>
        );
    }
}
BorrowModalContent = BindToChainState(BorrowModalContent);

/* This wrapper class appears to be necessary because the decorator eats the show method from refs */
export default class ModalWrapper extends React.Component {
    constructor() {
        super();
        this.state = {
            smallScreen: false,
            open: false
        };
    }

    show() {
        this.props.showModal();
    }

    componentWillMount() {
        this.setState({
            smallScreen: window.innerHeight <= 800
        });
    }

    render() {
        let {quoteAssetObj, backingAssetObj, accountObj} = this.props;
        let accountObjBalance = accountObj.get("balances").toJS();
        let coreBalance, bitAssetBalance;

        if (accountObjBalance) {
            for (var id in accountObjBalance) {
                if (id === backingAssetObj) {
                    coreBalance = accountObjBalance[id];
                }

                if (id === quoteAssetObj) {
                    bitAssetBalance = accountObjBalance[id];
                }
            }
        }

        return this.props.visible ? (
            <BorrowModalContent
                visible={this.props.visible}
                hideModal={this.props.hideModal}
                showModal={this.props.showModal}
                quoteAssetObj={quoteAssetObj}
                call_orders={accountObj.get("call_orders", List()).toList()}
                hasCallOrders={
                    accountObj.get("call_orders") &&
                    accountObj.get("call_orders").size > 0
                }
                modalId={this.props.modalId}
                debtBalanceObj={bitAssetBalance}
                collateralBalanceObj={coreBalance}
                backingAssetObj={backingAssetObj}
                disableHelp={this.state.smallScreen}
                accountObj={accountObj}
            />
        ) : null;
    }
}
