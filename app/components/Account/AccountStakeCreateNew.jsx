import React from "react";
import Translate from "react-translate-component";
import FormattedAsset from "../Utility/FormattedAsset";
import AmountSelector from "../Utility/AmountSelector";
import BalanceComponent from "../Utility/BalanceComponent";
import BindToChainState from "../Utility/BindToChainState";
import {FetchChain, ChainStore} from "bitsharesjs/es";
import ChainTypes from "../Utility/ChainTypes";
import utils from "common/utils";
import WalletActions from "actions/WalletActions";
import {Apis} from "bitsharesjs-ws";
import { debounce } from "lodash";
import { checkFeeStatusAsync } from "common/trxHelper";
import counterpart from "counterpart";
import { Asset } from "common/MarketClasses";

const BCO_ID = '1.3.1564';

class AccountStakeCreateNew extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            amount: 0,
            selectedPeriod: 2678400,
            checked: false,
            showValidationErrors: false,
            balances: {'BRIDGE.BCO': 0},
            periods: [
                {
                    name1: 'account.cryptobridge.month_1',
                    bonus: '0%',
                    name: counterpart.translate("account.cryptobridge.month_1", {bonus: '0%'}),
                    monthName: counterpart.translate("account.cryptobridge.month_1_plural"),
                    value: 2678400
                },
                {
                    name1: 'account.cryptobridge.month_3',
                    bonus: '20%',
                    name: counterpart.translate("account.cryptobridge.month_3", {bonus: '20%'}),
                    monthName: counterpart.translate("account.cryptobridge.month_3_plural"),
                    value: 7776000
                },
                {
                    name1: 'account.cryptobridge.month_6',
                    bonus: '50%',
                    name: counterpart.translate("account.cryptobridge.month_6", {bonus: '50%'}),
                    monthName: counterpart.translate("account.cryptobridge.month_6_plural"),
                    value: 15552000
                },
                {
                    name1: 'account.cryptobridge.month_12',
                    bonus: '100%',
                    name: counterpart.translate("account.cryptobridge.month_12", {bonus: '100%'}),
                    monthName: counterpart.translate("account.cryptobridge.month_12_plural"),
                    value: 31536000
                }
            ]

        }
        this.onAmountChanged = this.onAmountChanged.bind(this)
        this._setTotal = this._setTotal.bind(this);
        this.setPeriod = this.setPeriod.bind(this);
        this.stakeBalance = this.stakeBalance.bind(this);
        this.getMonths = this.getMonths.bind(this);
        this.checkTerms = this.checkTerms.bind(this);
        this.getBalance = this.getBalance.bind(this);
    }

    componentDidMount() {
        this.getBalance(this.props.balances.get('1.3.0'), '1.3.0');
        this.getBalance(this.props.balances.get(BCO_ID), BCO_ID);
    }

    onAmountChanged(amount) {
        let newAmount = amount.amount;
        if (newAmount > 0 && (parseFloat(parseFloat(newAmount) + parseFloat(this.props.feeAmount)) > this.state.balances['BRIDGE.BCO']) ) {
            // Amount with fee higher than available balance
            newAmount = parseFloat(newAmount - this.props.feeAmount).toFixed(7);
            if (newAmount > this.state.balances['BRIDGE.BCO'] ) {
                // Still too high, let's take the possible amount
                newAmount = parseFloat(this.state.balances['BRIDGE.BCO'] - this.props.feeAmount).toFixed(7);
            }
        }
        this.setState({amount: newAmount});
    }

    checkTerms() {

        this.setState({checked: !this.state.checked, showValidationErrors: false});
    }


    _setTotal(asset_id, balance_id) {
        this.setState({amount: parseFloat(this.state.balances['BRIDGE.BCO'] - this.props.feeAmount).toFixed(7) });
    }

    setPeriod(period) {
        this.setState({selectedPeriod: parseInt(period.target.value, 10)})
    }

    stakeBalance() {
        if (!this.state.checked) {
            this.setState({showValidationErrors: true});
        } else {
            WalletActions.stakeBalance(this.props.accountId, this.state.selectedPeriod, this.state.amount);
        }
    }

    getBalance(object, asset){
        Promise.all([
            FetchChain("getObject", object),
            FetchChain("getAsset", asset),
        ]).then((res)=> {
            let [object, asset] = res;

            object = object.toJS();
            asset = asset.toJS();

            let assetObject = new Asset({
                asset_id: asset.id,
                precision: asset.precision,
                amount: object.balance
            });

            let symbol = asset.symbol;
            let amount = assetObject.getAmount({real: true});

            let obj  = {}
            obj['balances'] = this.state.balances;
            obj['balances'][symbol] = amount;

            this.setState(obj);
        });
    }

    getMonths() {
        if (this.state.periods) {
            for (let i=0;i<this.state.periods.length;i++) {
                let p = this.state.periods[i];
                if (p.value && p.value === this.state.selectedPeriod) {
                    return p.monthName;
                }
            }
        }
        return false;
    }

    render() {
        let balance = null;
        let key=0;

        //let account_balances = this.props.balances.toJS();
        //console.log(account_balances[BCO_ID]);
        let month = this.getMonths();
        let style;

        if (this.state.showValidationErrors) {
            style = {color: 'red'};
        }


        //console.log(this.props.balances.get("1.3.0"));

    //    console.log(account_balances[BCO_ID]);
        let bco_balance = this.props.balances.get(BCO_ID);
        balance = (<span style={{borderBottom: "#A09F9F 1px dotted", cursor: "pointer"}} onClick={ this._setTotal }> { this.props.balances.get(BCO_ID) ? <Translate component="span" content="account.cryptobridge.bco_available"/> : <Translate component="span" content="account.cryptobridge.bco_not_available"/> } <BalanceComponent balance={ bco_balance }/></span>);
        return (
                <div style={{'marginTop': '20px'}} className="small-12 grid-content1">

                        <h5><b><Translate content="account.cryptobridge.title" /></b></h5>

                        <p>
                            <Translate  content="account.cryptobridge.staking_text1" percent="50%" unsafe/>
                        </p>
                        <p>
                            <Translate content="account.cryptobridge.staking_text2" fee={this.props.feeAmount || 0} unsafe  />
                        </p>

                        <Translate component="p" content="account.cryptobridge.staking_text3" unsafe />


                        <label style={{'paddingTop': '20px'}}><Translate component="p" unsafe content="account.cryptobridge.amount_bco"/></label>
                        <AmountSelector
                                    label="transfer.amount"
                                    display_balance={true}
                                    amount={this.state.amount}
                                    onChange={this.onAmountChanged.bind(this)}
                                    asset={BCO_ID}
                                    assets={[BCO_ID]}
                                    display_balance={balance}
                                    tabIndex={0}
                        />

                    <label  style={{'paddingTop': '20px'}}><Translate content="account.cryptobridge.length" /></label>
                    <select onChange={this.setPeriod} value={this.state.selectedPeriod}>
                        {
                        this.state.periods.map((p) => {
                            if (!p || p === "") {return null; }
                            return <option key={key++} value={p.value}><Translate content={p.name1} unsafe bonus={p.bonus} /></option>;
                        })}
                    </select>
                    { this.state.amount > 0 ?( <label className={this.state.showValidationErrors ? 'has-errors' : ''}>
                        <input  type="checkbox" onChange={this.checkTerms} checked={this.state.checked}/>
                        <Translate style={style} unsafe content="account.cryptobridge.understand" amount={ this.state.amount } month={ month } />
                    </label> ) : null }

                    <p  style={{textAlign: "right"}}>
                        <button onClick={this.stakeBalance} className="button outline"><Translate content="account.cryptobridge.stake_bco" /></button>
                    </p>


                </div>
        );
    }
}

export default AccountStakeCreateNew;
