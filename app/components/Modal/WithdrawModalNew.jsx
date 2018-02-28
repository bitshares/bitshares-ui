import React from "react";
import BindToChainState from "components/Utility/BindToChainState";
import BaseModal from "components/Modal/BaseModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import DepositWithdrawAssetSelector from "../DepositWithdraw/DepositWithdrawAssetSelector";
import Translate from "react-translate-component";
import ExchangeInput from "components/Exchange/ExchangeInput";
import _ from "lodash";
import GatewayStore from "stores/GatewayStore";
import AssetStore from "stores/AssetStore";
import AssetActions from "actions/AssetActions";
import MarketsStore from "stores/MarketsStore";
import MarketsActions from "actions/MarketsActions";
import { connect } from "alt-react";
import SettingsStore from "stores/SettingsStore";
import Immutable from "immutable";
import { Asset, Price } from "common/MarketClasses";
import utils from "common/utils";
import { equivalentPrice } from "../Utility/EquivalentPrice";
import BalanceWrapper from "../Account/BalanceWrapper";
import AccountActions from "actions/AccountActions";
import AccountStore from "stores/AccountStore";
import ChainTypes from "../Utility/ChainTypes";
import BalanceComponent from "../Utility/BalanceComponent";
import { _getAvailableGateways, gatewaySelector, _getNumberAvailableGateways, _onAssetSelected, _getCoinToGatewayMapping } from "lib/common/assetGatewayMixin";
import { validateAddress as blocktradesValidateAddress, WithdrawAddresses } from "lib/common/blockTradesMethods";
import { blockTradesAPIs } from "api/apiConfig";
import AmountSelector from "components/Utility/AmountSelector";
import { checkFeeStatusAsync, checkBalance } from "common/trxHelper";
import AccountSelector from "components/Account/AccountSelector";
import {ChainStore} from "bitsharesjs/es";
const logo = require("assets/logo-ico-blue.png");
const gatewayBoolCheck = "withdrawalAllowed";

var renders = 0;
class WithdrawModalNew extends React.Component {
    constructor(props){
        super(props);

        this.state = {
            selectedAsset: "",
            selectedAssetId: "",
            selectedGateway: "",
            fee: 0,
            feeAmount: new Asset({amount: 0}),
            feeStatus: {},
            hasBalance: null,
            hasPoolBalance: null,
            feeError: null,
            fee_asset_id: "1.3.0",
            gateFee: 0,
            issuer: "",
            quantity: 0,
            address: "",
            memo: "",
            userEstimate: null,
            addressError: false,
            gatewayStatus: {
                OPEN: { id: "OPEN", name: "OPENLEDGER", enabled: false, selected: false, support_url: "https://wallet.bitshares.org/#/help/gateways/openledger" },
                RUDEX: { id: "RUDEX", name: "RUDEX", enabled: false, selected: false, support_url: "https://wallet.bitshares.org/#/help/gateways/rudex" }
            },
            withdrawalCurrencyId: "",
            withdrawalCurrencyBalance: null,
            withdrawalCurrencyBalanceId: "",
            withdrawalCurrencyPrecision: "",
            preferredCurrencyPrecision: "",
            precisionDifference: "",
            coreAsset: "",
            convertedBalance: "",
            estimatedValue: "",
            options_is_valid: false,
            btsAccountName: "",
            btsAccount: ""
        }
    }

    componentWillMount(){
        this._checkFeeStatus();
        this._updateFee = _.debounce(this._updateFee.bind(this), 250);
        this._updateFee(this.state);
        let initialState = {};

        let { backedCoins, openLedgerBackedCoins, rudexBackedCoins } = this.props;

        let coinToGatewayMapping = _getCoinToGatewayMapping.call(this, gatewayBoolCheck);
        initialState.coinToGatewayMapping = coinToGatewayMapping;

        if(this.props.initialSymbol){
          initialState = _.extend(initialState, this._getAssetAndGatewayFromInitialSymbol(this.props.initialSymbol));

          initialState.gatewayStatus = _getAvailableGateways.call(this, initialState.selectedAsset, gatewayBoolCheck);
        }

        this.setState(initialState);
    }

