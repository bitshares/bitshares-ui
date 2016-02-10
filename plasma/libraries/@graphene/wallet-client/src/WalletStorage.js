import { fromJS, Map } from "immutable"
import { encrypt, decrypt } from "./WalletActions"
import { PrivateKey, Signature, hash } from "@graphene/ecc"
import WalletWebSocket from "./WalletWebSocket"
import WalletApi from "./WalletApi"
import assert from "assert"

/**
    Serilizable persisterent state (JSON serilizable types only).
*/
const inital_persistent_state = fromJS({
    
    // True to stay in sync with the server (boolean)
    remote_copy: undefined,
    
    // An emailed token used to create a wallet for the 1st time (base58)
    remote_token: null,
    
    // Server's REST URL
    remote_url: null,
    
    // This is the last encrypted_wallet hash that was saved on the server (base64)
    remote_hash: null,
    
    // This is the public key derived from the email+username+password ... This could be brute forced, so consider this private (email+username+password is not nearly random enough for this to be public).
    secret_encryption_pubkey: null,
    
    // Wallet JSON string encrypted using the private key derived from email+username+password (base64)
    encrypted_wallet: null,
    
    // ISO Date string from the server
    remote_created_date: null,
    
    // ISO Date string from the server
    remote_updated_date: null
    
})

/**
    A Wallet is a place where private user information can be stored. This information is kept encrypted when on disk or stored on the remote server.
    
    Serilizable persisterent state (JSON serilizable types only)..  This is the data kept in the walletStorage.  

    ```js
    const empty_wallet = fromJS({
        created: t.Dat,
        last_modified: t.Dat,
        backup_date: t.maybe(t.Dat),
        chain_id: t.Str,
    })
    ```
    
    @see [Plasma Wallet API]{@link https://github.com/cryptonomex/graphene/wiki/Plasma---Wallet-API}
*/
export default class WalletStorage {
    
    /**
        Variables:
        
        {string} this.remote_status - Last status from server [undefined|Not Modified|No Content|Conflict|OK].  OK means the wallet is synchronizing, a notice is not sent until this is complete.
        
        {string} this.local_status - Last status from encryption and storage routines [null|Processing|"error text"].  A null value indicates that memory and local storage (if used) are in sync, Processing indicates in progress, "error text" could be any error.
        
        {Immutable.Map|Immutable.List} this.wallet_object - When unlocked, this is the unencrypted wallet object
        
        {PrivateKey} this.private_key - Present only when unlocked
         
        @arg {LocalStoragePersistence} storage
    */
    constructor(storage) {
        this.wallet_object = Map()
        this.storage = storage
        this.subscribers = Map()
        if( this.storage.state.isEmpty() ) {
            // If storage were async, set this.local_status would be set upon completion
            storage.setState( inital_persistent_state )
        }
        this.local_status = null
        
        // enable the backup server if one is configured (see useBackupServer)
        let remote_url = this.storage.state.get("remote_url")
        if( remote_url ) {
            this.ws_rpc = new WalletWebSocket(remote_url)
            this.api = new WalletApi(this.ws_rpc)
            this.instance = this.ws_rpc.instance
        }
        
        // Semi-private functions .. Having them outside of this class helps the reader see they are not part of the standard API
        this.sync = sync.bind(this)
        this.updateWallet = updateWallet.bind(this)
        this.localHash = localHash.bind(this)
        this.notifyResolve = notifyResolve.bind(this)
        this.deleteWallet = deleteWallet.bind(this)
    }
    
    /**
        Configure the wallet to run with (provide a URL) or without (pass in null) a wallet backup server.
    
        Calling this method does not immediately trigger any action on the server.  It will however notify subscribers if the remote_url changes.
        
        Every call to this method will disconnect leaving it to the API to the re-connect (if applicable).
        
        @arg {string} [ remote_url ] - Provide a URL to start synchronizing, null or undefined to stop synchronizing
        @return Promise - resolve after close or just resolve immediately
    */
    useBackupServer( remote_url = this.storage.state.get("remote_url")) {
        // close (if applicable)
        let close = this.ws_rpc ? this.ws_rpc.close() : null
        if(remote_url !== null) {
            this.ws_rpc = new WalletWebSocket(remote_url)
            this.api = new WalletApi(this.ws_rpc)
            this.instance = this.ws_rpc.instance
        } else {
            this.ws_rpc = null
            this.api = null
            this.instance = null
        } 
        if(remote_url != this.storage.state.get("remote_url")) {
            this.notify = true
            this.storage.setState({ remote_url })
        }
        return this.notifyResolve(Promise.resolve(close))
    }
    
