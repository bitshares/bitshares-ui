import assert from "assert"
import { fromJS, Map, List, Set } from "immutable"
import { PrivateKey, PublicKey, Aes, brainKey, hash, key } from "@graphene/ecc"
import { fetchChain, config, chain_types, Apis, TransactionBuilder, number_utils } from "@graphene/chain"
import { ops } from "@graphene/serializer"
import AddressIndex from "./AddressIndex"

import ByteBuffer from "bytebuffer"

let { stealth_memo_data, stealth_confirmation, blind_transfer, transfer_from_blind } = ops
let { toImpliedDecimal } = number_utils
let Long = ByteBuffer.Long

/** This class is used for stealth transfers.

    Serilizable persisterent state (JSON serilizable types only)..  This is the data used by this class and kept in walletStorage.wallet_object:

    ```js
    const empty_wallet = fromJS({
        blind_receipts: [ see this.receiveBlindTransfer()  ],
        keys: {
            "pubkey": {
                //  No two keys can have the same label, no two labels can have the same key
                label: t.maybe(t.Str),
                import_account_names: t.maybe(t.Arr),
                brainkey_sequence: t.maybe(t.Num),
                private_wif: t.Str, // was: encrypted_key: t.Str
                index_address: false // Mark legacy keys for address indexing (addresses are calculated outside of this wallet backup)  
            }
        }
    })
    ```
 */
export default class ConfidentialWallet {
    
    constructor( walletStorage ) {
        // The walletStorage format is documented as comments at the bottom of this file..
        this.wallet = req(walletStorage, "walletStorage")
        
        // Convenience function to access the wallet object (ensure friendly return values)
        this.keys = () => this.wallet.wallet_object.getIn(["keys"], Map())
        this.blind_receipts = () => this.wallet.wallet_object.get("blind_receipts", List())
        this.commitments = (receipts = this.blind_receipts()) => receipts
            .reduce( (r, receipt) => r.push(receipt.getIn(["data", "commitment"])), List())
        
        // BTS 1.0 addresses for shorts and balance claims
        this.addressIndex = new AddressIndex()
        // this.addressIndex.add( indexableKeys( this.keys() ))
        
        // semi-private methods (outside of this API)
        this.update = update.bind(this)// update the wallet object
        this.assertLogin = assertLogin.bind(this)
        this.getPubkeys_having_PrivateKey = getPubkeys_having_PrivateKey.bind(this)
        this.blind_transfer_help = blind_transfer_help.bind(this)
        this.fetch_blinded_balances = fetch_blinded_balances.bind(this)
        this.send_blind_tr = send_blind_tr.bind(this)
    }
    
    /**
        This method can be used to set or change the label for a public_key.

        This is a one-to-one: one key per label, one label per key.  If there is a conflict, the label is renamed.  A label is optional so their may be any number of unlabeled keys. 

        @arg {PrivateKey|PublicKey|string} key - Key object or public_key string (like: GPHXyz...)
        
        @arg {string} [label = null] - string (like: GPHXyz...).  Required if a private key is not provided.  If provided, must be unique or this method will return false.
        
        @arg {boolean} [index_address = false] - set truthy only if this could be a BTS 1.0 key having a legacy address format (Protoshares, etc.).  Unless true, the user may not see some shorts or balance claims.  A private key object is requred if this is used.
        
        @arg {PublicKey|string} public_key - this is provided for performanc gains where it is already known.  A private key object is requred if this is used.
        
        @return {boolean} false if this label is already assigned, otherwise a wallet update is sent over to the WalletStorage object.
     */
    setKeyLabel( key, label = null, index_address = false, public_key = null ) {
        
        this.assertLogin()
        assert( key, "key is required (a public or private key)" )
        
        let private_key
        if(key.d) {
            private_key = key
        } else {
            if( ! public_key )
                public_key = key
        }
        
        if( ! public_key ) {
            assert( private_key.d, "PrivateKey object is required since public key was not provided")
            public_key = private_key.toPublicKey()
        }
        
        private_key = toString(private_key)
        public_key = toString(public_key)

        if( index_address ) {
            req(private_key, "private_key required to derive addresses")
        }
        
        if( ! label )
            req(private_key, "Label is required unless a private key is provided")
        
        let keys = this.keys()
        if( label ) {
            let key = keys.find( key => key.get("label") === label )
            if( key != null )
                // this label is already assigned
                return false
        }
        let indexables = List().asMutable()
        this.update(wallet =>
            wallet.updateIn(["keys", public_key], Map(),
                key => key.withMutations( key =>{
                    if( label ) key.set("label", label)
                    if( index_address )
                        key.set("index_address", true)
                    
                    if( private_key )
                        key.set("private_wif", private_key)
                    
                    if( index_address )
                        indexables.push(public_key)
                    
                    return key
                })
            )
        )
        this.addressIndex.add( indexables.asImmutable() )
        return true
    }
    
