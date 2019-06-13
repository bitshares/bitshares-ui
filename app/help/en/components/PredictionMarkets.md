# Prediction market

A prediction market is a specialized BitAsset such that total debt and total collateral are always equal amounts (although asset IDs differ). No margin calls or force settlements may be performed on a prediction market asset. A prediction market is globally settled by the issuer after the event being predicted resolves, thus a prediction market must always have the `global_settle` permission enabled. The maximum price for global settlement or short sale of a prediction market asset is 1-to-1.
