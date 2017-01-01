import React from "react";
import Post from "common/formPost";
import WithdrawModalMetaexchange from "./WithdrawModalMetaexchange";
import DepositModalMetaexchange from "./DepositModalMetaexchange";
import Modal from "react-foundation-apps/src/modal";
import Trigger from "react-foundation-apps/src/trigger";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import AccountBalance from "../../Account/AccountBalance";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import Translate from "react-translate-component";
import WalletDb from "stores/WalletDb";

class MetaexchangeDepositRequest extends React.Component {
    static propTypes = {
        gateway:                React.PropTypes.string,
        symbol_pair:            React.PropTypes.string,
        deposit_asset_name:     React.PropTypes.string,
        account:                ChainTypes.ChainAccount,
        issuer_account:         ChainTypes.ChainAccount,
        deposit_asset:          React.PropTypes.string,
        is_bts_deposit:         React.PropTypes.string,
        receive_asset:          ChainTypes.ChainAsset
    };

    constructor(props)
    {
        super(props);

        let parts = props.symbol_pair.split('_');

        this.state = {
            deposit_address: null,
            memo:null,
            base_symbol:parts[0],
            quote_symbol:parts[1]
        };
        this.apiRoot = "https://metaexchange.info/api";
        this.marketPath = "https://metaexchange.info/markets/";
        //this.apiRoot = "http://localhost:1235/api";
        //this.marketPath = "http://localhost:1235/markets/";
    }

    getDepositAddress()
    {
        Post.PostForm(this.apiRoot + '/1/submitAddress', {
                    receiving_address:this.props.account.get('name'),
                    order_type:'buy',
                    symbol_pair:this.props.symbol_pair
                }).then( reply=>reply.json().then(reply=>
                {
                    //console.log(reply);

                    this.setState( {deposit_address:reply.deposit_address, memo:reply.memo} );

                    let wallet = WalletDb.getWallet();
                    let name = this.props.account.get('name');

                    if( !wallet.deposit_keys ) wallet.deposit_keys = {}
                    if( !wallet.deposit_keys[this.props.gateway] )
                        wallet.deposit_keys[this.props.gateway] = {}
                    if( !wallet.deposit_keys[this.props.gateway][this.state.base_symbol] )
                        wallet.deposit_keys[this.props.gateway][this.state.base_symbol] = {}
                    else
                        wallet.deposit_keys[this.props.gateway][this.state.base_symbol][name] = reply

                    WalletDb._updateWallet();
                }));
    }

    getWithdrawModalId() {
        return "withdraw" + this.getModalId();
    }

    getDepositModalId() {
        return "deposit" + this.getModalId();
    }

    getModalId() {
        return "_asset_"+this.props.issuer_account.get('name') + "_"+this.props.receive_asset.get('symbol');
    }

    onWithdraw() {
        ZfApi.publish(this.getWithdrawModalId(), "open");
    }

    onDeposit() {
        ZfApi.publish(this.getDepositModalId(), "open");
    }

    getMetaLink()
    {
        let wallet = WalletDb.getWallet();
        var withdrawAddr = "";

        try
        {
            withdrawAddr = wallet.deposit_keys[this.props.gateway][this.state.base_symbol]['withdraw_address'];
        }
        catch (Error) {}

        return this.marketPath + this.props.symbol_pair.replace('_','/')+'?receiving_address='+encodeURIComponent(this.props.account.get('name')+','+withdrawAddr);
    }

    render() {
        if( !this.props.account || !this.props.issuer_account || !this.props.receive_asset )
            return <tr><td colSpan="4"></td></tr>;

        let wallet = WalletDb.getWallet();

        if( !this.state.deposit_address )
        {
            try
            {
                let reply = wallet.deposit_keys[this.props.gateway][this.state.base_symbol][this.props.account.get('name')];
                this.state.deposit_address = reply.deposit_address;
                this.state.memo = reply.memo;
            }
            catch (Error) {}
        }
        if( !this.state.deposit_address )
        {
            this.getDepositAddress();
        }

        let withdraw_modal_id = this.getWithdrawModalId();
        let deposit_modal_id = this.getDepositModalId();

        return <tr>
            <td>{this.props.deposit_asset} </td>


            {/*<td> <button className={"button outline"} onClick={this.onDeposit.bind(this)}> <Translate content="gateway.deposit" /> </button>
                <Modal id={deposit_modal_id} overlay={true}>
                    <Trigger close={deposit_modal_id}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <br/>
                    <div className="grid-block vertical">
                        <DepositModalMetaexchange
                            api_root={this.apiRoot}
                            symbol_pair={this.props.symbol_pair}
                            gateway={this.props.gateway}
                            deposit_address={this.state.deposit_address}
                            memo={this.state.memo}
                            is_bts_deposit={this.props.is_bts_deposit}
                            receive_asset_name={this.props.deposit_asset_name}
                            receive_asset_symbol={this.props.deposit_asset}
                            modal_id={deposit_modal_id} />
                    </div>
                </Modal>
            </td>*/}

            <td><button className={"button outline"}><a target="__blank" href={this.getMetaLink()}>Open in metaexchange</a></button></td>

            <td> <AccountBalance account={this.props.account.get('name')} asset={this.state.base_symbol} /> </td>
            <td> <button className={"button outline"} onClick={this.onWithdraw.bind(this)}> <Translate content="gateway.withdraw" /> </button>
                <Modal id={withdraw_modal_id} overlay={true}>
                    <Trigger close={withdraw_modal_id}>
                        <a href="#" className="close-button">&times;</a>
                    </Trigger>
                    <br/>
                    <div className="grid-block vertical">
                        <WithdrawModalMetaexchange
                            api_root={this.apiRoot}
                            gateway={this.props.gateway}
                            order_type='sell'
                            symbol_pair={this.props.symbol_pair}
                            account={this.props.account.get('name')}
                            issuer={this.props.issuer_account.get('name')}
                            is_bts_withdraw={this.props.is_bts_deposit}
                            asset={this.props.receive_asset.get('symbol')}
                            receive_asset_name={this.props.deposit_asset_name}
                            receive_asset_symbol={this.props.deposit_asset}
                            modal_id={withdraw_modal_id} />
                    </div>
                </Modal>
            </td>
        </tr>
    }
};

export default BindToChainState(MetaexchangeDepositRequest, {keep_updating:true});