    /**
        @return {string} label or null
    */
    getKeyLabel( public_key ) {
        
        this.assertLogin()
        public_key = toString(req(public_key, "public_key"))
        
        let key = this.keys().get(public_key)
        // let key = this.wallet.wallet_object.getIn(["keys", public_key])
        return key ? key.get("label") : null
    }
    
    /**
        @arg {string} pubkey_or_label
        @return {PublicKey} or null
    */
    getPublicKey( pubkey_or_label ) {
        
        this.assertLogin()
        req(pubkey_or_label, "pubkey_or_label")
        
        if( pubkey_or_label.Q )
            return pubkey_or_label
            
        try {
            return PublicKey.fromStringOrThrow(pubkey_or_label)
        } catch(e) {}
        
        let keys = this.keys()
        let pubkey = keys.findKey( key => key.get("label") === pubkey_or_label )
        if( ! pubkey)
            return null
        
        return PublicKey.fromStringOrThrow( pubkey )
    }
    
    /**
        @arg {PublicKey|string} pubkey_or_label - public key string or object or label
        @return {PrivateKey} or null
    */
    getPrivateKey( pubkey_or_label ) {
        
        this.assertLogin()
        req(pubkey_or_label, "pubkey_or_label")
        
        let keys = this.keys()
        let priv = pubkey => {
            let key = keys.get( pubkey )
            if( ! key )
                return null
            
            let wif = key.get("private_wif")
            if( ! wif )
                return null
            return PrivateKey.fromWif( wif )
        }
        
        if( pubkey_or_label.Q ) {
            return priv( pubkey_or_label.toString() )
        }
        try {
            PublicKey.fromStringOrThrow( pubkey_or_label )
            return priv(pubkey_or_label)
        } catch(error) {
            // slowest operation last
            let pubkey = this.keys().findKey( key => key.get("label") === pubkey_or_label )
            return pubkey ? priv( pubkey ) : null
        }
    }
    
    
    /**
        Generates a new blind account for the given brain key and assigns it the given label. 
        
        "Stealth accounts" are labeled private keys.  They will also be able to manage "stealth contacts" which are nothing more than labeled public keys.
        
        @throws {Error} [locked|label_exists]
        @arg {string} label
        @arg {string} brain_key
        @return {PublicKey}
    */
    createBlindAccount( label, brain_key  ) {

        this.assertLogin()
        req(label, "label")
        req(brain_key, "brain_key")
        
        brain_key = brainKey.normalize( brain_key )
        let private_key = PrivateKey.fromSeed( brain_key )
        let public_key = private_key.toPublicKey()
        
        if( ! this.setKeyLabel( public_key, label ))
            throw new Error("label_exists")
        
        this.update(wallet =>
            wallet.updateIn(["keys", toString(public_key)], Map(),
                key => key.set("private_wif", private_key.toWif()))
        )
        
        return public_key
    }
    
    /** @return {Map<label, pubkey>} all blind accounts */
    getBlindAccounts() {
        this.assertLogin()
        let keys = this.keys()
        return keys.reduce( (r, key, pubkey) => r.set(key.get("label"), pubkey), Map())
    }
    
    /** @return {Map<label, pubkey>} all blind accounts for which this wallet has the private key */
    getMyBlindAccounts() {
        this.assertLogin()
        let keys = this.keys()
        let reduce = (r, label, pubkey) => ! keys.has(pubkey) ? r : r.set(label, pubkey)
        return keys.reduce( (r, key, pubkey) => reduce(r, key.get("label"), pubkey), Map())
    }
    
    /**
        @arg {string} public key or label
        @return {Promise<Map<asset_id, amount>>} the total balance of all blinded commitments that can be claimed by given account key or label
    */
    getBlindBalances(pubkey_or_label) {
        this.assertLogin()
        let balances = Map().asMutable()
        let p1 = this.fetch_blinded_balances( pubkey_or_label, (bal, receipt)=> {
            let amount = receipt.getIn(["data", "amount"])
            balances.update(amount.get("asset_id"), 0, amt => longAdd(amt, amount.get("amount")).toString() )
        })
        return p1.then(()=> balances.asImmutable())
    }