    /**
        Configure the wallet to keep a local copy on disk.  This allows the user to access the wallet even if the server is no longer available. This option can be disabled on public computers where the wallet data should never touch disk and should be deleted when the user logs out.
        
        By default a local copy will NOT be kept.  Subscribers will not be notified.
        
        @arg {boolean} [save = true] -  Save (or delete / do not save) all state changes to disk
    */
    keepLocalCopy( local_copy = true ) {
        this.storage.setSaveToDisk( local_copy )
    }
    
    /**
        Configure the wallet to save its data on the remote server. If this is set to false, then it will be removed from the server. If it is set to true, then it will be uploaded to the server. If the wallet is not currently saved on the server a token will be required to allow the creation of the new wallet's data on the remote server.  If this is set to false, then it will be removed from the server. If it is set to true, then it will be uploaded to the server. If the wallet is not currently saved on the server a token will be required to allow the creation of a new wallet.
        
        The default is <b>undefined</b> (neither upload nor remove).  Subscribers are notified if the configuration changes.
        
        The upload or delete operation may be deferred pending: {@link this.login} and {@link this.useBackupServer}
        
        @arg {boolean} save - Add or delete remote backups or `undefined` (do neither)
        @arg {string} token - Code obtained via `wallet.api.requestCode(email)`.  Only required for the first remote backup (from any computer). 
        @throws {Error} ["remote_url required"|"login"]
        @return {Promise} - only important if the wallet is communicating with the server
    */
    keepRemoteCopy( save = true, token = this.storage.state.get("remote_token") ) {
        let state = this.storage.state
        if( save === true && ! state.get("remote_url"))
            throw new Error(this.instance+":configuration_error, remote_copy without remote_url")
        
        if( save != this.storage.state.get("remote_copy") || token != this.storage.state.get("remote_token"))
            this.notify = true
        
        this.storage.setState({ remote_copy: save, remote_token: token })
        return this.notifyResolve( this.sync() )
    }
    
    /**
        This API call is used to load the wallet. If a backup server has been specified then it will attempt to fetch the latest version from the server, otherwise it will load the local wallet into memory. The configuration set by keepLocalCopy will determine whether or not the wallet is saved to disk as a side effect of logging in.
        
        The wallet is unlocked in RAM when it combines these as follows: lowercase(email) + lowercase(username) + password to come up with a matching public / private key. If keepRemoteCopy is enabled, the email used to obtain the token must match the email used here. Also, if keepRemoteCopy is enabled, the server will store only a one-way hash of the email (and not the email itself) so that it can track resources by unique emails but still respect email privacy also giving the server no advantage in guessing the email portion of the password salt.
        
        If the login is successful, subscribers are notified after any potential remote sync has finished but before this method resolves.
        
        @arg {string} email 
        @arg {string} username
        @arg {string} password
        @arg {string} chain_id - required on first login.  The transaction layer checks this value to ensure wallet's can not cross-chains.  Chain ID is validated if it is provided on subsequent logins.
        
        @arg {boolean} [unlock = true] - use false to check the password without unlocking.
        
        @throws {Error<string>} [email_required | username_required | password_required | invalid_password | logged_in ]
        
        @return {Promise} - can be ignored unless one is interested in the remote wallet syncing
    */
    login( email, username, password, chain_id = null, unlock = true ) {

        if( this.private_key ) {
            throw new Error("logged_in")
        }
        req(email, "email")
        req(username, "username")
        req(password, "password")
        
        let private_key = PrivateKey.fromSeed(
            email.trim().toLowerCase() + "\t" +
            username.trim().toLowerCase() + "\t" +
            password
        )
        
        let public_key = private_key.toPublicKey()
        
        if(this.storage.state.get("secret_encryption_pubkey")) {
            
            // check login (email, username, and password)
            if( this.storage.state.get("secret_encryption_pubkey") !== public_key.toString())
                throw new Error( "invalid_password" )
            
            if( chain_id && chain_id !== this.storage.state.get("chain_id"))
                throw new Error( "missmatched chain id, wallet has " + this.storage.state.get("chain_id") + " but login is expecting " + chain_id )
            
            if( ! unlock )
                return Promise.resolve()
        
        } else {
            assert(chain_id, "provide the chainId on first login")
            
            if( ! unlock )
                return Promise.resolve()
            
            // first login
            let dt = new Date().toISOString()
            let init = {
                chain_id,
                created: dt,
                last_modified: dt,
                secret_encryption_pubkey: public_key.toString()
            }
            this.storage.setState(init)
            
            // Temporily stuff the state into the wallet_object, this helps the unit tests where waiting for this.sync to resolve is not required.
            this.wallet_object = this.wallet_object.merge(init)
            
            this.notify = true
        }
        
        // unlock
        this.private_key = private_key
        
        return this.notifyResolve( this.sync(private_key) )
    }
    
