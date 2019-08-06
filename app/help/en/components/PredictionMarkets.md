# Prediction Market Assets

A prediction market asset allows you to agree or disagree with the
prediction (condition) of the asset and put collateral behind your opinion.
A prediction market is resolved by its
issuer after the resolution date to reflect the real world outcome of
the prediction on-chain.

On the blockchain, a prediction market asset is special kind of SmartCoin
that anyone can borrow. The total debt and total collateral are always
equal amounts (borrowing 1:1), margin calls or force settlements are deactivated.
A prediction market asset has the active market of itself with its collateral.
Agreeing with the prediction means to buy the prediction market asset, whereas
disagreeing with the prediction means to borrow it and sell it.
Resolving a prediction market asset is done by forcing global settlement,
with a global settlement price given by the issuer.
After resolution (global settlement), and if the prediction proves true (global settlement price is 1),
 holders of the prediction market asset can instantly force settle it to
 obtain the same amount of the underlying collateral.
If the prediction is incorrect (global settlement price 0), owners of
margin positions will automatically get back all the collateral that was locked
 up in the position.