    /**
        Transfers a public balance from @from to one or more blinded balances using a stealth transfer.
        
        @arg {string} from_account_id_or_name
        @arg {string} asset_symbol
        @arg {array<string, number>} <from_key_or_label, amount> - from key_or_label to amount (destination public_key or key label)
        @arg {boolean} [broadcast = false]
        @return {Promise} reject ["unknown_from_account"|"unknown_asset"] resolve<object> blind_confirmation
    */
    transferToBlind( from_account_id_or_name, asset_symbol, to_amounts, broadcast = false ) {
         
        this.assertLogin()
        assert.equal(typeof from_account_id_or_name, "string", "from_account_id_or_name")
        assert.equal(typeof asset_symbol, "string", "asset_symbol")
        assert(Array.isArray( to_amounts ), "to_amounts should be an array")

        let idx = 0
        
        let promises = []
        promises.push(fetchChain("getAccount", from_account_id_or_name))
        promises.push(fetchChain("getAsset", asset_symbol))
        
        return Promise.all(promises).then( res =>{
            
            let [ account, asset ] = res
            if( ! account ) return Promise.reject("unknown_from_account")
            if( ! asset ) return Promise.reject("unknown_asset")
            
            // Validate to_amounts, lookup or parse destination public_key or key label (from_key_or_label)
            for( let to_amount of to_amounts) {
                 assert(Array.isArray( to_amount ), 'to_amounts parameter should look like: [["alice",1],["bob",1]]')
                 assert.equal(typeof to_amount[0], "string", 'to_amounts parameter should look like: [["alice",1],["bob",1]]')
                 assert.equal(typeof to_amount[1], "number", 'to_amounts parameter should look like: [["alice",1],["bob",1]]')
                 
                 to_amount[1] = toImpliedDecimal(to_amount[1], asset.get("precision"))
                 
                 let public_key
                 try { public_key = PublicKey.fromStringOrThrow(to_amount[0]) }
                    catch(error) { public_key = this.getPublicKey(to_amount[0]) }
                
                 assert(public_key, "Unknown to_amounts[" + (idx++) + "][0] (from_key_or_label): " + to_amount[0])
                 to_amount[3] = public_key
            }
        
            let promises = []
            let total_amount = 0
            let blinding_factors = []
            let bop = {
                from: account.get("id"),
                outputs: []
            }
            let confirm = {
                outputs: []
            }
            
            for( let to_amount of to_amounts) {
                
                let label = to_amount[0]
                let amount = to_amount[1]
                let to_public = to_amount[3]
                
                let one_time_private = key.get_random_key()
                let secret = one_time_private.get_shared_secret( to_public )
                let child = hash.sha256( secret )
                let nonce = hash.sha256( one_time_private.toBuffer() )
                let blind_factor = hash.sha256( child )
                
                blinding_factors.push( blind_factor.toString("hex") )
                total_amount = longAdd(total_amount, amount)
                
                let out = {}, conf_output
                
                let derived_child = to_public.child( child )
                out.owner = { weight_threshold: 1, key_auths: [[ derived_child.toString(), 1 ]],
                    account_auths: [], address_auths: []}
                    
                promises.push( Promise.resolve()
                    .then( ()=> Apis.crypto("blind", blind_factor, amount.toString()))
                    .then( ret =>{ out.commitment = ret })
                    .then( ()=>
                        to_amounts.length > 1 ?
                            Apis
                            .crypto( "range_proof_sign", 0, out.commitment, blind_factor, nonce, 0, 0, amount.toString() )
                            .then( res => out.range_proof = res)
                        :
                            out.range_proof = ""
                    )
                    .then(()=> {
                        conf_output = {
                            label,
                            pub_key: to_public.toString(),
                            decrypted_memo: {
                                amount: { amount: amount.toString(), asset_id: asset.get("id") },
                                blinding_factor: blind_factor,
                                commitment: new Buffer(out.commitment, "hex"),
                                check: bufferToNumber(secret.slice(0, 4)) 
                            },
                            confirmation: {
                                one_time_key: one_time_private.toPublicKey().toString(),
                                to: to_public.toString(),
                                owner: out.owner // allows wallet save before broadcasting (durable)
                            }
                        }
                        
                        let memo = stealth_memo_data.toBuffer( conf_output.decrypted_memo )
                        conf_output.confirmation.encrypted_memo = Aes.fromBuffer(secret).encrypt( memo ).toString("hex")
                        // conf_output.confirmation_receipt = conf_output.confirmation
                        
                        bop.outputs.push( out )
                        confirm.outputs.push( conf_output )
                    })
                    
                )
            }
            
            return Promise.all(promises).then(()=>{
                
                let p
                if( broadcast ) {
                    // make sure the receipts are stored first before broadcasting
                    let name = account.get("name")
                    let cr = confirmation_receipts(confirm.outputs)
                    p = this.receiveBlindTransfer( cr, "@"+name, "from @"+name )
                }
                
                return (p ? p : Promise.resolve())
                .then( ()=> Apis.crypto("blind_sum", blinding_factors, blinding_factors.length) )
                .then( res => bop.blinding_factor = res )
                .then( ()=>{
                    
                    bop.amount = { amount: total_amount.toString(), asset_id: asset.get("id") }
                    
                    let tr = new TransactionBuilder()
                    bop.outputs = bop.outputs.sort((a, b)=> a.commitment > b.commitment)
                    tr.add_type_operation("transfer_to_blind", bop)
                    
                    return tr.process_transaction(this, null, broadcast).then(()=> {
                        confirm.trx = tr.serialize()
                        // console.log("confirm trx2", JSON.stringify(confirm.outputs))
                        return confirm
                    })
                })
                
            })
        })
    }
     
