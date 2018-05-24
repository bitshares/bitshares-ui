import React from "react";
import BindToChainState from "components/Utility/BindToChainState";
import Translate from "react-translate-component";
import AssetName from "../../Utility/AssetName";
import LinkToAccountById from "../../Utility/LinkToAccountById";
import AccountBalance from "../../Account/AccountBalance";
import BaseModal from "../../Modal/BaseModal";
import ChainTypes from "../../Utility/ChainTypes";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import GdexCache from "../../../lib/common/GdexCache";
import {requestDepositAddress} from "../../../lib/common/gdexMethods";
import QRCode from "qrcode.react";
import GdexWithdrawModal from "./GdexWithdrawModal";
import counterpart from "counterpart";
import PropTypes from "prop-types";

class GdexGatewayInfo extends React.Component {
    static propTypes = {
        // inner_asset_name:               PropTypes.string,
        // outer_asset_name:           PropTypes.string,
        account: ChainTypes.ChainAccount,
        issuer_account: ChainTypes.ChainAccount,
        gateway: PropTypes.string,
        btsCoin: ChainTypes.ChainAsset,
        memo_rule: PropTypes.string
    };

    static defaultProps = {
        autosubscribe: false
    };

    constructor() {
        super();
        this.state = {
            receive_address: null,
            isAvailable: true,
            qrcode: ""
        };
        this.deposit_address_cache = new GdexCache();
        this._copy = this._copy.bind(this);
        document.addEventListener("copy", this._copy);
    }

    getDepositAddress() {
        this._getDepositAddress(
            this.props.user_id,
            this.props.account.get("name"),
            this.props.coin,
            this.props.action
        );
    }

    _getDepositAddress(user_id, user_name, coin, action) {
        // The coin can only support withdraw sometime, no need to call get deposit address
        if (action != "deposit") return;

        let cached_receive_address = this.deposit_address_cache.getCachedInputAddress(
            user_name,
            coin.outerSymbol,
            coin.innerSymbol
        );
        if (
            cached_receive_address &&
            cached_receive_address != this.state.receive_address
        ) {
            this.setState({receive_address: cached_receive_address});
            return;
        }
        // Get address from server side
        var _this = this;
        requestDepositAddress({
            btsAssetId: coin.innerAssetId,
            outAssetId: coin.outerAssetId,
            uid: user_id,
            userAccount: user_name
        })
            .then(data => {
                if (data.address && data.address.address) {
                    var receive_address = {
                        address: data.address.address,
                        memo: data.address.memo
                    };
                    _this.deposit_address_cache.cacheInputAddress(
                        user_name,
                        coin.outerSymbol,
                        coin.innerSymbol,
                        receive_address.address,
                        receive_address.memo
                    );
                    _this.setState({receive_address: receive_address});
                } else {
                    _this.setState({receive_address: null});
                }
            })
            .catch(err => {
                _this.setState({receive_address: null});
                console.log(err);
            });
    }

    componentWillMount() {
        this.getDepositAddress();
    }

    componentWillReceiveProps(np) {
        if (
            np.user_id !== this.props.user_id ||
            np.action !== this.props.action ||
            np.coin != this.props.coin
        ) {
            this._getDepositAddress(
                np.user_id,
                np.account.get("name"),
                np.coin,
                np.action
            );
        }
    }

    componentWillUnmount() {
        document.removeEventListener("copy", this._copy);
    }

    getWithdrawModalId() {
        return (
            "withdraw_asset_" +
            this.props.issuer_account.get("name") +
            "_" +
            this.props.coin.innerSymbol
        );
    }

    onWithdraw() {
        ZfApi.publish(this.getWithdrawModalId(), "open");
    }

    onShowQrcode(text) {
        this.setState({qrcode: text}, () => ZfApi.publish("qrcode", "open"));
    }

    _copy(e) {
        try {
            if (this.state.clipboardText)
                e.clipboardData.setData("text/plain", this.state.clipboardText);
            else
                e.clipboardData.setData(
                    "text/plain",
                    counterpart
                        .translate("gateway.use_copy_button")
                        .toUpperCase()
                );
            e.preventDefault();
        } catch (err) {
            console.error(err);
        }
    }

    toClipboard(clipboardText) {
        try {
            this.setState({clipboardText}, () => {
                document.execCommand("copy");
            });
        } catch (err) {
            console.error(err);
        }
    }

