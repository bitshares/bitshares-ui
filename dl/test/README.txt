

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
ex: sell_asset 1.3.11 1000 CORE 100 SHILL 100000 false true

Place a short order:

short_sell_asset ACCOUNT_ID SHORT_AMOUNT ASSET_NAME COLLATERAL_AMOUNT broadcast
ex: short_sell_asset 1.3.11 1000 SHILL 1000 true