    /**
        @return {List<blind_receipt>} all blind receipts to/form a particular account sorted by date
    */
    blindHistory( pubkey_or_label ) {
        
        this.assertLogin()
        let public_key = this.getPublicKey( pubkey_or_label )
        assert( public_key, "missing pubkey_or_label " + pubkey_or_label)
        
        let pubkey = public_key.toString()
        return this.blind_receipts()
            .filter( receipt => receipt.get("from_key") === pubkey || receipt.get("to_key") === pubkey )
            .reduce( (r, receipt)=> r.push( receipt ), List())
            .sort( (a, b) => a.get("date") > b.get("date") )
    }
    
    /**
        Given a confirmation receipt, this method will parse it for a blinded balance and confirm that it exists in the blockchain.  If it exists then it will save it in the wallet then report the amount received and who sent it.

        Checking the blockchain is optional.  This allows the wallet to save the receipt first before broadcasting.  In that case, confirmation_receipt.owner is provided and the get_blinded_balances API call is skipped.
        
        @arg {string|object|Array<string|object>} confirmation_receipt (HEX or JSON) - serilized stealth_confirmation operation: { to: optional(public_key), one_time_key: public_key, encrypted_memo: hex }
        
        @arg {string} opt_from - optional `from_label` unless a receeipt already has a from_label
        @arg {string} opt_memo - optional memo to apply each receipt
        
        @typedef {object} blind_receipt
        @property {object} control_authority: {weight_threshold, ...}
        @property {object} conf: {one_time_key, to, encrypted_memo}
        
        @property {object} data
        @property {object} data.amount: { amount, asset_id }
        @property {string} data.blinding_factor
        @property {string} data.commitment
        @property {number} data.check
        
        @property {string} to_label - alice
        @property {string} to_key - "GPHAbc9Def..."
        @property {string} from_label - "bob" from memo or opt_from
        @property {object} amount - same as data.amount
        @property {string} date - ISO
        @property {string} memo - from opt_memo
        @property {boolean} used - `true` when spent
        
        @return {Promise< array<blind_receipt> >}
    */
    receiveBlindTransfer( confirmation_receipts, opt_from, opt_memo ) {

        // console.log("confirmation_receipt", confirmation_receipt, opt_from, opt_memo )

        this.assertLogin()
        
        let receipt = conf => {
            if( ! conf.to) assert( conf.to, "to is required\t" + conf)
            
            let result = { conf : fromJS(conf).toJS() }
            delete result.conf.owner // not stored, it is provided via get_blinded_balances(commitment)
            
            let to_private = this.getPrivateKey( conf.to )
            assert( to_private, "No private key for receiver " + conf.to )

            let secret = to_private.get_shared_secret( conf.one_time_key )
            // console.log("TO secret.toString('hex')\t", secret.toString('hex'))
            let child = hash.sha256( secret )
            let child_private = PrivateKey.fromBuffer( child )
            let blind_factor = hash.sha256( child )

            assert( typeof conf.encrypted_memo === "string", "Expecting HEX string for confirmation_receipt.encrypted_memo")
            let plain_memo = Aes.fromBuffer(secret).decryptHexToText( conf.encrypted_memo )

            let memo = stealth_memo_data.fromBuffer( plain_memo )
            memo = stealth_memo_data.toObject(memo)
            
            let to_key = this.getPublicKey( conf.to )
            if( to_key )
                result.to_key = to_key.toString()
            
            result.to_label = this.getKeyLabel( result.to_key )
            if( memo.from ) {
                result.from_key = memo.from
                result.from_label = this.getKeyLabel( result.from_key )
                if( ! result.from_label ) {
                    result.from_label = opt_from
                    this.setKeyLabel( result.from_key, result.from_label )
                }
            } else {
                result.from_label = opt_from
            }
            result.amount = memo.amount
            result.memo = opt_memo
            
            let owner = authority({ key_auths: [[ to_key.child(child).toString(), 1 ]] })
            
            // console.log("memo", JSON.stringify(memo))
            
            // confirm the amount matches the commitment (verify the blinding factor)
            return Apis.crypto("blind", memo.blinding_factor, memo.amount.amount)
            .then( commtiment_test =>
                Apis.crypto("verify_sum", [commtiment_test], [memo.commitment], 0)
                .then( result => assert(result, "verify_sum " + result))
                .then( () => {
                    
                    result.control_authority = owner
                    result.data = memo
                    
                    this.setKeyLabel( child_private )
                    result.date = new Date().toISOString()
                    return result
                })
            )
        }
        let rp = [], receipts

        if( ! Array.isArray( confirmation_receipts ) && ! List.isList(confirmation_receipts))
            confirmation_receipts = [ confirmation_receipts ]
        
        List(confirmation_receipts).forEach( r =>{
            if( typeof r === 'string' ) {
                r = stealth_confirmation.fromHex(r)
                r = stealth_confirmation.toObject(r)
            }
            rp.push( receipt(r) )
        })
        
        return Promise.all(rp)
            .then( res => receipts = res )
            .then(() => this.update(
                wallet => wallet.update("blind_receipts", List(), r => r.concat(fromJS(receipts)))
            ))
            .then( ()=> receipts )
    }

