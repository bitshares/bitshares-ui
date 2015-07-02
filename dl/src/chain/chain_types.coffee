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

ChainTypes.vote_type=
    committee:0
    witness:1
    worker:2

# ./programs/js_operation_serializer
ChainTypes.operations=
    transfer: 0
    limit_order_create: 1
    limit_order_cancel: 2
    call_order_update: 3
    key_create: 4
    account_create: 5
    account_update: 6
    account_whitelist: 7
    account_upgrade: 8
    account_transfer: 9
    asset_create: 10
    asset_update: 11
    asset_update_bitasset: 12
    asset_update_feed_producers: 13
    asset_issue: 14
    asset_burn: 15
    asset_fund_fee_pool: 16
    asset_settle: 17
    asset_global_settle: 18
    asset_publish_feed: 19
    delegate_create: 20
    witness_create: 21
    witness_withdraw_pay: 22
    proposal_create: 23
    proposal_update: 24
    proposal_delete: 25
    withdraw_permission_create: 26
    withdraw_permission_update: 27
    withdraw_permission_claim: 28
    withdraw_permission_delete: 29
    fill_order: 30
    global_parameters_update: 31
    vesting_balance_create: 32
    vesting_balance_withdraw: 33
    worker_create: 34
    custom: 35
    assert: 36
    balance_claim: 37

