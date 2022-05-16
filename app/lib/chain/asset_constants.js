module.exports = {
    permission_flags: {
        charge_market_fee: 0x01 /**< an issuer-specified percentage of all market trades in this asset is paid to the issuer */,
        white_list: 0x02 /**< accounts must be whitelisted in order to hold this asset */,
        override_authority: 0x04 /**< issuer may transfer asset back to himself */,
        transfer_restricted: 0x08 /**< require the issuer to be one party to every transfer */,
        disable_force_settle: 0x10 /**< disable force settling */,
        global_settle: 0x20 /**< allow the bitasset issuer to force a global settling -- this may be set in permissions, but not flags */,
        disable_confidential: 0x40 /**< allow the asset to be used with confidential transactions */,
        witness_fed_asset: 0x80 /**< allow the asset to be fed by witnesses */,
        committee_fed_asset: 0x100 /**< allow the asset to be fed by the committee */,
        lock_max_supply: 0x200, ///< the max supply of the asset can not be updated
        disable_new_supply: 0x400, ///< unable to create new supply for the asset
        disable_mcr_update: 0x800, ///< the bitasset owner can not update MCR, permission only
        disable_icr_update: 0x1000, ///< the bitasset owner can not update ICR, permission only
        disable_mssr_update: 0x2000, ///< the bitasset owner can not update MSSR, permission only
        disable_bsrm_update: 0x4000, ///< the bitasset owner can not update BSRM, permission only
        disable_collateral_bidding: 0x8000 ///< Can not bid collateral after a global settlement
    },
    uia_permission_mask: [
        "charge_market_fee",
        "white_list",
        "override_authority",
        "transfer_restricted",
        "disable_confidential"
    ],
    GRAPHENE_100_PERCENT: 10000,
    GRAPHENE_1_PERCENT: 10000 / 100,
    GRAPHENE_MAX_SHARE_SUPPLY: "1000000000000000"
};

/*

const static uint32_t ASSET_ISSUER_PERMISSION_MASK = charge_market_fee|white_list|override_authority|transfer_restricted|disable_force_settle|global_settle|disable_confidential
      |witness_fed_asset|committee_fed_asset;
const static uint32_t UIA_ASSET_ISSUER_PERMISSION_MASK = charge_market_fee|white_list|override_authority|transfer_restricted|disable_confidential;

 */
