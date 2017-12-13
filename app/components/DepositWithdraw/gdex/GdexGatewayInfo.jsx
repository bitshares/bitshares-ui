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
import BlockTradesDepositAddressCache from "../../../lib/common/BlockTradesDepositAddressCache";
import {requestDepositAddress} from "../../../lib/common/gdexMethods";
import QRCode from "qrcode.react";
import GdexWithdrawModal from "./GdexWithdrawModal";

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
        this.deposit_address_cache = new BlockTradesDepositAddressCache();
        this._copy = this._copy.bind(this);
        document.addEventListener("copy", this._copy);
    }

    _requestDepositAddress(user_id = null ,user_name = null){
        if(this.props.action != "deposit"){
            this.setState({"receive_address":null});
            return;
        }

        if (!user_id) user_id = this.props.user_id;
        if (!user_name) user_name = this.props.account.get("name");
        var _this = this;
        requestDepositAddress({
            btsAssetId: this.props.coin.innerAssetId,
            outAssetId: this.props.coin.outerAssetId,
            uid: user_id,
            userAccount: user_name
        }).then(data =>{
            if(data.address && data.address.address){
                var receive_address = {"address":data.address.address,"memo":null};
                _this.deposit_address_cache.cacheInputAddress(_this.props.gateway, user_name, _this.props.coin.outerSymbol, _this.props.coin.innerSymbol, receive_address.address, "");
                _this.setState({"receive_address":receive_address});
            } else{
            }
        }).catch(err =>{
            console.log(err);
        });
    }

    componentWillMount() {
        this._updateDepositAddress();
    }

    componentWillReceiveProps(np) {
        if (np.user_id !== this.props.user_id) {
            this._updateDepositAddress(np.user_id, np.account.get("name"));
        }
    }

    _updateDepositAddress(user_id=null, user_name=null){
        var changeAccount = true
        if(!user_id) {
            user_id =this.props.user_id;
            changeAccount = false;
        }
        if(!user_name){
            user_name = this.props.account.get("name");
            changeAccount = false;
        }
        let receive_address = this.state.receive_address;
        if( !receive_address || changeAccount)  {
            let account_name = user_name;
            receive_address = this.deposit_address_cache.getCachedInputAddress(this.props.gateway, account_name, this.props.coin.outerSymbol, this.props.coin.innerSymbol);
            if(receive_address){
                this.setState({"receive_address":receive_address});
            } else{
                this._requestDepositAddress(user_id, user_name);
            }
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
            e.clipboardData.setData("text/plain", this.state.clipboardText);
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
        let account_balances_object = this.props.account.get("balances");
        const { coin } = this.props;
        var balance = "0 " + this.props.coin.assetName;
        let account_balances = account_balances_object.toJS();
        let asset_types = Object.keys(account_balances);
        if (asset_types.length > 0) {
            let current_asset_id = this.props.btsCoin.get("id");
            if( current_asset_id )
            {
                balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>);
            }
        }
        let receive_address = this.state.receive_address;
        let withdraw_modal_id = this.getWithdrawModalId();
        let deposit_address_fragment = null;
        let clipboardText = "";

        var withdraw_memo_prefix = this.props.coin.outerSymbol + ":";
        if (this.props.action === "deposit")
        {
            if(receive_address){
                deposit_address_fragment = (<span>{receive_address.address}</span>);
                clipboardText = receive_address.address;
            }
            withdraw_memo_prefix = "";
        }
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
                                    <td style={{fontWeight: "bold", color: "#4A90E2", textAlign: "right"}}>{this.props.coin.outerSymbol}</td>
                                </tr>
                                <tr>
                                    <Translate component="td" content="gateway.asset_to_receive" />
                                    <td style={{fontWeight: "bold", color: "#4A90E2", textAlign: "right"}}><AssetName name={this.props.coin.innerSymbol} replace={false} /></td>
                                </tr>
                                <tr>
                                    <Translate component="td" content="gateway.intermediate" />
                                    <td style={{fontWeight: "bold", color: "#4A90E2", textAlign: "right"}}><LinkToAccountById account={this.props.issuer_account.get("id")} /></td>
                                </tr>
                                <tr>
                                    <Translate component="td" content="gateway.your_account" />
                                    <td style={{fontWeight: "bold", color: "#4A90E2", textAlign: "right"}}><LinkToAccountById account={this.props.account.get("id")} /></td>
                                </tr>
                                <tr>
                                    <td><Translate content="gateway.balance" />:</td>
                                    <td style={{fontWeight: "bold", color: "#4A90E2", textAlign: "right"}}>
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
                        <label className="left-label"><Translate content="gateway.deposit_to" asset={this.props.coin.outerSymbol} />:</label>
                        <p style={{color:"red"}}><Translate content="gateway.deposit_warning" asset={this.props.coin.outerSymbol} /></p>

                        <div style={{padding: "10px 0", fontSize: "1.1rem", fontWeight: "bold"}}>
                                {deposit_address_fragment}
                            <div className="small-12 medium-5" style={{paddingTop: "10px"}}>
                                {receive_address ?<QRCode size={120} value={receive_address.address} />: null}
                            </div>
                            <div className="button-group" style={{paddingTop: 10}}>
                                {deposit_address_fragment && receive_address ? <div className="button" onClick={this.toClipboard.bind(this, clipboardText)}>Copy address</div>
                                    : <div className="button" onClick={this._requestDepositAddress()}>Refresh</div>}
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
                                    <td style={{fontWeight: "bold", color: "#4A90E2", textAlign: "right"}}><AssetName name={this.props.coin.innerSymbol} replace={false} /></td>
                                </tr>
                                <tr>
                                    <Translate component="td" content="gateway.asset_to_receive" />
                                    <td style={{fontWeight: "bold", color: "#4A90E2", textAlign: "right"}}>{this.props.coin.outerSymbol}</td>
                                </tr>
                                <tr>
                                    <Translate component="td" content="gateway.intermediate" />
                                    <td style={{fontWeight: "bold", color: "#4A90E2", textAlign: "right"}}><LinkToAccountById account={this.props.issuer_account.get("id")} /></td>
                                </tr>
                                <tr>
                                    <td><Translate content="gateway.balance" />:</td>
                                    <td style={{fontWeight: "bold", color: "#4A90E2", textAlign: "right"}}>
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
                                output_coin_name={this.props.coin.outerAssetName}
                                gateFee={coin.gateFee}
                                output_coin_id = {coin.outerAssetId}
                                output_coin_symbol={coin.outerSymbol}
                                output_supports_memos={coin.needMemo==1}
                                minWithdrawAmount = {coin.minTransactionAmount}
                                memo_prefix={withdraw_memo_prefix}
                                memo_rule={this.props.memo_rule}
                                modal_id={withdraw_modal_id}
                                balance={this.props.account.get("balances").toJS()[this.props.btsCoin.get("id")]} />
                        </div>
                    </BaseModal>
                </div>
            );
        }
    }

}


export default BindToChainState(GdexGatewayInfo, {keep_updating:true});