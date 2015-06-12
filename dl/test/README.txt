

== Account 1.3.0
The Genesis account and contains a very large testing 
balance.  The funds may be transferred using the genesis_private key.

Genesis Private Key: 5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3
Genesis Public Key: GPH6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV

= Lookup the account's public keys
Graphene > $g.db.api.exec("get_objects",[["1.3.0"]])
var o=_[0]
o.active
{ weight_threshold: 1, auths: [ [ '1.2.0', 1 ] ] }
o.owner
{ weight_threshold: 1, auths: [ [ '1.2.0', 1 ] ] }

$g.db.api.exec("get_objects",[["1.2.0"]])
[ { id: '1.2.0',
    key_data: [ 1, 'GPH7Pz9Xfpn9rBbWvvmPgcbESGDmRTfoEt6E6gkrspwk2YX49VCUJ' ] } ]

== Account 1.3.11

Built-in testnet account, this has a large test balance.

In the cli_wallet importing the genesis key will unlock the balance:
>>> import_key "1.3.11" "5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3"
>>> list_account_balances "1.3.11"
>>> transfer "1.3.11" "1.3.0" 1 "GPH" "memo" true

In these unit tests the "import_key" step is not necessary because the
genesis key is saved in the source code.

An inspection of account 1.3.11 gives usefull information:
Graphene > $g.db.api.exec("get_objects",[["1.3.11"]])
var o=_[0]
o.active
{ weight_threshold: 1, auths: [ [ '1.2.1', 1 ] ] }
o.owner
{ weight_threshold: 1, auths: [ [ '1.2.1', 1 ] ] }

The same key (1.2.1) is used for active and owner.  This object is storing
the actual public key:

$g.db.api.exec("get_objects",[["1.2.1"]])
[ { id: '1.2.1',
    key_data: [ 1, 'GPH6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV' ] } ]

Create market asset:

dbg_make_mia ACCOUNT ASSET
dbg_make_mia 1.3.11 USD

Place a limit order:

sell_asset ACCOUNT_ID AMOUNT ASSET FOR_AMOUNT FOR_ASSET EXPIRATION fill_or_kill broadcast
ex: sell_asset 1.3.11 1000 CORE 100 USD 100000 false true

Place a short order:

short_sell_asset ACCOUNT_ID SHORT_AMOUNT ASSET_NAME COLLATERAL_AMOUNT broadcast
ex: short_sell_asset 1.3.11 1000 USD 1000 true

Generic transaction support with visual aid from template:
$g.wallet.template("account_upgrade")
{"fee":{"amount":"0","asset_id":"1.4.0"},"account_to_upgrade":"1.3.0","upgrade_to_lifetime_member":false}
Graphene > var tr = $g.wallet.new_transaction()
Graphene > tr.add_type_operation("account_upgrade", {"account_to_upgrade":"1.3.11","upgrade_to_lifetime_member":true})
Graphene > $g.wallet.sign_and_broadcast(tr)
null

// Operations (launch instructions below)

var trx = ["short_order_cancel", {"fee_paying_account": "1.3.11","order": "1.9.3"}]

var trx = ["account_upgrade", {"account_to_upgrade":"1.3.11","upgrade_to_lifetime_member":true}]

var trx = ["asset_update", {"issuer":"1.3.11","asset_to_update":"1.4.2", "new_options": {"max_supply": "1000000000000", "market_fee_percent": 1, "max_market_fee": "1000000000000", "min_market_fee": 0, "issuer_permissions": 0, "flags": 0, "core_exchange_rate": {"base": {"amount": 1, "asset_id": "1.4.0"}, "quote": {"amount": 1, "asset_id": "1.4.2"}}, "whitelist_authorities": [], "blacklist_authorities": [], "whitelist_markets": [], "blacklist_markets": []}}]

var trx = ["asset_update_bitasset", {"issuer":"1.3.11","asset_to_update":"1.4.1","new_options":{"feed_lifetime_sec":55,"force_settlement_delay_sec":0,"force_settlement_offset_percent":0,"maximum_force_settlement_volume":0,"short_backing_asset":"1.4.0"}}]

var trx = ["asset_update_feed_producers", {"issuer":"1.3.11","asset_to_update":"1.4.1","new_feed_producers":["1.3.5", "1.3.11"]}]

var trx = ["asset_issue", {"issuer":"1.3.11","asset_to_issue":{"amount":"1245470","asset_id":"1.4.2"},"issue_to_account":"1.3.11"}]

var trx = ["asset_issue", {"issuer":"1.3.11","asset_to_issue":{"amount":"1245470","asset_id":"1.4.2"},"issue_to_account":"1.3.11"}]

var trx = ["asset_burn", {"payer":"1.3.11","amount_to_burn":{"amount":"1000","asset_id":"1.4.4"}}]

var trx = ["asset_fund_fee_pool", {"from_account":"1.3.11","asset_id":"1.4.0","amount":"15410"}]

var trx = ["asset_settle", {"account":"1.3.11","amount":{"amount":"1000","asset_id":"1.4.1"}}]

var trx = ["delegate_create", {"delegate_account":"1.3.11"}];

// Launch with
var tr = $g.wallet.new_transaction(); tr.add_type_operation(trx[0], trx[1]); $g.wallet.sign_and_broadcast(tr)

// Not working currently:
var trx = ["account_update", {"account": "1.3.11", "num_witness":0,"num_committee":0, "vote": ["0:18"]}]

var trx = ["account_transfer", {"account_id":"1.3.12","new_owner":"1.3.5"}] // Crashes the node currently

var trx = ["asset_publish_feed", {"publisher":"1.3.11","asset_id":"1.4.1","feed":{"call_limit":{"base":{"amount":"1","asset_id":"1.4.0"},"quote":{"amount":"1","asset_id":"1.4.1"}},"short_limit":{"base":{"amount":"1","asset_id":"1.4.1"},"quote":{"amount":"2","asset_id":"1.4.0"}},"settlement_price":{"base":{"amount":"1","asset_id":"1.4.0"},"quote":{"amount":"2","asset_id":"1.4.1"}},"max_margin_period_sec":1500,"required_initial_collateral":2000,"required_maintenance_collateral":1750}}]

var trx = ["proposal_create", {"fee_paying_account":"1.3.11","expiration_time":131232,"proposed_ops":[[0,{"fee":{"amount":"0","asset_id":"1.4.0"},"from":"1.3.9","to":"1.3.11","amount":{"amount":"100000","asset_id":"1.4.0"},"memo":{"from":"1.2.0","to":"1.2.1","nonce":"0","message":"test"}}]]}]