    /**
        Transfers funds from a set of blinded balances to a public account balance.
        
        @arg {string} from_blind_account_key_or_label
        @arg {string} to_account_id_or_name
        @arg {string} amount
        @arg {string} asset_symbol
        @arg {boolean} [broadcast = false]
        @return blind_confirmation
    */
    transferFromBlind( from_blind_account_key_or_label, to_account_id_or_name, amount, asset_symbol, broadcast = false ){
        
        this.assertLogin()
        
        let promises = []
        promises.push(fetchChain("getAccount", to_account_id_or_name))
        promises.push(fetchChain("getAsset", asset_symbol))
        
        return Promise.all(promises).then( res =>{
            
            let [ to_account, asset ] = res
            if( ! to_account ) return Promise.reject("unknown_to_account")
            if( ! asset ) return Promise.reject("unknown_asset")
            
            amount = toImpliedDecimal(amount, asset.get("precision"))
            
            let from_blind_fee
            return Promise.resolve()
            
            .then( () => get_blind_transfer_fee(asset.get("id"), 0) )
            .then( fee => from_blind_fee = fee )
            
            .then( () => longAdd(from_blind_fee.amount, amount))
            
            .then( amount_with_fee =>
                this.blind_transfer_help(
                    from_blind_account_key_or_label, from_blind_account_key_or_label,
                    amount_with_fee, asset_symbol, false, true/*to_temp*/
                )
            )
            .then( conf => {
    
                assert( conf.outputs, "outputs are required" )
                
                // Sender's change address
                let last_output = conf.outputs[conf.outputs.length - 1]
                
                let from_blind = {
                    fee: from_blind_fee,
                    amount: { amount: amount.toString(), asset_id: asset.get("id") },
                    to: to_account.get("id"),
                    blinding_factor: last_output.decrypted_memo.blinding_factor,
                    inputs: [{
                        commitment: last_output.decrypted_memo.commitment,
                        owner: authority(),
                        // one_time_key added for signing
                        // one_time_key: last_output.confirmation.one_time_key
                    }]
                }
                
                let operations = conf.trx.operations
                operations.push( from_blind )
                
                
                let p1
                if( broadcast && conf.outputs.length === 2 ) {
                    let change_out = conf.outputs[0]
                    // make sure the receipts are stored first before broadcasting (durable)
                    let cr = {
                        // { to, one_time_key, encrypted_memo, [owner = null] } 
                        to: this.getPublicKey(from_blind_account_key_or_label).toString(),
                        one_time_key: change_out.confirmation.one_time_key,
                        encrypted_memo: change_out.confirmation.encrypted_memo
                    }
                    p1 = this.receiveBlindTransfer(cr, from_blind_account_key_or_label, "to @" + to_account.get("name"))
                }
                return (p1 ? p1 : Promise.resolve()).then(()=>{
                    
                    // console.log("conf.trx", JSON.stringify(conf.trx))
                    return this.send_blind_tr(
                        operations,
                        from_blind_account_key_or_label,
                        broadcast,
                        conf.one_time_keys
                    ).then( tr => {
                        conf.trx = tr
                        return conf
                    })
                })
            })
        })
    }

    /**
        Used to transfer from one set of blinded balances to another.
        
        @arg {string} from_key_or_label
        @arg {string} to_key_or_label
        @arg {string} amount
        @arg {string} asset_symbol
        @arg {boolean} [broadcast = false]
        @return blind_confirmation
    */
    blindTransfer( from_key_or_label, to_key_or_label, amount, asset_symbol, broadcast = false) {
        
        this.assertLogin()
        
        return Promise.resolve()
        .then( ()=> fetchChain("getAsset", asset_symbol) )
        .then( asset => {
            if( ! asset ) return Promise.reject("unknown_asset")
            amount = toImpliedDecimal(amount, asset.get("precision"))
            return this.blind_transfer_help(from_key_or_label, to_key_or_label, amount, asset_symbol, broadcast)
        })
        
    }

}

