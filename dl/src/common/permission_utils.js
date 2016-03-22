import ChainStore from "api/ChainStore";
import Immutable from "immutable";

let permissionUtils = {

    AccountPermission: function(id, weight, threshold) {
        this.id = id;
        this.weight = weight;
        this.threshold = threshold;
        this.accounts = [];

        this.isAvailable = (auths) => {
            return auths.includes ? auths.includes(this.id) : auths.indexOf(this) !== -1;
        };

        this._sumWeights = (auths) => {

            if (!this.isNested()) {
                return this.isAvailable(auths) ? this.weight : 0;
            } else {
                let sum = this.accounts.reduce((status, account) => {
                    return status + (account._sumWeights(auths) ? account.weight : 0);
                }, 0);

                return Math.floor((sum / this.threshold)); 
            }
        }

        this.getStatus = (auths) => {
            if (!this.isNested()) {
                return this._sumWeights()
            } else {
                let sum = this.accounts.reduce((status, account) => {
                    return status + account._sumWeights(auths);
                }, 0);

                return sum;
            }
        }

        this.isNested = () => {
            return this.accounts.length > 0;
        }

        this.getMissingSigs = (auths) => {
            let missing  = [];
            let nested = [];
            if (this.isNested()) {
                nested = this.accounts.reduce((a, account) => {                    
                    return a.concat(account.getMissingSigs(auths));
                }, []);
            } else if (!this.isAvailable(auths)) {
                missing.push(this.id);
            }

            return missing.concat(nested);
        }
    },

    listToIDs: function(accountList) {
        let allAccounts = [];

        accountList.forEach(account => {
            if (account) {
                allAccounts.push(account.get ? account.get("id") : account);
            }
        });

        return allAccounts;
    },

    unravel: function(accountPermission, type, recursive_count = 0) {
        if (recursive_count < 3) {
            let account = ChainStore.getAccount(accountPermission.id);
            if (account && account.getIn([type, "account_auths"]).size) {
                account.getIn([type, "account_auths"]).forEach(auth => {
                    let nestedAccount = ChainStore.getAccount(auth.get(0));
                    if (nestedAccount) {
                        accountPermission.accounts.push(this.unravel(new this.AccountPermission(auth.get(0), auth.get(1), nestedAccount.getIn([type, "weight_threshold"])), type, recursive_count + 1));
                    } 
                })
            } 
        }

        return accountPermission;
    },

    unnest: function(accounts, type) {

        let map = [];
        accounts.forEach(id => {
            let fullAccount = ChainStore.getAccount(id);

            let currentPermission = this.unravel(new this.AccountPermission(id, null, fullAccount.getIn([type, "weight_threshold"])), type);
            map.push(currentPermission);
        });

        return map;
    },


    flatten_auths(auths, existingAuths = Immutable.List()) {
        if (!auths.size) {
            return existingAuths;
        }

        auths.forEach(owner => {
            if (!existingAuths.includes(owner.get(0))) {
                existingAuths = existingAuths.push(owner.get(0)); 
            }
        });
        return existingAuths;
    }
}

export default permissionUtils;
