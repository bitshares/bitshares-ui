import {ChainStore} from "bitsharesjs/es";
import Immutable from "immutable";

let KeyAuth = function(auth) {
    this.id = auth.toJS ? auth.get(0) : auth[0];
    this.weight = auth.toJS ? auth.get(1) : auth[1];

    this.isAvailable = (auths) => {
        return auths.includes ? auths.includes(this.id) : auths.indexOf(this) !== -1;
    }
}

let permissionUtils = {

    AccountPermission: function(account, weight, type) {
        this.id = account.get("id");
        this.weight = weight;
        this.threshold = account.getIn([type, "weight_threshold"]);
        this.accounts = [];
        this.keys = account.getIn([type, "key_auths"]).map(auth => {
            return new KeyAuth(auth);
        }).toArray();

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

        this.getStatus = (auths, keyAuths) => {
            if (!this.isNested()) {
                return this._sumWeights(auths)
            } else {
                let sum = this.accounts.reduce((status, account) => {
                    return status + account._sumWeights(auths);
                }, 0);

                if (this.keys.length) {
                    let keySum = this.keys.reduce((s, key) => {
                        return s + (key.isAvailable(keyAuths) ? key.weight : 0);
                    }, 0);

                    sum += keySum;
                }

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

        this.getMissingKeys = (auths) => {
            let missing = [];
            let nested = [];
            if (this.keys.length && this.isNested()) {
                this.keys.forEach(key => {
                    if (!key.isAvailable(auths)) {
                        missing.push(key.id);
                    }
                });
            }

            if (this.isNested()) {
                nested = this.accounts.reduce((a, account) => {                    
                    return a.concat(account.getMissingKeys(auths));
                }, []);
            };

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
                        accountPermission.accounts.push(this.unravel(new this.AccountPermission(nestedAccount, auth.get(1), type), type, recursive_count + 1));
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
            let currentPermission = this.unravel(new this.AccountPermission(fullAccount, null, type), type);
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
