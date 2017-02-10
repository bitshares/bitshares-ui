# Торговля

Эта страница даст Вам краткую интерпретацию терминов, используемых на DEX и информацию о том, как размещаются торговые пары.

## Пары

На BitShares почти любой актив может торговаться со всеми остальными активами. Как только мы выбрали два актива, обычно мы ссылаемся на определенную *рыночную пару*. Например, мы можем торговать USD против EUR в паре USD:EUR.

В целях установки ориентира, мы будем использовать общие термины "базовый" и "котируемый", где подобные пары представлены как

    "котируемый" : "базовый"
    

в частности, в представленной паре EUR:USD, базовым активом будет являться USD, а котируемым - EUR.

## Регистр Ордеров

Регистр состоит из цен покупки и цен продажи. Since trading pairs do not have a preferred orientation, and can be flipped, the following table shall give an overview of ask/bid and the corresponding buy/sell operations for each side:

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