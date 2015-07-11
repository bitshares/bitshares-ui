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
    account: 2
    asset: 3
    force_settlement: 4
    delegate: 5
    witness: 6
    limit_order: 7
    call_order: 8
    custom: 9
    proposal: 10
    operation_history: 11
    withdraw_permission: 12
    vesting_balance: 13
    worker: 14
    balance: 15

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
    fill_order: 4
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
    asset_reserve: 15
    asset_fund_fee_pool: 16
    asset_settle: 17
    asset_global_settle: 18
    asset_publish_feed: 19
    witness_create: 20
    witness_withdraw_pay: 21
    proposal_create: 22
    proposal_update: 23
    proposal_delete: 24
    withdraw_permission_create: 25
    withdraw_permission_update: 26
    withdraw_permission_claim: 27
    withdraw_permission_delete: 28
    delegate_create: 29
    delegate_update_global_parameters: 30
    vesting_balance_create: 31
    vesting_balance_withdraw: 32
    worker_create: 33
    custom: 34
    assert: 35
    balance_claim: 36
    override_transfer: 37
