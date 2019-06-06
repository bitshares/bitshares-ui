import React from "react";
import Translate from "react-translate-component";
import utils from "common/utils";
import AssetName from "../Utility/AssetName";

class AccountOrderRowDescription extends React.Component {
    render() {
        let {base, quote, order} = this.props;
        const isBid = order.isBid();

        let quoteColor = !isBid ? "value negative" : "value positive";
        let baseColor = isBid ? "value negative" : "value positive";

        return (
            <Translate
                content={
                    isBid
                        ? "exchange.buy_description"
                        : "exchange.sell_description"
                }
                baseAsset={utils.format_number(
                    order[
                        isBid ? "amountToReceive" : "amountForSale"
                    ]().getAmount({real: true}),
                    base.get("precision"),
                    false
                )}
                quoteAsset={utils.format_number(
                    order[
                        isBid ? "amountForSale" : "amountToReceive"
                    ]().getAmount({real: true}),
                    quote.get("precision"),
                    false
                )}
                baseName={
                    <AssetName
                        noTip
                        customClass={quoteColor}
                        name={quote.get("symbol")}
                    />
                }
                quoteName={
                    <AssetName
                        noTip
                        customClass={baseColor}
                        name={base.get("symbol")}
                    />
                }
            />
        );
    }
}

export default AccountOrderRowDescription;
