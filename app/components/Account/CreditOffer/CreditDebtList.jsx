import React from "react";
import {connect} from "alt-react";
import counterpart from "counterpart";
import utils from "common/utils";
import AccountStore from "../../../stores/AccountStore";
import CreditOfferStore from "../../../stores/CreditOfferStore";
import {
    Tooltip,
    Modal,
    Button,
    Form,
    Table,
    Icon as AntIcon
} from "bitshares-ui-style-guide";
import CreditOfferActions, {
    FEE_RATE_DENOM
} from "../../../actions/CreditOfferActions";
import LinkToAccountById from "../../Utility/LinkToAccountById";
import FormattedAsset from "../../Utility/FormattedAsset";
import moment from "moment";
import Translate from "react-translate-component";
import AmountSelector from "../../Utility/AmountSelectorStyleGuide";
import FeeAssetSelector from "../../Utility/FeeAssetSelector";
import {checkBalance} from "common/trxHelper";
import {ChainStore} from "bitsharesjs";
import {Asset} from "../../../lib/common/MarketClasses";
import BalanceComponent from "../../Utility/BalanceComponent";

const getUninitializedFeeAmount = () =>
    new Asset({amount: 0, asset_id: "1.3.0"});

class CreditDebtList extends React.Component {
    constructor(props) {
        super();

        this.state = {
            dealId: null,
            showModal: false,
            debtAsset: null,
            debtAmount: null,
            amount: null,
            feeAmount: getUninitializedFeeAmount(),
            maxAmount: false,
            balanceError: false,
            collateralAmount: 0,
            collateralAsset: null,
            feeRate: null
        };
        this._renderRepayModal = this._renderRepayModal.bind(this);
        this.showRepayModal = this.showRepayModal.bind(this);
        this.hideRepayModal = this.hideRepayModal.bind(this);
        this._getColumns = this._getColumns.bind(this);
    }

    componentDidMount() {
        CreditOfferActions.getCreditDealsByBorrower({
            name_or_id: this.props.account.get("id"),
            flag: "first"
        });
    }

