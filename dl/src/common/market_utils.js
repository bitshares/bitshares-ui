import {
    object_type
}
from "chain/chain_types";
var opTypes = Object.keys(object_type);

class MarketUtils {
    constructor() {
        this.order_type = this.order_type.bind(this);
    }

    static parse_order(newOrder) {
        let o = newOrder[0][1];
        let orderType = this.order_type(newOrder[1][1]);
        let order = {};
        switch (orderType) {

            case "limit_order":
                o.expiration = new Date(o.expiration);
                console.log("new limit order:", orderType, newOrder);

                order = {
                    expiration: o.expiration,
                    for_sale: o.amount_to_sell.amount,
                    id: newOrder[1][1],
                    sell_price: {
                        base: {
                            amount: parseInt(o.min_to_receive.amount, 10) / parseInt(o.amount_to_sell.amount),
                            asset_id: o.min_to_receive.asset_id
                        },
                        quote: {
                            amount: 1,
                            asset_id: parseInt(o.amount_to_sell.asset_id, 10)

                        }
                    },
                    seller: o.seller
                };

                break;

            case "short_order":
                o.expiration = new Date(o.expiration);
                console.log("new short order:", orderType, newOrder);

                order = {
                    expiration: o.expiration,
                    for_sale: o.amount_to_sell.amount,
                    id: newOrder[1][1],
                    sell_price: {
                        base: {
                            amount: parseInt(o.min_to_receive.amount, 10) / parseInt(o.amount_to_sell.amount, 10),
                            asset_id: o.min_to_receive.asset_id
                        },
                        quote: {
                            amount: 1,
                            asset_id: o.amount_to_sell.asset_id
                        }
                    },
                    seller: o.seller
                };
                break;

            default:
                break;
        }

        return {
            order: order,
            orderType: orderType
        };
    }

    static order_type(id) {
        if (typeof id !== "string") {
            return false;
        }
        var type = id.split(".")[1];
        return opTypes[type];
    }

}

export default MarketUtils;