    /**
        This API call will lock, remove unencrypted wallet from memory, and unsubscribe to wallet updates (if a remote copy it kept).
        @return {Promise} resolve immediately or after a successful unsubscribe
    */
    logout() {
        this.wallet_object = Map()
        this.remote_status = null
        
        // capture the public key first:
        let public_key = this.private_key ? this.private_key.toPublicKey() : null
        this.private_key = null // logout
        
        let unsub
        if( public_key && this.api && this.ws_rpc.getSubscriptionId("fetchWallet", public_key.toString()) ) {
            unsub = this.api.fetchWalletUnsubscribe(public_key)
        } else {
            unsub = Promise.resolve()
        }
        
        return this.notifyResolve( unsub
            // useBackupServer() will close the connection (this does not change the configuration)
            .then(()=> this.useBackupServer())
        )
    }
    
    /**
        This method returns the wallet_object representing the state of the wallet.  It is only valid if the wallet has successfully logged in.  If the wallet is known to be in a consistent state (after a login for example) one may instead access the object directly `this.wallet_object` instead.
        
        @return {Promise} {Immutable} wallet_object or `undefined` if locked
    */
    getState() {
        if( ! this.private_key ) return Promise.reject("login")
        return this.notifyResolve( this.sync().then(()=> this.wallet_object ))
    }

    /** 
        This method is used to update the wallet state. If the wallet is configured to keep synchronized with the remote wallet then the server will refer to a copy of the wallets revision history to ensure that no version is overwritten. If the local wallet ever falls on a fork an attempt to upload that wallet will cause the API call to fail; a reconcilation will be needed. After successfully storing the state on the server, save the state to local memory, and optionally disk.
        
        A deep merge is used (see ImmutableJs).  This is less prone to loosing information.  If something should be removed you will need to update the wallet_object direclty then call setState to presist the change.
        
        This method does not perform any updates if the wallet_object is the same (using Immutable.Js will help ensure that this will work).
        
        The Immutable version of wallet_object ends up in `this.wallet_object` (synchronizing may be in progress)
        
        @arg {Immutable|object} wallet_object - mutable or immutable object .. no loops, only JSON serilizable data
        
        @throws {Error} - [wallet_locked, etc...]
        
        @return {Promise} - resolve or reject on completion.  One may also monitor this.local_status and this.remote_status.
    */
    setState( wallet_object )  {
        
        // Immutable js merge is good at keeping object equality
        wallet_object = this.wallet_object.mergeDeep(wallet_object)
        
        // Still the same after merging?
        if(this.wallet_object === wallet_object) {
            return Promise.resolve()
        }
        
        if( ! this.private_key )
            throw new Error("wallet_locked")
        
        this.notify = true
        this.local_status = "Pending"
        this.wallet_object = fromJS(wallet_object)
        this.wallet_object = this.wallet_object.set("last_modified", new Date().toISOString())
        
        let rollback_wallet = this.wallet_object
        this.wallet_object = this.wallet_object.set("backup_date", new Date().toISOString())
        
        return this.notifyResolve(
            this.updateWallet().catch( error => {
                console.log('ERROR\tWallet:'+this.instance+'\tsetState', error, 'stack', error.stack)
                throw error
            })
        ).catch( error =>{
            
            if( rollback_wallet )
                this.wallet_object = rollback_wallet
            
            throw error
        })
    }
    
