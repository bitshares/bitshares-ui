import React from "react";
import Translate from "react-translate-component";
import MetaexchangeDepositRequest from "../DepositWithdraw/metaexchange/MetaexchangeDepositRequest";
import RecentTransactions, {TransactionWrapper} from "components/Account/RecentTransactions";
import Immutable from "immutable";

export default class MetaExchange extends React.Component {

	render() {
		let {service} = this.props;

		let issuer_account = service === "bridge" ? "metaexchangebtc" : "dev-metaexchange.monsterer";

		return (
			<div>
			<p style={{fontSize: "1.1rem"}} className="label warning">MetaExchange is closing down, please see this post for more info: <a href="https://metaexchange.info/closing" target="_blank" >https://metaexchange.info/closing</a></p>
				{service === "bridge" ? (
				<div className="content-block">
	                <table className="table">
	                    <thead>
	                    <tr>
	                        <th><Translate content="gateway.symbol" /></th>
	                        <th><Translate content="gateway.meta.open_website" /></th>
	                        <th><Translate content="gateway.balance" /></th>
	                        <th><Translate content="gateway.withdraw" /></th>
	                    </tr>
	                    </thead>
	                    <tbody>
	                    <MetaexchangeDepositRequest
	                        symbol_pair="BTS_BTC"
	                        gateway="metaexchange"
	                        issuer_account="metaexchangebtc"
	                        account={this.props.account}
	                        receive_asset="BTS"
	                        is_bts_deposit="true"
	                        deposit_asset="BTS"
	                        deposit_asset_name="Bitcoin"/>
	                    </tbody>
	                </table>
	            </div>) : (
	            <div className="content-block">
	                <table className="table">
	                    <thead>
	                    <tr>
	                        <th><Translate content="gateway.symbol" /></th>
	                        <th><Translate content="gateway.meta.open_website" /></th>
	                        <th><Translate content="gateway.balance" /></th>
	                        <th><Translate content="gateway.withdraw" /></th>
	                    </tr>
	                    </thead>
	                    <tbody>
	                    <MetaexchangeDepositRequest
	                        symbol_pair="METAEX.BTC_BTC"
	                        gateway="metaexchange"
	                        issuer_account="dev-metaexchange.monsterer"
	                        account={this.props.account}
	                        receive_asset="METAEX.BTC"
	                        deposit_asset="BTC"
	                        deposit_asset_name="Bitcoin"/>
	                    <MetaexchangeDepositRequest
	                        symbol_pair="METAEX.ETH_ETH"
	                        gateway="metaexchange"
	                        issuer_account="dev-metaexchange.monsterer"
	                        account={this.props.account}
	                        receive_asset="METAEX.ETH"
	                        deposit_asset="ETH"
	                        deposit_asset_name="Ether"/>
	                    <MetaexchangeDepositRequest
	                        symbol_pair="METAEX.NXT_NXT"
	                        gateway="metaexchange"
	                        issuer_account="dev-metaexchange.monsterer"
	                        account={this.props.account}
	                        receive_asset="METAEX.NXT"
	                        deposit_asset="NXT"
	                        deposit_asset_name="Nxt"/>
	                    </tbody>
	                </table>
	            </div>)}
	            <div style={{marginBottom: 20}}>
	            	<TransactionWrapper
                        fromAccount={
                            this.props.account.get("id")
                        }
                        to={
                            issuer_account
                        }
                    >
                        { ({to, fromAccount}) => {
                            return <RecentTransactions
                                accountsList={Immutable.List([this.props.account.get("id")])}
                                limit={10}
                                compactView={true}
                                fullHeight={true}
                                filter="transfer"
                                customFilter={{
                                    fields: ["to", "from"],
                                    values: {
                                            to: to.get("id"),
                                            from: fromAccount.get("id")
                                        }

                                    }}
                            />
                            }
                        }
                    </TransactionWrapper>
                   	</div>

            </div>
		);
	}
}