    _renderRepayModal() {
        let {account} = this.props;
        let {
            debtAmount,
            debtAsset,
            amount,
            feeAmount,
            balanceError,
            asset
        } = this.state;
        let balance = null;
        const isSubmitNotValid = !amount || !asset || balanceError;
        if (account && account.get("balances")) {
            let account_balances = account.get("balances").toJS();
            let _error = balanceError ? "has-error" : "";
            if (account_balances[debtAsset]) {
                balance = (
                    <span>
                        <Translate
                            component="span"
                            content="transfer.available"
                        />
                        :{" "}
                        <span
                            className={_error}
                            style={{
                                borderBottom: "#A09F9F 1px dotted",
                                cursor: "pointer"
                            }}
                            onClick={this._setTotal.bind(
                                this,
                                debtAsset,
                                account_balances[debtAsset],
                                feeAmount.getAmount({real: true}),
                                feeAmount.asset_id
                            )}
                        >
                            <BalanceComponent
                                balance={account_balances[debtAsset]}
                                trimZero
                            />
                        </span>
                    </span>
                );
            } else {
                balance = (
                    <span>
                        <span className={_error}>
                            <Translate content="transfer.errors.noFunds" />
                        </span>
                    </span>
                );
            }
        }
        return (
            <Modal
                wrapClassName="modal--transaction-confirm"
                title={counterpart.translate("credit_offer.repay")}
                visible={this.state.showModal}
                id="modal-repay"
                overlay={true}
                onCancel={this.hideRepayModal}
                footer={[
                    <Button
                        key={"send"}
                        disabled={isSubmitNotValid}
                        onClick={this._onSubmit.bind(this)}
                    >
                        <Translate content="wallet.submit" />
                    </Button>,
                    <Button key="Cancel" onClick={this.hideRepayModal}>
                        <Translate content="wallet.cancel" />
                    </Button>
                ]}
            >
                <div className="grid-block vertical no-overflow">
                    <Form className="full-width" layout="vertical">
                        <Form.Item
                            label={counterpart.translate(
                                "credit_offer.my_debt"
                            )}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 16}}
                            colon={false}
                        >
                            <div
                                style={{
                                    textAlign: "right",
                                    width: "100%",
                                    color: "#e3745b"
                                }}
                            >
                                <FormattedAsset
                                    amount={debtAmount}
                                    asset={debtAsset}
                                    trimZero
                                />
                            </div>
                        </Form.Item>
                        <AmountSelector
                            label="transfer.amount"
                            amount={amount}
                            asset={debtAsset}
                            display_balance={balance}
                            onChange={this._onAmountChanged.bind(this)}
                            allowNaN={true}
                        />
                        <Form.Item
                            label={counterpart.translate(
                                "credit_offer.redemption_collateral"
                            )}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 16}}
                            colon={false}
                        >
                            <div
                                style={{
                                    textAlign: "right",
                                    width: "100%",
                                    color: "#7ed321"
                                }}
                            >
                                {this._renderCollateral()}
                            </div>
                        </Form.Item>
                        <Form.Item
                            label={counterpart.translate(
                                "credit_offer.estimated_fee"
                            )}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 16}}
                            colon={false}
                        >
                            <div
                                style={{
                                    textAlign: "right",
                                    width: "100%",
                                    color: "#7ed321"
                                }}
                            >
                                {this._renderFeeRate()}
                            </div>
                        </Form.Item>
                        <Form.Item
                            label={counterpart.translate(
                                "credit_offer.total_to_repay"
                            )}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 16}}
                            colon={false}
                        >
                            <div
                                style={{
                                    textAlign: "right",
                                    width: "100%",
                                    color: "#7ed321"
                                }}
                            >
                                {this._renderTotalAmount()}
                            </div>
                        </Form.Item>
                        <FeeAssetSelector
                            account={account}
                            transaction={{type: "credit_deal_repay"}}
                            onChange={this.onFeeChanged.bind(this)}
                        />
                    </Form>
                </div>
            </Modal>
        );
    }

    _renderCollateral() {
        let {
            debtAmount,
            collateralAmount,
            collateralAsset,
            asset,
            amount
        } = this.state;
        if (asset) {
            let cAsset = new Asset({
                asset_id: asset.get("id"),
                real: amount,
                precision: asset.get("precision")
            });
            let currentAmount = 0;
            if (cAsset.getAmount() > debtAmount) {
                currentAmount = collateralAmount;
            } else if (amount <= 0) {
                currentAmount = 0;
            } else {
                currentAmount = parseInt(
                    (parseFloat(cAsset.getAmount()) / parseFloat(debtAmount)) *
                        collateralAmount
                );
            }
            return (
                <FormattedAsset
                    amount={currentAmount}
                    asset={collateralAsset}
                    trimZero
                />
            );
        } else {
            return (
                <FormattedAsset amount={0} asset={collateralAsset} trimZero />
            );
        }
    }

    _renderTotalAmount() {
        let {feeRate, debtAsset, debtAmount, amount, asset} = this.state;
        let fRate = parseFloat(feeRate) / FEE_RATE_DENOM;
        if (asset) {
            let cAsset = new Asset({
                asset_id: asset.get("id"),
                real: amount,
                precision: asset.get("precision")
            });
            let rate = parseFloat(cAsset.getAmount()) / debtAmount;
            let cAmount = fRate * debtAmount * rate;
            let realFee =
                cAmount / utils.get_asset_precision(asset.get("precision"));
            let realRepay = cAsset.getAmount({real: true});
            let realTotal = realFee + realRepay;
            return (
                <span>
                    <FormattedAsset
                        exact_amount={true}
                        amount={realTotal}
                        asset={debtAsset}
                        trimZero
                    />
                </span>
            );
        } else {
            <span>
                <FormattedAsset amount={0} asset={debtAsset} trimZero />{" "}
            </span>;
        }
    }

    _renderFeeRate() {
        let {feeRate, debtAsset, debtAmount, amount, asset} = this.state;
        let fRate = parseFloat(feeRate) / FEE_RATE_DENOM;
        if (asset) {
            let cAsset = new Asset({
                asset_id: asset.get("id"),
                real: amount,
                precision: asset.get("precision")
            });
            let rate = parseFloat(cAsset.getAmount()) / debtAmount;
            let cAmount = fRate * debtAmount * rate;
            return (
                <span>
                    <FormattedAsset
                        amount={cAmount}
                        asset={debtAsset}
                        trimZero
                    />{" "}
                    {`(${fRate * 100}%)`}
                </span>
            );
        } else {
            <span>
                <FormattedAsset amount={0} asset={debtAsset} trimZero />{" "}
                {`(${fRate * 100}%)`}
            </span>;
        }
    }

    _onAmountChanged({amount, asset}) {
        if (!asset) return;
        if (typeof asset !== "object") {
            asset = ChainStore.getAsset(asset);
        }

        this.setState(
            {
                amount,
                asset,
                error: null,
                maxAmount: false
            },
            this._checkBalance
        );
    }

    _setTotal(asset_id, balance_id) {
        const {feeAmount, debtAmount} = this.state;
        let balanceObject = ChainStore.getObject(balance_id);
        let transferAsset = ChainStore.getObject(asset_id);

        if (balanceObject) {
            let balance = new Asset({
                amount: balanceObject.get("balance"),
                asset_id: transferAsset.get("id"),
                precision: transferAsset.get("precision")
            });
            if (feeAmount.asset_id === balance.asset_id) {
                balance.minus(feeAmount);
            }
            const amount =
                balance.getAmount() > debtAmount
                    ? new Asset({
                          amount: debtAmount,
                          asset_id,
                          precision: transferAsset.get("precision")
                      })
                    : balance;
            this.setState(
                {maxAmount: true, amount: amount.getAmount({real: true})},
                this._checkBalance
            );
        }
    }

    _checkBalance() {
        const {feeAmount, amount, account, debtAsset} = this.state;
        if (!debtAsset || !account) return;
        const balanceID = account.getIn(["balances", debtAsset]);
        const feeBalanceID = account.getIn(["balances", feeAmount.asset_id]);
        if (!balanceID) return this.setState({balanceError: true});
        let balanceObject = ChainStore.getObject(balanceID);
        let feeBalanceObject = feeBalanceID
            ? ChainStore.getObject(feeBalanceID)
            : null;
        if (!feeBalanceObject || feeBalanceObject.get("balance") === 0) {
            this.setState({feeAmount: getUninitializedFeeAmount()});
        }
        if (!balanceObject || !feeAmount) return;
        if (!amount) return this.setState({balanceError: false});
        const asset = ChainStore.getAsset(debtAsset);
        const hasBalance = checkBalance(
            amount,
            asset,
            feeAmount,
            balanceObject
        );
        if (hasBalance === null) return;
        this.setState({balanceError: !hasBalance});
    }

    onFeeChanged(fee) {
        if (!fee) return;
        this.setState(
            {
                feeAmount: fee,
                error: null
            },
            this._checkBalance
        );
    }

    hideRepayModal() {
        this.setState({showModal: false});
    }

    showRepayModal(data) {
        // console.log("data: ", data);
        this.setState({
            showModal: true,
            debtAmount: data.debt_amount,
            debtAsset: data.debt_asset,
            collateralAmount: data.collateral_amount,
            collateralAsset: data.collateral_asset,
            feeRate: data.fee_rate,
            dealId: data.id
        });
    }

    _onSubmit() {
        let {
            feeRate,
            debtAmount,
            amount,
            asset,
            dealId,
            feeAmount
        } = this.state;
        let {account} = this.props;
        let fRate = parseFloat(feeRate) / FEE_RATE_DENOM;
        let cAsset = new Asset({
            asset_id: asset.get("id"),
            real: amount,
            precision: asset.get("precision")
        });
        let cAmount = cAsset.getAmount();
        let rate = parseFloat(cAmount) / debtAmount;
        let cfAmount = Math.ceil(fRate * debtAmount * rate);

        let data = {
            account,
            deal_id: dealId,
            repay_amount: new Asset({
                amount: cAmount,
                asset_id: cAsset.asset_id,
                precision: asset.get("precision")
            }),
            credit_fee: new Asset({
                amount: cfAmount,
                asset_id: cAsset.asset_id,
                precision: asset.get("precision")
            }),
            fee_asset: feeAmount
        };
        CreditOfferActions.repay(data)
            .then(() => {
                this.hideRepayModal();
            })
            .catch(err => {
                // todo: visualize error somewhere
                console.error(err);
            });
    }

    _getColumns() {
        let header = [
            {
                title: "ID",
                dataIndex: "id"
            },
            {
                title: counterpart.translate(
                    "credit_offer.credit_right_account"
                ),
                dataIndex: "offer_owner",
                render: account => <LinkToAccountById account={account} />
            },
            {
                title: counterpart.translate("credit_offer.debt"),
                align: "right",
                dataIndex: "debt_asset",
                render: (text, row) => (
                    <FormattedAsset
                        asset={text}
                        amount={row.debt_amount}
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.fee_rate"),
                align: "right",
                render: (text, row) => (
                    <FormattedAsset
                        asset={row.debt_asset}
                        amount={
                            (parseFloat(row.fee_rate) / FEE_RATE_DENOM) *
                            row.debt_amount
                        }
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.mortgage_assets"),
                align: "right",
                render: (text, row) => (
                    <FormattedAsset
                        asset={row.collateral_asset}
                        amount={row.collateral_amount}
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.repay_period"),
                dataIndex: "latest_repay_time",
                render: time =>
                    moment
                        .utc(time)
                        .local()
                        .format("YYYY-MM-DD HH:mm:ss")
            }
        ];
        let {account, currentAccount} = this.props;
        if (account.get("name") == currentAccount) {
            header.push({
                title: counterpart.translate("credit_offer.repay"),
                render: (_, row) => (
                    <span style={{fontSize: 20}}>
                        <Tooltip
                            title={counterpart.translate("credit_offer.repay")}
                        >
                            <AntIcon
                                type="dollar"
                                style={{cursor: "pointer"}}
                                onClick={() => {
                                    this.showRepayModal(row);
                                }}
                            />
                        </Tooltip>
                    </span>
                )
            });
        }
        return header;
    }

    render() {
        let {dealsByBorrower} = this.props;
        return (
            <div className="grid-content no-overflow no-padding">
                <div className="generic-bordered-box">
                    <div className="grid-wrapper">
                        <Table
                            rowKey="id"
                            columns={this._getColumns()}
                            dataSource={dealsByBorrower}
                            pagination={{
                                hideOnSinglePage: true,
                                pageSize: 10
                            }}
                        />
                        {this._renderRepayModal()}
                    </div>
                </div>
            </div>
        );
    }
}

CreditDebtList = connect(CreditDebtList, {
    listenTo() {
        return [AccountStore, CreditOfferStore];
    },
    getProps(props) {
        return {
            currentAccount: AccountStore.getState().currentAccount,
            passwordAccount: AccountStore.getState().passwordAccount,
            dealsByBorrower: CreditOfferStore.getState().dealsByBorrower
        };
    }
});

export default CreditDebtList;