    /**
    *  Add a callback that will be called anytime this wallet is updated
    *  @return {Promise} pass-through of the callback's return value exception
    */
    subscribe( callback, resolve = null ) {
        if(this.subscribers.has(callback)) {
            console.error("ERROR\tWallet:"+this.instance+"\tSubscribe callback already exists", callback)
            return
        }
        this.subscribers = this.subscribers.set(callback, resolve)
    }

    /**
    *  Remove a callback that was previously added via {@link this.subscribe}
    */
    unsubscribe( callback ) {
        if( ! this.subscribers.has(callback)) {
            console.error("ERROR\tWallet:"+this.instance+"\tUnsubscribe callback does not exists", callback)
            return
        }
        this.subscribers = this.subscribers.remove( callback )
    }
    
    /**
        @arg {string} email 
        @arg {string} username
        @arg {string} old_password
        @arg {string} new_password
        @throws {Error} [
            email_required | username_required | old_password_required |
            invalid_password | new_password_required | wallet_empty
        ]
        @return {Promise} - can be ignored unless one is interested in the remote wallet syncing.
    */
    changePassword( email, username, old_password, new_password ) {
        
        if( ! this.storage.state.get("secret_encryption_pubkey") )
            throw new Error("wallet_empty")
        
        req(email, "email")
        req(username, "username")
        req(old_password, "old_password")
        req(old_password, "new_password")
        
        let old_private_key = PrivateKey.fromSeed(
            email.trim().toLowerCase() + "\t" +
            username.trim().toLowerCase() + "\t" +
            old_password
        )
        
        let old_public_key = old_private_key.toPublicKey()
        
        // check login
        if( this.storage.state.get("secret_encryption_pubkey") !== old_public_key.toString())
            throw new Error( "invalid_password" )
        
        let original_local_hash = this.localHash()
        let remote_copy = this.storage.state.get("remote_copy")
        if( remote_copy === true ) {
            
            let remote_hash = this.storage.state.get("remote_hash")
            if( toBase64(original_local_hash) !== remote_hash ) {
                // Check this now before changing local encrypted data, better to not find out later that the server can't be updated
                throw new Error("wallet_modified: Can't change password, this wallet has a remote copy that has not been updated")
            }
            
        }
        
        let new_private_key = PrivateKey.fromSeed(
            email.trim().toLowerCase() + "\t" +
            username.trim().toLowerCase() + "\t" +
            new_password
        )
        let new_public_key = new_private_key.toPublicKey()
        
        this.wallet_object = this.wallet_object.set("last_modified", new Date().toISOString())
        
        return new Promise( (resolve, reject) => {
            encrypt(this.wallet_object, new_public_key).then( encrypted_data => {
                
                // Save locally first
                this.storage.setState({
                    encrypted_wallet: encrypted_data.toString('base64'),
                    secret_encryption_pubkey: new_public_key.toString()
                })
                this.local_status = null
                this.notify = true
                
                if( this.api == null || remote_copy !== true ) {
                    resolve( this.notifyResolve() )
                    return
                }
                
                if( this.ws_rpc.getSubscriptionId("fetchWallet", old_public_key.toString()) )
                    this.api.fetchWalletUnsubscribe(old_public_key).catch( error => reject(error))
                
                let original_signature = Signature.signBufferSha256(original_local_hash, old_private_key)
                let new_local_hash = this.localHash()
                let new_signature = Signature.signBufferSha256(new_local_hash, new_private_key)
                
                let changePromise = this.api.changePassword(
                    original_local_hash, original_signature, encrypted_data, new_signature
                )
                    .then( json => {
                    if( json.statusText !== "OK"){
                        reject(json)
                        return
                    }
                    assert(json.local_hash, "local_hash")
                    assert(json.updated, 'updated')
                    this.storage.setState({
                        remote_hash: json.local_hash,
                        remote_updated: json.updated
                    })
                    this.notify = true
                })
                resolve( this.notifyResolve( changePromise ))
            }).catch( error => reject(error))
        })

    }
    
    
}

