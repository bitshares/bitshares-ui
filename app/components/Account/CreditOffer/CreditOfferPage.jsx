import React from "react";
import {connect} from "alt-react";
import counterpart from "counterpart";
import {
    Tooltip,
    Modal,
    Button,
    Table,
    Form,
    Icon as AntIcon,
    Alert
} from "bitshares-ui-style-guide";
import assetUtils from "common/asset_utils";
import SearchInput from "../../Utility/SearchInput";
import LinkToAssetById from "../../Utility/LinkToAssetById";
import FormattedAsset from "../../Utility/FormattedAsset";
import LinkToAccountById from "../../Utility/LinkToAccountById";
import moment from "moment";
import utils from "../../../lib/common/utils";
import CreditOfferActions, {
    FEE_RATE_DENOM,
    parsingTime
} from "../../../actions/CreditOfferActions";

import AccountStore from "stores/AccountStore";
import CreditOfferStore from "stores/CreditOfferStore";
import {Asset, Price} from "../../../lib/common/MarketClasses";
import {ChainStore} from "bitsharesjs";
import AmountSelector from "../../Utility/AmountSelectorStyleGuide";
import AssetSelect from "../../Utility/AssetSelect";
import Translate from "react-translate-component";
import FeeAssetSelector from "../../Utility/FeeAssetSelector";
import {checkBalance} from "common/trxHelper";
import notify from "actions/NotificationActions";
import IntlStore from "stores/IntlStore";

const getUninitializedFeeAmount = () =>
    new Asset({amount: 0, asset_id: "1.3.0"});

class CreditOfferPage extends React.Component {
    constructor(props) {
        super();
        this.state = {
            info: null,
            filterValue: null,
            showModal: false,
            amount: null,
            balanceError: false,
            maxAmount: false,
            feeAmount: getUninitializedFeeAmount(),
            mortgageAmount: 0,
            rateAmount: 0
        };
        this.showAcceptModal = this.showAcceptModal.bind(this);
        this.hideAcceptModal = this.hideAcceptModal.bind(this);
        this._handleFilterInput = this._handleFilterInput.bind(this);
        this._checkBalance = this._checkBalance.bind(this);
    }

    componentDidMount() {
        CreditOfferActions.getAll({flag: "first"});
    }

    _checkBalance() {
        const {currentAccount} = this.props;
        const account = ChainStore.getAccount(currentAccount);
        const {feeAmount, mortgageAmount, selectAsset} = this.state;
        if (!selectAsset || !account) return;
        const balanceID = account.getIn(["balances", selectAsset.get("id")]);
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
        if (!mortgageAmount) return this.setState({balanceError: false});
        let mortgageReal = new Asset({
            asset_id: selectAsset.get("id"),
            amount: mortgageAmount,
            precision: selectAsset.get("precision")
        }).getAmount({real: true});
        const hasBalance = checkBalance(
            mortgageReal,
            selectAsset,
            feeAmount,
            balanceObject
        );
        if (hasBalance === null) return;
        this.setState({balanceError: !hasBalance});
    }

    showAcceptModal(data) {
        let assetList = data.acceptable_collateral.map(v => v[0]);
        let debtAsset = data.asset_type;
        let selectAsset = assetList[0];
        if (typeof selectAsset == "string") {
            selectAsset = ChainStore.getAsset(selectAsset);
        }
        if (typeof debtAsset == "string") {
            debtAsset = ChainStore.getAsset(debtAsset);
        }
        this.setState({
            showModal: true,
            assetList,
            selectAsset,
            debtAsset,
            currentBalance: data.current_balance,
            info: data
        });
    }

    hideAcceptModal() {
        this.setState({showModal: false});
    }

    _handleFilterInput(e) {
        this.setState({
            filterValue: e.target.value.toUpperCase()
        });
    }

