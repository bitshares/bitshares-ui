import React from "react";
import {connect} from "alt-react";
import counterpart from "counterpart";
import AccountStore from "stores/AccountStore";
import SettingsStore from "stores/SettingsStore";
import {ChainStore} from "bitsharesjs";
import {
    Tooltip,
    Table,
    Modal,
    Button,
    Select,
    Input,
    Form,
    DatePicker,
    Alert,
    Icon as AntIcon
} from "bitshares-ui-style-guide";
import utils from "common/utils";
import AmountSelector from "../../Utility/AmountSelectorStyleGuide";
import FeeAssetSelector from "../../Utility/FeeAssetSelector";
import BalanceComponent from "../../Utility/BalanceComponent";
import AssetSelector from "../../Utility/AssetSelector";
import AccountSelector from "../../Account/AccountSelector";
import AccountName from "../../Utility/AccountName";

import {checkBalance} from "common/trxHelper";
import {Asset, Price} from "../../../lib/common/MarketClasses";
import Translate from "react-translate-component";
import moment from "moment";
import localeZH from "antd/es/date-picker/locale/zh_CN";
import CreditOfferActions, {
    FEE_RATE_DENOM,
    listRepayPeriod
} from "../../../actions/CreditOfferActions";

const getUninitializedFeeAmount = () =>
    new Asset({amount: 0, asset_id: "1.3.0"});

