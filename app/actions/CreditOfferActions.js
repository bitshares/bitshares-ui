import alt from "alt-instance";
import WalletApi from "api/WalletApi";
import moment from "moment";
import {Asset} from "../lib/common/MarketClasses";
import WalletDb from "../stores/WalletDb";
import {Apis} from "bitsharesjs-ws";
import humanizeDuration from "humanize-duration";

export const FEE_RATE_DENOM = 1000000; // Denominator for SameT Fund fee calculation
export const listRepayPeriod = [43200, 86400, 259200, 604800, 2592000, 7776000, 31536000, 63072000, 157680000];

export const parsingTime = (time, locale) => {
    if (locale === "zh") locale = "zh_CN";
    return humanizeDuration(parseInt(time) * 1000, {
        language: locale,
        delimiter: " ",
        units: ["d", "h", "m"]
    });
};

class CreditOfferActions {
    create({
        owner_account,
        asset_type,
        balance,
        fee_rate,
        max_duration_seconds,
        min_deal_amount,
        auto_disable_time,
        acceptable_collateral,
        acceptable_borrowers = [],
        enabled = true,
        fee_asset = "1.3.0"
    }) {
        if (fee_asset instanceof Asset) {
            fee_asset = fee_asset.asset_id;
        } else if (typeof fee_asset !== "string") {
            fee_asset = fee_asset.get("id");
        }
        if (typeof asset_type !== "string") {
            asset_type = asset_type.get("id");
        }
        if (auto_disable_time instanceof moment) {
            auto_disable_time = auto_disable_time.toDate();
        }
        const tr = WalletApi.new_transaction();
        tr.add_type_operation("credit_offer_create", {
            fee: {
                amount: 0,
                asset_id: fee_asset
            },
            owner_account,
            asset_type,
            balance,
            fee_rate,
            max_duration_seconds,
            min_deal_amount,
            enabled,
            auto_disable_time,
            acceptable_collateral,
            acceptable_borrowers
        });
        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(res => {
                    dispatch({transaction: res});
                })
                .catch(error => {
                    console.log("CreditOfferActions create ----->", error);
                    dispatch({transaction: null});
                });
        };
    }

    update({
        owner_account,
        offer_id,
        delta_amount,
        fee_rate,
        max_duration_seconds,
        min_deal_amount,
        enabled = true,
        auto_disable_time,
        acceptable_collateral,
        acceptable_borrowers = [],
        fee_asset = "1.3.0"
    }) {
        if (fee_asset instanceof Asset) {
            fee_asset = fee_asset.asset_id;
        } else if (typeof fee_asset !== "string") {
            fee_asset = fee_asset.get("id");
        }
        if (auto_disable_time instanceof moment) {
            auto_disable_time = auto_disable_time.toDate();
        }
        const tr = WalletApi.new_transaction();
        tr.add_type_operation("credit_offer_update", {
            fee: {
                amount: 0,
                asset_id: fee_asset
            },
            owner_account,
            offer_id,
            delta_amount,
            fee_rate,
            max_duration_seconds,
            min_deal_amount,
            enabled,
            auto_disable_time,
            acceptable_collateral,
            acceptable_borrowers
        });
        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(res => {
                    dispatch({transaction: res});
                })
                .catch(error => {
                    console.log("CreditOfferActions update ----->", error);
                    dispatch({transaction: null});
                });
        };
    }

    disabled({owner_account, offer_id, enabled = false, fee_asset = "1.3.0"}) {
        if (typeof owner_account !== "string") {
            owner_account = owner_account.get("id");
        }
        const tr = WalletApi.new_transaction();
        tr.add_type_operation("credit_offer_update", {
            fee: {
                amount: 0,
                asset_id: fee_asset
            },
            owner_account,
            offer_id,
            enabled
        });
        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(res => {
                    dispatch({transaction: res});
                })
                .catch(error => {
                    console.log("CreditOfferActions disabled ----->", error);
                    dispatch({transaction: null});
                });
        };
    }

    delete({owner_account, offer_id, fee_asset = "1.3.0"}) {
        if (typeof owner_account !== "string") {
            owner_account = owner_account.get("id");
        }
        if (fee_asset instanceof Asset) {
            fee_asset = fee_asset.asset_id;
        } else if (typeof fee_asset !== "string") {
            fee_asset = fee_asset.get("id");
        }
        const tr = WalletApi.new_transaction();
        tr.add_type_operation("credit_offer_delete", {
            fee: {
                amount: 0,
                asset_id: fee_asset
            },
            owner_account,
            offer_id
        });
        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(res => {
                    dispatch({transaction: res});
                })
                .catch(error => {
                    console.log("CreditOfferActions delete ----->", error);
                    dispatch({transaction: null});
                });
        };
    }

    accept({
        borrower,
        offer_id,
        borrow_amount,
        collateral,
        max_fee_rate,
        min_duration_seconds,
        fee_asset = "1.3.0"
    }) {
        if (typeof borrower !== "string") {
            borrower = borrower.get("id");
        }
        if (fee_asset instanceof Asset) {
            fee_asset = fee_asset.asset_id;
        } else if (typeof fee_asset !== "string") {
            fee_asset = fee_asset.get("id");
        }
        const tr = WalletApi.new_transaction();
        tr.add_type_operation("credit_offer_accept", {
            fee: {
                amount: 0,
                asset_id: fee_asset
            },
            borrower,
            offer_id,
            borrow_amount,
            collateral,
            max_fee_rate,
            min_duration_seconds
        });
        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(res => {
                    dispatch({transaction: res});
                })
                .catch(error => {
                    console.log("CreditOfferActions delete ----->", error);
                    dispatch({transaction: null});
                });
        };
    }

    repay({account, deal_id, repay_amount, credit_fee, fee_asset = "1.3.0"}) {
        if (typeof account !== "string") {
            account = account.get("id");
        }
        if (fee_asset instanceof Asset) {
            fee_asset = fee_asset.asset_id;
        } else if (typeof fee_asset !== "string") {
            fee_asset = fee_asset.get("id");
        }
        const tr = WalletApi.new_transaction();
        tr.add_type_operation("credit_deal_repay", {
            fee: {
                amount: 0,
                asset_id: fee_asset
            },
            account,
            deal_id,
            repay_amount: repay_amount.toObject(),
            credit_fee: credit_fee.toObject()
        });
        return dispatch => {
            return WalletDb.process_transaction(tr, null, true)
                .then(res => {
                    dispatch({transaction: res});
                })
                .catch(error => {
                    console.log("CreditOfferActions create ----->", error);
                    dispatch({transaction: null});
                });
        };
    }

    getCreditOffersByOwner({
        name_or_id,
        limit = 100,
        start_id = null,
        flag = false
    }) {
        let pars = [name_or_id, limit, start_id];
        return dispatch => {
            Apis.instance()
                .db_api()
                .exec("get_credit_offers_by_owner", pars)
                .then(result => {
                    // console.log("result: ", result);
                    if (result && result.length == limit) {
                        dispatch({
                            list: result,
                            end:
                                flag === false || flag === "first"
                                    ? false
                                    : true,
                            flag,
                            pars: {name_or_id, limit, start_id}
                        });
                    } else {
                        dispatch({list: result, end: true, flag});
                    }
                })
                .catch(err => {
                    console.error(err);
                    dispatch({list: [], end: true, flag});
                });
        };
    }

    getCreditDealsByBorrower({
        name_or_id,
        limit = 100,
        start_id = null,
        flag = false
    }) {
        let pars = [name_or_id, limit, start_id];
        return dispatch => {
            Apis.instance()
                .db_api()
                .exec("get_credit_deals_by_borrower", pars)
                .then(result => {
                    // console.log("result: ", result);
                    if (result && result.length == limit) {
                        dispatch({
                            list: result,
                            end:
                                flag === false || flag === "first"
                                    ? false
                                    : true,
                            flag,
                            pars: {name_or_id, limit, start_id}
                        });
                    } else {
                        dispatch({
                            list: result,
                            end: true,
                            flag,
                            pars: {name_or_id, limit, start_id}
                        });
                    }
                })
                .catch(err => {
                    console.error(err);
                    dispatch({list: [], end: true, flag});
                });
        };
    }

    getCreditDealsByOfferOwner({
        name_or_id,
        limit = 100,
        start_id = null,
        flag = false
    }) {
        let pars = [name_or_id, limit, start_id];
        return dispatch => {
            Apis.instance()
                .db_api()
                .exec("get_credit_deals_by_offer_owner", pars)
                .then(result => {
                    // console.log("result: ", result);
                    if (result && result.length == limit) {
                        dispatch({
                            list: result,
                            end:
                                flag === false || flag === "first"
                                    ? false
                                    : true,
                            flag,
                            pars: {name_or_id, limit, start_id}
                        });
                    } else {
                        dispatch({list: result, end: true, flag});
                    }
                })
                .catch(err => {
                    console.error(err);
                    dispatch({list: [], end: true, flag});
                });
        };
    }

    getAll({limit = 100, start_id = null, flag = false}) {
        let pars = [limit, start_id];
        return dispatch => {
            Apis.instance()
                .db_api()
                .exec("list_credit_offers", pars)
                .then(result => {
                    // console.log("result: ", result);
                    if (result && result.length == limit) {
                        dispatch({
                            list: result,
                            end:
                                flag === false || flag === "first"
                                    ? false
                                    : true,
                            flag,
                            pars: {limit, start_id}
                        });
                    } else {
                        dispatch({list: result, end: true, flag});
                    }
                })
                .catch(err => {
                    console.error(err);
                    dispatch({list: [], end: true, flag});
                });
        };
    }
}

export default alt.createActions(CreditOfferActions);