    render() {
        let emptyRow = <div style={{display: "none", minHeight: 150}} />;
        if (
            !this.props.account ||
            !this.props.issuer_account ||
            !this.props.coin
        )
            return emptyRow;
        const {coin, btsCoin} = this.props;
        // asset is not loaded
        if (!btsCoin) return emptyRow;
        let receive_address = this.state.receive_address;
        let qrcode = this.state.qrcode;
        let withdraw_modal_id = this.getWithdrawModalId();
        let deposit_address_fragment = null;
        let clipboardText = "";
        let memoText = "";
        let deposit_memo_fragment = null;

        var withdraw_memo_prefix = coin.outerSymbol + ":";
        if (this.props.action === "deposit") {
            if (receive_address) {
                deposit_address_fragment = (
                    <span>{receive_address.address}</span>
                );
                clipboardText = receive_address.address;
                if (receive_address.memo) {
                    deposit_memo_fragment = <span>{receive_address.memo}</span>;
                    memoText = receive_address.memo;
                }
            }
            withdraw_memo_prefix = "";
        }
        let balance = null;
        let account_balances_object = this.props.account.get("balances");

        if (account_balances_object)
            balance = account_balances_object.toJS()[btsCoin.get("id")];

        if (this.props.action === "deposit") {
            return (
                <div className="Blocktrades__gateway grid-block no-padding no-margin">
                    <div className="small-12 medium-5">
                        <Translate
                            component="h4"
                            content="gateway.deposit_summary"
                        />
                        <div className="small-12 medium-10">
                            <table className="table">
                                <tbody>
                                    <tr>
                                        <Translate
                                            component="td"
                                            content="gateway.asset_to_deposit"
                                        />
                                        <td
                                            style={{
                                                fontWeight: "bold",
                                                color: "#049cce",
                                                textAlign: "right"
                                            }}
                                        >
                                            {coin.outerSymbol}
                                        </td>
                                    </tr>
                                    <tr>
                                        <Translate
                                            component="td"
                                            content="gateway.asset_to_receive"
                                        />
                                        <td
                                            style={{
                                                fontWeight: "bold",
                                                color: "#049cce",
                                                textAlign: "right"
                                            }}
                                        >
                                            <AssetName
                                                name={coin.innerSymbol}
                                                replace={false}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <Translate
                                            component="td"
                                            content="gateway.intermediate"
                                        />
                                        <td
                                            style={{
                                                fontWeight: "bold",
                                                color: "#049cce",
                                                textAlign: "right"
                                            }}
                                        >
                                            <LinkToAccountById
                                                account={this.props.issuer_account.get(
                                                    "id"
                                                )}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <Translate
                                            component="td"
                                            content="gateway.your_account"
                                        />
                                        <td
                                            style={{
                                                fontWeight: "bold",
                                                color: "#049cce",
                                                textAlign: "right"
                                            }}
                                        >
                                            <LinkToAccountById
                                                account={this.props.account.get(
                                                    "id"
                                                )}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <Translate content="gateway.balance" />:
                                        </td>
                                        <td
                                            style={{
                                                fontWeight: "bold",
                                                color: "#049cce",
                                                textAlign: "right"
                                            }}
                                        >
                                            <AccountBalance
                                                account={this.props.account.get(
                                                    "name"
                                                )}
                                                asset={coin.innerSymbol}
                                                replace={false}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="small-12 medium-7">
                        <Translate
                            component="h4"
                            content="gateway.deposit_inst"
                        />
                        <label className="left-label">
                            <Translate
                                content="gateway.deposit_to"
                                asset={coin.outerSymbol}
                            />:
                        </label>
                        <p style={{color: "red"}}>
                            <Translate
                                content="gateway.deposit_warning"
                                asset={coin.outerSymbol}
                            />
                        </p>
                        {memoText ? (
                            <p style={{color: "red"}}>
                                <Translate
                                    content="gateway.deposit_warning_memo"
                                    asset={coin.outerSymbol}
                                />
                            </p>
                        ) : null}
                        <div>
                            <table className="table">
                                <tbody>
                                    <tr>
                                        <td>
                                            <Translate content="gateway.address" />:
                                        </td>
                                        <td>{deposit_address_fragment}</td>
                                        <td>
                                            <div
                                                style={{width: "125px"}}
                                                className="button"
                                                onClick={this.toClipboard.bind(
                                                    this,
                                                    clipboardText
                                                )}
                                            >
                                                <Translate content="transfer.copy_address" />
                                            </div>
                                        </td>
                                        <td>
                                            <div
                                                className="button"
                                                onClick={this.onShowQrcode.bind(
                                                    this,
                                                    clipboardText
                                                )}
                                            >
                                                <Translate content="modal.qrcode.label" />
                                            </div>
                                        </td>
                                    </tr>
                                    {memoText ? (
                                        <tr>
                                            <td>
                                                <Translate content="gateway.memo" />:
                                            </td>
                                            <td>{memoText}</td>
                                            <td>
                                                <div
                                                    style={{width: "125px"}}
                                                    className="button"
                                                    onClick={this.toClipboard.bind(
                                                        this,
                                                        memoText
                                                    )}
                                                >
                                                    <Translate content="transfer.copy_memo" />
                                                </div>
                                            </td>
                                            <td>
                                                <div
                                                    className="button"
                                                    onClick={this.onShowQrcode.bind(
                                                        this,
                                                        memoText
                                                    )}
                                                >
                                                    <Translate content="modal.qrcode.label" />
                                                </div>
                                            </td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                            <BaseModal id="qrcode" overlay={true}>
                                {/*<div className="gdex-gateway">abc</div>*/}
                                <DepositQrCodeModal text={qrcode} />
                            </BaseModal>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="Blocktrades__gateway grid-block no-padding no-margin">
                    <div className="small-12 medium-5">
                        <Translate
                            component="h4"
                            content="gateway.withdraw_summary"
                        />
                        <div className="small-12 medium-10">
                            <table className="table">
                                <tbody>
                                    <tr>
                                        <Translate
                                            component="td"
                                            content="gateway.asset_to_withdraw"
                                        />
                                        <td
                                            style={{
                                                fontWeight: "bold",
                                                color: "#049cce",
                                                textAlign: "right"
                                            }}
                                        >
                                            <AssetName
                                                name={coin.innerSymbol}
                                                replace={false}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <Translate
                                            component="td"
                                            content="gateway.asset_to_receive"
                                        />
                                        <td
                                            style={{
                                                fontWeight: "bold",
                                                color: "#049cce",
                                                textAlign: "right"
                                            }}
                                        >
                                            {coin.outerSymbol}
                                        </td>
                                    </tr>
                                    <tr>
                                        <Translate
                                            component="td"
                                            content="gateway.intermediate"
                                        />
                                        <td
                                            style={{
                                                fontWeight: "bold",
                                                color: "#049cce",
                                                textAlign: "right"
                                            }}
                                        >
                                            <LinkToAccountById
                                                account={this.props.issuer_account.get(
                                                    "id"
                                                )}
                                            />
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <Translate content="gateway.balance" />:
                                        </td>
                                        <td
                                            style={{
                                                fontWeight: "bold",
                                                color: "#049cce",
                                                textAlign: "right"
                                            }}
                                        >
                                            <AccountBalance
                                                account={this.props.account.get(
                                                    "name"
                                                )}
                                                asset={coin.innerSymbol}
                                                replace={false}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="small-12 medium-7">
                        <Translate
                            component="h4"
                            content="gateway.withdraw_inst"
                        />
                        <label className="left-label">
                            <Translate
                                content="gateway.withdraw_to"
                                asset={this.props.deposit_asset}
                            />:
                        </label>
                        <div className="button-group" style={{paddingTop: 20}}>
                            <button
                                className="button success"
                                style={{fontSize: "1.3rem"}}
                                onClick={this.onWithdraw.bind(this)}
                            >
                                <Translate content="gateway.withdraw_now" />{" "}
                            </button>
                        </div>
                    </div>
                    <BaseModal id={withdraw_modal_id} overlay={true}>
                        <br />
                        <div className="grid-block vertical">
                            <GdexWithdrawModal
                                account={this.props.account.get("name")}
                                issuer={this.props.issuer_account.get("name")}
                                asset={coin.innerSymbol}
                                output_coin_name={coin.outerAssetName}
                                gateFee={coin.gateFee}
                                output_coin_id={coin.outerAssetId}
                                output_coin_symbol={coin.outerSymbol}
                                output_supports_memos={coin.needMemo == 1}
                                minWithdrawAmount={coin.minTransactionAmount}
                                output_coin_precision={coin.relationPrecision}
                                memo_prefix={withdraw_memo_prefix}
                                memo_rule={this.props.memo_rule}
                                modal_id={withdraw_modal_id}
                                balance={balance}
                            />
                        </div>
                    </BaseModal>
                </div>
            );
        }
    }
}

class DepositQrCodeModal extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let text = this.props.text;
        return (
            <div className="small-12" style={{textAlign: "center"}}>
                <QRCode size={200} value={text} />
                <br />
                <br />
                <label>{text}</label>
            </div>
        );
    }
}

export default BindToChainState(GdexGatewayInfo);
