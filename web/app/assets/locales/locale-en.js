module.exports = {
    languages: {
        en: "English",
        cn: "简体中文",
        fr: "French",
        ko: "한국어",
        switch: "Switch language"
    },
    header: {
        title: "Graphene UI",
        dashboard: "Dashboard",
        explorer: "Explorer",
        exchange: "Exchange",
        payments: "Payments",
        logout: "Logout",
        settings: "Settings",
        current: "Current Account"
    },
    account: {
        asset: "Asset",
        market_value: "Market Value",
        hour_24: "24hr Change",
        recent: "Recent activity",
        name: "Account name",
        member: {
            stats: "Member stats",
            join: "Joined on",
            reg: "Registered by",
            ref: "Referred by",
            referrals: "Referrals",
            rewards: "Cashback Rewards",
            cashback: "Cashback",
            vested: "Vested"
        },
        connections: {
            known: "Known by",
            "black": "Blacklisted by"
        }
    },
    transfer: {
        from: "From",
        amount: "Amount",
        to: "To",
        memo: "Memo",
        fee: "Fee",
        send: "Send",
        final: "Final balance",
        balances: "Balances",
        errors: {
            req: "Required field",
            pos: "Amount must be positive",
            valid: "Please enter a valid, positive number"
        },
        back: "BACK",
        confirm: "CONFIRM",
        broadcast: "Your transfer has been broadcast to the network",
        again: "MAKE ANOTHER TRANSFER",
        see: "SEE MY TRANSFERS"
    },
    transaction: {
        sent: "Sent",
        to: "to",
        received: "Received",
        from: "from",
        amount_sell: "Amount to sell",
        expiration: "Expiration",
        fill_or: "Fill or kill",
        min_receive: "Minimum amount to receive",
        seller: "Seller",
        collateral: "Collateral",
        coll_ratio: "Initial collateral ratio",
        coll_maint: "Collateral maintenance ratio",
        "create_key": "Created a public key",
        reg_account: "Registered the account",
        was_reg_account: "registered by",
        create_asset: "Created the asset",
        limit_order: "Placed limit order to sell",
        limit_order_buy: "Placed limit order to buy",
        limit_order_cancel: "Cancelled limit order with id",
        short_order: "Placed short order to sell",
        short_order_cancel: "Cancelled short with id",
        at: "at",
        coll_of: "with collateral of",
        call_order_update: "Updated call order",
        upgrade_account: "Upgraded the account to lifetime member",
        update_account: "Updated account",
        whitelist_account: "Whitelisted the account",
        whitelisted_by: "Was whitelisted by the account",
        transfer_account: "Transferred the account",
        update_asset: "Updated the asset",
        update_feed_producers: "Updated the feed producers of asset",
        feed_producer: "Became a feed producer for the asset",
        asset_issue: "Issued",
        was_issued: "Was issued",
        by: "by",
        burn_asset: "Burnt",
        fund_pool: "Funded asset fee pool with",
        asset_settle: "Requested settlement of",
        asset_global_settle: "Requested global settlement of",
        publish_feed: "Published new feed for asset",
        delegate_create: "Created the delegate",
        witness_create: "Created the witness",
        witness_pay: "Withdrew witness pay to account",
        witness_receive: "Received witness from witness",
        proposal_create: "Created a proposal",
        proposal_update: "Updated a proposal",
        proposal_delete: "Deleted a proposal",
        withdraw_permission_create: "Gave withdrawal permission for account",
        withdraw_permission_update: "Updated withdrawal permission for account",
        withdraw_permission_claim: "Claimed withdrawal permission for account",
        withdraw_permission_delete: "Deleted withdrawal permissions for account",
        paid: "Paid",
        obtain: "to obtain",
        global_parameters_update: "Updated global parameters",
        file_write: "Wrote a file",
        vesting_balance_create: "created vesting balance of",
        for: "for",
        vesting_balance_withdraw: "Withdrew vesting balance of",
        bond_create_offer: "Created bond offer",
        bond_cancel_offer: "Cancelled bond offer",
        bond_accept_offer: "Accepted bond offer of",
        bond_claim_collateral: "Claimed collateral of",
        bond_pay_collateral: "Paid collateral of",
        create_worker: "Created a worker with a pay of",
        custom: "Created a custom operation",
        order_id: "Order ID",
        trxTypes: {
            0: "Transfer",
            1: "Limit order",
            2: "Cancel limit order",
            3: "Update call order",
            4: "Create account",
            5: "Account update",
            6: "Account whitelist",
            7: "Account upgrade",
            8: "Account transfer",
            9: "Create asset",
            10: "Update asset",
            11: "Update SmartCoin",
            12: "Update asset feed producers",
            13: "Issue asset",
            14: "Burn asset",
            15: "Fund asset fee pool",
            16: "Asset settlement",
            17: "Global asset settlement",
            18: "Publish asset feed",
            19: "Create delegate",
            20: "Create witness",
            21: "Witness pay withdrawal",
            22: "Create proposal",
            23: "Update proposal",
            24: "Delete proposal",
            25: "Create withdrawal permission",
            26: "Update withdrawal permission",
            27: "Claim withdrawal permission",
            28: "Delete withdrawal permission",
            29: "Fill order",
            30: "Global parameters update",
            31: "Create vesting balance",
            32: "Withdraw vesting balance",
            33: "Create worker",
            34: "Custom"
        }
    },
    explorer: {
        accounts: {
            title: "Accounts"
        },
        blocks: {
            title: "Blockchain",
            globals: "Global parameters",
            recent: "Recent blocks"
        },
        block: {
            title: "Block",
            id: "Block ID",
            witness: "Witness",
            count: "Transaction count",
            date: "Date",
            previous: "Previous",
            previous_secret: "Previous secret",
            next_secret: "Next secret hash",
            op: "Operation",
            trx: "Transaction",
            op_type: "Operation type",
            fee_payer: "Fee paying account",
            key: "Public key",
            transactions: "Transaction count",
            account_upgrade: "Account to upgrade",
            lifetime: "Upgrade to lifetime member",
            authorizing_account: "Authorizing account",
            listed_account: "Listed account",
            new_listing: "New listing",
            asset_update: "Asset to update",
            common_options: "Common options",
            new_options: "New options",
            new_producers: "New feed producers",
            asset_issue: "Amount to issue",
            max_margin_period_sec: "Max margin period (s)",
            call_limit: "Call limit",
            short_limit: "Short limit",
            settlement_price: "Settlement price"
        },
        assets: {
            title: "Assets",
            market: "SmartCoins",
            user: "User Issued Assets",
            symbol: "Symbol",
            id: "ID",
            issuer: "Issuer",
            precision: "Precision"
        },
        asset: {
            title: "Asset"
        },
        witnesses: {
            title: "Witnesses"
        },      
        delegates: {
            title: "Delegates"
        },
        delegate: {
            title: "Delegate"
        },
        workers: {
            title: "Workers"
        },
        proposals: {
            title: "Proposals"
        },
        account: {
            title: "Account"
        }
    },
    settings: {
        inversed: "Market orientation preference",
        unit: "Preferred unit of account"
    }
};
