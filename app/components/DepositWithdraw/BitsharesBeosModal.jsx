import React from "react";
import AmountSelector from "components/Utility/AmountSelector";
import Translate from "react-translate-component";
import counterpart from "counterpart";
import ChainTypes from "components/Utility/ChainTypes";
import BalanceComponent from "components/Utility/BalanceComponent";
import BindToChainState from "components/Utility/BindToChainState";
import PropTypes from "prop-types";
import {checkFeeStatusAsync, checkBalance} from "common/trxHelper";
import {Asset} from "common/MarketClasses";
import AccountActions from "actions/AccountActions";
import utils from "common/utils";
import {Button, Modal} from "bitshares-ui-style-guide";
import ls from "common/localStorage";
import {ChainStore} from "bitsharesjs";
import WalletDb from "stores/WalletDb";

const STORAGE_KEY = "__beos__";
let lsBeos = new ls(STORAGE_KEY);

class BitsharesBeosModal extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired,
        assets: ChainTypes.ChainAssetsList,
        creator: PropTypes.string.isRequired,
        issuer: ChainTypes.ChainAccount.isRequired,
        owner_key: PropTypes.string.isRequired,
        ram: PropTypes.string.isRequired,
        account_contract: PropTypes.string.isRequired,
        action: PropTypes.string.isRequired,
        from: PropTypes.string.isRequired,
        balance: ChainTypes.ChainObject,
        balances: ChainTypes.ChainObjectsList,
        beosApiUrl: PropTypes.string.isRequired,
        beosFee: PropTypes.string.isRequired
    };

    constructor(props) {
        super(props);

        this.state = {
            account: "",
            btsAmount: "500",
            is_account_validation: false,
            is_account_creation_checkbox: false,
            isConfirmationModalVisible: false,
            account_validation_error: false,
            amount_to_send: "",
            creator: this.props.creator,
            owner_key: this.props.owner_key,
            ram: this.props.ram,
            is_account_creation: false,
            account_contract: this.props.account_contract,
            from_account: props.account,
            action: this.props.action,
            fee_amount_creation: 0,
            fee_asset_id: "1.3.0",
            from: this.props.from,
            empty_amount_to_send_error: false,
            balance_error: false,
            maintenance_error: false,
            memo: "",
            no_account_error: false,
            selectedAssetId: "1.3.0",
            no_account_error_without_creation: false,
            multiSigError: false
        };

        this.showConfirmationModal = this.showConfirmationModal.bind(this);
        this.hideConfirmationModal = this.hideConfirmationModal.bind(this);
    }

    componentWillMount() {
        this._updateFee();
        this._updateMultiSigError();
    }

    componentWillUnmount() {
        this.unMounted = true;
    }

    componentWillReceiveProps(np) {
        if (
            np.account !== this.state.from_account &&
            np.account !== this.props.account
        ) {
            this._updateMultiSigError();
            this.setState(
                {
                    from_account: np.account,
                    fee_asset_id: this.getAssetById(
                        this.state.selectedAssetId
                    ).get("id"),
                    fee_amount: new Asset({amount: 0})
                },
                () => {
                    this._updateFee();
                }
            );
        }
    }

    _updateMultiSigError() {
        let accountData = ChainStore.getAccount(this.props.account).toJS();
        if (accountData && accountData.active && accountData.owner) {
            if (
                accountData.active.account_auths.length === 0 &&
                accountData.active.address_auths.length === 0 &&
                accountData.active.key_auths.length === 1 &&
                accountData.owner.account_auths.length === 0 &&
                accountData.owner.address_auths.length === 0 &&
                accountData.owner.key_auths.length === 1
            ) {
                this.setState({
                    multiSigError: false
                });
            } else {
                this.setState({
                    multiSigError: true
                });
            }
        }
    }

    showConfirmationModal() {
        this.setState({
            isConfirmationModalVisible: true
        });
    }

    hideConfirmationModal() {
        this.setState({
            isConfirmationModalVisible: false
        });
    }

    _updateFee(state = this.state) {
        let {from_account} = state;

        const asset = this.getAssetById(this.state.selectedAssetId);
        const pxasset = this.getProxyAsset(asset.get("symbol"));
        let memo;

        if (pxasset === "pxbts" && this.state.is_account_creation) {
            memo = this.createMemoForAsset(pxasset, true);
        } else {
            memo = this.createMemoForAsset(pxasset);
        }

        if (!from_account) return null;
        if (asset.get("id") !== "1.3.0") return null;
        checkFeeStatusAsync({
            accountID: from_account.get("id"),
            feeID: asset.get("id"),
            options: ["price_per_kbyte"],
            data: {
                type: "memo",
                content: memo
            }
        }).then(({fee}) => {
            if (this.unMounted) return;

            this.setState(
                {
                    fee_amount: fee
                },
                this._checkBalance
            );
        });
    }

    getBalanceForAsset(assetId) {
        return this.props.balances.filter(
            b => b.get("asset_type") === assetId
        )[0];
    }

    getAssetById(assetId) {
        return this.props.assets.filter(a => a.get("id") === assetId)[0];
    }

    _checkBalance() {
        const {selectedAssetId} = this.state;
        const {amount_to_send, fee_amount, fee_amount_creation} = this.state;
        const asset = this.getAssetById(selectedAssetId);
        const balance = this.getBalanceForAsset(selectedAssetId);
        let fee_amount_amount = 0;
        if (fee_amount) {
            fee_amount_amount = fee_amount.amount;
        }
        let feeAmount = new Asset({
            amount: fee_amount_creation + fee_amount_amount,
            asset_id: asset.get("id"),
            precision: asset.get("precision")
        });
        if (!balance || !feeAmount) return;
        let hasBalance = null;
        if (asset.get("id") === "1.3.0") {
            hasBalance = checkBalance(
                amount_to_send,
                asset,
                feeAmount,
                balance
            );
        } else {
            if (
                parseInt(
                    this.state.amount_to_send *
                        utils.get_asset_precision(asset.get("precision")),
                    10
                ) <= balance.get("balance")
            ) {
                hasBalance = true;
            } else {
                hasBalance = false;
            }
        }
        if (hasBalance === null) return;
        this.setState({balance_error: !hasBalance});
        return hasBalance;
    }

    onAlternativeAccountValidation(url, account) {
        const asset = this.getAssetById(this.state.selectedAssetId);

        let validation_url =
            url + "/wallets/beos/address-validator?address=" + account;
        let validation_promise = fetch(validation_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());

        validation_promise
            .then(result => {
                let re = /^[a-z1-5.]+$/;
                setTimeout(() => {
                    this.setState({
                        account_validation_error: false,
                        is_account_validation: false,
                        maintenance_error: false,
                        no_account_error: false
                    });
                    if (
                        account.length < 13 &&
                        re.test(account) &&
                        account.substr(account.length - 1) !== "."
                    ) {
                        if (account.length === 12) {
                            this.setState({
                                btsAmount: this.props.beosFee
                            });
                        } else if (account.length < 12) {
                            this.setState({
                                btsAmount: this.props.beosFee
                            });
                        }
                        if (
                            !result.isValid &&
                            !this.state.is_account_creation
                        ) {
                            if (asset.get("symbol") === "BTS") {
                                this.setState({
                                    no_account_error: true
                                });
                            } else {
                                this.setState({
                                    no_account_error_without_creation: true,
                                    is_account_creation_checkbox: false,
                                    is_account_creation: false
                                });
                            }
                        } else {
                            this.setState(
                                {
                                    fee_amount_creation: 0,
                                    is_account_creation: false,
                                    no_account_error: false,
                                    no_account_error_without_creation: false
                                },
                                this._checkBalance
                            );
                        }
                        this.setState({
                            is_account_creation_checkbox:
                                !result.isValid &&
                                asset.get("symbol") === "BTS",
                            is_account_validation: false
                        });
                    } else {
                        this.setState({
                            is_account_creation_checkbox: false,
                            is_account_validation: false,
                            account_validation_error: true,
                            no_account_error: false
                        });
                    }
                }, 200);
            })
            .catch(() => {
                setTimeout(() => {
                    this.setState({
                        is_account_validation: false,
                        maintenance_error: true,
                        is_account_creation_checkbox: false,
                        account_validation_error: false,
                        no_account_error: false
                    });
                }, 200);
            });
    }

    onAccountValidation(url, account) {
        const asset = this.getAssetById(this.state.selectedAssetId);

        this.setState({
            is_account_creation_checkbox: false,
            is_account_validation: true
        });
        let validation_url =
            url + "/wallets/beos/address-validator?address=" + account;
        let validation_promise = fetch(validation_url, {
            method: "get",
            headers: new Headers({Accept: "application/json"})
        }).then(response => response.json());
        validation_promise
            .then(result => {
                if (
                    result.isValid &&
                    this.getPendingAccounts().includes(account)
                ) {
                    this.removePendingAccount(account);
                    this.setState({
                        account_creation_transfer_success_info: false
                    });
                }

                let re = /^[a-z1-5.]+$/;
                setTimeout(() => {
                    this.setState({
                        account_validation_error: false,
                        is_account_validation: false,
                        maintenance_error: false,
                        no_account_error: false
                    });
                    if (
                        account.length < 13 &&
                        re.test(account) &&
                        account.substr(account.length - 1) !== "."
                    ) {
                        if (account.length === 12) {
                            this.setState({
                                btsAmount: this.props.beosFee
                            });
                        } else if (account.length < 12) {
                            this.setState({
                                btsAmount: this.props.beosFee
                            });
                        }
                        if (
                            !result.isValid &&
                            !this.state.is_account_creation
                        ) {
                            if (asset.get("symbol") === "BTS") {
                                this.setState({
                                    no_account_error: true
                                });
                            } else {
                                this.setState({
                                    no_account_error_without_creation: true,
                                    is_account_creation_checkbox: false,
                                    is_account_creation: false
                                });
                            }
                        } else {
                            this.setState(
                                {
                                    fee_amount_creation: 0,
                                    is_account_creation: false,
                                    no_account_error: false,
                                    no_account_error_without_creation: false
                                },
                                this._checkBalance
                            );
                        }
                        this.setState({
                            is_account_creation_checkbox:
                                !result.isValid &&
                                asset.get("symbol") === "BTS",
                            is_account_validation: false
                        });
                    } else {
                        this.setState({
                            is_account_creation_checkbox: false,
                            is_account_validation: false,
                            account_validation_error: true,
                            no_account_error: false
                        });
                    }

                    if (
                        !result.isValid &&
                        this.getPendingAccounts().includes(account)
                    ) {
                        this.setState({
                            no_account_error: false,
                            is_account_creation_checkbox: false,
                            account_validation_error: false,
                            account_creation_transfer_success_info: true
                        });
                    }
                }, 200);
            })
            .catch(() => {
                this.onAlternativeAccountValidation(
                    this.props.beosApiUrl, // need to be set
                    account
                );
            });
    }

    onMaintenance() {
        this.showConfirmationModal();
    }

    onAccountBalance() {
        const {selectedAssetId, fee_amount, fee_amount_creation} = this.state;
        const asset = this.getAssetById(selectedAssetId);
        const balance = this.getBalanceForAsset(selectedAssetId);
        if (balance) {
            let total = new Asset({
                amount: balance.get("balance"),
                asset_id: asset.get("id"),
                precision: asset.get("precision")
            });

            let fee_amount_amount = 0;

            if (fee_amount && Number.isInteger(fee_amount.amount)) {
                fee_amount_amount = fee_amount.amount;
            }

            let totalFeeAmount = new Asset({
                amount: fee_amount_creation + fee_amount_amount,
                asset_id: asset.get("id"),
                precision: asset.get("precision")
            });

            if (asset.get("id") === "1.3.0") {
                total.minus(totalFeeAmount);
                if (total.getAmount({real: true})) {
                    const i = total
                        .getAmount({real: true})
                        .toString()
                        .indexOf(".");
                    if (i > -1) {
                        const newAmount = total
                            .getAmount({real: true})
                            .toString()
                            .substr(0, i + 5);
                        if (!newAmount.endsWith(".")) {
                            this.setState(
                                {
                                    amount_to_send: newAmount,
                                    empty_amount_to_send_error: false
                                },
                                this._checkBalance
                            );
                            return;
                        }
                    }
                }
                this.setState(
                    {
                        amount_to_send: total.getAmount({real: true}),
                        empty_amount_to_send_error: false
                    },
                    this._checkBalance
                );
            } else {
                this.setState({
                    amount_to_send: total.getAmount({real: true}),
                    balance_error: false,
                    empty_amount_to_send_error: false
                });
            }
        }
    }

    onAccountChanged(e) {
        if (e.target.value !== "") {
            if (this.state.maintenance_error === false) {
                this.setState({
                    is_account_validation: false,
                    maintenance_error: false,
                    no_account_error: false
                });
            }
            this.onAccountValidation(this.props.beosApiUrl, e.target.value); // need to be set
        }
        this.setState({account_validation_error: false});
        this.setState({account: e.target.value}, this._updateFee);
    }

    onAmountToSendChange({amount, asset}) {
        if (asset.get("id") !== this.state.selectedAssetId) {
            this.setState(
                {
                    is_account_creation_checkbox: false,
                    is_account_creation: false,
                    no_account_error: false,
                    no_account_error_without_creation: false,
                    account_validation_error: false,
                    selectedAssetId: asset.get("id")
                },
                () => {
                    this.onAccountValidation(
                        this.props.beosApiUrl,
                        this.state.account
                    );
                }
            );
        }

        if (asset.get("symbol") !== "BTS") {
            this.setState({
                is_account_creation: false,
                is_account_creation_checkbox: false,
                no_account_error: false
            });
        }

        if (amount) {
            const i = amount.toString().indexOf(".");
            if (i > -1) {
                const newAmount = amount.toString().substr(0, i + 5);
                if (!newAmount.endsWith(".")) {
                    this.setState(
                        {
                            amount_to_send: newAmount,
                            empty_amount_to_send_error:
                                amount !== undefined && !parseFloat(newAmount)
                        },
                        this._checkBalance
                    );
                    return;
                }
            }
        }

        this.setState(
            {
                amount_to_send: amount,
                empty_amount_to_send_error:
                    amount !== undefined && !parseFloat(amount)
            },
            this._checkBalance
        );
    }

    onCreateAccountCheckbox() {
        if (this.state.is_account_creation) {
            let re = /^[a-z1-5.]+$/;
            if (
                this.state.account.length < 13 &&
                re.test(this.state.account) &&
                !this.state.no_account_error &&
                !this.state.maintenance_error &&
                this.state.account.substr(this.state.account.length - 1) !== "."
            ) {
                this.setState({no_account_error: true});
            }
        } else {
            let re = /^[a-z1-5.]+$/;
            if (
                this.state.account.length < 13 &&
                re.test(this.state.account) &&
                this.state.no_account_error &&
                this.state.account.substr(this.state.account.length - 1) !== "."
            ) {
                this.setState({no_account_error: false});
            }
        }
        if (this.state.is_account_creation) {
            this.setState(
                {
                    fee_amount_creation: 0,
                    is_account_creation: !this.state.is_account_creation
                },
                this._checkBalance
            );
        } else {
            const fee = parseFloat(this.props.beosFee) * 100000;
            if (this.state.account.length === 12) {
                this.setState(
                    {
                        fee_amount_creation: fee,
                        is_account_creation: !this.state.is_account_creation
                    },
                    this._checkBalance
                );
            } else if (this.state.account.length < 12) {
                this.setState(
                    {
                        fee_amount_creation: fee,
                        is_account_creation: !this.state.is_account_creation
                    },
                    this._checkBalance
                );
            }
        }
    }

    onMemoChanged(e) {
        this.setState(
            {memo: e.target.value.replace(/:/g, "")},
            this._updateFee
        );
    }

    getPendingAccounts = () => {
        const accounts = lsBeos.get("pendingAccounts");
        return accounts.length ? lsBeos.get("pendingAccounts") : [];
    };

    setPendingAccount = account => {
        const newAccounts = [...this.getPendingAccounts(), account];
        lsBeos.set("pendingAccounts", newAccounts);
    };

    removePendingAccount = account => {
        const newAccounts = this.getPendingAccounts().filter(
            a => a !== account
        );
        lsBeos.set("pendingAccounts", newAccounts);
    };

    validationInterval = accountName => {
        const validation_url = `${
            this.props.beosApiUrl
        }/wallets/beos/address-validator?address=${accountName}`;
        const interval = setInterval(async () => {
            try {
                const response = await fetch(validation_url, {
                    method: "get",
                    headers: new Headers({Accept: "application/json"})
                });
                const {isValid} = await response.json();

                if (isValid) {
                    this.removePendingAccount(account);
                    clearInterval(interval);
                }
            } catch (e) {
                throw e;
            }
        }, 5000);

        setTimeout(() => {
            this.removePendingAccount(accountName);
            this.setState({account_creation_transfer_success_info: false});
            clearInterval(interval);
        }, 35000);
    };

    createMemoForAsset(pxasset, isAccountCreation = false) {
        const memo = [];
        switch (pxasset) {
            case "pxbts":
                memo.push("pxbts");
                break;
            case "pxbrnp":
                memo.push("pxbrnp");
                break;
            default:
                break;
        }
        const {memo: userMemo} = this.state;
        memo.push(
            this.state.account,
            userMemo.trim() ? userMemo : "",
            isAccountCreation ? "create" : ""
        );

        return memo.join(":");
    }

    getProxyAsset(assetSymbol) {
        let pxasset = "";

        switch (assetSymbol) {
            case "BTS":
                pxasset = "pxbts";
                break;
            case "BROWNIE.PTS":
                pxasset = "pxbrnp";
                break;
            default:
                break;
        }

        return pxasset;
    }

    getAvailableAssets = () => {
        return this.props.assets
            .filter(a => !!this.getBalanceForAsset(a.get("id")))
            .map(a => a.get("id"));
    };

    async onSubmit() {
        const asset = this.getAssetById(this.state.selectedAssetId);

        let newAmountToSend = parseInt(
            this.state.amount_to_send *
                utils.get_asset_precision(asset.get("precision")),
            10
        );

        const pxasset = this.getProxyAsset(asset.get("symbol"));
        let memo;

        if (pxasset === "pxbts" && this.state.is_account_creation) {
            memo = this.createMemoForAsset(pxasset, true);
            newAmountToSend = newAmountToSend + this.state.fee_amount_creation;
        } else {
            memo = this.createMemoForAsset(pxasset);
        }

        try {
            await AccountActions.transfer(
                this.props.account.get("id"),
                this.props.issuer.get("id"),
                newAmountToSend,
                asset.get("id"),
                memo,
                null,
                "1.3.0"
            );

            if (this.state.is_account_creation) {
                if (!WalletDb.isLocked()) {
                    this.setPendingAccount(this.state.account);
                    this.setState({
                        is_account_creation_checkbox: false,
                        account_creation_transfer_success_info: true,
                        is_account_creation: false
                    });
                    this.validationInterval(this.state.account);
                }
            }
        } catch (e) {
            this.onMaintenance();
            throw e;
        }
    }

    render() {
        let account_creation_checkbox = null;
        let balance = null;
        let account_balances = this.props.account.get("balances").toJS();
        let asset_types = Object.keys(account_balances);
        let maintenanceDialog = null;

        if (asset_types.length > 0) {
            let current_asset_id = this.state.selectedAssetId;
            if (current_asset_id) {
                let current = this.getBalanceForAsset(current_asset_id).get(
                    "id"
                );
                balance = (
                    <span
                        style={{
                            borderBottom: "#A09F9F 1px dotted",
                            cursor: "pointer"
                        }}
                    >
                        <Translate
                            component="span"
                            content="transfer.available"
                        />
                        &nbsp;:&nbsp;
                        <span
                            className="set-cursor"
                            onClick={this.onAccountBalance.bind(this)}
                        >
                            {current ? (
                                <BalanceComponent balance={current} />
                            ) : (
                                0
                            )}
                        </span>
                    </span>
                );
            } else balance = "No funds";
        } else {
            balance = "No funds";
        }

        if (
            this.getAssetById(this.state.selectedAssetId).get("symbol") ===
                "BTS" &&
            this.state.is_account_creation_checkbox &&
            this.state.account !== "" &&
            !this.state.maintenance_error
        ) {
            account_creation_checkbox = (
                <table className="table" style={{width: "inherit"}}>
                    <tbody>
                        <tr>
                            <td style={{border: "none"}}>
                                <Translate
                                    content={
                                        "gateway.bitshares_beos.create_account_checkbox"
                                    }
                                />
                                :
                            </td>
                            <td style={{border: "none"}}>
                                <div
                                    className="switch"
                                    style={{
                                        marginBottom: "10px"
                                    }}
                                    onClick={this.onCreateAccountCheckbox.bind(
                                        this
                                    )}
                                >
                                    <input
                                        type="checkbox"
                                        checked={this.state.is_account_creation}
                                    />
                                    <label />
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            );
        }

        maintenanceDialog = (
            <Modal
                onCancel={this.hideConfirmationModal}
                footer={null}
                visible={this.state.isConfirmationModalVisible}
            >
                <label>
                    <Translate content="gateway.bitshares_beos.maintenance_modal_label" />
                </label>
                <br />
                <Button key="cancel" onClick={this.hideConfirmationModal}>
                    {counterpart.translate(
                        "gateway.bitshares_beos.maintenance_button_label"
                    )}
                </Button>
            </Modal>
        );

        const disableSubmit =
            !this.state.amount_to_send ||
            this.state.balance_error ||
            this.state.account === "" ||
            this.state.account_validation_error ||
            this.state.no_account_error ||
            this.state.is_account_validation ||
            this.state.no_account_error_without_creation ||
            this.getPendingAccounts().includes(this.state.account) ||
            this.state.multiSigError;
        // this.state.maintenance_error;

        return (
            <div>
                <form className="grid-block vertical full-width-content">
                    <div className="grid-container">
                        {/* Amount to send to BEOS account */}
                        <div className="content-block">
                            <AmountSelector
                                label="gateway.bitshares_beos.amount_to_send_label"
                                amount={this.state.amount_to_send}
                                asset={this.state.selectedAssetId}
                                assets={this.getAvailableAssets()}
                                placeholder="0.0"
                                onChange={this.onAmountToSendChange.bind(this)}
                                display_balance={balance}
                            />
                            {this.state.empty_amount_to_send_error ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="transfer.errors.valid" />
                                </p>
                            ) : null}
                            {this.state.balance_error ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="transfer.errors.insufficient" />
                                </p>
                            ) : null}
                        </div>
                        {/* Bitshares EOS account */}
                        <div className="content-block">
                            <label className="left-label">
                                <Translate
                                    component="span"
                                    content="gateway.bitshares_beos.account_label"
                                />
                            </label>
                            <div className="inline-label">
                                <input
                                    type="text"
                                    value={this.state.account}
                                    autoComplete="off"
                                    onChange={this.onAccountChanged.bind(this)}
                                />
                            </div>
                            {this.state.account_validation_error &&
                            this.state.account !== "" ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="gateway.bitshares_beos.account_validation_error" />
                                </p>
                            ) : null}
                            {this.state.is_account_validation ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="gateway.bitshares_beos.account_validation_label" />
                                </p>
                            ) : null}
                            {this.state.maintenance_error ? (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingTop: 10}}
                                >
                                    <Translate content="gateway.bitshares_beos.maintenance_error" />
                                </p>
                            ) : null}
                        </div>
                        {/* Memo */}
                        <div className="content-block">
                            <label className="left-label">
                                <Translate
                                    component="span"
                                    content="gateway.bitshares_beos.memo_label"
                                />
                            </label>
                            <textarea
                                rows="3"
                                value={this.state.memo}
                                onChange={this.onMemoChanged.bind(this)}
                            />
                        </div>
                        {/* Create account enabled/disabled */}
                        {account_creation_checkbox}
                        {this.state.no_account_error &&
                        !this.state.maintenance_error &&
                        this.state.account !== "" ? (
                            <p
                                className="has-error no-margin"
                                style={{paddingBottom: 15}}
                            >
                                <Translate
                                    content="gateway.bitshares_beos.no_account_error"
                                    btsAmount={this.state.btsAmount}
                                />
                            </p>
                        ) : null}
                        {this.state.multiSigError ? (
                            <p
                                className="has-error no-margin"
                                style={{paddingBottom: 15}}
                            >
                                <Translate content="gateway.bitshares_beos.multi_sig_error" />
                            </p>
                        ) : null}
                        {this.state.no_account_error_without_creation &&
                            !this.state.maintenance_error &&
                            this.state.account !== "" && (
                                <p
                                    className="has-error no-margin"
                                    style={{paddingBottom: 15}}
                                >
                                    <Translate content="gateway.bitshares_beos.no_account_error_without_creation" />
                                </p>
                            )}
                        {this.renderInfo()}
                        {/* Send/Cancel buttons */}
                        <div>
                            <Button
                                type="primary"
                                disabled={disableSubmit}
                                onClick={this.onSubmit.bind(this)}
                            >
                                {counterpart.translate(
                                    "gateway.bitshares_beos.send_button_label"
                                )}
                            </Button>

                            <Button
                                onClick={this.props.hideModal}
                                style={{marginLeft: "8px"}}
                            >
                                {counterpart.translate("account.perm.cancel")}
                            </Button>
                        </div>
                        {maintenanceDialog}
                    </div>
                </form>
            </div>
        );
    }

    renderInfo = () => {
        if (this.getPendingAccounts().includes(this.state.account)) {
            return (
                <p
                    className="has-success no-margin"
                    style={{paddingBottom: 15, color: "green"}}
                >
                    <Translate content="gateway.bitshares_beos.account_creation_pending" />
                </p>
            );
        }

        return null;
    };
}

export default BindToChainState(BitsharesBeosModal);
