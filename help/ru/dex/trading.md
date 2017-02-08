# Торговля

This page will give a very quick introduction on how to interpret the terms used by the DEX and how trading pairs are presented.

## Pairs

In BitShares, almost any asset can be traded with all other assets. Once we have picked two assets, we usually refer to a *market pair*. For instance, we can trade USD against EUR in the USD:EUR pair.

For sake of consistency, we will use the generalized terms *base* and *quote* such that pairs are represented as

    *quote* : *base*
    

and for instance with *base* being USD and *quote* being EUR, denote the EUR:USD pair.

## Order Books

The order book consists of an *ask* and a *bid* side. Since trading pairs do not have a preferred orientation, and can be flipped, the following table shall give an overview of ask/bid and the corresponding buy/sell operations for each side:

| Side          | Sell      | Buy       |
| ------------- | --------- | --------- |
| Ask           | *quote*   | *base*    |
| Bid           | *base*    | *quote*   |
| \---\---\---- | \---\---- | \---\---- |

Obviously, what is on the bid side of the USD:EUR pair will be on the ask side on the EUR:USD pair. Of course prices are internally represented as fractions, and thus results in both pairs being identical.

## Trading

To place a trading order, it is required to fill the form on either the *ask* or the *bid* side (respectively, *buy* or *sell* side). You will need to define a *price* and an *amount* to sell/buy. The cost for this order will be calculated automatically. Note that there will be an additional fee required to actually place the order.

Once the order is filled (i.e. someone sold/bought your offer), your account will be credited by the corresponding asset.

Unfilled orders can be canceled at any time.