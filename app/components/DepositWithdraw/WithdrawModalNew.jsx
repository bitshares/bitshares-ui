import React from "react";
import BindToChainState from "components/Utility/BindToChainState";
import BaseModal from "components/Modal/BaseModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import DepositWithdrawAssetSelector from "./DepositWithdrawAssetSelector";
import Translate from "react-translate-component";
import ExchangeInput from "components/Exchange/ExchangeInput";
import _ from "lodash";
import {BalanceValueComponent} from "../Utility/EquivalentValueComponent";
import { convertValueToPriceInPreferredCurrency } from "../Utility/TotalBalanceValue";
import GatewayStore from "stores/GatewayStore";
import GatewayActions from "actions/GatewayActions";
import AssetStore from "stores/AssetStore";
import AssetActions from "actions/AssetActions";
import MarketsStore from "stores/MarketsStore";
import MarketsActions from "actions/MarketsActions";
import { connect } from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import Immutable from "immutable";
import { Asset, Price } from "common/MarketClasses";
import utils from "common/utils";
import { equivalentPrice } from "../Utility/EquivalentPrice";
import BalanceWrapper from "../Account/BalanceWrapper";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import ChainTypes from "../Utility/ChainTypes";
import BalanceComponent from "../Utility/BalanceComponent";

window.action = AccountActions;

class WithdrawModalNew extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            symbol: "",
            gateway: "",
            fee: 0,
            gateway_fee: 0,
            quantity: 0,
            address: "",
            memo: "",
            loadedFromAsset: "",
            loadedToAsset: "",
            userEstimate: null
        }
    }

    shouldComponentUpdate(np, ns){
        const s = this.state;
        const p = this.props;

        if(
            !np.assets.equals(p.assets) ||
            !np.balances.equals(p.balances) ||
            !Immutable.fromJS(ns).equals(Immutable.fromJS(s))      
        ) return true;

        return false;
    }

    componentDidMount(){
        ZfApi.publish("withdrawModal", "open");
    }

    componentDidUpdate(){
        let { preferredCurrency } = this.props;
        let { symbol, gateway, quantity, loadedFromAsset, loadedToAsset } = this.state;
        let fullSymbol = gateway + "." + symbol;

        if(symbol && loadedFromAsset != fullSymbol){
            this.setState({loadedFromAsset: fullSymbol});
            AssetActions.getAssetList(fullSymbol, 1);
        }

        if(preferredCurrency && symbol && loadedToAsset != preferredCurrency){
            this.setState({loadedToAsset: preferredCurrency});
            AssetActions.getAssetList(preferredCurrency, 1);                
        }
    }

    componentWillUpdate(nextProps, nextState){
        const { preferredCurrency, assets } = nextProps;
        const { symbol, quantity, gateway } = nextState;

        if(preferredCurrency && symbol && quantity){
            if(preferredCurrency == this.props.preferredCurrency && symbol == this.state.symbol && quantity == this.state.quantity) return;
            let toAsset = null;
            let fromAsset = null;      
            let fullFromAssetSymbol = gateway+"."+symbol;

            assets.forEach((item)=>{
                item = item.get ? item : Immutable.fromJS(item);
                if(item.get("symbol") == preferredCurrency) toAsset = item;
                if(item.get("symbol") == fullFromAssetSymbol) fromAsset = item;
            })

            if(fromAsset && toAsset){
                if(toAsset.get("precision") != fromAsset.get("precision")) toAsset = toAsset.set("precision", fromAsset.get("precision"));

                MarketsActions.getMarketStats(toAsset, fromAsset, true);
            }
        }
    }

    onAssetSelected(value){
        try{
            let s = value.split(".")
            if(s.length == 1){
               this.setState({gateway: null, symbol: s[0], userEstimate: null});
            } else {
                this.setState({gateway: s[0], symbol: s[1], userEstimate: null});
            }
        } catch(e){}
    }

    onAssetChanged(value){
        if(!value){
            this.setState({gateway: ""});
        }
    }

    onGatewayChanged(){

    }

    onQuantityChanged(e){
        this.setState({quantity: e.target.value});
    }

    onEstimateChanged(e){
        this.setState({userEstimate: e.target.value});
    }

    onAddressChanged(){

    }

    onMemoChanged(){

    }

    onClickAvailableBalance(available){
        this.setState({quantity: available});
    }

    render() {
        const { state, props } = this;
        let { preferredCurrency, assets, marketStats, balances } = props;
        let { symbol, quantity, loadedFromAsset, loadedToAsset, gateway, userEstimate } = this.state;
        let estimatedValue = 0;
        let coreAsset = null;
        let withdrawalCurrencyId = null;
        let withdrawalCurrencyBalance = 0;
        let withdrawalCurrencyBalanceId = null;
        let withdrawalCurrencyPrecision = null;
        let fullSymbol = gateway + "." + symbol;

        assets.forEach((item)=>{
            if(item.symbol == fullSymbol) withdrawalCurrencyId = item.id;
        });

        if(balances && withdrawalCurrencyId){
            balances.forEach((balance)=>{
                if(balance && balance.toJS){
                    if(balance.get("asset_type") == withdrawalCurrencyId){
                        withdrawalCurrencyBalanceId = balance.get("id");
                        withdrawalCurrencyBalance = balance.get("balance");
                    }
                }
            });
        }

        if(preferredCurrency && symbol){
            let toAsset = null;
            let fromAsset = null;      

            assets.forEach((item)=>{
                item = item.get ? item : Immutable.fromJS(item);
                if(item.get("id") == "1.3.0") coreAsset = item;
                if(item.get("symbol") == preferredCurrency) toAsset = item;
                if(item.get("symbol") == gateway+"."+symbol){
                  fromAsset = item;
                  withdrawalCurrencyPrecision = item.get("precision");
                }
            })

            if(quantity && fromAsset && toAsset){
              estimatedValue = quantity * equivalentPrice(coreAsset, fromAsset, toAsset, marketStats, true);
            }
        }

        let convertedBalance = null;
        if(withdrawalCurrencyBalance && withdrawalCurrencyPrecision){
            let l = String(withdrawalCurrencyBalance).length;
            let decimalPart = String(withdrawalCurrencyBalance).substr(0, l-withdrawalCurrencyPrecision);
            let mantissa = String(withdrawalCurrencyBalance).substr(l-withdrawalCurrencyPrecision);
            convertedBalance = Number(decimalPart + "." + mantissa);
        }

        console.log('convertedBalance', convertedBalance, 'quantity', quantity, 'estimatedValue', estimatedValue);
        let canCoverWithdrawal = convertedBalance ? convertedBalance >= quantity : true;

        let halfWidth = {width: "50%", float: "left", boxSizing: "border-box"}
        let leftColumn = _.extend({paddingRight: "0.5em"}, halfWidth);
        let rightColumn = _.extend({paddingLeft: "0.5em"}, halfWidth);
        let buttonStyle = {width: "100%"}

        return <BaseModal id="withdrawModal">
          <DepositWithdrawAssetSelector onSelect={this.onAssetSelected.bind(this)} onChange={this.onAssetChanged.bind(this)} />
          {symbol == "BTS" || !symbol ? null : <div>
            <label className="left-label"><Translate content="gateway.gateway" /></label>
            <input type="text" value={state.gateway ? (state.gateway == "OPEN" ? "OPENLEDGER" : state.gateway): ""} disabled="true" onChange={()=>{}} />
          </div>}
          <div>
            {(loadedToAsset && preferredCurrency) ? <div style={{fontSize: "0.8em", position: "absolute", right: "1.25em"}}>
              <Translate content="modal.withdraw.available" />
              <span style={{color: canCoverWithdrawal ? null : "red", cursor: "pointer", textDecoration: "underline"}} onClick={this.onClickAvailableBalance.bind(this, convertedBalance)}>
                  <BalanceComponent balance={withdrawalCurrencyBalanceId} />
              </span>
            </div> : null}
            <label className="left-label">
              <Translate content="modal.withdraw.quantity" />
            </label>
            <input type="text" value={state.quantity} onChange={this.onQuantityChanged.bind(this)} />
          </div>
          <div>
            <label className="left-label"><Translate content="modal.withdraw.estimated_value" /> ({preferredCurrency})</label>
            <input type="text" value={userEstimate != null ? userEstimate : estimatedValue} onChange={this.onEstimateChanged.bind(this)} />
          </div>
          <div>
            <label className="left-label"><Translate content="modal.withdraw.address" /></label>
            <input type="text" value={state.address} onChange={this.onAddressChanged.bind(this)} />
          </div>
          <div>
            <label className="left-label"><Translate content="modal.withdraw.memo" /></label>
            <input type="text" value={state.memo} onChange={this.onMemoChanged.bind(this)} />
          </div>
          <div>
            <div style={leftColumn}>
              <div>
                <label className="left-label"><Translate content="modal.withdraw.fee" /></label>
                <input type="text" value={state.fee} ref="fee" />
              </div>
            </div>
            <div style={rightColumn}>
              <div>
                <label className="left-label"><Translate content="modal.withdraw.gateway_fee" /></label>
                <input type="text" value={state.gateway_fee} ref="gateway_fee" />
              </div>
            </div>
          </div>
          <div>
            <div style={leftColumn}>
              <button style={buttonStyle} className="button danger"><Translate content="modal.withdraw.cancel" /></button>
            </div>
            <div style={rightColumn}>
              <button style={buttonStyle} className="button"><Translate content="modal.withdraw.withdraw" /></button>
            </div>
          </div>
        </BaseModal>
    }
};

