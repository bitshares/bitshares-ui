import React from "react";
import Trigger from "react-foundation-apps/src/trigger";
import Translate from "react-translate-component";
import ChainTypes from "components/Utility/ChainTypes";
import BindToChainState from "components/Utility/BindToChainState";
import BalanceComponent from "components/Utility/BalanceComponent";
import counterpart from "counterpart";
import AmountSelector from "components/Utility/AmountSelector";
import AccountActions from "actions/AccountActions";
import TransactionConfirmStore from "stores/TransactionConfirmStore";
import utils from "common/utils";

class ConvertModalBlocktrades extends React.Component {

    static propTypes = {
        from_account: ChainTypes.ChainAccount.isRequired,
		to_account: ChainTypes.ChainAccount.isRequired,
        asset: ChainTypes.ChainAsset.isRequired,
        output_coin_name: React.PropTypes.string.isRequired,
        output_coin_symbol: React.PropTypes.string.isRequired,
        url: React.PropTypes.string,
		conversion_memo: React.PropTypes.string
    };

    constructor( props ) {
        super(props);

        this.state = {
        convert_amount: '',
		error: null
        }
    }

    onConvertAmountChange( {amount, asset} ) {
        this.setState( {convert_amount: amount} );
    }

    onTrxIncluded(confirm_store_state) {
        if(confirm_store_state.included && confirm_store_state.broadcasted_transaction) {
            // this.setState(Transfer.getInitialState());
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        } else if (confirm_store_state.closed) {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.reset();
        }
    }

    onSubmit(e) {
		e.preventDefault();
		this.setState({error: null});
        let asset = this.props.asset;
        let precision = utils.get_asset_precision(asset.get("precision"));
        let amount = this.state.convert_amount.replace( /,/g, "" );

        AccountActions.transfer(
            this.props.from_account.get("id"),
            this.props.to_account.get("id"),
            parseInt(amount * precision, 10),
            asset.get("id"),
            this.props.conversion_memo ? new Buffer(this.props.conversion_memo, "utf-8") : this.props.conversion_memo,
            null,
            "1.3.0"
        ).then( () => {
            TransactionConfirmStore.unlisten(this.onTrxIncluded);
            TransactionConfirmStore.listen(this.onTrxIncluded);
        }).catch( e => {
            let msg = e.message ? e.message.split( '\n' )[1] : null;
            console.log( "error: ", e, msg);
            this.setState({error: msg})
        } );

	}

    render() {

        let balance = null;
        let account_balances = this.props.from_account.get("balances").toJS();
        let asset_types = Object.keys(account_balances);

        if (asset_types.length > 0) {
            let current_asset_id = this.props.asset.get('id');
            if( current_asset_id )
                balance = (<span><Translate component="span" content="transfer.available"/>: <BalanceComponent balance={account_balances[current_asset_id]}/></span>)
            else
                balance = "No funds";
        } else {
            balance = "No funds";
        }

	    let tabIndex = 1;

        return (<form className="grid-block vertical full-width-content">
            <div className="grid-container">
                <div className="content-block">
                    <h3><Translate content="gateway.convert_coin" coin={this.props.output_coin_name} symbol={this.props.output_coin_symbol} /></h3>
                </div>
                <div className="content-block">
                    <AmountSelector label="modal.convert.amount"
                        amount={this.state.convert_amount}
                        asset={this.props.asset.get('id')}
                        assets={[this.props.asset.get('id')]}
                        placeholder="0.0"
                        onChange={this.onConvertAmountChange.bind(this)}
                        display_balance={balance}
                    />
                </div>
                <div className="content-block">
                    <input type="submit" className="button"
                    onClick={this.onSubmit.bind(this)}
                    value={counterpart.translate("modal.convert.submit")} />
                    <Trigger close={this.props.modal_id}>
                        <a href className="secondary button"><Translate content="account.perm.cancel" /></a>
                    </Trigger>
                </div>
            </div>
            </form>
	    )
    }
};

export default BindToChainState(ConvertModalBlocktrades, {keep_updating:true});