/**
    Called once at the end of each API call OR once after a subscription update is received.  Calling this function only once per API call prevents duplicate notifications from going out which aids in efficiency and testing.

    @private
*/
function notifyResolve(promise) {
    let notify = notifySubscribers.bind(this)
    if( ! promise ) {
        notify()
        return Promise.resolve()
    }
    return promise.then(ret =>{
        notify()
        return ret
    }).catch( error => {
        notify()
        throw error
    })
}

// Used by notifyResolve 
function notifySubscribers() {
    
    if( ! this.notify)
        return
    
    this.notify = false
    this.subscribers.forEach( (resolve, callback) => {
        try { resolve ? resolve( callback(this) ) : callback(this) }
        catch(error) {
            if(resolve)
                resolve(Promise.reject(error))
            else
                console.error("ERROR\tWallet:"+this.instance+"\tnotifySubscribers" , error, 'stack', error.stack)
        }
    })
}

/**
    Take the most recent server wallet and the local wallet then decide what to do: 'pull' from the server, or 'push' changes to the server ...
    @private
*/
function sync(private_key = this.private_key) {
    // Wallet is locked OR it is an offline wallet
    if( ! private_key || ! this.api )
        return Promise.resolve()
        
    let public_key = private_key.toPublicKey()
    
    // If we have a subscription, we are aleady up-to-date...  
    if( this.ws_rpc.getSubscriptionId("fetchWallet", public_key.toString()) )
    {
        let remote_copy = this.storage.state.get("remote_copy")
        if( remote_copy === false ) {
            let local_hash = this.localHash()
            if(local_hash) {
                let signature = Signature.signBufferSha256(local_hash, private_key)
                return this.deleteWallet( local_hash, signature )
            }
        }
        return Promise.resolve()
    }
    let remote_hash = this.storage.state.get("remote_hash")
    // No subscription, fetch and subscribe to future wallet updates
    return fetchWallet.bind(this)(private_key, remote_hash)
}

/** Subscribe or skip fetch if already subscribed */
function fetchWallet(private_key, local_hash) {
    let state = this.storage.state
    let public_key = private_key.toPublicKey()
    let remote_copy = state.get("remote_copy")

    let local_hash_buffer = local_hash ? new Buffer(local_hash, 'base64') : null

    // for the server wallet's callback
    return new Promise( resolve => {
        
        // This promise can't server as the return value, we are only after the error and instead need the callback to "resolve"
        this.api.fetchWallet(public_key, local_hash_buffer, server_wallet => {
            
            // A subscribe callback does not have a statusText 
            let subscriptionRequest = ! server_wallet.statusText
            
            let fetchCallback = fetchWalletCallback.bind(this)
            if( subscriptionRequest )
                // this is a subscription notice (not an API call) so make sure to notify
                resolve(this.notifyResolve( fetchCallback(server_wallet, private_key) ))
            else
                // The API call will notify
                resolve( fetchCallback(server_wallet, private_key) )
            
        }).catch( error => reject(error))
    })
}