const ConnectedWithdrawModal = connect(WithdrawModalNew, {
    listenTo() {
        return [GatewayStore, AssetStore, SettingsStore, MarketsStore];
    },
    getProps() {
        return {
            openLedgerBackedCoins: GatewayStore.getState().backedCoins.get("OPEN", []),
            rudexBackedCoins: GatewayStore.getState().backedCoins.get("RUDEX", []),
            blockTradesBackedCoins: GatewayStore.getState().backedCoins.get("TRADE", []),
            assets: AssetStore.getState().assets,
            preferredCurrency: SettingsStore.getSetting("unit"),
            marketStats: MarketsStore.getState().allMarketStats,
        };
    }
});

class WithdrawModalWrapper extends React.Component {
    static propTypes = {
        account: ChainTypes.ChainAccount.isRequired
    };

    static defaultProps = {
        account: ""
    };

    render(){
      const { props } = this;
      console.log("balances", props.account.get("balances"));
      return <BalanceWrapper wrap={ConnectedWithdrawModal} {...props} balances={props.account.get("balances")} />
    }
}

const ConnectedWrapper = connect(BindToChainState(WithdrawModalWrapper, {}), {
    listenTo() {
        return [AccountStore];
    },
    getProps() {
        return {
            account: AccountStore.getState().currentAccount
        };
    }
});

export default ConnectedWrapper;