function fetch_blinded_balances(pubkey_or_label, callback) {
    
    let public_key = this.getPublicKey( pubkey_or_label )
    assert( public_key, "missing pubkey_or_label " + pubkey_or_label)
    
    let pubkey = public_key.toString()

    let receipts = this.blind_receipts()
        .filter( r => r.get("to_key") === pubkey)
        // .filterNot( r => r.get("used") === true )// just for testing
    
    let used = Set()
    let commitments = this.commitments(receipts)
    
    let p1 = Apis.db("get_blinded_balances", commitments.toJS()).then( bbal => {
        
        // if( ! bbal.length )
        //     console.log("INFO\tConfidentialWallet\tno blinded balances", pubkey_or_label, commitments.toJS())
        
        let bbalMap = List(bbal).reduce( (r, bal)=> r.set(bal.commitment, bal), Map())
        
        receipts.forEach( receipt => {
            let commitment = receipt.getIn(["data", "commitment"])
            let bal = bbalMap.get(commitment)
            
            // console.log("used", ! bal, receipt.get('amount'), '\t', pubkey_or_label)
            
            if( ! bal ) {
                used = used.add(commitment)
                return
            }
            let ret = callback(bal, receipt, commitment)
            if( ret === false )
                return false
        })
    })
    
    // update "used" in the wallet after the API call finishes
    return p1.then(()=> {
        
        if( used.size ) return this.update(wallet => wallet
            .update("blind_receipts", receipts => receipts.reduce( (r, receipt) =>
                used.has( receipt.getIn(["data", "commitment"]) ) ?
                    r.push(receipt.set("used", true)) :
                    r.push(receipt)
                , List()
            ))
        )
        
    })
}