function fetchWalletCallback(server_wallet, private_key) {
    return new Promise( (resolve, reject) => {

        if( ! server_wallet.statusText ) {
            
            // 99 console.log("sub received, this.instance", this.instance)
            
            // subscription request (the server does not have our local hash, it does not know the status)
            let remote_hash = server_wallet.local_hash
            let statusText = remote_hash == null ? "No Content" :
                remote_hash === toBase64(this.localHash()) ? "Not Modified" : "OK"
            
            server_wallet.statusText = statusText
        }
        
        if( this.remote_status != server_wallet.statusText ) {
            this.remote_status = server_wallet.statusText
            this.notify = true
        }
        
        assert(/OK|No Content|Not Modified/.test(server_wallet.statusText), this.instance + ":" + server_wallet.statusText)
        
        let state = this.storage.state
        let push = forcePush.bind(this)
        let pull = forcePull.bind(this)
        
        let has_server_wallet = /OK|Not Modified/.test(server_wallet.statusText)
        let encrypted_wallet = state.get("encrypted_wallet")
        let has_local_wallet = encrypted_wallet != null
        
        if( ! has_server_wallet && ! has_local_wallet ) {
            assert(/No Content/.test(server_wallet.statusText))
            this.remote_status = "No Content"
            this.notify = true
            resolve()
            return
        }
        
        if( ! has_server_wallet ) {
            this.notify = true
            this.remote_status = "Not Modified"
            resolve( push(has_server_wallet, private_key) )
            return
        }
        
        if( ! has_local_wallet ) {
            this.notify = true
            this.remote_status = "Not Modified"
            resolve( pull(server_wallet, private_key) )
            return
        }
        
        // We have 2 wallets (both server and local)
        let current_hash = hash.sha256(new Buffer(encrypted_wallet, 'base64'))
        
        // Has local modifications since last backup
        let remote_hash = state.get("remote_hash")
        let dirtyLocal = current_hash.toString('base64') !== remote_hash
        
        // No changes locally or remote
        if( ! dirtyLocal &&  server_wallet.statusText === "Not Modified") {
            this.remote_status = "Not Modified"
            this.notify = true
            resolve()
            return
        }
        
        // Push local changes (no conflict)
        if( dirtyLocal && server_wallet.statusText === "Not Modified" ) {
            this.notify = true
            this.remote_status = "Not Modified"
            resolve( push(has_server_wallet, private_key) )
            return
        }
        
        if( ! dirtyLocal && server_wallet.statusText === "OK") {
            // The server had this copy of this wallet when another device changed it (meaning that the other device must have been in sync with the wallet when the change was made).  It is safe to pull this wallet and overwrite the local version.
            this.remote_status = "Not Modified"
            this.notify = true
            resolve( pull(server_wallet, private_key) )
            return
        }
        
        assert(dirtyLocal, this.instance + 'Expecting a locally modified wallet')
        assert(server_wallet.statusText === "OK", this.instance + 'Expecting a remotely modified wallet')
        
        this.remote_status = "Conflict"
        this.notify = true
        
        // An internal wallet comparison is required to resolve
        // Unit test checks this message for /^Conflict/
        throw "Conflict both server and local wallet modified:"+this.instance
    })
}

/** syncPull.bind(this, ...) 
    @private
*/
function forcePull(server_wallet, private_key) {
    let state = this.storage.state
    let remote_copy = state.get("remote_copy")
    let server_local_hash = new Buffer(server_wallet.local_hash, 'base64')
    
    if( remote_copy === false ) {
        let signature = Signature.signBufferSha256(server_local_hash, private_key)
        return this.deleteWallet( server_local_hash, signature )
    }
    
    state = state.merge({
        remote_token: null, // unit tests will over-populate remote_token
        remote_hash: server_wallet.local_hash,
        encrypted_wallet: server_wallet.encrypted_data,
        remote_updated_date: server_wallet.updated,
        remote_created_date: server_wallet.created,
    })
    
    let backup_buffer = new Buffer(server_wallet.encrypted_data, 'base64')
    return decrypt(backup_buffer, private_key).then( wallet_object => {
        this.storage.setState(state)
        this.wallet_object = fromJS( wallet_object )
        this.local_status = null
        this.notify = true
        // console.log(this.instance + ":forcePull new hash", state.get("remote_hash"), this.localHash().toString('base64'))
    })
}