class EditModal extends React.Component {
    constructor(props) {
        super(props);
        this.state = this.getInitialState(props);
        this.initModal = this.initModal.bind(this);
        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    getInitialState(props) {
        return {
            submitErr: null,
            showModal: 0, // 1: create modal 2: add pawn modal 3: add whitelist modal
            account: props.account,
            amount: "",
            asset_id: null,
            asset: null,
            error: null,
            feeAmount: getUninitializedFeeAmount(),
            maxAmount: false,
            balanceError: false,
            pawn_assets: [],
            pawnInput: null,
            pawn_asset: null,
            pawn_price: null,
            whitelist: [],
            whitelist_name: "",
            whitelist_account: null,
            whitelist_amount: "",
            rate: "",
            repay_period: null,
            validity_period: null
        };
    }

    getDataState(itemData) {
        let asset_type_precision = ChainStore.getAsset(itemData.asset_type).get(
            "precision"
        );
        let asset = new Asset({
            amount: itemData.current_balance,
            asset_id: itemData.asset_type,
            precision: asset_type_precision
        });
        let pawn_assets = itemData.acceptable_collateral.map(v => {
            let bp = ChainStore.getAsset(v[1].base.asset_id).get("precision");
            let qp = ChainStore.getAsset(v[1].quote.asset_id).get("precision");
            let price = new Price({
                base: new Asset({
                    asset_id: v[1].base.asset_id,
                    amount: v[1].base.amount,
                    precision: bp
                }),
                quote: new Asset({
                    asset_id: v[1].quote.asset_id,
                    amount: v[1].quote.amount,
                    precision: qp
                })
            });
            return new Asset({
                // real: price.toReal(),
                real: 1 / price.toReal(), //Keeping it consistent with the App, this may violate Graphene's price representation convention.
                asset_id: v[0],
                precision: ChainStore.getAsset(v[0]).get("precision")
            });
        });

        let whitelist = itemData.acceptable_borrowers.map(v => {
            return {
                account: v[0],
                amount: new Asset({
                    amount: v[1],
                    asset_id: itemData.asset_type,
                    precision: asset_type_precision
                }).getAmount({real: true})
            };
        });
        return {
            showModal: 0, // 1: create modal 2: add pawn modal 3: add whitelist modal
            offer_id: itemData.id,
            account: ChainStore.getAccount(itemData.owner_account, false),
            amount: asset.getAmount({real: true}),
            balanceAmount: asset.getAmount({real: true}),
            asset_id: itemData.asset_type,
            asset: null,
            error: null,
            feeAmount: getUninitializedFeeAmount(),
            maxAmount: false,
            balanceError: false,
            pawnInput: null,
            pawn_asset: null,
            pawn_price: null,
            pawn_assets: pawn_assets,
            whitelist: whitelist,
            whitelist_name: "",
            whitelist_account: null,
            whitelist_amount: "",
            rate: (parseFloat(itemData.fee_rate) / FEE_RATE_DENOM) * 100,
            repay_period: itemData.max_duration_seconds,
            validity_period: moment(itemData.auto_disable_time),
            min_loan: new Asset({
                amount: itemData.min_deal_amount,
                asset_id: itemData.asset_type,
                precision: asset_type_precision
            }).getAmount({real: true})
        };
    }

    showModal(modal = 1) {
        this.setState({
            showModal: modal
        });
    }

    initModal(data, modal = 1) {
        let state = this.getDataState(data);
        state.showModal = modal;
        this.setState(state);
    }

    hideModal() {
        this.setState({
            showModal: 0
        });
    }

    onAmountChanged({amount, asset}) {
        if (!asset) return;

        if (typeof asset !== "object") {
            asset = ChainStore.getAsset(asset);
        }

        this.setState(
            {
                amount,
                asset,
                asset_id: asset.get("id"),
                error: null,
                maxAmount: false
            },
            this._checkBalance
        );
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

    _setTotal(asset_id, balance_id) {
        const {feeAmount} = this.state;
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
            this.setState(
                {maxAmount: true, amount: balance.getAmount({real: true})},
                this._checkBalance
            );
        }
    }

    _checkBalance() {
        const {feeAmount, amount, account, asset} = this.state;
        if (!asset || !account) return;
        const balanceID = account.getIn(["balances", asset.get("id")]);
        const feeBalanceID = account.getIn(["balances", feeAmount.asset_id]);
        if (!asset || !account) return;
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
        const hasBalance = checkBalance(
            amount - this.state.balanceAmount,
            asset,
            feeAmount,
            balanceObject
        );
        if (hasBalance === null) return;
        this.setState({balanceError: !hasBalance});
    }

    _getAvailableAssets(state = this.state) {
        const {account} = state;
        let asset_types = [];
        if (!(account && account.get("balances"))) {
            return {asset_types};
        }
        let account_balances = account.get("balances").toJS();
        asset_types = Object.keys(account_balances).sort(utils.sortID);
        for (let key in account_balances) {
            let balanceObject = ChainStore.getObject(account_balances[key]);
            if (balanceObject && balanceObject.get("balance") === 0) {
                asset_types.splice(asset_types.indexOf(key), 1);
            }
        }
        return {asset_types};
    }

    _delPawnItem(asset) {
        let {pawn_assets} = this.state;
        let index = pawn_assets.findIndex(v => v.asset_id == asset);
        pawn_assets.splice(index, 1);
        if (index > -1) this.setState({pawn_assets: pawn_assets});
    }

    _addPawnItem() {
        let {pawn_asset, pawn_price, pawn_assets} = this.state;
        if (!!pawn_asset && !!pawn_price) {
            if (typeof pawn_asset !== "object") {
                pawn_asset = ChainStore.getAsset(pawn_asset);
            }
            let found = pawn_assets.find((asset) => {
                return asset.asset_id === pawn_asset.get('id')
            })
            if(found) {
                found.setAmount({ real: pawn_price })
            } else {
                pawn_assets.push(
                    new Asset({
                        real: pawn_price,
                        asset_id: pawn_asset.get("id"),
                        precision: pawn_asset.get("precision")
                    })
                );
            }
            this.setState({pawn_assets: pawn_assets, showModal: 1});
        } else {
            this.setState({showModal: 1});
        }
    }

    _getPawnColumns() {
        return [
            {
                title: counterpart.translate("credit_offer.accepted_pawn"),
                dataIndex: "pawn_asset",
                key: "pawn_asset",
                render: text => text
            },
            {
                title: counterpart.translate("credit_offer.price"),
                dataIndex: "price",
                key: "price",
                render: text => text
            },
            {
                title: counterpart.translate("credit_offer.operate"),
                dataIndex: "pawn_asset_id",
                key: "operate",
                render: asset => (
                    <AntIcon
                        type="close-circle"
                        onClick={() => this._delPawnItem(asset)}
                        style={{cursor: "pointer", color: "#00a9e9"}}
                    />
                )
            }
        ];
    }

    _getWhitelistColumns() {
        return [
            {
                title: counterpart.translate("credit_offer.whitelist_account"),
                dataIndex: "account",
                key: "account",
                render: text => <AccountName account={text} />
            },
            {
                title: counterpart.translate("credit_offer.loan_amount"),
                dataIndex: "amount",
                key: "amount",
                render: text => text
            },
            {
                title: counterpart.translate("credit_offer.operate"),
                dataIndex: "account",
                key: "operate",
                render: account => (
                    <AntIcon
                        type="close-circle"
                        onClick={() => this._delWhitelistItem(account)}
                        style={{cursor: "pointer", color: "#00a9e9"}}
                    />
                )
            }
        ];
    }

    _getPawnData() {
        let {pawn_assets} = this.state;
        return pawn_assets.map(a => {
            let asset = ChainStore.getAsset(a.asset_id);
            let symbol = asset.get("symbol");
            return {
                key: symbol,
                pawn_asset: symbol,
                price: a.getAmount({real: true}),
                pawn_asset_id: a.asset_id
            };
        });
    }

    _getWhitelistData() {
        let {whitelist} = this.state;
        return whitelist.map(v => {
            return {
                key: v.account,
                account: v.account,
                amount: v.amount
            };
        });
    }

    _getAddPawnBtn() {
        return (
            <Button onClick={() => this.showModal(2)}>
                <AntIcon type="plus-circle" />{" "}
                <Translate component="span" content="credit_offer.add_pawn" />
            </Button>
        );
    }

    _getAddWhitelistBtn() {
        return (
            <Button onClick={() => this.showModal(3)}>
                <AntIcon type="plus-circle" />{" "}
                <Translate
                    component="span"
                    content="credit_offer.add_whitelist"
                />
            </Button>
        );
    }

    _onRateChange(event) {
        this.setState({rate: event.target.value});
    }

    _onMinLoanChange(event) {
        this.setState({min_loan: event.target.value});
    }

    _onRepayPeriodChange(value) {
        this.setState({repay_period: value});
    }

    _onValidityPeriodChange(value) {
        this.setState({validity_period: value});
    }

    _onSubmit() {
        let {
            account,
            asset_id,
            amount,
            rate,
            repay_period,
            min_loan,
            validity_period,
            pawn_assets,
            whitelist,
            feeAmount,
            offer_id,
            balanceAmount
        } = this.state;

        this.setState({
            submitErr: null
        });

        let opData;

        try {
            let asset_precision = ChainStore.getAsset(asset_id).get(
                "precision"
            );
            opData = {
                owner_account: account.get("id"),
                offer_id,
                delta_amount: new Asset({
                    real: parseInt(amount) - parseInt(balanceAmount),
                    asset_id,
                    precision: asset_precision
                }),
                fee_rate: (parseFloat(rate) * FEE_RATE_DENOM) / 100,
                max_duration_seconds: repay_period,
                min_deal_amount: new Asset({
                    real: min_loan,
                    asset_id,
                    precision: asset_precision
                }).getAmount(),
                enabled: true,
                auto_disable_time: validity_period,
                acceptable_collateral: pawn_assets.map(v => {
                    let v_precision = ChainStore.getAsset(v.asset_id).get(
                        "precision"
                    );
                    let p = new Price({
                        base: new Asset({asset_id, precision: asset_precision}),
                        quote: new Asset({
                            asset_id: v.asset_id,
                            precision: v_precision
                        }),
                        // real: v.getAmount({real: true}),
                        real: 1 / v.getAmount({real: true}) //Keeping it consistent with the App, this may violate Graphene's price representation convention.
                    });
                    return [v.asset_id, p.toObject()];
                }),
                acceptable_borrowers: whitelist.map(v => {
                    return [
                        v.account.get ? v.account.get("id") : v.account,
                        new Asset({
                            real: v.amount,
                            asset_id,
                            precision: asset_precision
                        }).getAmount()
                    ];
                }),
                fee_asset: feeAmount
            };
        } catch (err) {
            this.setState({
                submitErr: err.toString()
            });
        }
        if (opData.delta_amount.getAmount({real: true}) === 0) {
            delete opData.delta_amount;
        }
        CreditOfferActions.update(opData)
            .then(() => {
                this.hideModal();
            })
            .catch(err => {
                // todo: visualize error somewhere
                console.error(err);
            });
    }

    _renderEditModal() {
        let {
            asset,
            asset_id,
            amount,
            account,
            feeAmount,
            balanceError,
            pawn_assets,
            whitelist,
            rate,
            min_loan,
            repay_period,
            validity_period
        } = this.state;
        let tabIndex = 0;
        let balance = null;
        const isSubmitNotValid =
            pawn_assets.length == 0 ||
            !amount ||
            !asset ||
            !rate ||
            !min_loan ||
            !repay_period ||
            !validity_period ||
            balanceError;
        if (account && account.get("balances")) {
            let account_balances = account.get("balances").toJS();
            let _error = balanceError ? "has-error" : "";
            if (asset_id && !asset) asset = ChainStore.getAsset(asset_id);
            balance = (
                <span>
                    <Translate component="span" content="transfer.available" />:{" "}
                    <span
                        className={_error}
                        style={{
                            borderBottom: "#A09F9F 1px dotted",
                            cursor: "pointer"
                        }}
                        onClick={this._setTotal.bind(
                            this,
                            asset_id,
                            account_balances[asset_id],
                            feeAmount.getAmount({real: true}),
                            feeAmount.asset_id
                        )}
                    >
                        <BalanceComponent
                            balance={account_balances[asset_id]}
                        />
                    </span>
                </span>
            );
        }
        return (
            <Modal
                wrapClassName="modal--transaction-confirm"
                title={counterpart.translate("credit_offer.edit")}
                visible={this.state.showModal === 1}
                id={this.props.id}
                overlay={true}
                onCancel={this.hideModal}
                footer={[
                    <Button
                        key={"send"}
                        disabled={isSubmitNotValid}
                        onClick={this._onSubmit.bind(this)}
                    >
                        <Translate content="wallet.submit" />
                    </Button>,
                    <Button key="Cancel" onClick={this.hideModal}>
                        <Translate content="wallet.cancel" />
                    </Button>
                ]}
            >
                <div className="grid-block vertical no-overflow">
                    <Form className="full-width" layout="vertical">
                        <AmountSelector
                            label="credit_offer.current_available_balance"
                            amount={amount}
                            onChange={this.onAmountChanged.bind(this)}
                            asset={asset_id}
                            display_balance={balance}
                            tabIndex={tabIndex++}
                            allowNaN={true}
                        />
                        <div
                            className="content-block"
                            style={{marginBottom: 0}}
                        >
                            <div
                                className="grid-wrapper"
                                style={{marginBottom: 0}}
                            >
                                <Table
                                    columns={this._getPawnColumns()}
                                    dataSource={this._getPawnData()}
                                    pagination={false}
                                    locale={{emptyText: this._getAddPawnBtn()}}
                                    className="modal-table"
                                />
                            </div>
                        </div>
                        {pawn_assets.length > 0 ? (
                            <div
                                className="content-block"
                                style={{textAlign: "center"}}
                            >
                                {this._getAddPawnBtn()}
                            </div>
                        ) : null}

                        <div className="grid-block no-overflow wrap shrink">
                            <div
                                className="small-12 medium-6 withdraw-fee-selector"
                                style={{paddingRight: 5}}
                            >
                                <label className="left-label">
                                    <Translate content="credit_offer.fee_rate" />
                                </label>
                                <div className="inline-label input-wrapper">
                                    <Tooltip
                                        placement="top"
                                        title={counterpart.translate(
                                            "credit_offer.tip_fee_rate"
                                        )}
                                    >
                                        <Input
                                            type="number"
                                            value={rate}
                                            onChange={this._onRateChange.bind(
                                                this
                                            )}
                                        />
                                    </Tooltip>
                                </div>
                            </div>
                            <div className="small-12 medium-6 ant-form-item-label withdraw-fee-selector">
                                <label
                                    className="amount-selector-field--label"
                                    style={{marginBottom: "13px"}}
                                >
                                    <Translate content="credit_offer.repay_period" />
                                </label>
                                <div className="grid-block no-overflow wrap shrink">
                                    <Select
                                        value={repay_period}
                                        onChange={this._onRepayPeriodChange.bind(
                                            this
                                        )}
                                    >
                                        {listRepayPeriod.map((v, i) => (
                                            <Select.Option key={v} value={v}>
                                                {counterpart.translate(
                                                    "credit_offer.list_repay_period.period_" +
                                                        i
                                                )}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </div>
                            </div>
                        </div>

                        <div className="grid-block no-overflow wrap shrink">
                            <div
                                className="small-12 medium-6 withdraw-fee-selector"
                                style={{paddingRight: 5}}
                            >
                                <label className="left-label">
                                    <Translate content="credit_offer.min_borrow" />
                                </label>
                                <div className="inline-label input-wrapper">
                                    <Input
                                        type="number"
                                        value={min_loan}
                                        onChange={this._onMinLoanChange.bind(
                                            this
                                        )}
                                    />
                                </div>
                            </div>
                            <div className="small-12 medium-6 ant-form-item-label withdraw-fee-selector">
                                <label
                                    className="amount-selector-field--label"
                                    style={{marginBottom: "13px"}}
                                >
                                    <Translate content="credit_offer.validity_period" />
                                </label>
                                <div className="grid-block no-overflow wrap shrink">
                                    <DatePicker
                                        className="text-cursor"
                                        placeholder={counterpart.translate(
                                            "credit_offer.plh_select_validity_period"
                                        )}
                                        locale={
                                            this.props.currentLocale == "zh"
                                                ? localeZH
                                                : null
                                        }
                                        style={{width: "100%"}}
                                        showTime={true}
                                        value={validity_period}
                                        onChange={this._onValidityPeriodChange.bind(
                                            this
                                        )}
                                        disabledDate={current =>
                                            current <
                                                moment().add(-1, "days") ||
                                            current > moment().add(380, "days")
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                        <div
                            className="content-block"
                            style={{marginBottom: 0}}
                        >
                            <div
                                className="grid-wrapper"
                                style={{marginBottom: 0}}
                            >
                                <Table
                                    columns={this._getWhitelistColumns()}
                                    dataSource={this._getWhitelistData()}
                                    pagination={false}
                                    locale={{
                                        emptyText: this._getAddWhitelistBtn()
                                    }}
                                    className="modal-table"
                                />
                            </div>
                        </div>
                        {whitelist.length > 0 ? (
                            <div
                                className="content-block"
                                style={{textAlign: "center"}}
                            >
                                {this._getAddWhitelistBtn()}
                            </div>
                        ) : null}
                        <FeeAssetSelector
                            account={account}
                            transaction={{
                                type: "credit_offer_create",
                                options: ["price_per_kbyte"],
                                data: {
                                    type: "memo",
                                    content: null
                                }
                            }}
                            onChange={this.onFeeChanged.bind(this)}
                            tabIndex={tabIndex++}
                        />
                    </Form>
                </div>
                {this.state.submitErr && (
                    <Alert message={this.state.submitErr} type="warning" />
                )}
            </Modal>
        );
    }

    _onInputPawn(asset) {
        this.setState({pawnInput: asset});
    }

    _onFoundPawnAsset(asset) {
        if (asset) {
            this.setState({pawn_asset: asset});
        }
    }

    _onPwanPriceChanged(event) {
        this.setState({pawn_price: event.target.value});
    }

    _onHideAddPawnModal() {
        this.showModal(1);
    }

    _renderAddPawnModal() {
        let {pawn_price, showModal, pawnInput} = this.state;
        return (
            <Modal
                wrapClassName="modal--transaction-confirm"
                title={counterpart.translate("credit_offer.title_add_pawn")}
                visible={showModal === 2}
                id={this.props.id}
                overlay={true}
                onCancel={this._onHideAddPawnModal.bind(this)}
                footer={[
                    <Button
                        key={"send"}
                        disabled={!pawn_price || pawn_price <= 0 || !pawnInput}
                        onClick={this._addPawnItem.bind(this)}
                    >
                        <Translate content="wallet.submit" />
                    </Button>,
                    <Button
                        key="Cancel"
                        onClick={this._onHideAddPawnModal.bind(this)}
                    >
                        <Translate content="wallet.cancel" />
                    </Button>
                ]}
            >
                <Form className="full-width" layout="vertical">
                    <AssetSelector
                        inputClass="ant-input"
                        label="account.user_issued_assets.name"
                        onChange={this._onInputPawn.bind(this)}
                        asset={pawnInput}
                        assetInput={pawnInput}
                        style={{width: "100%"}}
                        onFound={this._onFoundPawnAsset.bind(this)}
                    />
                    <Form.Item
                        label={counterpart.translate(
                            "credit_offer.pawn_amount"
                        )}
                        style={{marginTop: "40px"}}
                    >
                        <Tooltip
                            placement="top"
                            title={counterpart.translate(
                                "credit_offer.tip_pawn_amount"
                            )}
                        >
                            <Input
                                style={{marginBottom: 0}}
                                value={pawn_price}
                                type="number"
                                onChange={this._onPwanPriceChanged.bind(this)}
                            />
                        </Tooltip>
                    </Form.Item>
                </Form>
            </Modal>
        );
    }

    _onHideWhitelistModal() {
        this.showModal(1);
    }

    _addWhitelistItem() {
        let {whitelist, whitelist_account, whitelist_amount} = this.state;
        if (!whitelist_account || !whitelist_amount) {
            this.showModal(1);
            return;
        }
        let item = {
            account: whitelist_account.get("id"),
            amount: whitelist_amount
        };
        whitelist.push(item);
        this.setState({whitelist}, () => this.showModal(1));
    }

    _delWhitelistItem(account) {
        let {whitelist} = this.state;
        let index = whitelist.findIndex(v => v.account == account);
        whitelist.splice(index, 1);
        if (index > -1) this.setState({whitelist});
    }

    _whitelistChanged(name) {
        this.setState({whitelist_name: name});
    }

    _onWhitelistAccountChanged(account) {
        this.setState({whitelist_account: account});
    }

    _onWhitelistAmountChanged({amount, asset}) {
        if (!asset) return;

        if (typeof asset !== "object") {
            asset = ChainStore.getAsset(asset);
        }
        this.setState({whitelist_amount: amount});
    }

    _renderAddWhitelistModal() {
        let {
            showModal,
            whitelist_name,
            whitelist_account,
            whitelist_amount,
            asset,
            asset_id
        } = this.state;
        return (
            <Modal
                wrapClassName="modal--transaction-confirm"
                title={counterpart.translate(
                    "credit_offer.title_add_whitelist"
                )}
                visible={showModal === 3}
                id={this.props.id}
                overlay={true}
                onCancel={this._onHideWhitelistModal.bind(this)}
                footer={[
                    <Button
                        key={"send"}
                        onClick={this._addWhitelistItem.bind(this)}
                    >
                        <Translate content="wallet.submit" />
                    </Button>,
                    <Button
                        key="Cancel"
                        onClick={this._onHideWhitelistModal.bind(this)}
                    >
                        <Translate content="wallet.cancel" />
                    </Button>
                ]}
            >
                <Form className="full-width" layout="vertical">
                    <AccountSelector
                        label="credit_offer.account"
                        accountName={whitelist_name}
                        account={whitelist_account}
                        onChange={this._whitelistChanged.bind(this)}
                        onAccountChanged={this._onWhitelistAccountChanged.bind(
                            this
                        )}
                        typeahead={true}
                        includeMyActiveAccounts={false}
                        noForm={true}
                    />
                    <AmountSelector
                        label="credit_offer.loan_amount"
                        amount={whitelist_amount}
                        onChange={this._onWhitelistAmountChanged.bind(this)}
                        asset={asset_id}
                    />
                </Form>
            </Modal>
        );
    }

    render() {
        switch (this.state.showModal) {
            case 1:
                return this._renderEditModal();
            case 2:
                return this._renderAddPawnModal();
            case 3:
                return this._renderAddWhitelistModal();
            default:
                return null;
        }
    }
}

class EditModalConnectWrapper extends React.Component {
    render() {
        return <EditModal {...this.props} ref={this.props.refCallback} />;
    }
}

EditModalConnectWrapper = connect(EditModalConnectWrapper, {
    listenTo() {
        return [AccountStore, SettingsStore];
    },
    getProps(props) {
        return {
            currentAccount: AccountStore.getState().currentAccount,
            passwordAccount: AccountStore.getState().passwordAccount,
            currentLocale: SettingsStore.getState().settings.get("locale")
        };
    }
});

export default EditModalConnectWrapper;
