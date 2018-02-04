import React from "react";
import BindToChainState from "components/Utility/BindToChainState";
import Translate from "react-translate-component";
import LoadingIndicator from "../../LoadingIndicator";
import AssetName from "../../Utility/AssetName";
import LinkToAccountById from "../../Utility/LinkToAccountById";
import AccountBalance from "../../Account/AccountBalance";
import BaseModal from "../../Modal/BaseModal";
import ChainTypes from "../../Utility/ChainTypes";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import BalanceComponent from "../../Utility/BalanceComponent";
import GdexCache from "../../../lib/common/GdexCache";
import {requestDepositAddress} from "../../../lib/common/gdexMethods";
import QRCode from "qrcode.react";
import GdexWithdrawModal from "./GdexWithdrawModal";
import counterpart from "counterpart";

class GdexGatewayInfo extends React.Component {
    static propTypes = {
        // inner_asset_name:               React.PropTypes.string,
        // outer_asset_name:           React.PropTypes.string,
        account: ChainTypes.ChainAccount,
        issuer_account: ChainTypes.ChainAccount,
        gateway: React.PropTypes.string,
        btsCoin: ChainTypes.ChainAsset,
        memo_rule: React.PropTypes.string
    };

    static defaultProps = {
        autosubscribe: false
    };

    constructor(){
        super();
        this.state = {
            receive_address: null,
            isAvailable:true
        };
        this.deposit_address_cache = new GdexCache();
        this._copy = this._copy.bind(this);
        document.addEventListener("copy", this._copy);
    }

    getDepositAddress(){
        this._getDepositAddress(this.props.user_id, this.props.account.get("name"), this.props.coin, this.props.action);
    }

    _getDepositAddress(user_id, user_name, coin, action){
        // The coin can only support withdraw sometime, no need to call get deposit address
        if(action != "deposit") return;

        let cached_receive_address = this.deposit_address_cache.getCachedInputAddress(user_name, coin.outerSymbol, coin.innerSymbol);
        if(cached_receive_address && cached_receive_address!=this.state.receive_address) {
            this.setState({"receive_address":cached_receive_address});
            return;
        }
        // Get address from server side
        var _this = this;
        requestDepositAddress({
            btsAssetId: coin.innerAssetId,
            outAssetId: coin.outerAssetId,
            uid: user_id,
            userAccount: user_name
        }).then(data =>{
            if(data.address && data.address.address){
                var receive_address = {"address":data.address.address,"memo":null};
                _this.deposit_address_cache.cacheInputAddress(user_name, coin.outerSymbol, coin.innerSymbol, receive_address.address, "");
                _this.setState({"receive_address":receive_address});
            } else{
            }
        }).catch(err =>{
            _this.setState({"receive_address":null});
            console.log(err);
        });
    }

    componentWillMount(){
        this.getDepositAddress();
    }

    componentWillReceiveProps(np) {
        if (np.user_id !== this.props.user_id || np.action!==this.props.action || np.coin != this.props.coin ) {
            this._getDepositAddress(np.user_id, np.account.get("name"), np.coin, np.action);
        }
    }

    componentWillUnmount() {
        document.removeEventListener("copy", this._copy);
    }

    getWithdrawModalId() {
        return "withdraw_asset_"+this.props.issuer_account.get("name") + "_"+this.props.coin.innerSymbol;
    }

    onWithdraw() {
        ZfApi.publish(this.getWithdrawModalId(), "open");
    }

    _copy(e) {
        try {
            if (this.state.clipboardText)
                e.clipboardData.setData("text/plain", this.state.clipboardText);
            else
                e.clipboardData.setData("text/plain", counterpart.translate("gateway.use_copy_button").toUpperCase());
            e.preventDefault();
        } catch(err) {
            console.error(err);
        }
    }

    toClipboard(clipboardText) {
        try {
            this.setState({clipboardText}, () => {
                document.execCommand("copy");
            });
        } catch(err) {
            console.error(err);
        }
    }

