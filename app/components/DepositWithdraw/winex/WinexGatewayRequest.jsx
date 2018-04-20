import React from "react";
import Translate from "react-translate-component";
import {ChainStore} from "bitsharesjs/es";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import WinexWithdrawModal from "components/DepositWithdraw/winex/WinexWithdrawModal";
import BaseModal from "../../Modal/BaseModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../../Account/AccountBalance";
import BlockTradesDepositAddressCache from "common/BlockTradesDepositAddressCache";
import AssetName from "components/Utility/AssetName";
import LinkToAccountById from "components/Utility/LinkToAccountById";
import {requestDepositAddress} from "common/gatewayMethods";
import {widechainAPIs} from "api/apiConfig";
import LoadingIndicator from "components/LoadingIndicator";
import QRCode from "qrcode.react";

class WinexGatewayRequest extends React.Component {
    static propTypes = {
        url: React.PropTypes.string,
        gateway: React.PropTypes.string,
        deposit_coin_type: React.PropTypes.string,
        deposit_asset_name: React.PropTypes.string,
        deposit_account: React.PropTypes.string,
        receive_coin_type: React.PropTypes.string,
        account: ChainTypes.ChainAccount,
        issuer_account: ChainTypes.ChainAccount,
        deposit_asset: React.PropTypes.string,
        deposit_wallet_type: React.PropTypes.string,
        receive_asset: ChainTypes.ChainAsset,
        deprecated_in_favor_of: ChainTypes.ChainAsset,
        deprecated_message: React.PropTypes.string,
        action: React.PropTypes.string,
        supports_output_memos: React.PropTypes.bool.isRequired,
        min_withdraw_amount: React.PropTypes.any,
        max_withdraw_amount: React.PropTypes.any,
        fee_type: React.PropTypes.string
    };

    static defaultProps = {
        autosubscribe: false
    };

    constructor(props) {
        super(props);
        this.deposit_address_cache = new BlockTradesDepositAddressCache();

        let urls = {
            Winex: widechainAPIs.BASE
        };

        this.state = {
            receive_address: {},
            url: props.url || urls[props.gateway]
        };

        this.addDepositAddress = this.addDepositAddress.bind(this);
        this._copy = this._copy.bind(this);
        document.addEventListener("copy", this._copy);
    }

    _copy(e) {
        try {
            e.clipboardData.setData("text/plain", this.state.clipboardText);
            e.preventDefault();
        } catch (err) {
            console.error(err);
        }
    }

    _getDepositObject(props = this.props) {
        return {
            inputCoinType: props.deposit_coin_type,
            outputCoinType: props.receive_coin_type,
            outputAddress: props.account.get("name"),
            url: this.state.url,
            stateCallback: this.addDepositAddress
        };
    }

    componentWillMount() {
        // let account_name = this.props.account.get("name");
        // let receive_address = this.deposit_address_cache.getCachedInputAddress(this.props.gateway, account_name, this.props.deposit_coin_type, this.props.receive_coin_type);
        // if(!receive_address){
        //     receive_address.address = "unknown";
        // }
        // let receive_address = {address:"",memo:""}
        // this.setState({receive_address});
    }

    componentWillReceiveProps(np) {
        /* When switching accounts, reset the receive_address so a new one
        gets fetched/generated for the new account */
        if (np.account !== this.props.account) {
            this.setState({receive_address: {}});
        }
    }

    componentWillUnmount() {
        document.removeEventListener("copy", this._copy);
    }

    addDepositAddress(receive_address) {
        let account_name = this.props.account.get("name");
        this.deposit_address_cache.cacheInputAddress(
            this.props.gateway,
            account_name,
            this.props.deposit_coin_type,
            this.props.receive_coin_type,
            receive_address.address,
            receive_address.memo
        );
        this.setState({receive_address});
    }

    getWithdrawModalId() {
        // console.log( "this.props.issuer: ", this.props.issuer_account.toJS() )
        // console.log( "this.receive_asset.issuer: ", this.props.receive_asset.toJS() )
        return (
            "withdraw_asset_" +
            this.props.issuer_account.get("name") +
            "_" +
            this.props.receive_asset.get("symbol")
        );
    }

