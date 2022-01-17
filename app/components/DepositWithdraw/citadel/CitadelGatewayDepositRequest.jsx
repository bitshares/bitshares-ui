import React from "react";
import Translate from "react-translate-component";
import {ChainStore} from "bitsharesjs/es";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import WithdrawModalCitadel from "./WithdrawModalCitadel";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../../Account/AccountBalance";
import AssetName from "components/Utility/AssetName";
import LinkToAccountById from "components/Utility/LinkToAccountById";
import {requestDepositAddress, getDepositAddress} from "common/gatewayMethods";
import {blockTradesAPIs, openledgerAPIs, citadelAPIs} from "api/apiConfig";
import LoadingIndicator from "components/LoadingIndicator";
import DisableCopyText from "../DisableCopyText";
import counterpart from "counterpart";
import PropTypes from "prop-types";
import {Modal} from "bitshares-ui-style-guide";
import CopyToClipboard from "react-copy-to-clipboard";

class CitadelGatewayDepositRequest extends React.Component {
    static propTypes = {
        url: PropTypes.string,
        gateway: PropTypes.string,
        deposit_coin_type: PropTypes.string,
        deposit_asset_name: PropTypes.string,
        deposit_account: PropTypes.string,
        receive_coin_type: PropTypes.string,
        account: ChainTypes.ChainAccount,
        issuer_account: ChainTypes.ChainAccount,
        deposit_asset: PropTypes.string,
        deposit_wallet_type: PropTypes.string,
        receive_asset: ChainTypes.ChainAsset,
        deprecated_in_favor_of: ChainTypes.ChainAsset,
        deprecated_message: PropTypes.string,
        action: PropTypes.string,
        supports_output_memos: PropTypes.bool.isRequired
    };

    static defaultProps = {
        autosubscribe: false
    };

    constructor(props) {
        super(props);

        let urls = {
            blocktrades: blockTradesAPIs.BASE,
            openledger: openledgerAPIs.BASE,
            citadel: citadelAPIs.BASE
        };

        this.state = {
            isModalVisible: false,
            receive_address: null,
            url: props.url || urls[props.gateway],
            loading: false,
            emptyAddressDeposit: false
        };

        this.addDepositAddress = this.addDepositAddress.bind(this);
        this.showModal = this.showModal.bind(this);
        this.hideModal = this.hideModal.bind(this);
    }

    showModal() {
        this.setState({
            isModalVisible: true
        });
    }

    hideModal() {
        this.setState({
            isModalVisible: false
        });
    }

    _getDepositObject() {
        return {
            inputCoinType: this.props.deposit_coin_type,
            outputCoinType: this.props.receive_coin_type,
            outputAddress: this.props.account.get("name"),
            url: this.state.url,
            stateCallback: this.addDepositAddress
        };
    }

    UNSAFE_componentWillMount() {
        getDepositAddress({
            coin: this.props.receive_coin_type,
            account: this.props.account.get("name"),
            stateCallback: this.addDepositAddress
        });
    }

    UNSAFE_componentWillReceiveProps(np) {
        if (np.account !== this.props.account) {
            getDepositAddress({
                coin: np.receive_coin_type,
                account: np.account.get("name"),
                stateCallback: this.addDepositAddress
            });
        }
    }

    addDepositAddress(receive_address) {
        if (receive_address.error) {
            receive_address.error.message === "no_address"
                ? this.setState({emptyAddressDeposit: true})
                : this.setState({emptyAddressDeposit: false});
        }

        this.setState({receive_address});
        this.setState({
            loading: false
        });
        this.setState({receive_address});
    }