    _getAssetAndGatewayFromInitialSymbol(initialSymbol){
        let pieces = initialSymbol.split(".");
        let selectedAsset = pieces[1];
        let selectedGateway = pieces[0];
        let gateFee = 0;

        if(selectedGateway){
          this.props.backedCoins.get(selectedGateway).forEach((item)=>{
            if(item.symbol == [selectedGateway, selectedAsset].join(".") || item.backingCoinType == selectedAsset){
              gateFee = item.gateFee;
            }
          });
        }

        return { selectedAsset, selectedGateway, gateFee };
    }

    shouldComponentUpdate(np, ns){
        const s = this.state;
        const p = this.props;

        if(
            !np.assets.equals(p.assets) ||
            !np.balances.equals(p.balances) ||
            !np.marketStats.equals(p.marketStats) ||
            !Immutable.fromJS(ns).equals(Immutable.fromJS(s))      
        ) return true;

        return false;
    }

    componentWillReceiveProps(np, ns){
        if(np.account != this.props.account){
            this._checkFeeStatus();
            this._updateFee(ns);
        }

        if(np.initialSymbol != this.props.initialSymbol){
          let newState = this._getAssetAndGatewayFromInitialSymbol(np.initialSymbol)
          newState.gatewayStatus = _getAvailableGateways.call(this, newState.selectedAsset, gatewayBoolCheck);
          this.setState(newState);
        }
    }

    componentDidUpdate(){
        let { preferredCurrency } = this.props;
        let { selectedAsset, selectedGateway, quantity  } = this.state;
        let fullSymbol = selectedGateway ? selectedGateway + "." + selectedAsset : selectedAsset;

        this.setState(this._getAssetPairVariables());
    }