/** syncPush.bind(this, ...) 
    @private
*/
function forcePush(has_server_wallet, private_key) {
    let state = this.storage.state
    let remote_copy = state.get("remote_copy")
    if( remote_copy === false && has_server_wallet ) {
        let remote_hash = state.get("remote_hash")
        if( ! remote_hash )
            throw new Error(this.instance + ":Delete error, is this wallet in-sync?")
        
        let remote_hash_buffer = new Buffer(remote_hash, 'base64')
        let signature = Signature.signBufferSha256(remote_hash_buffer, private_key)
        this.notify = true
        return this.deleteWallet( remote_hash_buffer, signature )
    }
    // if( this.wallet_object ) is probably unnecessary, an unset empty_wallet is a empty Map.. Does not hurt to check though. 
    if( this.wallet_object && remote_copy === true ) {
        this.notify = true
        //updateWallet updates remote storage
        return this.updateWallet()
    }
}

/** Create or update a wallet on the server.
*/
function updateWallet() {
    let state = this.storage.state
    let wallet_object = this.wallet_object
    
    return new Promise( resolve => {
    
        if( ! this.private_key )
            throw new Error("login")
        
        let pubkey = state.get("secret_encryption_pubkey")
        let remote_copy = state.get("remote_copy")
        
        let p1 = encrypt(wallet_object, pubkey).then( encrypted_data => {

            // Save locally first
            state = state.merge({
                encrypted_wallet: encrypted_data.toString('base64')
            })
            this.storage.setState(state)
            this.wallet_object = wallet_object
            this.local_status = null
            this.notify = true
            
            if( this.api == null || remote_copy !== true ) {
                resolve( wallet_object )
                return
            }
            
            // Try to save remotely
            let private_key = this.private_key
            let local_hash_buffer = hash.sha256(encrypted_data)
            let local_hash = local_hash_buffer.toString('base64')
            let signature = Signature.signBufferSha256(local_hash_buffer, private_key)
            let code = state.get("remote_token")
            
            if( code != null ) {
                
                // create the server-side wallet for the first time
                return this.api.createWallet(code, encrypted_data, signature).then( json => {
                    
                    assert.equal(json.local_hash, local_hash, 'local_hash')
                    
                    state = state.merge({
                        remote_token: null,
                        remote_hash: local_hash,
                        // encrypted_wallet: encrypted_data.toString('base64'),
                        remote_created_date: json.remote_created_date
                    })
                    this.storage.setState(state)
                    this.remote_status = "Not Modified"
                    this.notify = true
                })
            
            } else {
                // update the server wallet
                let remote_hash = state.get("remote_hash")
                if( ! remote_hash )
                    throw new Error(this.instance + ":Unable to update wallet.  You probably need to provide a remote_token.")
                
                let remote_hash_buffer = remote_hash ? new Buffer(remote_hash, 'base64') : null
                
                return this.api.saveWallet( remote_hash_buffer, encrypted_data, signature) .then( json => {
                    
                    if(json.statusText === "OK") {
                        assert.equal(json.local_hash, local_hash, 'local_hash')
                        state = state.merge({
                            remote_hash: local_hash,
                            remote_updated_date: json.remote_updated_date
                        })
                        this.storage.setState(state)
                        this.remote_status = "Not Modified"
                        this.notify = true
                        return
                    }
                    
                    if( json.statusText !== "OK" ) {
                        this.notify = true
                        this.remote_status = json.statusText // Probably "Conflict"
                        throw new Error(this.instance + ":Unexpected WalletApi.saveWallet status: " + json.statusText )
                    }
                
                })
            }
        })
        resolve(p1.then( ()=> wallet_object ))
    })
}

function deleteWallet( local_hash_buffer, signature ) {
    return this.api.deleteWallet( local_hash_buffer, signature ).then(()=>{
        this.notify = true
        this.storage.setState({
            remote_hash: null,
            remote_created_date: null,
            remote_updated_date: null
        })
    })
}

/** @return {Buffer} or undefined */
function localHash() {
    let encrypted_wallet = this.storage.state.get("encrypted_wallet")
    if( ! encrypted_wallet) return
    return hash.sha256(new Buffer(encrypted_wallet, 'base64'))
}

var toBase64 = data => data == null ? data :
    data["toBuffer"] ? data.toBuffer().toString('base64') :
    Buffer.isBuffer(data) ? data.toString('base64') : data

// required
function req(data, field_name) {
    if( data == null ) throw new Error(field_name + "_required")
    return data
}