    _sortByAmount(aAmount, aAssetId, bAmount, bAssetId) {
        let aAsset = utils.convert_satoshi_to_typed(
            aAmount,
            ChainStore.getAsset(aAssetId)
        );
        let bAsset = utils.convert_satoshi_to_typed(
            bAmount,
            ChainStore.getAsset(bAssetId)
        );
        return aAsset - bAsset;
    }

    _getColumns() {
        let {locale} = this.props;
        if (locale === "zh") locale = "zh_CN";
        return [
            {
                title: "ID",
                dataIndex: "id"
            },
            {
                title: counterpart.translate("credit_offer.asset"),
                dataIndex: "asset_type",
                render: text => <LinkToAssetById asset={text} />
            },
            {
                title: counterpart.translate("credit_offer.account"),
                dataIndex: "owner_account",
                render: accountId => <LinkToAccountById account={accountId} />
            },
            {
                title: counterpart.translate("credit_offer.total_amount"),
                dataIndex: "total_balance",
                align: "right",
                sorter: (a, b) =>
                    this._sortByAmount(
                        a.total_balance,
                        a.asset_type,
                        b.total_balance,
                        b.asset_type
                    ),
                render: (item, row) => (
                    <FormattedAsset
                        amount={item}
                        asset={row.asset_type}
                        hide_asset
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.available_amount"),
                align: "right",
                dataIndex: "current_balance",
                sorter: (a, b) =>
                    this._sortByAmount(
                        a.current_balance,
                        a.asset_type,
                        b.current_balance,
                        b.asset_type
                    ),
                render: (item, row) => (
                    <FormattedAsset
                        amount={item}
                        asset={row.asset_type}
                        hide_asset
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.min_borrow"),
                align: "right",
                dataIndex: "min_deal_amount",
                sorter: (a, b) =>
                    this._sortByAmount(
                        a.min_deal_amount,
                        a.asset_type,
                        b.min_deal_amount,
                        b.asset_type
                    ),
                render: (item, row) => (
                    <FormattedAsset
                        amount={item}
                        asset={row.asset_type}
                        hide_asset
                        trimZero
                    />
                )
            },
            {
                title: counterpart.translate("credit_offer.fee_rate"),
                align: "right",
                dataIndex: "fee_rate",
                sorter: (a, b) => a.fee_rate - b.fee_rate,
                render: item =>
                    `${utils.format_number(
                        (parseFloat(item) / parseFloat(FEE_RATE_DENOM)) * 100,
                        2,
                        false
                    )}%`
            },
            {
                title: counterpart.translate("credit_offer.repay_period"),
                dataIndex: "max_duration_seconds",
                align: "right",
                sorter: (a, b) =>
                    a.max_duration_seconds - b.max_duration_seconds,
                render: item => {
                    return parsingTime(item, locale);
                }
            },
            {
                title: counterpart.translate("credit_offer.validity_period"),
                dataIndex: "auto_disable_time",
                render: text =>
                    moment
                        .utc(text)
                        .local()
                        .format("YYYY-MM-DD HH:mm:ss")
            },
            {
                title: counterpart.translate("credit_offer.mortgage_assets"),
                dataIndex: "acceptable_collateral",
                render: item => {
                    return item.map(v => (
                        <div key={v[0]}>
                            <LinkToAssetById asset={v[0]} />
                        </div>
                    ));
                }
            },
            {
                title: counterpart.translate("credit_offer.borrow"),
                key: "action",
                render: (_, row) => {
                    return (
                        <span style={{fontSize: 20}}>
                            <Tooltip
                                title={counterpart.translate(
                                    "credit_offer.borrow"
                                )}
                            >
                                <AntIcon
                                    type="dollar"
                                    style={{
                                        cursor: "pointer",
                                        marginRight: "20px"
                                    }}
                                    onClick={() => {
                                        this.showAcceptModal(row);
                                    }}
                                />
                            </Tooltip>
                        </span>
                    );
                }
            }
        ];
    }

    _sortByAsset() {
        let {allList} = this.props;
        let {filterValue} = this.state;
        if (filterValue) {
            return allList.filter(v => {
                let assetName = ChainStore.getAsset(v.asset_type)?.get(
                    "symbol"
                );
                return assetName.includes(filterValue.toUpperCase());
            });
        } else {
            return allList;
        }
    }

    _onSubmit() {
        let {selectAsset, mortgageAmount, info, debtAsset, amount} = this.state;
        let {currentAccount} = this.props;
        let account = ChainStore.getAccount(currentAccount);
        if (info.owner_account !== account.get("id")) {
            let data = {
                borrower: account.get("id"),
                offer_id: info.id,
                borrow_amount: new Asset({
                    asset_id: debtAsset.get("id"),
                    real: amount,
                    precision: debtAsset.get("precision")
                }),
                collateral: new Asset({
                    asset_id: selectAsset.get("id"),
                    amount: mortgageAmount,
                    precision: selectAsset.get("precision")
                }),
                max_fee_rate: info.fee_rate,
                min_duration_seconds: info.max_duration_seconds
            };
            // console.log("data: ", data);
            CreditOfferActions.accept(data)
                .then(() => {
                    this.hideAcceptModal();
                })
                .catch(err => {
                    // todo: visualize error somewhere
                    console.error(err);
                });
        }
    }

    _onAssetChange(selected_asset) {
        this.setState(
            {selectAsset: ChainStore.getAsset(selected_asset)},
            this._checkBalance
        );
    }

    _onAmountChanged({amount, asset}) {
        if (!asset) return;
        if (typeof asset !== "object") {
            asset = ChainStore.getAsset(asset);
        }
        let {info, selectAsset} = this.state;
        if (asset && info && selectAsset) {
            let index = info.acceptable_collateral.findIndex(
                v => v[0] == selectAsset.get("id")
            );
            if (index < 0) return;
            let base = info.acceptable_collateral[index][1].base;
            let quote = info.acceptable_collateral[index][1].quote;
            let baseAsset = new Asset({
                asset_id: base.asset_id,
                amount: base.amount,
                precision: ChainStore.getAsset(base.asset_id).get("precision")
            });
            let quoteAsset = new Asset({
                asset_id: quote.asset_id,
                amount: quote.amount,
                precision: ChainStore.getAsset(quote.asset_id).get("precision")
            });

            let price = new Price({base: baseAsset, quote: quoteAsset});
            // let currentAmount = price.toReal() * mortgageAsset.getAmount();
            let mortgageAmount = parseFloat(amount) * price.toReal(true); // Keeping it consistent with the App, this may violate Graphene's price representation convention.
            if (Number.isNaN(mortgageAmount)) {
                mortgageAmount = 0;
            } else {
                mortgageAmount = Math.ceil(
                    mortgageAmount * 10 ** selectAsset.get("precision")
                );
            }
            let mortgageAsset = new Asset({
                asset_id: selectAsset.get("id"),
                real: mortgageAmount,
                precision: selectAsset.get("precision")
            });
            let rateAsset = new Asset({
                asset_id: asset.get("id"),
                real: amount,
                precision: asset.get("precision")
            });
            let rate = parseFloat(rateAsset.getAmount()) / info.total_balance;
            let rateAmount =
                (parseFloat(info.fee_rate) / FEE_RATE_DENOM) *
                info.total_balance *
                rate;
            this.setState(
                {
                    amount,
                    error: null,
                    maxAmount: false,
                    mortgageAmount: mortgageAmount,
                    rateAmount
                },
                this._checkBalance
            );
        }
    }

    _setTotal(asset) {
        const {currentBalance} = this.state;
        if (asset) {
            let balance = new Asset({
                amount: currentBalance,
                asset_id: asset.get("id"),
                precision: asset.get("precision")
            });
            this.setState({maxAmount: true});

            this._onAmountChanged({
                amount: balance.getAmount({real: true}),
                asset: asset.get("id")
            });
        }
    }

    _onFeeChanged(fee) {
        if (!fee) return;
        this.setState(
            {
                feeAmount: fee,
                error: null
            },
            this._checkBalance
        );
    }

    _renderAcceptModal() {
        let {
            selectAsset,
            assetList,
            debtAsset,
            amount,
            currentBalance,
            balanceError,
            feeAmount,
            info,
            mortgageAmount,
            rateAmount
        } = this.state;
        if ((!selectAsset, !debtAsset)) return null;
        let {currentAccount} = this.props;
        let account = ChainStore.getAccount(currentAccount);
        let balance = null;
        let minAssetAmount = new Asset({
            amount: info.min_deal_amount,
            asset_id: debtAsset.get("id"),
            precision: debtAsset.get("precision")
        });
        let maxAssetAmount = minAssetAmount.clone(currentBalance);
        let minError = amount < minAssetAmount.getAmount({real: true});
        let maxReal = maxAssetAmount.getAmount({real: true});
        let maxError = amount > maxReal || maxReal <= 0;
        const isSubmitNotValid =
            !amount ||
            minError ||
            maxError ||
            !selectAsset ||
            balanceError ||
            account.get("id") == info.owner_account;
        let _error = maxError ? "has-error" : "";
        if (currentBalance && currentBalance > 0) {
            balance = (
                <span>
                    <Translate
                        component="span"
                        content="credit_offer.current_balance"
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
                            feeAmount.getAmount({real: true}),
                            feeAmount.asset_id
                        )}
                    >
                        <FormattedAsset
                            amount={currentBalance}
                            asset={debtAsset.get("id")}
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

        const borrowingAsset = selectAsset.toJS();
        const borrowingAssetPermissions = assetUtils.getFlagBooleans(
            borrowingAsset.options.flags,
            !!borrowingAsset.bitasset_data_id
        );

        const issuer = ChainStore.getObject(
            borrowingAsset.issuer,
            false,
            false
        );
        const issuerName = issuer ? issuer.get("name") : "";

        let overrideAuthorityMessage = [
            counterpart.translate(
                "credit_offer.override_authority_warning_p1",
                {symbol: borrowingAsset.symbol}
            ),
            " ",
            <a target="_blank" href={`/account/${issuerName}`}>
                {issuerName}
            </a>,
            <br />,
            counterpart.translate("credit_offer.override_authority_warning_p2"),
            " ",
            <a target="_blank" href={`/asset/${borrowingAsset.symbol}`}>
                {borrowingAsset.symbol}
            </a>
        ];

        return (
            <Modal
                wrapClassName="modal--transaction-confirm"
                title={counterpart.translate("credit_offer.borrow")}
                visible={this.state.showModal}
                id="modal-repay"
                overlay={true}
                onCancel={this.hideAcceptModal}
                footer={[
                    (info.owner_account === info.owner_account && (
                        <Translate
                            component="span"
                            content="credit_offer.info_borrow_err"
                        />
                    )) ||
                        null,
                    <Button
                        key={"send"}
                        disabled={isSubmitNotValid}
                        onClick={this._onSubmit.bind(this)}
                    >
                        <Translate content="wallet.submit" />
                    </Button>,
                    <Button key="Cancel" onClick={this.hideAcceptModal}>
                        <Translate content="wallet.cancel" />
                    </Button>
                ]}
            >
                {borrowingAssetPermissions.override_authority && (
                    <div style={{marginBottom: 12}}>
                        <Alert message={overrideAuthorityMessage}></Alert>
                    </div>
                )}
                <div className="grid-block vertical no-overflow">
                    <Form className="full-width" layout="vertical">
                        <Form.Item
                            label={counterpart.translate(
                                "credit_offer.mortgage_assets"
                            )}
                            colon={false}
                        >
                            <div
                                style={{
                                    textAlign: "right",
                                    width: "100%"
                                }}
                            >
                                <AssetSelect
                                    selectStyle={{width: "100%"}}
                                    value={selectAsset.get("symbol")}
                                    assets={assetList}
                                    onChange={this._onAssetChange.bind(this)}
                                />
                            </div>
                        </Form.Item>
                        <AmountSelector
                            label="credit_offer.borrow_amount"
                            amount={amount}
                            asset={debtAsset.get("id")}
                            display_balance={balance}
                            onChange={this._onAmountChanged.bind(this)}
                            allowNaN={true}
                        />
                        <Form.Item
                            label={counterpart.translate(
                                "credit_offer.repay_period"
                            )}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 16}}
                            colon={false}
                        >
                            <div
                                style={{
                                    textAlign: "right",
                                    width: "100%"
                                }}
                            >
                                {parsingTime(
                                    info.max_duration_seconds,
                                    this.props.locale
                                )}
                            </div>
                        </Form.Item>
                        <Form.Item
                            label={counterpart.translate(
                                "credit_offer.min_borrow"
                            )}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 16}}
                            colon={false}
                        >
                            <div
                                style={{
                                    textAlign: "right",
                                    width: "100%",
                                    color: minError ? "red" : "#7ed321"
                                }}
                            >
                                <FormattedAsset
                                    amount={info.min_deal_amount}
                                    asset={info.asset_type}
                                    trimZero
                                />
                            </div>
                        </Form.Item>
                        <Form.Item
                            label={counterpart.translate(
                                "credit_offer.mortgage_assets"
                            )}
                            labelCol={{span: 8}}
                            wrapperCol={{span: 16}}
                            colon={false}
                        >
                            <div
                                style={{
                                    textAlign: "right",
                                    width: "100%",
                                    color: balanceError ? "red" : "#7ed321"
                                }}
                            >
                                <FormattedAsset
                                    amount={mortgageAmount}
                                    asset={selectAsset.get("id")}
                                    trimZero
                                />
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
                                <span>
                                    <FormattedAsset
                                        amount={rateAmount}
                                        asset={debtAsset.get("id")}
                                        trimZero
                                    />
                                    {` (${(parseFloat(info.fee_rate) * 100) /
                                        FEE_RATE_DENOM}%)`}
                                </span>
                            </div>
                        </Form.Item>
                        <FeeAssetSelector
                            account={account}
                            transaction={{
                                type: "credit_offer_accept",
                                data: {
                                    type: "memo",
                                    content: null
                                }
                            }}
                            onChange={this._onFeeChanged.bind(this)}
                        />
                    </Form>
                </div>
            </Modal>
        );
    }

    render() {
        let {filterValue} = this.state;
        let allList = this._sortByAsset();
        return (
            <div className="grid-content app-tables no-padding">
                <div className="content-block small-12">
                    <div
                        className="generic-bordered-box"
                        style={{margin: "20px"}}
                    >
                        <div className="header-selector">
                            <div className="filter inline-block">
                                <SearchInput
                                    value={filterValue}
                                    placeholder={counterpart.translate(
                                        "credit_offer.plh_input_asset_name"
                                    )}
                                    onChange={this._handleFilterInput}
                                />
                            </div>
                        </div>
                    </div>
                    <div
                        className="generic-bordered-box"
                        style={{marginBottom: "40px"}}
                    >
                        <div className="grid-wrapper">
                            <Table
                                rowKey="id"
                                columns={this._getColumns()}
                                dataSource={allList}
                                pagination={{
                                    hideOnSinglePage: true,
                                    pageSize: 10
                                }}
                            />
                        </div>
                    </div>
                    {this._renderAcceptModal()}
                </div>
            </div>
        );
    }
}

CreditOfferPage = connect(CreditOfferPage, {
    listenTo() {
        return [AccountStore, CreditOfferStore, IntlStore];
    },
    getProps(props) {
        return {
            currentAccount: AccountStore.getState().currentAccount,
            passwordAccount: AccountStore.getState().passwordAccount,
            allList: CreditOfferStore.getState().allList,
            locale: IntlStore.getState().currentLocale
        };
    }
});

export default CreditOfferPage;
