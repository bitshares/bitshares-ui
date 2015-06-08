module.exports = ChainTypes = {}

ChainTypes.reserved_spaces=
    relative_protocol_ids: 0
    protocol_ids: 1
    implementation_ids: 2

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
    short_order: 9
    call_order: 10
    custom: 11
    proposal: 12
    operation_history: 13
    withdraw_permission: 14
    bond_offer: 15
    bond: 16
    file: 17
    vesting_balance_object_type:18
    worker_object_type: 19 

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
    account_transfer: 10
    asset_create: 11
    asset_update: 12
    asset_update_bitasset: 13
    asset_update_feed_producers: 14
    asset_issue: 15
    asset_burn: 16
    asset_fund_fee_pool: 17
    asset_settle: 18
    asset_global_settle: 19
    asset_publish_feed: 20
    delegate_create: 21
    witness_create: 22
    witness_withdraw_pay: 23
    proposal_create: 24
    proposal_update: 25
    proposal_delete: 26
    withdraw_permission_create: 27
    withdraw_permission_update: 28
    withdraw_permission_claim: 29
    withdraw_permission_delete: 30
    fill_order: 31
    global_parameters_update: 32
    file_write: 33
    vesting_balance_create: 34
    vesting_balance_withdraw: 35
    bond_create_offer: 36
    bond_cancel_offer: 37
    bond_accept_offer: 38
    bond_claim_collateral: 39
    worker_create: 40
    custom: 41
