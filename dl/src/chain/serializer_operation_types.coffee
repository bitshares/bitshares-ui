##  Generated code below

SerializerImpl = require './serializer'

sr_type = require './serializer_types'
uint8 = sr_type.uint8
uint16 = sr_type.uint16
uint32 = sr_type.uint32
varint32 = sr_type.varint32
int64 = sr_type.int64
uint64 = sr_type.uint64
string = sr_type.string
bytes = sr_type.bytes
bool = sr_type.bool
array = sr_type.array
fixed_array = sr_type.fixed_array
#id_type = sr_type.id_type
protocol_id_type = sr_type.protocol_id_type
object_id_type = sr_type.object_id_type
vote_id = sr_type.vote_id
optional = sr_type.optional
static_variant = sr_type.static_variant
map = sr_type.map
set = sr_type.set
public_key = sr_type.public_key
address = sr_type.address
time_point_sec = sr_type.time_point_sec

###
When updating generated code
Replace:  operation = static_variant [
with:     operation.st_operations = [

Delete:
operation  = new Serializer( 
    "operation "
    op: operation
)
address = new Serializer( 
    "address"
    addr: bytes 20
)
public_key = new Serializer( 
    "public_key"
    key_data: bytes 33
)

###

# Place-holder, their are dependencies on "operation" .. The final list of
# operations is not avialble until the very end of the generated code.
# See: operation.st_operations = ...
operation = static_variant()
module.exports["operation"] = operation

# For module.exports
Serializer=(operation_name, serilization_types_object)->
    s = new SerializerImpl operation_name, serilization_types_object
    module.exports[operation_name] = s

## -------------------------------
##  Generated code follows
# programs/js_operation_serializer
# / +$//g
## -------------------------------

void_header = new Serializer( 
    "void_header"
)

header_extension = static_variant [
    void_header
]

void_result = new Serializer( 
    "void_result"
)

asset = new Serializer( 
    "asset"
    amount: int64
    asset_id: protocol_id_type "asset"
)

operation_result = static_variant [
    void_result    
    object_id_type    
    asset
]

processed_transaction = new Serializer( 
    "processed_transaction"
    ref_block_num: uint16
    ref_block_prefix: uint32
    relative_expiration: uint16
    operations: array operation
    signatures: map (protocol_id_type "key"), (bytes 65)
    operation_results: array operation_result
)

signed_block = new Serializer( 
    "signed_block"
    previous: bytes 20
    timestamp: time_point_sec
    witness: protocol_id_type "witness"
    next_secret_hash: bytes 28
    previous_secret: bytes 28
    transaction_merkle_root: bytes 20
    extensions: array header_extension
    delegate_signature: bytes 65
    transactions: array processed_transaction
)

block_header = new Serializer( 
    "block_header"
    previous: bytes 20
    timestamp: time_point_sec
    witness: protocol_id_type "witness"
    next_secret_hash: bytes 28
    previous_secret: bytes 28
    transaction_merkle_root: bytes 20
    extensions: array header_extension
)

signed_block_header = new Serializer( 
    "signed_block_header"
    previous: bytes 20
    timestamp: time_point_sec
    witness: protocol_id_type "witness"
    next_secret_hash: bytes 28
    previous_secret: bytes 28
    transaction_merkle_root: bytes 20
    extensions: array header_extension
    delegate_signature: bytes 65
)

memo_data = new Serializer( 
    "memo_data"
    from: protocol_id_type "key"
    to: protocol_id_type "key"
    nonce: uint64
    message: bytes()
)

transfer = new Serializer( 
    "transfer"
    fee: asset
    from: protocol_id_type "account"
    to: protocol_id_type "account"
    amount: asset
    memo: optional memo_data
)

limit_order_create = new Serializer( 
    "limit_order_create"
    fee: asset
    seller: protocol_id_type "account"
    amount_to_sell: asset
    min_to_receive: asset
    expiration: time_point_sec
    fill_or_kill: bool
)

short_order_create = new Serializer( 
    "short_order_create"
    fee: asset
    seller: protocol_id_type "account"
    amount_to_sell: asset
    collateral: asset
    initial_collateral_ratio: uint16
    maintenance_collateral_ratio: uint16
    expiration: time_point_sec
)

limit_order_cancel = new Serializer( 
    "limit_order_cancel"
    fee: asset
    fee_paying_account: protocol_id_type "account"
    order: protocol_id_type "limit_order"
)

short_order_cancel = new Serializer( 
    "short_order_cancel"
    fee: asset
    fee_paying_account: protocol_id_type "account"
    order: protocol_id_type "short_order"
)

call_order_update = new Serializer( 
    "call_order_update"
    fee: asset
    funding_account: protocol_id_type "account"
    collateral_to_add: asset
    amount_to_cover: asset
    maintenance_collateral_ratio: uint16
)

key_data = static_variant [
    address    
    public_key
]

key_create = new Serializer( 
    "key_create"
    fee: asset
    fee_paying_account: protocol_id_type "account"
    key_data: key_data
)

authority = new Serializer( 
    "authority"
    weight_threshold: uint32
    auths: map (object_id_type), (uint16)
)

account_create = new Serializer( 
    "account_create"
    fee: asset
    registrar: protocol_id_type "account"
    referrer: protocol_id_type "account"
    referrer_percent: uint8
    name: string
    owner: authority
    active: authority
    voting_account: protocol_id_type "account"
    memo_key: object_id_type
    num_witness: uint16
    num_committee: uint16
    vote: set vote_id
)

account_update = new Serializer( 
    "account_update"
    fee: asset
    account: protocol_id_type "account"
    owner: optional authority
    active: optional authority
    voting_account: optional protocol_id_type "account"
    memo_key: optional object_id_type
    num_witness: uint16
    num_committee: uint16
    vote: optional set vote_id
)

account_whitelist = new Serializer( 
    "account_whitelist"
    fee: asset
    authorizing_account: protocol_id_type "account"
    account_to_list: protocol_id_type "account"
    new_listing: uint8
)

account_upgrade = new Serializer( 
    "account_upgrade"
    fee: asset
    account_to_upgrade: protocol_id_type "account"
    upgrade_to_lifetime_member: bool
)

account_transfer = new Serializer( 
    "account_transfer"
    fee: asset
    account_id: protocol_id_type "account"
    new_owner: protocol_id_type "account"
)

price = new Serializer( 
    "price"
    base: asset
    quote: asset
)

asset_object_asset_options = new Serializer( 
    "asset_object_asset_options"
    max_supply: int64
    market_fee_percent: uint16
    max_market_fee: int64
    min_market_fee: int64
    issuer_permissions: uint16
    flags: uint16
    core_exchange_rate: price
    whitelist_authorities: set protocol_id_type "account"
    blacklist_authorities: set protocol_id_type "account"
    whitelist_markets: set protocol_id_type "asset"
    blacklist_markets: set protocol_id_type "asset"
)

asset_object_bitasset_options = new Serializer( 
    "asset_object_bitasset_options"
    feed_lifetime_sec: uint32
    force_settlement_delay_sec: uint32
    force_settlement_offset_percent: uint16
    maximum_force_settlement_volume: uint16
    short_backing_asset: protocol_id_type "asset"
)

asset_create = new Serializer( 
    "asset_create"
    fee: asset
    issuer: protocol_id_type "account"
    symbol: string
    precision: uint8
    common_options: asset_object_asset_options
    bitasset_options: optional asset_object_bitasset_options
    is_prediction_market: bool
)

asset_update = new Serializer( 
    "asset_update"
    fee: asset
    issuer: protocol_id_type "account"
    asset_to_update: protocol_id_type "asset"
    new_issuer: optional protocol_id_type "account"
    new_options: asset_object_asset_options
)

asset_update_bitasset = new Serializer( 
    "asset_update_bitasset"
    fee: asset
    issuer: protocol_id_type "account"
    asset_to_update: protocol_id_type "asset"
    new_options: asset_object_bitasset_options
)

asset_update_feed_producers = new Serializer( 
    "asset_update_feed_producers"
    fee: asset
    issuer: protocol_id_type "account"
    asset_to_update: protocol_id_type "asset"
    new_feed_producers: set protocol_id_type "account"
)

asset_issue = new Serializer( 
    "asset_issue"
    fee: asset
    issuer: protocol_id_type "account"
    asset_to_issue: asset
    issue_to_account: protocol_id_type "account"
    memo: optional memo_data
)

asset_burn = new Serializer( 
    "asset_burn"
    fee: asset
    payer: protocol_id_type "account"
    amount_to_burn: asset
)

asset_fund_fee_pool = new Serializer( 
    "asset_fund_fee_pool"
    fee: asset
    from_account: protocol_id_type "account"
    asset_id: protocol_id_type "asset"
    amount: int64
)

asset_settle = new Serializer( 
    "asset_settle"
    fee: asset
    account: protocol_id_type "account"
    amount: asset
)

asset_global_settle = new Serializer( 
    "asset_global_settle"
    fee: asset
    issuer: protocol_id_type "account"
    asset_to_settle: protocol_id_type "asset"
    settle_price: price
)

price_feed = new Serializer( 
    "price_feed"
    call_limit: price
    short_limit: price
    settlement_price: price
    max_margin_period_sec: uint32
    required_initial_collateral: uint16
    required_maintenance_collateral: uint16
)

asset_publish_feed = new Serializer( 
    "asset_publish_feed"
    fee: asset
    publisher: protocol_id_type "account"
    asset_id: protocol_id_type "asset"
    feed: price_feed
)

delegate_create = new Serializer( 
    "delegate_create"
    fee: asset
    delegate_account: protocol_id_type "account"
)

witness_create = new Serializer( 
    "witness_create"
    fee: asset
    witness_account: protocol_id_type "account"
    block_signing_key: protocol_id_type "key"
    initial_secret: bytes 28
)

witness_withdraw_pay = new Serializer( 
    "witness_withdraw_pay"
    fee: asset
    from_witness: protocol_id_type "witness"
    to_account: protocol_id_type "account"
    amount: int64
)

proposal_create = new Serializer( 
    "proposal_create"
    fee: asset
    fee_paying_account: protocol_id_type "account"
    expiration_time: time_point_sec
    proposed_ops: array operation 
    review_period_seconds: optional uint32
)

proposal_update = new Serializer( 
    "proposal_update"
    fee: asset
    fee_paying_account: protocol_id_type "account"
    proposal: protocol_id_type "proposal"
    active_approvals_to_add: set protocol_id_type "account"
    active_approvals_to_remove: set protocol_id_type "account"
    owner_approvals_to_add: set protocol_id_type "account"
    owner_approvals_to_remove: set protocol_id_type "account"
    key_approvals_to_add: set protocol_id_type "key"
    key_approvals_to_remove: set protocol_id_type "key"
)

proposal_delete = new Serializer( 
    "proposal_delete"
    fee: asset
    fee_paying_account: protocol_id_type "account"
    using_owner_authority: bool
    proposal: protocol_id_type "proposal"
)

withdraw_permission_create = new Serializer( 
    "withdraw_permission_create"
    fee: asset
    withdraw_from_account: protocol_id_type "account"
    authorized_account: protocol_id_type "account"
    withdrawal_limit: asset
    withdrawal_period_sec: uint32
    periods_until_expiration: uint32
    period_start_time: time_point_sec
)

withdraw_permission_update = new Serializer( 
    "withdraw_permission_update"
    fee: asset
    withdraw_from_account: protocol_id_type "account"
    authorized_account: protocol_id_type "account"
    permission_to_update: protocol_id_type "withdraw_permission"
    withdrawal_limit: asset
    withdrawal_period_sec: uint32
    period_start_time: time_point_sec
    periods_until_expiration: uint32
)

withdraw_permission_claim = new Serializer( 
    "withdraw_permission_claim"
    fee: asset
    withdraw_permission: protocol_id_type "withdraw_permission"
    withdraw_from_account: protocol_id_type "account"
    withdraw_to_account: protocol_id_type "account"
    amount_to_withdraw: asset
    memo: optional memo_data
)

withdraw_permission_delete = new Serializer( 
    "withdraw_permission_delete"
    fee: asset
    withdraw_from_account: protocol_id_type "account"
    authorized_account: protocol_id_type "account"
    withdrawal_permission: protocol_id_type "withdraw_permission"
)

fill_order = new Serializer( 
    "fill_order"
    fee: asset
    order_id: object_id_type
    account_id: protocol_id_type "account"
    pays: asset
    receives: asset
)

fee_schedule = new Serializer( 
    "fee_schedule"
    key_create_fee: uint32
    account_create_fee: uint32
    account_len8_fee: uint32
    account_len7_fee: uint32
    account_len6_fee: uint32
    account_len5_fee: uint32
    account_len4_fee: uint32
    account_len3_fee: uint32
    account_len2_fee: uint32
    account_premium_fee: uint32
    account_whitelist_fee: uint32
    delegate_create_fee: uint32
    witness_withdraw_pay_fee: uint32
    transfer_fee: uint32
    limit_order_fee: uint32
    short_order_fee: uint32
    publish_feed_fee: uint32
    asset_create_fee: uint32
    asset_update_fee: uint32
    asset_issue_fee: uint32
    asset_fund_fee_pool_fee: uint32
    asset_settle_fee: uint32
    market_fee: uint32
    transaction_fee: uint32
    data_fee: uint32
    signature_fee: uint32
    global_parameters_update_fee: uint32
    membership_annual_fee: uint32
    membership_lifetime_fee: uint32
    withdraw_permission_update_fee: uint32
    create_bond_offer_fee: uint32
    cancel_bond_offer_fee: uint32
    accept_bond_offer_fee: uint32
    claim_bond_collateral_fee: uint32
    file_storage_fee_per_day: uint32
    vesting_balance_create_fee: uint32
    vesting_balance_withdraw_fee: uint32
    global_settle_fee: uint32
    worker_create_fee: uint32
    worker_delete_fee: uint32
)

chain_parameters = new Serializer( 
    "chain_parameters"
    current_fees: fee_schedule
    block_interval: uint8
    maintenance_interval: uint32
    maximum_transaction_size: uint32
    maximum_block_size: uint32
    maximum_undo_history: uint32
    maximum_time_until_expiration: uint32
    maximum_proposal_lifetime: uint32
    maximum_asset_whitelist_authorities: uint8
    maximum_asset_feed_publishers: uint8
    maximum_authority_membership: uint16
    burn_percent_of_fee: uint16
    network_percent_of_fee: uint16
    lifetime_referrer_percent_of_fee: uint16
    max_bulk_discount_percent_of_fee: uint16
    cashback_vesting_period_seconds: uint32
    cashback_vesting_threshold: int64
    bulk_discount_threshold_min: int64
    bulk_discount_threshold_max: int64
    count_non_member_votes: bool
    allow_non_member_whitelists: bool
    witness_pay_per_block: int64
    worker_budget_per_day: int64
)

global_parameters_update = new Serializer( 
    "global_parameters_update"
    fee: asset
    new_parameters: chain_parameters
)

file_write = new Serializer( 
    "file_write"
    fee: asset
    payer: protocol_id_type "account"
    file_id: protocol_id_type "file"
    owner: protocol_id_type "account"
    group: protocol_id_type "account"
    flags: uint8
    offset: uint16
    data: bytes()
    lease_seconds: uint32
    file_size: uint16
    precondition_checksum: optional bytes 20
)

vesting_balance_create = new Serializer( 
    "vesting_balance_create"
    fee: asset
    creator: protocol_id_type "account"
    owner: protocol_id_type "account"
    amount: asset
    vesting_seconds: uint32
)

vesting_balance_withdraw = new Serializer( 
    "vesting_balance_withdraw"
    fee: asset
    vesting_balance: protocol_id_type "vesting_balance"
    owner: protocol_id_type "account"
    amount: asset
)

bond_create_offer = new Serializer( 
    "bond_create_offer"
    fee: asset
    creator: protocol_id_type "account"
    offer_to_borrow: bool
    amount: asset
    min_match: int64
    collateral_rate: price
    min_loan_period_sec: uint32
    loan_period_sec: uint32
    interest_apr: uint16
)

bond_cancel_offer = new Serializer( 
    "bond_cancel_offer"
    fee: asset
    creator: protocol_id_type "account"
    offer_id: protocol_id_type "bond_offer"
    refund: asset
)

bond_accept_offer = new Serializer( 
    "bond_accept_offer"
    fee: asset
    claimer: protocol_id_type "account"
    lender: protocol_id_type "account"
    borrower: protocol_id_type "account"
    offer_id: protocol_id_type "bond_offer"
    amount_borrowed: asset
    amount_collateral: asset
)

bond_claim_collateral = new Serializer( 
    "bond_claim_collateral"
    fee: asset
    claimer: protocol_id_type "account"
    lender: protocol_id_type "account"
    bond_id: protocol_id_type "bond"
    payoff_amount: asset
    collateral_claimed: asset
)

refund_worker_type_initializer = new Serializer( 
    "refund_worker_type_initializer"
)

vesting_balance_worker_type_initializer = new Serializer( 
    "vesting_balance_worker_type_initializer"
    pay_vesting_period_days: uint16
)

initializer_type = static_variant [
    refund_worker_type_initializer    
    vesting_balance_worker_type_initializer
]

worker_create = new Serializer( 
    "worker_create"
    fee: asset
    owner: protocol_id_type "account"
    work_begin_date: time_point_sec
    work_end_date: time_point_sec
    daily_pay: int64
    initializer: initializer_type
)

custom = new Serializer( 
    "custom"
    fee: asset
    payer: protocol_id_type "account"
    required_auths: set protocol_id_type "account"
    id: uint16
    data: bytes()
)

operation.st_operations = [
    transfer    
    limit_order_create    
    short_order_create    
    limit_order_cancel    
    short_order_cancel    
    call_order_update    
    key_create    
    account_create    
    account_update    
    account_whitelist    
    account_upgrade    
    account_transfer    
    asset_create    
    asset_update    
    asset_update_bitasset    
    asset_update_feed_producers    
    asset_issue    
    asset_burn    
    asset_fund_fee_pool    
    asset_settle    
    asset_global_settle    
    asset_publish_feed    
    delegate_create    
    witness_create    
    witness_withdraw_pay    
    proposal_create    
    proposal_update    
    proposal_delete    
    withdraw_permission_create    
    withdraw_permission_update    
    withdraw_permission_claim    
    withdraw_permission_delete    
    fill_order    
    global_parameters_update    
    file_write    
    vesting_balance_create    
    vesting_balance_withdraw    
    bond_create_offer    
    bond_cancel_offer    
    bond_accept_offer    
    bond_claim_collateral    
    worker_create    
    custom
]

transaction = new Serializer( 
    "transaction"
    ref_block_num: uint16
    ref_block_prefix: uint32
    relative_expiration: uint16
    operations: array operation
)

signed_transaction = new Serializer( 
    "signed_transaction"
    ref_block_num: uint16
    ref_block_prefix: uint32
    relative_expiration: uint16
    operations: array operation
    signatures: map (protocol_id_type "key"), (bytes 65)
)

## -------------------------------
##  Generated code end
# programs/js_operation_serializer
## -------------------------------