/**
    Short method to help form and send a blind transfer..
    
    @arg {string} from_key_or_label
    @arg {string} to_key_or_label
    @arg {string} amount - The implied decimal places amount
    @arg {string} asset_symbol
    @arg {boolean} broadcast
    @arg {boolean} to_temp
    
    @typedef {object} ret
    @property {object} outputs
    @property {object} outputs.decrypted_memo: {from, amount, blinding_factor, commitment, check}
    @property {object} outputs.confirmation: {one_time_key, to, owner, encrypted_memo}
    @property {string} outputs.label - "alice"
    @property {string} outputs.pub_key: "GPHAbc9Def..."
    @property {object} outputs.auth: {weight_threshold, ...}
    
    @property {object} fee: {amount, asset_id}
    @property {object} trx: {ref_block_num, ...}
    @property {array<string>} one_time_keys - for signing
    
    @return {Promise<ret>} 
*/
function blind_transfer_help(
    from_key_or_label, to_key_or_label,
    amount, asset_symbol, broadcast = false, to_temp = false
) {
    this.assertLogin()
    
    // assert digits (for implied decimal format)
    assert(isDigits(amount), "expecting only digits in amount " + amount) //not prefect, but would catch some invalid calls
    
    let confirm = {
        outputs: []
    }
    
    let from_key = this.getPublicKey(from_key_or_label)
    let to_key = this.getPublicKey(to_key_or_label)
    
    let promises = []
    promises.push(fetchChain("getAsset", asset_symbol))

    return Promise.all(promises).then( res =>{
        
        let [ asset ] = res
        if( ! asset ) return Promise.reject("unknown_asset")
        
        let blind_tr = {
            outputs: [],
            inputs: []
        }
        let one_time_keys = Set()
        let available_amount = Long.ZERO
        let blinding_factors = []
        
        let used = []
        let amount_with_fee
        
        return Promise.resolve()
        
        .then( ()=> get_blind_transfer_fee( asset.get("id")) )
        .then( fee =>{
            blind_tr.fee = fee
            confirm.fee = fee
        })
        
        .then( ()=>{ amount_with_fee = longAdd(amount, blind_tr.fee.amount) })
        .then( ()=> this.fetch_blinded_balances(from_key_or_label, (bal, receipt, commitment) =>{
            
            let control_authority = receipt.get("control_authority")
            
            let one_time_key = receipt.get("conf").get("one_time_key")
            //for signing
            one_time_keys = one_time_keys.add( one_time_key )
            
            blind_tr.inputs.push({ commitment,
                owner: control_authority.toJS(), one_time_key })
            
            blinding_factors.push( receipt.get("data").get("blinding_factor") )
            
            available_amount = longAdd(available_amount, receipt.get("amount").get("amount"))
            
            // return false to "break"
            // Break if the available_amount total is >= amount_with_fee
            // Being over is fine, change will be provided...
            return longCmp(available_amount, amount_with_fee) < 0
            
        }) )
        .then(()=> {
            
            assert( longCmp(available_amount, amount_with_fee) >= 0,
                `Insufficent Balance, available ${available_amount.toString()}, transfer amount plus fees ${amount_with_fee.toString()}`)
            
            let one_time_private = key.get_random_key()
            let secret = one_time_private.get_shared_secret( to_key )
            let child = hash.sha256( secret )
            let nonce = hash.sha256( one_time_private.toBuffer() )
            let blind_factor
            
            let from_secret = one_time_private.get_shared_secret( from_key )
            let from_child = hash.sha256( from_secret )
            let from_nonce = hash.sha256( nonce )
            
            let change = longSub(longSub(available_amount, amount), blind_tr.fee.amount)
            let change_blind_factor
            
            let has_change = longCmp(change, 0) > 0
            
            let bf_promise
            if( has_change ) {
                blind_factor = hash.sha256( child )
                blinding_factors.push( blind_factor.toString("hex") )
                bf_promise = Apis
                    .crypto("blind_sum", blinding_factors, blinding_factors.length - 1)
                    .then( bf => change_blind_factor = bf )
            } else {
                bf_promise = Apis
                    .crypto("blind_sum", blinding_factors, blinding_factors.length )
                    .then( bf => blind_factor = bf )
                    .then( () => blinding_factors.push( blind_factor.toString("hex") ))
            }
            
            return bf_promise.then(()=> {
                
                let to_out = { }

                let derived_child = to_key.child( child )
                to_out.owner = to_temp ? authority() :
                    authority({ key_auths: [[ derived_child.toString(), 1 ]] })
                
                return Promise.resolve()
                .then( ()=> Apis.crypto("blind", blind_factor, amount.toString()))
                .then( ret => to_out.commitment = ret )
                
                .then( ()=>{
                    
                    let rp_promise
                    
                    if( ! has_change ) {
                        
                       rp_promise = Promise.resolve()
                       to_out.range_proof = ""
                       
                   } else {
                        
                        let change_out = {}
                        let derived_child = from_key.child( from_child )
                        change_out.owner =
                            authority({ key_auths: [[ derived_child.toString(), 1 ]] })
                        
                        rp_promise = Apis.crypto(
                            "range_proof_sign",
                            0, to_out.commitment, blind_factor,
                            nonce, 0, 0, amount
                        )
                        .then( res => to_out.range_proof = res)
                        
                        .then( ()=> Apis.crypto("blind", change_blind_factor, change) )
                        .then( res => change_out.commitment = res )
                        
                        .then( ()=> Apis.crypto(
                            "range_proof_sign",
                            0, change_out.commitment, change_blind_factor,
                            from_nonce, 0, 0, change
                        ))
                        .then( res => change_out.range_proof = res )
                        
                        .then( ()=>{
                            
                            blind_tr.outputs[1] = change_out
                            
                            let conf_output = {
                                decrypted_memo: {},
                                confirmation: {}
                            }
                            
                            conf_output.label = from_key_or_label
                            conf_output.pub_key = from_key.toString()
                            conf_output.decrypted_memo.from = from_key.toString()
                            conf_output.decrypted_memo.amount = { amount: change.toString(), asset_id: asset.get("id") }
                            conf_output.decrypted_memo.blinding_factor = change_blind_factor.toString("hex")
                            conf_output.decrypted_memo.commitment = change_out.commitment
                            conf_output.decrypted_memo.check = bufferToNumber(from_secret.slice(0, 4))
                            conf_output.confirmation.one_time_key = one_time_private.toPublicKey().toString()
                            conf_output.confirmation.to = from_key.toString()
                            conf_output.confirmation.owner = change_out.owner
                            
                            let from_aes = Aes.fromBuffer(from_secret)
                            let memo = stealth_memo_data.toBuffer( conf_output.decrypted_memo )
                            conf_output.confirmation.encrypted_memo = from_aes.encrypt( memo ).toString("hex")
                            
                            conf_output.auth = change_out.owner
                            conf_output.confirmation_receipt = conf_output.confirmation
                        
                            confirm.outputs.push( conf_output )
                        })
                    }
                    
                    return rp_promise.then(()=>{
                        
                        blind_tr.outputs[0] = to_out
                        
                        let conf_output = {
                            decrypted_memo: {},
                            confirmation: {}
                        }
                        
                        conf_output.label = to_key_or_label
                        conf_output.pub_key = to_key.toString()
                        conf_output.decrypted_memo.from = from_key.toString()
                        conf_output.decrypted_memo.amount = { amount, asset_id: asset.get("id") }
                        conf_output.decrypted_memo.blinding_factor = blind_factor.toString("hex")
                        conf_output.decrypted_memo.commitment = to_out.commitment
                        conf_output.decrypted_memo.check   = bufferToNumber(secret.slice(0, 4))
                        conf_output.confirmation.one_time_key = one_time_private.toPublicKey().toString()
                        conf_output.confirmation.to = to_key.toString()
                        conf_output.confirmation.owner = to_out.owner
                        
                        let aes = Aes.fromBuffer(secret)
                        let memo = stealth_memo_data.toBuffer( conf_output.decrypted_memo )
                        conf_output.confirmation.encrypted_memo = aes.encrypt( memo ).toString("hex")
                        
                        conf_output.auth = to_out.owner
                        // conf_output.confirmation_receipt = conf_output.confirmation
                        
                        // transferFromBlind needs to_out as last
                        confirm.outputs.push( conf_output )

                        let p1
                        if( broadcast ) {
                            // make sure the receipts are stored first before broadcasting
                            let cr = confirmation_receipts(confirm.outputs)
                            p1 = this.receiveBlindTransfer(cr, from_key_or_label)
                        }
                        return (p1 ? p1 : Promise.resolve()).then(()=>{
                            return this.send_blind_tr([blind_tr], from_key_or_label, broadcast).then( tr => {
                                confirm.trx = tr
                                confirm.one_time_keys = one_time_keys.toJS()
                                return confirm
                            })
                        })
                        
                    })
                })
            })
        })
    })
}