    componentWillUpdate(nextProps, nextState){
        const { preferredCurrency, assets } = nextProps;
        const { selectedAsset, quantity, selectedGateway } = nextState;

        if(preferredCurrency && selectedAsset && quantity){
            if(preferredCurrency == this.props.preferredCurrency && selectedAsset == this.state.selectedAsset && quantity == this.state.quantity) return;
            let toAsset = null;
            let fromAsset = null;      
            let fullFromAssetSymbol = selectedGateway+"."+selectedAsset;

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

    _getAssetPairVariables(props, state){
        let { assets, marketStats, balances, preferredCurrency } = props || this.props;
        let { selectedAsset, quantity, selectedGateway, userEstimate, gatewayStatus, addressError, gateFee } = state || this.state; 
        if(isNaN(gateFee)) gateFee = 0;
        quantity = Number(quantity);
        gateFee = Number(gateFee);
        let fullSymbol = selectedGateway ? (selectedGateway + "." + selectedAsset) : selectedAsset;

        let withdrawalCurrencyId = null;
        let withdrawalCurrencyBalance = 0;
        let withdrawalCurrencyBalanceId = null;
        let withdrawalCurrencyPrecision = null;
        let preferredCurrencyPrecision = null;
        let precisionDifference = 0;
        let coreAsset = null;
        let convertedBalance = null;
        let estimatedValue = 0;
        let balancesByAssetAndGateway = {};

        assets.forEach((item)=>{
            if(item.symbol == fullSymbol) withdrawalCurrencyId = item.id;
        });

        if(balances){
          balances.forEach((balance)=>{
            if(balance && balance.toJS){
              if(withdrawalCurrencyId && balance.get("asset_type") == withdrawalCurrencyId){
                  withdrawalCurrencyBalanceId = balance.get("id");
                  withdrawalCurrencyBalance = balance.get("balance");
              }
            }
          });
        }

        if(!withdrawalCurrencyBalance){ //In case does not exist in balances
            withdrawalCurrencyBalance = 0;
        }

        if(preferredCurrency && selectedAsset){
            let toAsset = null;
            let fromAsset = null;      

            assets.forEach((item)=>{
                item = item.get ? item : Immutable.fromJS(item);
                if(item.get("id") == "1.3.0") coreAsset = item;
                if(item.get("symbol") == preferredCurrency){
                    toAsset = item;
                    preferredCurrencyPrecision = item.get("precision");
                }
                if(item.get("symbol") == selectedGateway+"."+selectedAsset){
                    fromAsset = item;
                    withdrawalCurrencyPrecision = item.get("precision");
                } 
                if(item.get("symbol") == selectedAsset){
                    fromAsset = item;
                    withdrawalCurrencyPrecision = item.get("precision");
                }
            })

            if(preferredCurrencyPrecision && withdrawalCurrencyPrecision){
                precisionDifference = withdrawalCurrencyPrecision - preferredCurrencyPrecision;
            }

            if(quantity && fromAsset && toAsset){
              estimatedValue = quantity * equivalentPrice(coreAsset, fromAsset, toAsset, marketStats, true);
              if(precisionDifference > 0){ //Need to compensate for different precisions between currencies
                estimatedValue = estimatedValue * Math.pow(10, precisionDifference); 
              } //No need to compensate for precision difference < 0
            }
        }

        if(Number.isFinite(withdrawalCurrencyBalance) && withdrawalCurrencyPrecision){
            let withdrawalCurrencyBalanceString = String(withdrawalCurrencyBalance);
            let l = withdrawalCurrencyBalanceString.length;

            while(l<withdrawalCurrencyPrecision){ //Zero pad
              withdrawalCurrencyBalanceString = "0" + withdrawalCurrencyBalanceString;
              ++l;
            }

            let decimalPart = withdrawalCurrencyBalanceString.substr(0, l-withdrawalCurrencyPrecision);
            let mantissa = withdrawalCurrencyBalanceString.substr(l-withdrawalCurrencyPrecision);

            if(!decimalPart){
              decimalPart = "0";
              mantissa = withdrawalCurrencyBalanceString;
            }

            convertedBalance = Number(decimalPart + "." + mantissa);
        }


        let nAvailableGateways = _getNumberAvailableGateways.call(this);
        let assetAndGateway = selectedAsset && selectedGateway;   

        let isBTS = false;
        if(coreAsset){
            if(selectedAsset == coreAsset.get("symbol")) isBTS = true;
        } else if(selectedAsset == "BTS"){
            isBTS = true;
        }

        let canCoverWithdrawal = convertedBalance != null ? convertedBalance >= (quantity + gateFee) : true;

        if(isBTS){
            let feeAmount = this.state.feeAmount.getAmount({real: true});
            canCoverWithdrawal = (convertedBalance >= (quantity + feeAmount));
        }

        let { fee_asset_types } = this._getAvailableAssets();

        return { withdrawalCurrencyId, withdrawalCurrencyBalance, withdrawalCurrencyBalanceId, withdrawalCurrencyPrecision, preferredCurrencyPrecision, precisionDifference, coreAsset, convertedBalance, estimatedValue, nAvailableGateways, assetAndGateway, isBTS, canCoverWithdrawal, fee_asset_types }
    }

    _getAvailableAssets(state = this.state) {
      let btsAccount = this.props.account;
        const { feeStatus } = state;
        function hasFeePoolBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasPoolBalance;
        }

        function hasBalance(id) {
            if (feeStatus[id] === undefined) return true;
            return feeStatus[id] && feeStatus[id].hasBalance;
        }

        let fee_asset_types = [];
        if (!(btsAccount && btsAccount.get("balances"))) {
            return {fee_asset_types};
        }
        let account_balances = btsAccount.get("balances").toJS();
        fee_asset_types = Object.keys(account_balances).sort(utils.sortID);
        for (let key in account_balances) {
            let asset = ChainStore.getObject(key);
            let balanceObject = ChainStore.getObject(account_balances[key]);
            if (balanceObject && balanceObject.get("balance") === 0) {
                if (fee_asset_types.indexOf(key) !== -1) {
                    fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                }
            }

            if (asset) {
                // Remove any assets that do not have valid core exchange rates
                let priceIsValid = false, p;
                try {
                    p = new Price({
                        base: new Asset(asset.getIn(["options", "core_exchange_rate", "base"]).toJS()),
                        quote: new Asset(asset.getIn(["options", "core_exchange_rate", "quote"]).toJS())
                    });
                    priceIsValid = p.isValid();
                } catch(err) {
                    priceIsValid = false;
                }

                if (asset.get("id") !== "1.3.0" && !priceIsValid) {
                    fee_asset_types.splice(fee_asset_types.indexOf(key), 1);
                }
            }
        }

        fee_asset_types = fee_asset_types.filter(a => {
            return hasFeePoolBalance(a) && hasBalance(a);
        });

        return {fee_asset_types};
    }

    _checkFeeStatus(state = this.state) {
        let account = this.props.account;
        if (!account) return;

        const { fee_asset_types: assets } = this._getAvailableAssets(state);
        // const assets = ["1.3.0", this.props.asset.get("id")];
        let feeStatus = {};
        let p = [];
        assets.forEach(a => {
            p.push(checkFeeStatusAsync({
                accountID: account.get("id"),
                feeID: a,
                options: ["price_per_kbyte"],
                data: {
                    type: "memo",
                    content: state.selectedAsset.toLowerCase() + ":" + state.address + (state.memo ? ":" + state.memo : "")
                }
            }));
        });
        Promise.all(p).then(status => {
            assets.forEach((a, idx) => {
                feeStatus[a] = status[idx];
            });
            if (!utils.are_equal_shallow(state.feeStatus, feeStatus)) {
                this.setState({
                    feeStatus
                });
            }
        }).catch(err => {
            console.error(err);
        });
    }

    _updateFee(state = this.state) {
        let btsAccount = this.props.account;
        let { fee_asset_id } = state;
        const { fee_asset_types } = this._getAvailableAssets(state);
        if ( fee_asset_types.length === 1 && fee_asset_types[0] !== fee_asset_id) {
            fee_asset_id = fee_asset_types[0];
        }

        if (!btsAccount) return null;
        checkFeeStatusAsync({
            accountID: btsAccount.get("id"),
            feeID: fee_asset_id,
            options: ["price_per_kbyte"],
            data: {
                type: "memo",
                content: this.props.output_coin_type + ":" + state.withdraw_address + (state.memo ? ":" + state.memo : "")
            }
        })
        .then(({fee, hasBalance, hasPoolBalance}) => {
            if (this.unMounted) return;

            this.setState({
                feeAmount: fee,
                hasBalance,
                hasPoolBalance,
                feeError: (!hasBalance || !hasPoolBalance)
            });
        });
    }

    _getStyleHelpers(){
        let halfWidth = {width: "50%", float: "left", boxSizing: "border-box"}
        let leftColumn = _.extend({paddingRight: "0.5em", marginBottom: "1em"}, halfWidth);
        let rightColumn = _.extend({paddingLeft: "0.5em", marginBottom: "1em"}, halfWidth);
        let buttonStyle = {width: "100%"}

        return { halfWidth, leftColumn, rightColumn, buttonStyle }
    }

    _getBindingHelpers(){
        let onFocus = this.onFocusAmount.bind(this);
        let onBlur = this.onBlurAmount.bind(this);

        return { onFocus, onBlur }
    }

    onFeeChanged({asset}) {
        this.setState({
            fee_asset_id: asset.get("id")
        }, this._updateFee);
    }

    onAssetSelected(value, asset){
        let { selectedAsset, selectedGateway } = _onAssetSelected.call(this, value, gatewayBoolCheck);
        let address = WithdrawAddresses.getLast(value.toLowerCase());
        this.setState({selectedAsset, selectedGateway, gateFee: asset.gateFee, issuer: asset.issuer, address, isBTS: false});
    }

    onAssetChanged(value){
        value = value.toUpperCase();

        let stateObj = {};

        if(value == "BTS"){
            stateObj = {isBTS: true};
        }

        if(!value){
            stateObj = {selectedAsset: "", selectedGateway: "", addressError: false, fee: 0, isBTS: false}
        }

        stateObj.estimatedValue = 0;
        stateObj.memo = "";
        stateObj.address = "";

        this.setState(stateObj);
    }

    onGatewayChanged(e){
        let selectedGateway = e.target.value;
        this.setState({selectedGateway});
        this._updateFee();
    }

    onQuantityChanged(e){
        this.setState({quantity: e.target.value});
    }

    onEstimateChanged(e){
        this.setState({userEstimate: e.target.value});
    }

    onFocusAmount(e){
        let { value } = e.target;

        if(String(value) == "0"){
            e.target.value = "";
        }
    }

    onBlurAmount(e){
        let { value } = e.target;

        if(value == ""){
            e.target.value = 0;
        }
    }

    onAddressChanged(e){
        let { value } = e.target;
        this.validateAddress(value);
        this.setState({address: value});
    }

    validateAddress(address){
        blocktradesValidateAddress({
            url: blockTradesAPIs.BASE_OL,
            walletType: this.state.selectedAsset.toLowerCase(),
            newAddress: address 
        }).then((isValid)=>{
            this.setState({addressError: isValid ? false : true});
        });
    }

    onSelectedAddressChanged(address) {
        let { state } = this;
        let { selectedAsset } = state;
        let walletType = selectedAsset.toLowerCase();
        WithdrawAddresses.setLast({wallet: walletType, address});

        this.validateAddress(address);
        this.setState({address});
    }

    onMemoChanged(e){
        this.setState({memo: e.target.value});
        this._updateFee();
    }

    onClickAvailableBalance(available){
        this.setState({quantity: available});
    }

    onDropDownList() {
        let hasAsset = WithdrawAddresses.has(this.state.selectedAsset.toLowerCase());
        if (hasAsset) {
            if(this.state.options_is_valid === false) {
                this.setState({options_is_valid: true});
            }

            if(this.state.options_is_valid === true) {
                this.setState({options_is_valid: false});
            }
        }
    }

    onSubmit(){
        const { props, state } = this;

        const { withdrawalCurrencyId, withdrawalCurrencyBalance, withdrawalCurrencyPrecision, quantity, selectedAsset, address, isBTS } = state;
        let assetName = selectedAsset.toLowerCase();

        if (!WithdrawAddresses.has(assetName)) {
            let withdrawals = [];
            withdrawals.push(address);
            WithdrawAddresses.set({wallet: assetName, addresses: withdrawals});
        } else {
            let withdrawals = WithdrawAddresses.get(assetName);
            if (withdrawals.indexOf(address) == -1) {
                withdrawals.push(address);
                WithdrawAddresses.set({wallet: assetName, addresses: withdrawals});
            }
        }
        WithdrawAddresses.setLast({wallet: assetName, address});

        let sendAmount = new Asset({
            asset_id: withdrawalCurrencyId,
            precision: withdrawalCurrencyPrecision,
            real: quantity
        });

        let balanceAmount = new Asset({
            asset_id: withdrawalCurrencyId,
            precision: withdrawalCurrencyPrecision,
            real: 0
        });
        
        if (withdrawalCurrencyBalance != null) {
            balanceAmount = sendAmount.clone(withdrawalCurrencyBalance);
        }

        const gateFeeAmount = new Asset({
            asset_id: withdrawalCurrencyId,
            precision: withdrawalCurrencyPrecision,
            real: state.gateFee
        });

        sendAmount.plus(gateFeeAmount);

        /* Insufficient balance */
        if (balanceAmount.lt(sendAmount)) {
            sendAmount = balanceAmount;
        }

        let descriptor = "";
        let to = "";

        if(isBTS){
            descriptor = state.memo ? new Buffer(state.memo, "utf-8") : "";
            to = state.btsAccount.get("id");
        } else {
            descriptor = assetName + ":" + address + (this.state.memo ? ":" + new Buffer(this.state.memo, "utf-8") : "");
            to = state.issuer;
        }

        let args = [
            this.props.account.get("id"),
            to,
            sendAmount.getAmount(),
            withdrawalCurrencyId,
            descriptor,
            null,
            state.feeAmount ? state.feeAmount.asset_id : "1.3.0"
        ]

        AccountActions.transfer(...args).then(()=>{
          ZfApi.publish(this.props.modalId, "close");
        });
    }

    onBTSAccountNameChanged(btsAccountName){
        if(!btsAccountName) this.setState({btsAccount: null});
        this.setState({btsAccountName, btsAccountError: null});
    }

    onBTSAccountChanged(btsAccount){
        this.setState({btsAccount, btsAccountError: null});
    }

    _renderStoredAddresses(){
        const { state } = this;
        let { selectedAsset, address } = state;
        let storedAddresses = WithdrawAddresses.get(selectedAsset.toLowerCase());

        if (storedAddresses.length > 1 && state.options_is_valid) {
            return <div className={!storedAddresses.length ? "blocktrades-disabled-options" : "blocktrades-options"}>
                {storedAddresses.filter((item)=>{ return item != address }).map(function(name, index){
                    return <a key={index} onClick={this.onSelectedAddressChanged.bind(this, name)}>{name}</a>;
                }, this)}
            </div>;
        }
    }

    render() {
        const { state, props } = this;
        let { preferredCurrency, assets, marketStats, balances, backedCoins } = props;
        let { selectedAsset, selectedGateway, userEstimate, gatewayStatus, addressError, gateFee, withdrawalCurrencyId, withdrawalCurrencyBalance, withdrawalCurrencyBalanceId, withdrawalCurrencyPrecision, preferredCurrencyPrecision, precisionDifference, coreAsset, convertedBalance, estimatedValue, nAvailableGateways, assetAndGateway, isBTS, canCoverWithdrawal, fee_asset_types, quantity, address, btsAccount, coinToGatewayMapping } = this.state;
        let symbolsToInclude = [];

        balances.forEach((item)=>{
          let id = item.get("asset_type");
          let asset = assets.get(id);

          if(asset && item.get("balance") > 0){
            symbolsToInclude.push(asset.symbol);
          }
        });

        let { halfWidth, leftColumn, rightColumn, buttonStyle } = this._getStyleHelpers();
        let { onFocus, onBlur } = this._getBindingHelpers();

        const shouldDisable = isBTS ? !quantity || !btsAccount : !assetAndGateway || !quantity || !address || !canCoverWithdrawal || addressError;
        let storedAddresses = WithdrawAddresses.get(selectedAsset.toLowerCase());

        return <div>
          <div className="Modal__header" style={{textAlign: "center"}}>
              <img src={logo} /><br />
              <p><Translate content="modal.withdraw.header" /></p>
          </div>

          {/*ASSET SELECTION*/}
            <DepositWithdrawAssetSelector onSelect={this.onAssetSelected.bind(this)} onChange={this.onAssetChanged.bind(this)} include={symbolsToInclude} selectOnBlur defaultValue={selectedAsset} includeBTS={false} usageContext="withdraw" />

          {
            !isBTS && selectedAsset && !selectedGateway ?
            <Translate content="modal.withdraw.no_gateways" /> : 
            null
          }

          {/*GATEWAY SELECTION*/}
          <div style={{marginBottom: "1em"}}>
            { selectedGateway ? gatewaySelector.call(this, {
                selectedGateway, 
                gatewayStatus, 
                nAvailableGateways,
                availableGateways: coinToGatewayMapping[selectedAsset],
                error: false,
                onGatewayChanged: this.onGatewayChanged.bind(this)
            }) : null}
          </div>

          {/*QUANTITY*/}
          {
            assetAndGateway || isBTS ? 
            <div>
              {(preferredCurrency) ? <div style={{fontSize: "0.8em", position: "absolute", right: "2.5em"}}>
                <Translate content="modal.withdraw.available" />
                <span style={{color: canCoverWithdrawal ? null : "red", cursor: "pointer", textDecoration: "underline"}} onClick={this.onClickAvailableBalance.bind(this, convertedBalance)}>
                    {/*Some currencies do not appear in balances, display zero balance if not found*/}
                    {withdrawalCurrencyBalanceId ? <BalanceComponent balance={withdrawalCurrencyBalanceId} /> : "0.00"}
                </span>
              </div> : null}
              <label className="left-label">
                <Translate content="modal.withdraw.quantity" />
              </label>
              <ExchangeInput value={quantity} onChange={this.onQuantityChanged.bind(this)} onFocus={onFocus} onBlur={onBlur} />
            </div> : 
            null
          }

          {
            (assetAndGateway || isBTS) && !canCoverWithdrawal ? 
            <div style={{marginBottom: "1em"}}>
              <Translate content="modal.withdraw.cannot_cover" />
            </div> :
            null
          }

          {/*ESTIMATED VALUE*/}
          {/*
            (assetAndGateway || quantity) && !isBTS ? 
            <div>
              <label className="left-label"><Translate content="modal.withdraw.estimated_value" /> ({preferredCurrency})</label>
              <ExchangeInput value={userEstimate != null ? userEstimate : estimatedValue} onChange={this.onEstimateChanged.bind(this)} onFocus={onFocus} onBlur={onBlur} />
            </div> :
            null
          */}

          {/*WITHDRAW ADDRESS*/}
          {
            (assetAndGateway && !isBTS) ? 
            <div style={{marginBottom: "1em"}}>
              <label className="left-label">
                  <Translate component="span" content="modal.withdraw.address"/>
              </label>
              {addressError ? <div className="has-error" style={{position: "absolute", right: "1em", marginTop: "-30px"}}>
                  <Translate content="modal.withdraw.address_not_valid" />
              </div> : null}
              <div className="blocktrades-select-dropdown">
                  <div className="inline-label">
                      <input type="text" value={address} onChange = {this.onAddressChanged.bind(this)} autoComplete="off" />
                      {storedAddresses.length > 1 ? <span onClick={this.onDropDownList.bind(this)} >&#9660;</span> : null}
                  </div>
              </div>
              <div className="blocktrades-position-options">
                  {this._renderStoredAddresses.call(this)}
              </div>
            </div> : null
          }

          {
            isBTS ? 
            <div style={{marginBottom: "1em"}}>
                <AccountSelector 
                    label="transfer.to"
                    accountName={state.btsAccountName}
                    onChange={this.onBTSAccountNameChanged.bind(this)}
                    onAccountChanged={this.onBTSAccountChanged.bind(this)}
                    account={state.btsAccountName}
                    size={60}
                    error={state.btsAccountError}

                />
            </div>
            : null
          }

          {/*MEMO*/}
          {
            ((assetAndGateway || isBTS) && selectedGateway != "OPEN") ? <div>
              <label className="left-label"><Translate content="modal.withdraw.memo" /></label>
              <input type="text" value={state.memo} onChange={this.onMemoChanged.bind(this)} />
            </div> : null
          }

          {/*FEE & GATEWAY FEE*/}
          { 
            (assetAndGateway || isBTS) ? 
            <div>
              <div style={leftColumn}>
                <div>
                  {/* Withdraw amount */}
                  <AmountSelector
                      label="transfer.fee"
                      disabled={true}
                      amount={this.state.feeAmount.getAmount({real: true})}
                      onChange={this.onFeeChanged.bind(this)}
                      asset={this.state.feeAmount.asset_id}
                      assets={fee_asset_types}
                      //tabIndex={tabIndex++}
                  />
                  {/*!this.state.hasBalance ? <p className="has-error no-margin" style={{paddingTop: 10}}><Translate content="transfer.errors.noFeeBalance" /></p> : null*/}
                  {/*!this.state.hasPoolBalance ? <p className="has-error no-margin" style={{paddingTop: 10}}><Translate content="transfer.errors.noPoolBalance" /></p> : null*/}

                </div>
              </div>
              <div style={rightColumn}>
                  {/* Gate fee */}
                  {gateFee ?
                      (<div className="amount-selector right-selector" style={{paddingBottom: 20}}>
                          <label className="left-label"><Translate content="gateway.fee" /></label>
                          <div className="inline-label input-wrapper">
                              <input type="text" disabled value={gateFee} />

                              <div className="form-label select floating-dropdown">
                                  <div className="dropdown-wrapper inactive">
                                      <div>{selectedAsset}</div>
                                  </div>
                              </div>
                          </div>
                      </div>):null}
              </div>
            </div> : null
          }

          {/*Submit Buttons*/}
          <div style={{clear: "both", position: "absolute", bottom: "0", right: "2em", left: "2em"}}>
            <div style={leftColumn} className="button-group">
              <button style={buttonStyle} className="button danger" onClick={this.props.close}><Translate content="modal.withdraw.cancel" /></button>
            </div>
            <div style={rightColumn} className="button-group">
              <button style={buttonStyle} className="button success" disabled={shouldDisable} onClick={this.onSubmit.bind(this)}>
                <Translate content="modal.withdraw.withdraw" />
              </button>
            </div>
          </div>
        </div>
    }
};

const ConnectedWithdrawModal = connect(WithdrawModalNew, {
    listenTo() {
        return [GatewayStore, AssetStore, SettingsStore, MarketsStore];
    },
    getProps() {
        return {
            backedCoins: GatewayStore.getState().backedCoins,
            openLedgerBackedCoins: GatewayStore.getState().backedCoins.get("OPEN", []),
            rudexBackedCoins: GatewayStore.getState().backedCoins.get("RUDEX", []),
            blockTradesBackedCoins: GatewayStore.getState().backedCoins.get("TRADE", []),
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

      let balances = props.account.get("balances");
      let assets = Immutable.fromJS({});
      balances.forEach((item, id)=>{
        try {
          let asset = ChainStore.getObject(id).toJS();
          assets = assets.set(id, asset);
        } catch(e){}
      });

      return <BalanceWrapper wrap={ConnectedWithdrawModal} {...props} balances={props.account.get("balances")} assets={assets} skipCoinFetch={true} />
    }
}

const ConnectedWrapper = connect(BindToChainState(WithdrawModalWrapper, {keep_updating: true}), {
    listenTo() {
        return [AccountStore];
    },
    getProps(props) {
        return {
            account: AccountStore.getState().currentAccount
        };
    }
});

export default class WithdrawModal extends React.Component {
    constructor() {
        super();

        this.state = {open: false};
    }

    show() {
        this.setState({open: true}, () => {
            ZfApi.publish(this.props.modalId, "open");
        });
    }

    onClose() {
        this.setState({open: false});
    }

    close() {
        ZfApi.publish(this.props.modalId, "close");

        this.onClose();
    }

    render() {
        return (
            this.state.open ?
            <BaseModal style={{maxWidth: 500}} className={this.props.modalId} onClose={this.onClose.bind(this)} overlay={true} id={this.props.modalId}>
                <ConnectedWrapper {...this.props} open={this.state.open} id={this.props.modalId} close={this.close.bind(this)} />
            </BaseModal> : null
        );
    }
}