    requestDepositAddressLoad() {
        this.setState({
            loading: true,
            emptyAddressDeposit: false
        });
        requestDepositAddress(this._getDepositObject());
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

    render() {
        const isDeposit = this.props.action === "deposit";
        let emptyRow = <LoadingIndicator />;
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

        let receive_address = this.state.receive_address;
        let {emptyAddressDeposit} = this.state;
        let indicatorButtonAddr = this.state.loading;

        if (!receive_address) {
            return (
                <div style={{margin: "3rem"}}>
                    <LoadingIndicator type="three-bounce" />
                </div>
            );
        }

        let withdraw_modal_id = this.getWithdrawModalId();
        let deposit_address_fragment = null;
        let deposit_memo = null;

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
            (isDeposit && !this.props.deposit_account && !receive_address) ||
                (receive_address && receive_address.address === "unknown")
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
                                            <Translate content="gateway.balance" />
                                            :
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
                            />
                            :
                        </label>
                        <label className="fz_12 left-label">
                            <Translate content="gateway.deposit_notice_delay" />
                        </label>
                        <div>
                            {emptyAddressDeposit ? (
                                <Translate content="gateway.please_generate_address" />
                            ) : (
                                <DisableCopyText
                                    replaceCopyText={counterpart.translate(
                                        "gateway.use_copy_button"
                                    )}
                                >
                                    deposit_address_fragment
                                </DisableCopyText>
                            )}
                            <div>
                                {deposit_memo && (
                                    <span>
                                        <DisableCopyText
                                            replaceCopyText={counterpart.translate(
                                                "gateway.use_copy_button"
                                            )}
                                        >
                                            memo: {deposit_memo}
                                        </DisableCopyText>
                                    </span>
                                )}
                            </div>
                            <div
                                className="button-group"
                                style={{paddingTop: 10}}
                            >
                                {deposit_address_fragment ? (
                                    <CopyToClipboard text={clipboardText}>
                                        <div className="button">
                                            <Translate content="gateway.copy_address" />
                                            cidatel
                                        </div>
                                    </CopyToClipboard>
                                ) : null}
                                {memoText ? (
                                    <CopyToClipboard text={memoText}>
                                        <div className="button">
                                            <Translate content="gateway.copy_memo" />
                                        </div>
                                    </CopyToClipboard>
                                ) : null}
                                <button
                                    className={"button spinner-button-circle"}
                                    onClick={this.requestDepositAddressLoad.bind(
                                        this
                                    )}
                                >
                                    {indicatorButtonAddr ? (
                                        <LoadingIndicator type="circle" />
                                    ) : null}
                                    <Translate content="gateway.generate_new" />
                                </button>
                            </div>
                            <Translate
                                className="has-error fz_14"
                                component="p"
                                content="gateway.min_deposit_warning_amount"
                                minDeposit={this.props.gateFee * 2}
                                coin={this.props.deposit_asset}
                            />
                            <Translate
                                className="has-error fz_14"
                                component="p"
                                content="gateway.min_deposit_warning_asset"
                                minDeposit={this.props.gateFee * 2}
                                coin={this.props.deposit_asset}
                            />
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
                                            <Translate content="gateway.balance" />
                                            :
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
                            />
                            :
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
                    <Modal
                        onCancel={this.hideModal}
                        title={counterpart.translate("gateway.withdraw_coin", {
                            coin: this.props.deposit_asset_name,
                            symbol: this.props.deposit_asset
                        })}
                        footer={null}
                        visible={this.state.isModalVisible}
                        id={withdraw_modal_id}
                        overlay={true}
                    >
                        <WithdrawModalCitadel
                            account={this.props.account.get("name")}
                            issuer={this.props.issuer_account.get("name")}
                            asset={this.props.receive_asset.get("symbol")}
                            url={this.state.url}
                            output_coin_name={this.props.deposit_asset_name}
                            gateFee={gateFee}
                            output_coin_symbol={this.props.deposit_asset}
                            output_coin_type={this.props.deposit_coin_type}
                            output_wallet_type={this.props.deposit_wallet_type}
                            output_supports_memos={
                                this.props.supports_output_memos
                            }
                            memo_prefix={withdraw_memo_prefix}
                            modal_id={withdraw_modal_id}
                            balance={
                                this.props.account.get("balances").toJS()[
                                    this.props.receive_asset.get("id")
                                ]
                            }
                        />
                    </Modal>
                </div>
            );
        }
    }
}

export default BindToChainState(CitadelGatewayDepositRequest);
