import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../../Utility/FormattedAsset";
import utils from "common/utils";
import AmountSelector from "../../Utility/AmountSelectorStyleGuide";
import FormattedPrice from "../../Utility/FormattedPrice";
import counterpart from "counterpart";
import HelpContent from "../../Utility/HelpContent";
import {
    Checkbox,
    Tooltip,
    Form,
    Slider,
    Input,
    Icon,
    Row,
    Col
} from "bitshares-ui-style-guide";
import asset_utils from "../../../lib/common/asset_utils";

export function BorrowModalView({
    // Objects
    accountObj,
    backingAssetObj,
    collateralBalanceObj,
    debtBalanceObj,
    quoteAssetObj,
    newPosition,
    errors,

    // Strings, Floats and Numbers
    collateral,
    collateral_ratio,
    debtAmount,
    backingPrecision,
    maintenanceRatio,
    remainingBackingBalance,
    remainingDebtBalance,
    target_collateral_ratio,
    unlockedInputType,

    // Bool Flags
    disableHelp,
    isRatioLocked,
    isOriginalBelowMCR,
    isPredictionMarket,
    isValid,
    useTargetCollateral,

    // Callbacks
    onPayDebt,
    onMaximizeCollatereal,
    onBorrowChange,
    onLockChangeDebt,
    onCollateralChange,
    onLockChangeCollateral,
    onRatioChange,
    onLockChangeCR,
    onSetUseTCR,
    onTCRatioChange
}) {
    let quotePrecision = utils.get_asset_precision(
        quoteAssetObj.get("precision")
    );

    const userExchangePrice = newPosition ? (
        <FormattedPrice
            noPopOver
            noTip
            quote_amount={maintenanceRatio * debtAmount * quotePrecision}
            quote_asset={quoteAssetObj.get("id")}
            base_asset={backingAssetObj.get("id")}
            base_amount={collateral * backingPrecision}
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
                            onClick={onPayDebt.bind(this)}
                            content="borrow.pay_max_debt"
                        />
                        &nbsp;
                    </span>
                ) : null}
                <Translate component="span" content="transfer.available" />:{" "}
                <span>
                    {debtBalanceObj.id ? (
                        <FormattedAsset
                            amount={remainingDebtBalance}
                            asset={quoteAssetObj.get("id")}
                        />
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
                        onClick={onMaximizeCollatereal.bind(this)}
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
                <div
                    style={{
                        paddingBottom: "1rem"
                    }}
                >
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
                </div>
            )}

            {!isPredictionMarket && isOriginalBelowMCR ? (
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
                            quote_asset={asset_utils
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
                    onChange={onBorrowChange.bind(this)}
                    asset={quoteAssetObj.get("id")}
                    assets={[quoteAssetObj.get("id")]}
                    display_balance={bitAssetBalanceText}
                    placeholder="0.0"
                    tabIndex={1}
                    lockStatus={
                        unlockedInputType == "debt" || isRatioLocked
                            ? false
                            : true
                    }
                    onLockChange={onLockChangeDebt.bind(this)}
                />
                <AmountSelector
                    label="transaction.collateral"
                    amount={collateral.toString()}
                    onChange={onCollateralChange.bind(this)}
                    asset={backingAssetObj.get("id")}
                    assets={[backingAssetObj.get("id")]}
                    display_balance={backingBalanceText}
                    placeholder="0.0"
                    tabIndex={2}
                    lockStatus={
                        unlockedInputType == "collateral" || isRatioLocked
                            ? false
                            : true
                    }
                    onLockChange={onLockChangeCollateral.bind(this)}
                    validateStatus={errors.collateral_balance ? "error" : ""}
                    help={
                        errors.collateral_balance
                            ? errors.collateral_balance
                            : null
                    }
                />
                {!isPredictionMarket ? (
                    <React.Fragment>
                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item
                                    label={counterpart.translate(
                                        "borrow.coll_ratio"
                                    )}
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
                                    <Input
                                        value={
                                            collateral_ratio == 0
                                                ? ""
                                                : collateral_ratio
                                        }
                                        tabIndex={3}
                                        onChange={onRatioChange.bind(this)}
                                        className="input-group-unbordered-before"
                                        addonBefore={
                                            <Icon
                                                className={
                                                    !isRatioLocked
                                                        ? "grey"
                                                        : "green"
                                                }
                                                type={
                                                    !isRatioLocked
                                                        ? "unlock"
                                                        : "lock"
                                                }
                                                onClick={onLockChangeCR.bind(
                                                    this
                                                )}
                                                style={{fontSize: "20px"}}
                                            />
                                        }
                                    />
                                </Form.Item>
                            </Col>
                            <Col span={12}>
                                <Form.Item
                                    validateStatus={
                                        errors.tcr_below_maintenance
                                            ? "error"
                                            : ""
                                    }
                                    help={
                                        errors.tcr_below_maintenance
                                            ? errors.tcr_below_maintenance
                                            : null
                                    }
                                >
                                    <Input.Group
                                        compact
                                        style={{marginBottom: 8}}
                                    >
                                        <Checkbox
                                            onClick={onSetUseTCR.bind(this)}
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
                                            onChange={onTCRatioChange.bind(
                                                this
                                            )}
                                        />
                                    ) : null}
                                </Form.Item>
                            </Col>
                        </Row>
                        <Form.Item label={"Ratio Slider"}>
                            <Slider
                                step={0.01}
                                min={0}
                                max={maintenanceRatio * 12}
                                value={collateral_ratio}
                                onChange={onRatioChange.bind(this)}
                            />
                        </Form.Item>
                    </React.Fragment>
                ) : null}
            </Form>
        </div>
    );
}
