module.exports = ChainTypes = {}

# types.hpp enum reserved_spaces
ChainTypes.reserved_spaces=
    relative_protocol_ids: 0
    protocol_ids: 1
    implementation_ids: 2

# types.hpp enum object_type
ChainTypes.object_type=
    null: 0
    base: 1
    key: 2
    account: 3
    asset: 4
    force_settlement: 5
    delegate: 6
    witness: 7
    limit_order: 8
    call_order: 9
    custom: 10
    proposal: 11
    operation_history: 12
    withdraw_permission: 13
    vesting_balance_object_type:14
    worker_object_type: 15

    
# ./programs/js_operation_serializer
ChainTypes.operations=
    transfer: 0
    limit_order_create: 1
    short_order_create: 2
    limit_order_cancel: 3
    short_order_cancel: 4
    call_order_update: 5
    key_create: 6
    account_create: 7
    account_update: 8
    account_whitelist: 9
    account_upgrade: 10
    account_transfer: 11
    asset_create: 12
    asset_update: 13
    asset_update_bitasset: 14
    asset_update_feed_producers: 15
    asset_issue: 16
    asset_burn: 17
    asset_fund_fee_pool: 18
    asset_settle: 19
    asset_global_settle: 20
    asset_publish_feed: 21
    delegate_create: 22
    witness_create: 23
    witness_withdraw_pay: 24
    proposal_create: 25
    proposal_update: 26
    proposal_delete: 27
    withdraw_permission_create: 28
    withdraw_permission_update: 29
    withdraw_permission_claim: 30
    withdraw_permission_delete: 31
    fill_order: 32
    global_parameters_update: 33
    vesting_balance_create: 34
    vesting_balance_withdraw: 35
    worker_create: 36
    custom: 37
