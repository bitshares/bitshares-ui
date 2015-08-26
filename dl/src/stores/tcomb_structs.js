var t = require("tcomb");

let Account = t.struct({
    active: t.Obj,
    annotations: t.Arr,
    blacklisting_accounts: t.Arr,
    id: t.Str,
    lifetime_referrer: t.Str,
    lifetime_referrer_fee_percentage: t.Num,
    membership_expiration_date: t.Str,
    name: t.Str,
    network_fee_percentage: t.Num,
    options: t.Obj,
    owner: t.Obj,
    referrer: t.Str,
    referrer_rewards_percentage: t.Num,
    imported_pubkey: t.maybe(t.Arr),
    registrar: t.Str,
    statistics: t.Str,
    stat_object: t.maybe(t.Obj),
    whitelisting_accounts: t.Arr,
    cashback_vb: t.maybe(t.Str),
    limit_orders: t.maybe(t.Arr),
    call_orders: t.maybe(t.Arr),
    vesting_balances: t.maybe(t.Arr),
    lifetime_referrer_name: t.maybe(t.Str),
    referrer_name: t.maybe(t.Str),
    registrar_name: t.maybe(t.Str),
    my_account: t.maybe(t.Bool)
}, "Account");

let Asset = t.struct({
    annotations: t.Arr,
    bitasset_data_id: t.maybe(t.Str),
    bitasset_data: t.maybe(t.Obj),
    dynamic_asset_data_id: t.Str,
    dynamic_data: t.maybe(t.Obj),
    id: t.Str,
    issuer: t.Str,
    market_asset: t.Bool,
    options: t.Obj,
    precision: t.Num,
    symbol: t.Str
}, "Asset");

// let BitAssetData = t.struct({
//     current_feed: t.Obj,
//     current_feed_publication_time: t.Str,
//     feeds: t.Arr,
//     force_settled_volume: t.Num,
//     id: t.Str,
//     is_prediction_market: t.Bool,
//     options: t.Obj
// }, "BitAssetData");

let Block = t.struct({
    extensions: t.Arr,
    id: t.Num,
    next_secret_hash: t.Str,
    previous: t.Str,
    previous_secret: t.Str,
    timestamp: t.Dat,
    transactions: t.Arr,
    transaction_merkle_root: t.Str,
    witness: t.Str,
    witness_signature: t.Str
}, "Block");

let WalletTcomb = t.struct({
    public_name: t.Str,
    login_account_name: t.maybe(t.Str),
    password_checksum: t.Str,
    encrypted_brainkey: t.maybe(t.Str),
    brainkey_checksum: t.maybe(t.Str),
    brainkey_sequence: t.Num,
    created: t.Dat,
    last_modified: t.Dat,
    last_backup: t.maybe(t.Dat),
    chain_id: t.Str
}, "WalletTcomb");

let PrivateKeyTcomb = t.struct({
    id: t.maybe(t.Num),
    pubkey: t.Str,
    label: t.maybe(t.Str),
    import_account_names: t.maybe(t.Arr),
    // brainkey_pos: "0" = 1st owner key, "0.0" = 1st active for owner "0"
    brainkey_pos: t.maybe(t.Str),
    encrypted_key: t.Str
}, "PrivateKeyTcomb");

//let PublicKeyTcomb = t.struct({
//    id: t.maybe(t.Num),
//    pubkey: t.Str,
//    key_id: t.maybe(t.Str)
//}, "PublicKeyTcomb");

let Witness = t.struct({
    id: t.Str,
    next_secret_hash: t.Str,
    previous_secret: t.Str,
    signing_key: t.Str,
    url: t.Str,
    vote_id: t.Str,
    witness_account: t.Str
}, "Witness");

let Delegate = t.struct({
    id: t.Str,
    url: t.Str,
    committee_member_account: t.Str,
    vote_id: t.Str
}, "Delegate");

let GlobalObject = t.struct({
    active_committee_members: t.Arr,
    active_witnesses: t.Arr,
    id: t.Str,
    next_available_vote_id: t.Num,
    parameters: t.Obj
}, "GlobalObject");

let DynGlobalObject = t.struct({
    accounts_registered_this_interval: t.Num,
    current_witness: t.Str,
    //first_maintenance_block_with_current_interval: t.Num,
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

let CallOrder = t.struct({
    borrower: t.Str,
    call_price: t.Obj,
    collateral: t.Num,
    debt: t.Num,
    id: t.Str
}, "CallOrder");

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
    WalletTcomb: WalletTcomb,
    //PublicKeyTcomb: PublicKeyTcomb,
    PrivateKeyTcomb: PrivateKeyTcomb,
    Witness: Witness,
    Delegate: Delegate,
    GlobalObject: GlobalObject,
    DynGlobalObject: DynGlobalObject,
    LimitTrx: LimitTrx,
    ShortTrx: ShortTrx,
    LimitOrder: LimitOrder,
    ShortOrder: ShortOrder,
    CallOrder: CallOrder
};
