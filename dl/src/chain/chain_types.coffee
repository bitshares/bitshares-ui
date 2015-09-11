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
    committee_member: 5
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

ChainTypes.impl_object_type=
    global_property: 0
    dynamic_global_property: 1
    index_meta: 2
    asset_dynamic_data: 3
    asset_bitasset_data: 4
    account_balance: 5
    account_statistics: 6
    transaction: 7
    block_summary: 8
    account_transaction_history: 9
    blinded_balance: 10
    chain_property: 11

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
    witness_update: 21
    proposal_create: 22
    proposal_update: 23
    proposal_delete: 24
    withdraw_permission_create: 25
    withdraw_permission_update: 26
    withdraw_permission_claim: 27
    withdraw_permission_delete: 28
    committee_member_create: 29
    committee_member_update: 30
    committee_member_update_global_parameters: 31
    vesting_balance_create: 32
    vesting_balance_withdraw: 33
    worker_create: 34
    custom: 35
    assert: 36
    balance_claim: 37
    override_transfer: 38
    transfer_to_blind: 39
    blind_transfer: 40
    transfer_from_blind: 41