    render() {
        let emptyRow = <div style={{display:"none", minHeight: 150}}></div>;
        if( !this.props.account || !this.props.issuer_account || !this.props.coin )
            return emptyRow;
        const { coin, btsCoin } = this.props;
        // asset is not loaded
        if(!btsCoin) return emptyRow;
        let receive_address = this.state.receive_address;
        let withdraw_modal_id = this.getWithdrawModalId();
        let deposit_address_fragment = null;
        let clipboardText = "";

        var withdraw_memo_prefix = coin.outerSymbol + ":";
        if (this.props.action === "deposit")
        {
            if(receive_address){
                deposit_address_fragment = (<span>{receive_address.address}</span>);
                clipboardText = receive_address.address;
            }
            withdraw_memo_prefix = "";
        }
        let balance = null;
        let account_balances_object = this.props.account.get("balances");

        if(account_balances_object) balance = account_balances_object.toJS()[btsCoin.get("id")];

        if (this.props.action === "deposit") {
            return (
                <div className="Blocktrades__gateway grid-block no-padding no-margin">
                    <div className="small-12 medium-5">
                        <Translate component="h4" content="gateway.deposit_summary" />
                        <div className="small-12 medium-10">
                            <table className="table">
                                <tbody>
                                <tr>
                                    <Translate component="td" content="gateway.asset_to_deposit" />
                                    <td style={{fontWeight: "bold", color: "#049cce", textAlign: "right"}}>{coin.outerSymbol}</td>
                                </tr>
                                <tr>
                                    <Translate component="td" content="gateway.asset_to_receive" />
                                    <td style={{fontWeight: "bold", color: "#049cce", textAlign: "right"}}><AssetName name={coin.innerSymbol} replace={false} /></td>
                                </tr>
                                <tr>
                                    <Translate component="td" content="gateway.intermediate" />
                                    <td style={{fontWeight: "bold", color: "#049cce", textAlign: "right"}}><LinkToAccountById account={this.props.issuer_account.get("id")} /></td>
                                </tr>
                                <tr>
                                    <Translate component="td" content="gateway.your_account" />
                                    <td style={{fontWeight: "bold", color: "#049cce", textAlign: "right"}}><LinkToAccountById account={this.props.account.get("id")} /></td>
                                </tr>
                                <tr>
                                    <td><Translate content="gateway.balance" />:</td>
                                    <td style={{fontWeight: "bold", color: "#049cce", textAlign: "right"}}>
                                        <AccountBalance
                                            account={this.props.account.get("name")}
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
                        <Translate component="h4" content="gateway.deposit_inst" />
                        <label className="left-label"><Translate content="gateway.deposit_to" asset={coin.outerSymbol} />:</label>
                        <p style={{color:"red"}}><Translate content="gateway.deposit_warning" asset={coin.outerSymbol} /></p>

                        <div style={{padding: "10px 0", fontSize: "1.1rem", fontWeight: "bold"}}>
                                {deposit_address_fragment}
                            <div className="small-12 medium-5" style={{paddingTop: "10px"}}>
                                {receive_address ?<QRCode size={120} value={receive_address.address} />: null}
                            </div>
                            <div className="button-group" style={{paddingTop: 10}}>
                                {deposit_address_fragment && receive_address ? <div className="button" onClick={this.toClipboard.bind(this, clipboardText)}>Copy address</div>
                                    : <div className="button" onClick={this.getDepositAddress.bind(this)}>Refresh</div>}
                                {/*{memoText ? <div className="button" onClick={this.toClipboard.bind(this, memoText)}>Copy memo</div> : null}*/}
                            </div>
                        </div>
                    </div>
                </div>
            );
        } else {
            return (
                <div className="Blocktrades__gateway grid-block no-padding no-margin">
                    <div className="small-12 medium-5">
                        <Translate component="h4" content="gateway.withdraw_summary" />
                        <div className="small-12 medium-10">
                            <table className="table">
                                <tbody>
                                <tr>
                                    <Translate component="td" content="gateway.asset_to_withdraw" />
                                    <td style={{fontWeight: "bold", color: "#049cce", textAlign: "right"}}><AssetName name={coin.innerSymbol} replace={false} /></td>
                                </tr>
                                <tr>
                                    <Translate component="td" content="gateway.asset_to_receive" />
                                    <td style={{fontWeight: "bold", color: "#049cce", textAlign: "right"}}>{coin.outerSymbol}</td>
                                </tr>
                                <tr>
                                    <Translate component="td" content="gateway.intermediate" />
                                    <td style={{fontWeight: "bold", color: "#049cce", textAlign: "right"}}><LinkToAccountById account={this.props.issuer_account.get("id")} /></td>
                                </tr>
                                <tr>
                                    <td><Translate content="gateway.balance" />:</td>
                                    <td style={{fontWeight: "bold", color: "#049cce", textAlign: "right"}}>
                                        <AccountBalance
                                            account={this.props.account.get("name")}
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
                        <Translate component="h4" content="gateway.withdraw_inst" />
                        <label className="left-label"><Translate content="gateway.withdraw_to" asset={this.props.deposit_asset} />:</label>
                        <div className="button-group" style={{paddingTop: 20}}>
                            <button className="button success" style={{fontSize: "1.3rem"}} onClick={this.onWithdraw.bind(this)}><Translate content="gateway.withdraw_now" /> </button>
                        </div>
                    </div>
                    <BaseModal id={withdraw_modal_id} overlay={true}>
                        <br/>
                        <div className="grid-block vertical">
                            <GdexWithdrawModal
                                account={this.props.account.get("name")}
                                issuer={this.props.issuer_account.get("name")}
                                asset={coin.innerSymbol}
                                output_coin_name={coin.outerAssetName}
                                gateFee={coin.gateFee}
                                output_coin_id = {coin.outerAssetId}
                                output_coin_symbol={coin.outerSymbol}
                                output_supports_memos={coin.needMemo==1}
                                minWithdrawAmount = {coin.minTransactionAmount}
                                output_coin_precision = {coin.relationPrecision}
                                memo_prefix={withdraw_memo_prefix}
                                memo_rule={this.props.memo_rule}
                                modal_id={withdraw_modal_id}
                                balance={balance} />
                        </div>
                    </BaseModal>
                </div>
            );
        }
    }

}


export default BindToChainState(GdexGatewayInfo, {keep_updating:true});