// required
function req(data, field_name) {
    if( data == null ) throw "Missing required field: " + field_name
    return data
}

function update(callback) {
    let wallet = callback(this.wallet.wallet_object)
    return this.wallet.setState(wallet)
    .catch( error =>{
        console.error("ERROR\tConfidentialWallet\tupdate", error, "stack", error.stack)
        throw error
    })
}

let confirmation_receipts = outputs => List(outputs)
    .reduce( (r, out)=>{
        assert(out.confirmation, "confirmation required")
        return r.push(out.confirmation)
    }, List())

function send_blind_tr(ops, from_key_or_label, broadcast, one_time_keys) {
    
    let tr = new TransactionBuilder()

    for(let op of ops) {

        if( Array.isArray(op) ) {
            op = op[1]
        }
        
        assert(op.inputs, "inputs are required")
        op.inputs = op.inputs.sort((a, b)=> a.commitment > b.commitment)
        
        let op_name = op.outputs ? "blind_transfer" : "transfer_from_blind"
        if( op.outputs )
            op.outputs = op.outputs.sort((a, b)=> a.commitment > b.commitment)

        tr.add_type_operation(op_name, op)
        {
            let signer
            let sign = one_time_key => {
                
                if( ! signer) {
                    signer = this.getPrivateKey(from_key_or_label)
                }

                if( ! signer )
                    throw new Error("Missing private key for: " + from_key_or_label)
                
                let secret = signer.get_shared_secret( one_time_key )
                let child = hash.sha256( secret )
                tr.add_signer(signer.child(child))
            }
            
            for(let input of op.inputs)
                if( input.one_time_key )
                    sign( input.one_time_key )
            
            if( one_time_keys )
                for(let one_time_key of one_time_keys)
                    sign( one_time_key )
        }
    }

    return tr.process_transaction(this, null, broadcast)
}

/** Feeds need to be obtained in advance before calculating inputs and outputs. */
function get_blind_transfer_fee(asset_id, output_count = 2) {
    
    // Create an empty but serilizable operation to send to the server
    let op = output_count === 0 ? transfer_from_blind : blind_transfer
    let object = op.toObject({}, {use_default: true})
    
    for(let i = 1; i < output_count; i++)
        object.outputs.push( object.outputs[0] )
    
    let tr = new TransactionBuilder()
    tr.add_type_operation(op.operation_name, object)
    return tr.set_required_fees(asset_id).then(()=>{
        let fee = tr.operations[0][1].fee
        assert.equal( asset_id, fee.asset_id, "expecting fee asset_id to match" )
        // console.log("output_count, blind transfer fee", output_count, fee)
        return fee
    })
}

let isDigits = value => value === "numeric" || /^[0-9]+$/.test(value)

function assertLogin() {
    if( ! this.wallet.private_key )
        throw new Error("login")
}

var toString = data => data == null ? data :
    data["toWif"] ? data.toWif() : // Case for PrivateKey.toWif()
    data["toString"] ? data.toString() : // Case for PublicKey.toString()
    data

let bufferToNumber = (buf, type = "Uint32") => 
    ByteBuffer.fromBinary(buf.toString("binary"), ByteBuffer.LITTLE_ENDIAN)["read" + type]()

// let indexableKeys = keys => keys
//     .reduce( (r, key, pubkey) => key.get("index_address") ? r.push(pubkey) : r, List())

// TODO abstract enough to move to WalletStorage
function getPubkeys_having_PrivateKey( pubkeys, addys = null ) {
    let return_pubkeys = []
    let keys = this.keys()
    if(pubkeys) {
        for(let pubkey of pubkeys) {
            let key = keys.get(pubkey)
            if(key && key.has("private_wif")) {
                return_pubkeys.push(pubkey)
            }
        }
    }
    if(addys) {
        for (let addy of addys) {
            let pubkey = this.addressIndex.getPublicKey(addy)
            return_pubkeys.push(pubkey)
        }
    }
    return return_pubkeys
}

let long = (operation, arg1, arg2) => new Long(arg1)[operation]( new Long(arg2) )
let longAdd = (a, b) => long("add", a, b)
let longMul = (a, b) => long("multiply", a, b)
let longCmp = (a, b) => long("compare", a, b)
let longSub = (a, b) => long("subtract", a, b)

let authority = (data, weight_threshold = data ? 1 : 0)  =>
    fromJS({ weight_threshold, key_auths: [], account_auths: [], address_auths: [] })
    .merge(data).toJS()