    onWithdraw() {
        ZfApi.publish(this.getWithdrawModalId(), "open");
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
        const isDeposit = this.props.action === "deposit";
        let emptyRow = <div style={{display: "none", minHeight: 150}} />;
        if (
            !this.props.account ||
            !this.props.issuer_account ||
            !this.props.receive_asset
        )
            return emptyRow;

        let account_balances_object = this.props.account.get("balances");

        const {gateFee} = this.props;

        let balance = "0 " + this.props.receive_asset.get("symbol");
        if (this.props.deprecated_in_favor_of) {
            let has_nonzero_balance = false;
            let balance_object_id = account_balances_object.get(
                this.props.receive_asset.get("id")
            );
            if (balance_object_id) {
                let balance_object = ChainStore.getObject(balance_object_id);
                if (balance_object) {
                    let balance = balance_object.get("balance");
                    if (balance != 0) has_nonzero_balance = true;
                }
            }
            if (!has_nonzero_balance) return emptyRow;
        }

        // let account_balances = account_balances_object.toJS();
        // let asset_types = Object.keys(account_balances);
        // if (asset_types.length > 0) {
        //     let current_asset_id = this.props.receive_asset.get("id");
        //     if( current_asset_id )
        //     {
        //         balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>);
        //     }
        // }

        let receive_address = this.state.receive_address;
        if (!Object.keys(receive_address).length) {
            let account_name = this.props.account.get("name");
            receive_address = this.deposit_address_cache.getCachedInputAddress(
                this.props.gateway,
                account_name,
                this.props.deposit_coin_type,
                this.props.receive_coin_type
            );
        }

        if (!receive_address) {
            requestDepositAddress(this._getDepositObject());
            return (
                <div style={{margin: "3rem"}}>
                    <LoadingIndicator type="three-bounce" />
                </div>
            );
        }

        let withdraw_modal_id = this.getWithdrawModalId();
        let deposit_address_fragment = null;
        let deposit_memo = null;
        // if (this.props.deprecated_in_favor_of)
        // {
        //     deposit_address_fragment = <span>please use {this.props.deprecated_in_favor_of.get("symbol")} instead. <span data-tip={this.props.deprecated_message} data-place="right" data-html={true}><Icon name="question-circle" /></span><ReactTooltip /></span>;
        // }
        // else
        // {
        let clipboardText = "";
        let memoText;
        if (this.props.deposit_account) {
            deposit_address_fragment = (
                <span>{this.props.deposit_account}</span>
            );
            clipboardText =
                this.props.receive_coin_type +
                ":" +
                this.props.account.get("name");
            deposit_memo = <span>{clipboardText}</span>;
            var withdraw_memo_prefix = this.props.deposit_coin_type + ":";
        } else {
            if (receive_address.memo) {
                // This is a client that uses a deposit memo (like ethereum), we need to display both the address and the memo they need to send
                memoText = receive_address.memo;
                clipboardText = receive_address.address;
                deposit_address_fragment = (
                    <span>{receive_address.address}</span>
                );
                deposit_memo = <span>{receive_address.memo}</span>;
            } else {
                // This is a client that uses unique deposit addresses to select the output
                clipboardText = receive_address.address;
                deposit_address_fragment = (
                    <span>{receive_address.address}</span>
                );
            }
            var withdraw_memo_prefix = "";
        }

        if (
            !this.props.isAvailable ||
            (isDeposit &&
                !this.props.deposit_account &&
                !this.state.receive_address)
        ) {
            return (
                <div>
                    <Translate
                        className="txtlabel cancel"
                        content="gateway.unavailable"
                        component="h4"
                    />
                </div>
            );
        }

        let issuer = {
            name: "Winex",
            qq: "623556771",
            support: "support@winex.pro"
        };
        let support_block = (
            <div>
                <label className="left-label">Support</label>
                <div>
                    <Translate content="winex.gateway.support_block" />
                    <br />
                    <br />
                    <span>Mail：</span>
                    <a
                        href={
                            (issuer.support.indexOf("@") === -1
                                ? ""
                                : "mailto:") + issuer.support
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {issuer.support}
                    </a>
                    <br />
                    <br />
                    <span>QQ群：</span>
                    <a
                        target="_blank"
                        href="//shang.qq.com/wpa/qunwpa?idkey=5346c21c6da5f4990daf9b178e2c71a160e0d4cfd2bbb7bbae21eea80f44a11f"
                        rel="noopener noreferrer"
                    >
                        623556771
                    </a>
                </div>
            </div>
        );
        if (isDeposit) {
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
                                            {this.props.deposit_asset}
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
                                                name={this.props.receive_asset.get(
                                                    "symbol"
                                                )}
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
                                                asset={this.props.receive_asset.get(
                                                    "symbol"
                                                )}
                                                replace={false}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                        {support_block}
                    </div>
                    <div className="small-12 medium-7">
                        <Translate
                            component="h4"
                            content="gateway.deposit_inst"
                        />
                        <label className="left-label">
                            <Translate
                                content="gateway.deposit_to"
                                asset={this.props.deposit_asset}
                            />:
                        </label>
                        <label className="left-label">
                            <p style={{color: "red"}}>
                                <Translate
                                    content="winex.gateway.deposit_warning"
                                    asset={this.props.deposit_asset}
                                />
                            </p>
                        </label>
                        <div
                            style={{
                                padding: "10px 0",
                                fontSize: "1.1rem",
                                fontWeight: "bold"
                            }}
                        >
                            <table className="table">
                                <tbody>
                                    <tr>
                                        <td>
                                            {!receive_address.address ||
                                            receive_address.address ===
                                                "unknown" ? null : (
                                                <QRCode
                                                    size={120}
                                                    value={
                                                        receive_address.address
                                                    }
                                                />
                                            )}
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            {!receive_address.address ||
                                            receive_address.address ===
                                                "unknown" ? (
                                                <Translate content="winex.gateway.click_getaddress" />
                                            ) : (
                                                receive_address.address
                                            )}
                                        </td>
                                    </tr>
                                    {deposit_memo ? (
                                        <tr>
                                            <td>memo: {deposit_memo}</td>
                                        </tr>
                                    ) : null}
                                </tbody>
                            </table>
                            <div
                                className="button-group"
                                style={{paddingTop: 10}}
                            >
                                {deposit_address_fragment ? (
                                    <div
                                        className="button"
                                        onClick={this.toClipboard.bind(
                                            this,
                                            clipboardText
                                        )}
                                    >
                                        Copy address
                                    </div>
                                ) : null}
                                {memoText ? (
                                    <div
                                        className="button"
                                        onClick={this.toClipboard.bind(
                                            this,
                                            memoText
                                        )}
                                    >
                                        Copy memo
                                    </div>
                                ) : null}
                                <button
                                    className={"button"}
                                    onClick={requestDepositAddress.bind(
                                        null,
                                        this._getDepositObject()
                                    )}
                                >
                                    <Translate content="winex.gateway.get_deposit_address" />
                                </button>
                            </div>
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
                                                name={this.props.receive_asset.get(
                                                    "symbol"
                                                )}
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
                                            {this.props.deposit_asset}
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
                                                asset={this.props.receive_asset.get(
                                                    "symbol"
                                                )}
                                                replace={false}
                                            />
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/*<p>When you withdraw {this.props.receive_asset.get("symbol")}, you will receive {this.props.deposit_asset} at a 1:1 ratio (minus fees).</p>*/}
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
                            <WinexWithdrawModal
                                account={this.props.account.get("name")}
                                issuer={this.props.issuer_account.get("name")}
                                asset={this.props.receive_asset.get("symbol")}
                                url={this.state.url}
                                output_coin_name={this.props.deposit_asset_name}
                                gateFee={gateFee}
                                output_coin_symbol={this.props.deposit_asset}
                                output_coin_type={this.props.deposit_coin_type}
                                output_wallet_type={
                                    this.props.deposit_wallet_type
                                }
                                output_supports_memos={
                                    this.props.supports_output_memos
                                }
                                min_withdraw_amount={
                                    this.props.min_withdraw_amount
                                }
                                max_withdraw_amount={
                                    this.props.max_withdraw_amount
                                }
                                fee_type={this.props.fee_type}
                                memo_prefix={withdraw_memo_prefix}
                                modal_id={withdraw_modal_id}
                                balance={
                                    this.props.account.get("balances").toJS()[
                                        this.props.receive_asset.get("id")
                                    ]
                                }
                            />
                        </div>
                    </BaseModal>
                    {support_block}
                </div>
            );
        }
    }
}

export default BindToChainState(WinexGatewayRequest, {keep_updating: true});
