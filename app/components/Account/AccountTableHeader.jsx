import React from "react";
import Translate from "react-translate-component";

const leftAlign = {textAlign: "left"};
const rightAlign = {textAlign: "right"};

class AccountTableHeader extends React.Component {
    render() {
        let {isMyAccount} = this.props;

        return (
            <tr>
                {isMyAccount ? (
                    <th id="cancelAllOrders" style={{cursor: "pointer"}}>
                        <Translate content="wallet.cancel" />
                    </th>
                ) : null}
                <th>
                    <Translate content="account.trade" />
                </th>
                <th style={leftAlign}>
                    <Translate content="transaction.order_id" />
                </th>
                <th style={leftAlign} colSpan="4">
                    <Translate content="exchange.description" />
                </th>
                <th style={leftAlign}>
                    <Translate content="exchange.price" />
                </th>
                <th style={leftAlign}>
                    <Translate content="exchange.price_market" />
                </th>
                <th style={rightAlign}>
                    <Translate content="exchange.value" />
                </th>
            </tr>
        );
    }
}

export default AccountTableHeader;
