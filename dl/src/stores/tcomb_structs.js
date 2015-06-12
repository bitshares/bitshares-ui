var t = require("tcomb");

let Account = t.struct({
    id: t.Str,
    annotations: t.Arr,
    registrar: t.Str,
    referrer: t.Str,
    lifetime_referrer: t.Str,
    network_fee_percentage: t.Num,
    lifetime_referrer_fee_percentage: t.Num,
    referrer_rewards_percentage: t.Num,
    name: t.Str,
    owner: t.Obj,
    active: t.Obj,
    memo_key: t.Str,
    voting_account: t.Str,
    num_witness: t.Num,
    num_committee: t.Num,
    votes: t.Arr,
    statistics: t.Str,
    whitelisting_accounts: t.Arr,
    blacklisting_accounts: t.Arr
}, "Account");

let Asset = t.struct({
    annotations: t.Arr,
    dynamic_asset_data_id: t.Str,
    bitasset_data_id: t.maybe(t.Str),
    id: t.Str,
    issuer: t.Str,
    options: t.Obj,
    precision: t.Num,
    symbol: t.Str
}, "Asset");

let Block = t.struct({
    delegate_signature: t.Str,
    id: t.Num,
    next_secret_hash: t.Str,
    previous: t.Str,
    previous_secret: t.Str,
    timestamp: t.Dat,
    transactions: t.Arr,
    witness: t.Str
}, "Block");

let Key = t.struct({
    id: t.Num
}, "Key");

let Witness = t.struct({
    id: t.Str,
    witness_account: t.Str,
    signing_key: t.Str,
    next_secret: t.Str,
    last_secret: t.Str,
    accumulated_income: t.Num,
    vote_id: t.Str
}, "Witness");

let Delegate = t.struct({
    id: t.Str,
    delegate_account: t.Str,
    vote_id: t.Str
}, "Delegate");

let GlobalObject = t.struct({
    active_delegates: t.Arr,
    active_witnesses: t.Arr,
    chain_id: t.Str,
    id: t.Str,
    next_available_vote_id: t.Num,
    parameters: t.Obj
}, "GlobalObject");

let DynGlobalObject = t.struct({
    current_witness: t.Str,
    head_block_id: t.Str,
    head_block_number: t.Num,
    id: t.Str,
    next_maintenance_time: t.Dat,
    random: t.Str,
    time: t.Dat,
    witness_budget: t.Num
}, "DynGlobalObject");

let LimitOrder = t.struct({
    expiration: t.Dat,
    for_sale: t.Num,
    id: t.Str,
    sell_price: t.Obj,
    seller: t.Str
}, "LimitOrder");

let ShortOrder = t.struct({
    expiration: t.Dat,
    for_sale: t.Num,
    id: t.Str,
    sell_price: t.Obj,
    seller: t.Str
}, "ShortOrder");

let LimitTrx = t.struct({
    amount_to_sell: t.Obj,
    expiration: t.Dat,
    fee: t.Obj,
    fill_or_kill: t.Bool,
    min_to_receive: t.Obj,
    seller: t.Str
}, "LimitTrx");

let ShortTrx = t.struct({
    amount_to_sell: t.Obj,
    collateral: t.Obj,
    expiration: t.Dat,
    fee: t.Obj,
    initial_collateral_ratio: t.Num,
    maintenance_collateral_ratio: t.Num,
    seller: t.Str
}, "ShortTrx");

module.exports = {
    Account: Account,
    Asset: Asset,
    Block: Block,
    Key: Key,
    Witness: Witness,
    Delegate: Delegate,
    GlobalObject: GlobalObject,
    DynGlobalObject: DynGlobalObject,
    LimitTrx: LimitTrx,
    ShortTrx: ShortTrx,
    LimitOrder: LimitOrder,
    ShortOrder: ShortOrder
};
