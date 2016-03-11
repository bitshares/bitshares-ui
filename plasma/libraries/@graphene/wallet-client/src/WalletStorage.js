import { fromJS, Map, Set, is } from "immutable"
import { encrypt, decrypt } from "./Backup"
import { PrivateKey, Signature, hash } from "@graphene/ecc"
import { extractSeed } from "@graphene/time-token"
import WalletWebSocket from "./WalletWebSocket"
import WalletApi from "./WalletApi"
import assert from "assert"

const trace = false
let setState_timeouts = Set()
let setState_timeoutId

/**
    A Wallet is a place where private user information can be stored. This information is kept encrypted when on disk or stored on the remote server.

    Anything in the encrypted wallet or storage must be JSON serilizable types only.

    This class creates these fields inside of the encrypted wallet object:
    ```js
    const wallet = fromJS({
        
        // Set on first login
        chain_id: "",
        
        // ISO creation Date string from the browser
        created: undefined,
        
        // Initially same as `created`
        last_modified: undefined,
        
        // {boolean} weak_password - truthy if an empty string was used for the email or username
        // <Not Used> weak_password: null,
        
        // This is the remote_token from the server (via the email request).  The server can validate that this was not altered.  Also it contains a API salt value used for all server operations (signing and encryption). 
        create_token: null,
        
    })
    ```
    
    This is the data kept in the storage object.  Note, the storage object may be configured for RAM only or RAM and disk.
    
    ```js
    const state = fromJS({
        
        // Wallet JSON string encrypted using the private key derived from email+username+password (base64)
        encrypted_wallet: null,
        
        // Server's REST URL
        remote_url: null,
        
        // True to stay in sync with the server (boolean)
        remote_copy: undefined,
        
        // An emailed token used to create a wallet for the first time (base58)
        remote_token: null,
        
        // This is the last encrypted_wallet hash that was found on the server (base64)
        remote_hash: null,
        
        // This is the last hash of local encrypted data.  If it was put on the server, it will be the last hash saved to the server.  This can be compared to the remote_hash to test for conflicts before updating the wallet.
        local_hash: null,
        
        // ISO Date string from the server
        remote_created_date: null,
        
        // ISO Date string from the server
        remote_updated_date: null,
        
        // This is the public key derived from the email+username+password ... This could be brute forced, so consider this private (email+username+password is not random enough to be public). 
        // Removed, instead passwords are checked by trying to decrypt the wallet.
        // private_encryption_pubkey: null,
        
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
        
        {number} [this.queue_mills = 0] - queue the setState update (encryption and backup) for specified milliseconds.  To keep calls queued, set this value again prior to every call to setState.  The final call to setState should not set this value (that will run the update immediately before the timeout and resolve all prior queued calls).  The timeout is reset to its default 0 after all calls to setState.  When queued, the this.wallet_object will still update immediately, if that is not desired the wallet object must be held and updated externally then passed into `setState` when ready.
         
        @arg {IndexedDbPersistence} storage
    */
    constructor(storage) {
        this.wallet_object = Map()
        this.storage = storage
        this.subscribers = Map()
        this.local_status = null
        this.queue_mills = 0
        
        // enable the backup server if one is configured (see useBackupServer)
        let remote_url = this.storage.state.get("remote_url")
        if( remote_url ) {
            this.ws_rpc = new WalletWebSocket(remote_url, true)
            this.api = new WalletApi(this.ws_rpc)
            this.instance = this.ws_rpc.instance // log instance number
        }
        
        // Semi-private functions .. Non standard API, these easily could change.
        this.sync = sync.bind(this)
        this.localHash = localHash.bind(this)
        this.updateWallet = updateWallet.bind(this)
        this.notifyResolve = notifyResolve.bind(this)
        this.deleteRemoteWallet = deleteRemoteWallet.bind(this)
        this.saveServerWallet = saveServerWallet.bind(this)
        this.fetchWalletCallback = fetchWalletCallback.bind(this)
        this.getPrivateApiKey = getPrivateApiKey.bind(this)
    }
    
    isEmpty() {
        return this.storage.state.isEmpty()
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
        Connect to a backup server and download a wallet if one exists.  Providing a null remote_url will disconnect from the server.
        
        Backups will only be made if keepRemoteCopy is enabled.
    
        Calling this method does not immediately trigger any action on the server.  It will however notify subscribers if the remote_url changes.
        
        @arg {string} [ remote_url ] - Provide a URL to start synchronizing, null or undefined to stop synchronizing
        @return Promise - resolve after close or just resolve immediately
    */
    useBackupServer( remote_url = this.storage.state.get("remote_url")) {
        if( remote_url && remote_url.trim() === "" )
            remote_url = null
        
        // close (if applicable)
        let p = this.ws_rpc ? this.ws_rpc.close() : Promise.resolve()
        return this.notifyResolve(p.then(()=>{// wait for close so the socket events remain in order
            if(remote_url != null) {
                this.ws_rpc = new WalletWebSocket(remote_url, true)
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
        }))
    }
    
    /**
        Configure the wallet to save its data on the remote server. If this is set to false, then it will be removed from the server. If it is set to true, then it will be uploaded to the server. If the wallet is not currently saved on the server a token will be required to allow the creation of the new wallet's data on the remote server.
        
        If any parameter is `null`, no changes will take place.  Subscribers are notified if the configuration changes.
        
        The upload or delete operation may be deferred pending: {@link this.login} and {@link this.useBackupServer}
        
        @arg {boolean} remote_copy - Add or delete remote backups or `undefined` (do neither)
        @arg {string} remote_token - Code obtained via `wallet.api.requestCode(email)`.  Only required for the first remote backup (from any computer). 
        @throws {Error} ["remote_url required"|"Wallet is locked"]
        @return {Promise} - only important if the wallet is communicating with the server
    */
    keepRemoteCopy( remote_copy = true, remote_token = this.storage.state.get("remote_token")) {
        
        if( remote_copy != null)
            assert.equal(typeof remote_copy, "boolean", "remote_copy")
        
        // if nothing changed, just return
        if( remote_copy === this.storage.state.get("remote_copy") && remote_token === this.storage.state.get("remote_token"))
            return Promise.resolve()
        
        if( remote_copy === true && ! this.storage.state.get("remote_url"))
            throw new Error(this.instance+":configuration_error, remote_copy without remote_url")
        
        // if( remote_copy === true && ! this.private_key ) {
        //     let weak_password = this.wallet_object.get("weak_password")
        //     assert(! weak_password, "Remote copies are enabled, but an email or username is missing from this wallet's encryption key.")
        // }
        let state = {}
        if( remote_copy !== null) state.remote_copy = remote_copy
        if( remote_token !== null){
            // Store in unencrypted storage until the server accepts it and creates a wallet (then moves into wallet as `create_token`)
            state.remote_token = remote_token
        }
        this.notify = true
        
        return this.notifyResolve(
            this.storage.setState(state).then(()=>{
                this.private_api_key = this.getPrivateApiKey(this.private_key)
                return this.sync()
            })
        )
    }
    
    /**
        This API call is used to load the wallet. If a backup server has been specified then it will attempt to fetch the latest version from the server, otherwise it will load the local wallet into memory. The configuration set by keepLocalCopy will determine whether or not the wallet is saved to disk as a side effect of logging in.
        
        The wallet is unlocked in RAM when it combines these as follows: lowercase(username).trim() + password to come up with a matching public / private key. If keepRemoteCopy is enabled, the server will store a hash of the email.
        
        If the login is successful, subscribers are notified after any potential remote sync has finished but before this method resolves.
        
        @arg {string} username
        @arg {string} password - an emtpy string may be used on a local (non-server) wallet
        @arg {string} chain_id - required on first login.  The transaction layer checks this value to ensure wallet's can not cross-chains.  Chain ID is validated if it is provided on subsequent logins.
        
        @throws {Error<string>} [ username_required | password_required ]
        
        @return {Promise} - can be ignored unless one is interested in the remote wallet syncing
    */
    login( username, password, chain_id = null ) {
        
        req(username, "username")
        req(password, "password")
        
        let private_key = PrivateKey.fromSeed(
            username.trim().toLowerCase() + "\t" +
            password
        )
        
        this.notify = true
        // `sync` will check the server (if configured) and sync up this.storage and this.wallet_object
        
        // if there is a local wallet, get it ready first
        let encrypted_wallet = this.storage.state.get("encrypted_wallet")
        if( encrypted_wallet ) {
            
            // console.log("INFO\tWalletStorage\tlogin", "local wallet")
            
            let public_key = private_key.toPublicKey()
            // check login (username, and password) - fast but this helps a brute force attack and complicates the code
            // if( this.storage.state.get("private_encryption_pubkey") !== public_key.toString())
            //     throw new Error( "invalid_auth" )
            
            // Setup wallet_object so sync will have something too look at
            let backup_buffer = new Buffer(encrypted_wallet, 'base64')
            
            // check login (slow)
            return decrypt(backup_buffer, private_key).then( wallet_object => {
                
                if( chain_id && chain_id !== wallet_object.chain_id)
                    throw new Error( "Missmatched chain id, wallet has " + wallet_object.chain_id + " but login is expecting " + chain_id )
                
                // Merge the wallet_object..  The application code can provided the wallet then login to backup to the server (the wallet restore does this)
                this.wallet_object = this.wallet_object.mergeDeep(wallet_object)
                this.private_api_key = this.getPrivateApiKey(private_key)// unlock
                this.private_key = private_key // unlock
                this.notify = true
                return this.notifyResolve(this.sync())
            })
        }
        
        // New wallet locally, weak && remote check.
        // let weak_password = username.trim() == ""
        // assert(! weak_password || ! this.storage.state.get("remote_copy"),
        //     "Remote copies are enabled, but a username is missing from this wallet's encryption key.")
        
        // Record it, don't send a weak password wallet to the server.
        // this.storage.setState({ weak_password })
        
        let prePopulated = ! this.wallet_object.isEmpty()
        let dt = new Date().toISOString()
        {
            // Merge default values. A restore puts stuff in this.wallet_object before calling `login`..
            let defaults = { chain_id, created: dt, last_modified: dt }
            let wallet_object = Map(defaults).merge(this.wallet_object)
            // console.log("WalletStorage("+this.instance+")\tlogin defaults " + (wallet_object !== this.wallet_object ? "added" : "not added") ) // debug
            this.wallet_object = wallet_object
        }
        
        // Stronger server-salted key.
        let private_api_key = this.getPrivateApiKey(private_key)
        
        // A wallet_object may be pre-populated before logging in.
        if( prePopulated ) {
            return this.updateWallet(private_key, private_api_key)// save or create (or conflict)
                .then(()=> this.sync(private_key, private_api_key))// subscribe to updates
                .then(()=> this.private_key = private_key )// unlock
                .then(()=> this.private_api_key = private_api_key )// unlock
                .then(()=> this.notifyResolve())
        }
        
        // fetch and subscribe to updates.
        return this.sync(private_key, private_api_key).then( ()=>{
            
            if(trace) console.log("WalletStorage("+this.instance+")\tlogin wallet " + (dt === this.wallet_object.get("created") ? "initilized" : "downloaded")) // debug

            // Need a chain_id from somewhere
            if( ! this.wallet_object.has("chain_id"))
                assert(chain_id, "Chain ID is required on first login")
            
            if( chain_id && this.wallet_object.has("chain_id"))
                if(this.wallet_object.get("chain_id") !== chain_id)
                    throw new Error("Missmatched chain id, wallet has " + this.wallet_object.get("chain_id") + " but login is expecting " + chain_id)
            
            this.private_key = private_key // unlock
            this.private_api_key = private_api_key // unlock
            return this.notifyResolve()
        })
    }
    
    // static restore( api_key, username, password, chain_id = null ) {
    // }
    
    /**
        Remove unencrypted wallet from memory, and unsubscribe to wallet updates.
        
        @return {Promise} resolve immediately or after a successful unsubscribe
    */
    logout() {
        this.wallet_object = Map()
        this.remote_status = null
        
        if( ! this.private_key )
            return Promise.resolve()
        
        // Capture the public key first (for unsubscribe)
        let api_pubkey = this.private_api_key ? this.private_api_key.toPublicKey().toString(""/*address prefix*/) : null
        
        this.private_key = null // logout
        this.private_api_key = null // logout
        
        let unsub
        if(api_pubkey && this.api && this.ws_rpc.getSubscriptionId("fetchWallet", api_pubkey)) {
            unsub = this.api.fetchWalletUnsubscribe(api_pubkey)
        } else {
            unsub = Promise.resolve()
        }
        this.notify = true
        return this.notifyResolve( unsub
            // useBackupServer() will close the connection (this does not change the configuration)
            .then(()=> this.useBackupServer())
        )
    }
    
    /**
        @return {boolean} true if password matches
        @throws {Error} "Wallet is locked" (if locked)
    */
    verifyPassword( username, password) {
        
        if( ! this.private_key )
            return Promise.reject("Wallet is locked")
        
        req(username, "username")
        req(password, "password")
        
        let private_key = PrivateKey.fromSeed(
            username.trim().toLowerCase() + "\t" +
            password
        )
        
        return private_key.toWif() === this.private_key.toWif()
    }
    
    /**
        This method returns the wallet_object representing the state of the wallet.  It is only valid if the wallet has successfully logged in.  If the wallet is known to be in a consistent state (after a login for example) one may instead access the object directly `this.wallet_object` instead.
        
        @throws {Error} - "wallet_locked"
        @return {Promise} {Immutable} wallet_object
    */
    getState() {
        if( ! this.private_key )
            throw new Error("wallet_locked")
        
        return this.notifyResolve( this.sync().then(()=> this.wallet_object ))
    }

    /** 
        Updates the server, this can be slow be cautious about calling.
        
        This method is used to update the wallet state. If the wallet is configured to keep synchronized with the remote wallet then the server will refer to a copy of the wallets revision history to ensure that no version is overwritten. If the local wallet ever falls on a fork an attempt to upload that wallet will cause the API call to fail; a reconcilation will be needed. After successfully storing the state on the server, save the state to local memory, and optionally disk.
        
        A deep merge is used (see ImmutableJs).  This is less prone to loosing information.  If something should be removed you will need to update the wallet_object direclty then call setState to presist the change.
        
        This method does not perform any updates if the wallet_object is the same (using Immutable.Js will help ensure that this will work).
        
        The Immutable version of wallet_object ends up in `this.wallet_object` (synchronizing may be in progress)
        
        @arg {Immutable|object} wallet_object - mutable or immutable object .. no loops, only JSON serilizable data
        @throws {Error} - [wallet_locked, etc...]
        @return {Promise} - resolve or reject on completion.  One may also monitor this.local_status and this.remote_status.
    */
    setState( wallet_object)  {
        
        try { throw new Error("trace") } catch(error) { console.log('TRACE\tWalletStorage who called?', error) }
        
        if( ! typeof wallet_object === "object")
            throw new Error("wallet_object: expecting object, got " + typeof(wallet_object))
        
        if( ! this.private_key )
            throw new Error("wallet_locked")
        
        assert(this.wallet_object.has("created"), "Login to create wallet")
        
        // Immutable js merge is good at keeping object equality
        wallet_object = this.wallet_object.mergeDeep(fromJS(wallet_object))
        
        // Still the same after merging?
        if(this.wallet_object === wallet_object) {
            return Promise.resolve()
        }
        
        this.notify = true
        this.local_status = "Pending"
        this.wallet_object = wallet_object
        this.wallet_object = this.wallet_object.set("last_modified", new Date().toISOString())
        
        let upd = ()=> this.notifyResolve(
            this.updateWallet().catch( error => {
                console.error("WalletStorage:"+this.instance+'\tsetState', error, 'stack', error.stack)
                throw error
            })
        )
        let timeUp = ()=> {
            let p = upd()
            setState_timeouts.forEach(r => r(p))
            setState_timeouts = Set()
            return p
        }
        if(this.queue_mills === 0)
            return timeUp()
        
        return new Promise( resolve =>{
            clearTimeout(setState_timeoutId)
            setState_timeouts = setState_timeouts.add(resolve)
            setState_timeoutId = setTimeout(()=> timeUp(), this.queue_mills)
            this.queue_mills = 0
        })
    }
    
    /**
    *  @arg {function} callback anytime this wallet is updated
    *  @arg {Promise} resolve - for unit testing (this may be removed) 
    */
    subscribe( callback, resolve = null ) {
        if(this.subscribers.has(callback)) {
            console.error("[WalletStorage:"+this.instance+"\tSubscribe callback already exists", callback)
            return
        }
        this.subscribers = this.subscribers.set(callback, resolve)
    }

    /**
    *  Remove a callback that was previously added via {@link this.subscribe}
    */
    unsubscribe( callback ) {
        if( ! this.subscribers.has(callback)) {
            console.log("[WalletStorage:"+this.instance+"\tWARN Unsubscribe callback does not exists")
            return
        }
        this.subscribers = this.subscribers.remove( callback )
    }
    
    /**
        Change password and leave the wallet unlocked with the new password.  You must be logged in to change the password.
        
        @arg {string} password
        @arg {string} username
        
        @throws {Error} [ username_required | password_required | wallet_empty ]
        @return {Promise} - can be ignored unless interested in the remote wallet syncing.
        
    */
    changePassword( password, username = "") {
        
        req(password, "password")
        
        if( ! this.private_key )
            throw new Error("Wallet is locked")
        
        if( ! this.storage.state.get("encrypted_wallet") )
            throw new Error("wallet_empty")
        
        // let weak_password = username.trim() == ""
        // assert( ! weak_password || ! this.storage.state.get("remote_copy"),
        //     "Remote copies are enabled, but username is missing from this wallet's encryption key.")
        
        // let original_local_hash = this.localHash()
        // let remote_copy = this.storage.state.get("remote_copy")
        
        // if( remote_copy === true && this.storage.state.has("remote_hash")) {
        //     let remote_hash = this.storage.state.get("remote_hash")
        //     if( toBase64(original_local_hash) !== remote_hash ) {
        //         // Check this now before changing local encrypted data, better to not find out later that the server can't be updated
        //         throw new Error("wallet_modified: Can't change password, this wallet has a modified remote copy")
        //     }
        // }
        
        let old_private_api_key = this.private_api_key ? this.private_api_key : null
        let old_public_api_key = this.private_api_key ? this.private_api_key.toPublicKey() : null
        let new_private_key = PrivateKey.fromSeed( username.trim().toLowerCase() + "\t" + password )
        let new_private_api_key = this.getPrivateApiKey(new_private_key, false/* null unless remote copy */)
        
        // If new_public_api_key is null it will avoid extra encryption below
        let new_public_api_key = new_private_api_key ? new_private_api_key.toPublicKey() : null
        let new_public_key = new_private_key.toPublicKey()
        
        this.wallet_object = this.wallet_object.merge({ last_modified: new Date().toISOString() })
        
        let encrypted_wallet, encrypted_server
        
        return Promise.resolve()
        .then(()=> encrypt(this.wallet_object, new_public_key)).then( e => encrypted_wallet = e)
        .then(()=> encrypt(this.wallet_object, new_public_api_key)).then( e => encrypted_server = e)
        .then(()=> {
            
            this.local_status = null
            this.notify = true
            
            if( ! encrypted_server ) {
                this.private_key = new_private_key // unlock
                
                return this.notifyResolve(
                    this.storage.setState({
                        // weak_password,
                        encrypted_wallet: encrypted_wallet.toString('base64'),
                        local_hash: hash.sha256(encrypted_wallet).toString("base64"),
                        // private_encryption_pubkey: new_public_key.toString()
                    })
                )
                return
            }
            
            let subId = this.ws_rpc.getSubscriptionId("fetchWallet", old_public_api_key.toString(""/*address prefix*/))
            if( subId != null )
                this.api.fetchWalletUnsubscribe(old_public_api_key).catch( error => reject(error))
                    .catch(error => console.error("WalletStorage\tunsubscribe error", error))//non fatal
            
            let original_remote_hash = this.storage.state.get("remote_hash")
            let original_signature = Signature.signBufferSha256(new Buffer(original_remote_hash, "base64"), old_private_api_key)
            
            let new_remote_hash = hash.sha256(encrypted_server)
            let new_signature = Signature.signBufferSha256(new_remote_hash, new_private_api_key)
            
            let changePromise = this.api.changePassword( original_remote_hash, original_signature, encrypted_server, new_signature )
            .then( json => {
                if( json.statusText !== "OK")
                    throw new Error("Change password API call failed: " + json)
                
                assert(json.local_hash, "local_hash")
                assert(json.updated, 'updated')
                
                this.notify = true
                this.private_key = new_private_key // unlock
                this.private_api_key = new_private_api_key // unlock
                
                return this.storage.setState({
                    // weak_password,
                    encrypted_wallet: encrypted_wallet.toString('base64'),
                    local_hash: hash.sha256(encrypted_wallet).toString("base64"),
                    remote_hash: json.local_hash,
                    remote_updated: json.updated
                })
            })
            return this.notifyResolve( changePromise )
        })
    }
    
    /** @return {string} seed - `null` or tab delimited data: "email\tapi_key" */
    getTokenSeed() {
        return extractSeed(this.wallet_object.get("create_token") || this.storage.state.get("remote_token"))
    }
    
}

function sync(private_key = this.private_key, private_api_key = this.getPrivateApiKey(private_key)) {

    // let remote_copy === false pass-through (into the delete the wallet below)
    // Wallet is locked OR it is an offline wallet.
    let sync_impossible = ! private_key || ! this.api || ! private_api_key
    if(trace && ! sync_impossible) console.log("WalletStorage("+this.instance+")\tsync")
    
    if(sync_impossible ) 
        return Promise.resolve()
    
    let public_api_key = private_api_key.toPublicKey()
    let subscription_id = this.ws_rpc.getSubscriptionId("fetchWallet", public_api_key.toString(""/*address prefix*/))
    if( subscription_id == null ) {
        // Create subscription .. `resolve` is for the server wallet's callback
        return new Promise( (resolve, reject) => {
            
            // Rely on the callback to "resolve"
            // This promise can't server as the return value, we are only after the error.
            this.api.fetchWallet(
                public_api_key, this.localHash(),
                server_wallet => resolve(this.fetchWalletCallback(server_wallet, private_key, private_api_key))
            )
            .catch( error => reject(error))
            
        })
    }
    assert( subscription_id != null, "Subscription required")
    if(this.remote_status)
        assert( /No Content|Not Modified/.test(this.remote_status),
            "Expecting No Content or Not Modified, got " + this.remote_status)
    
    if( this.remote_status === "Not Modified" && this.storage.state.get("remote_copy") === false )
        return this.deleteRemoteWallet(private_key, private_api_key)

    return this.updateWallet(private_key, private_api_key)
}

function fetchWalletCallback(server_wallet, private_key, private_api_key) {
    // A subscribe callback does not have a statusText but the initial fetch does
    let subscriptionRequest = ! server_wallet.statusText
    let fetch = fetchWallet.bind(this)
    let fetchPromise = Promise.resolve().then(()=> fetch(server_wallet, private_key, private_api_key))
    if( subscriptionRequest )
        return this.notifyResolve( fetchPromise )
    else
        // The API call will notify
        return fetchPromise
}

/**
    Take the most recent server wallet and the local wallet then decide what to do: 'pull' from the server, or 'push' changes to the server ...
    @private
*/
function fetchWallet(server_wallet, private_key, private_api_key) {
    
    let has_local = this.storage.state.has("encrypted_wallet")
    let local_hash = has_local ? this.storage.state.get("local_hash") : null
    
    let old_hash = this.storage.state.get("remote_hash")
    // let had_remote = old_hash != null
    
    let new_hash = server_wallet.statusText === "Not Modified" ? local_hash : server_wallet.local_hash
    let has_remote = new_hash != null // deleted
    
    if( new_hash )
        this.storage.setState({ remote_hash: new_hash })
    
    // No status? Subscription requests
    if( ! server_wallet.statusText ) {
        
        // Another connection modified the wallet, so the server was not passed our local hash again so this time it does not know the status. 
        
        // console.log("subscription received, this.instance", this.instance)
        server_wallet.statusText = 
            ! has_remote ? "No Content" : // deleted
            local_hash === new_hash ? "Not Modified" : "OK"
    }
    
    assert(/OK|No Content|Not Modified/.test(server_wallet.statusText), this.instance + " Invalid status: " + server_wallet.statusText)
    
    if(trace) console.log(`WalletStorage(${this.instance})\tServer ${server_wallet.statusText}, local_hash, old_hash, new_hash -> `, local_hash, old_hash, new_hash)
    
    if( this.remote_status != server_wallet.statusText ) {
        this.remote_status = server_wallet.statusText
        this.notify = true
    }
    if( has_remote && this.storage.state.get("remote_copy") === false ){
        this.notify = true
        return this.deleteRemoteWallet(private_key, private_api_key, new_hash)
    }
    
    if( ! has_remote && ! has_local ) {
        assert(/No Content/.test(server_wallet.statusText))
        return
    }
    
    this.notify = true
    
    // Another connecton deleted the wallet, but this connection is still backing up.. So, push it anyways.
    if( ! has_remote )
        return this.updateWallet(private_key, private_api_key)
    
    if( ! has_local )
        return this.saveServerWallet(server_wallet, private_key, private_api_key)

    // Two wallets and a new wallet is arriving
    
    if( local_hash === new_hash) {
        console.log("WalletStorage\tWallet online, nothing chanaged")
        return
    }
    
    if( old_hash === new_hash ) {
        console.log("WalletStorage\tWallet fetch, nothing chanaged")
    }
    
    let local_mod = local_hash !== old_hash
    let server_mod = old_hash !== new_hash
    
    if( local_mod && server_mod ) {
        
        // Both wallets modified.  An internal wallet comparison is required to resolve.
        
        // Unit tests are checking for /Conflict/
        this.remote_status = "Conflict"
        throw new Error("WalletWebSocket("+this.instance+") Conflict, both server and local wallet modified")
    }
    
    if( local_mod )
    {
        return this.updateWallet(private_key, private_api_key)
    }
    // The server had this copy of this wallet when another device changed it (meaning that the other device must have been in sync with the wallet when the change was made).  It is safe to pull this wallet and overwrite the local version.
    if( server_mod )
        return this.saveServerWallet(server_wallet, private_key, private_api_key)
        
    assert(old_hash === new_hash, "Conflict")
    
}

function deleteRemoteWallet(private_key, private_api_key, local_hash = this.localHash()) {
    
    let create_token = this.wallet_object.get("create_token") || this.storage.state.get("remote_token")
    assert(create_token, "create_token missing")
    
    if( ! Buffer.isBuffer(local_hash))
        local_hash = new Buffer(local_hash, "base64")
    
    let signature = Signature.signBufferSha256(local_hash, private_api_key)
    let public_key = private_key.toPublicKey()
    
    return this.api.deleteWallet( create_token, local_hash, signature ).then(()=> {
        this.notify = true
        this.remote_status = "No Content"
        return this.storage.setState({
            remote_hash: null,
            remote_created_date: null,
            remote_updated_date: null,
        })
    })
}

function saveServerWallet(server_wallet, private_key, private_api_key, chain_id) {
    
    assert(server_wallet.local_hash, "server_wallet.local_hash")
    assert(server_wallet.encrypted_data, "server_wallet.encrypted_data")
    
    let wallet_object, encrypted_wallet
    let backup_buffer = new Buffer(server_wallet.encrypted_data, 'base64')
    let public_key = private_key.toPublicKey()
    
    return Promise.resolve()
    .then(()=> decrypt(backup_buffer, private_api_key)).then( w => wallet_object = w)
    .then(()=> {
        if(chain_id && chain_id !== wallet_object.chain_id)
            throw "chain_id_missmatch"
    })
    .then(()=> encrypt(wallet_object, public_key)).then( w => encrypted_wallet = w)
    .then(()=> {
        let p = this.storage.setState({
            encrypted_wallet: encrypted_wallet.toString("base64"),
            local_hash: server_wallet.local_hash,
            remote_hash: server_wallet.local_hash,
            remote_token: null, // unit tests will over-populate remote_token
            remote_updated_date: server_wallet.updated,
            remote_created_date: server_wallet.created,
        })        
        this.wallet_object = fromJS( wallet_object )
        this.remote_status = "Not Modified"
        this.local_status = null
        this.notify = true
        if(trace) console.log("WalletStorage("+this.instance + ")\tsaveServerWallet local wallet updated", this.storage.state.get("remote_hash"))
        return p
    })
}

/**
    Update the encrypted wallet in storage, then create or update a wallet on the server.  The WalletApi may detect a conflict .
    @private call `setState` instead
*/
function updateWallet(private_key = this.private_key, private_api_key = this.getPrivateApiKey(private_key)) {
    
    if( ! private_key )
        throw new Error("Wallet is locked")
        
    let public_key = private_key.toPublicKey()
    let remote_hash = this.storage.state.get("remote_hash")
    let remote_copy = this.storage.state.get("remote_copy")
    let code = this.wallet_object.get("create_token") || this.storage.state.get("remote_token")
    
    if((remote_hash == null) !== (this.remote_status == null || this.remote_status === "No Content"))
        console.log("WalletStorage\tDEBUG remote_hash / remote_status mismatch",
            remote_hash, this.remote_status)
    
    let should_create = code != null && (remote_hash == null || this.remote_status === "No Content")
    let wallet_object = should_create ? this.wallet_object.set("create_token", code) : this.wallet_object
    let public_api_key = private_api_key ? private_api_key.toPublicKey() : null
    
    let encrypted_server, encrypted_wallet
    
    this.local_status = null
    this.notify = true
    
    const enc_local = ()=> encrypt(wallet_object, public_key)
        .then(e =>{
            let local_hash = hash.sha256(e).toString("base64")
            return this.storage.setState({ encrypted_wallet: e.toString('base64'), local_hash })
        })
    
    if( this.api == null || remote_copy !== true )
        return enc_local()
    
    if( code == null && this.remote_status === "No Content" )
        return enc_local()
    
    let p1 = Promise.resolve()
    .then(()=> encrypt(wallet_object, public_key)).then( e => encrypted_wallet = e)
    .then(()=> encrypt(wallet_object, public_api_key)).then( e => encrypted_server = e)
    .then(()=> {
        
        // Try to save remotely
        let local_hash_buffer = hash.sha256(encrypted_server)
        let local_hash = local_hash_buffer.toString('base64') // assert.equal(local_hash, toBase64(this.localHash()))
        let signature = Signature.signBufferSha256(local_hash_buffer, private_api_key)
        
        if( should_create ) {
            
            assert.equal( this.remote_status, "No Content", "remote_status")
            
            // Create the server-side wallet for the first time
            // This will not trigger a subscription event to this connection (this connection knows about the wallet)
            return this.api.createWallet(code, encrypted_server, signature).then( json => {
                
                assert.equal(json.local_hash, local_hash, 'local_hash')
                assert(json.created, 'created')
                
                this.notify = true
                this.remote_status = "Not Modified"
                this.wallet_object = wallet_object // expose the create_token
                
                return this.storage.setState({
                    remote_token: null,
                    local_hash: local_hash,
                    remote_hash: local_hash,
                    remote_created_date: json.created,
                    remote_updated_date: json.created, // created == updated
                    encrypted_wallet: encrypted_wallet.toString('base64'),
                })
            })
            .catch( error => {
                if( error.message === "invalid_token" ) {
                    console.log("WalletStorage\tremoving invalid token")
                    this.storage.setState({ remote_token: null })
                    this.setState({ create_token: null })
                }
                throw error
            })
        
        } else {
            
            assert(remote_hash, "Can't update the server wallet.  A remote token may be required to create the wallet.")
            assert(/OK|Not Modified/.test(this.remote_status), "remote_status")
            let remote_hash_buffer = new Buffer(remote_hash, 'base64')
            
            // This will not trigger a subscription event to this connection (this connection knows about the wallet update)
            return this.api.saveWallet( remote_hash_buffer, encrypted_server, signature) .then( json => {
                
                if(json.statusText === "OK") {
                    
                    assert.equal(json.local_hash, local_hash, 'local_hash')
                    assert(json.updated, 'updated')
                    
                    this.notify = true
                    this.remote_status = "Not Modified"
                    // No need to update this.wallet_object (no change)
                    
                    return this.storage.setState({
                        local_hash: local_hash,
                        remote_hash: local_hash,
                        remote_updated_date: json.updated,
                        encrypted_wallet: encrypted_wallet.toString('base64'),
                    })
                }
                
                this.notify = true
                this.remote_status = json.statusText // Probably "Conflict"
                throw new Error(this.instance + ":Unexpected WalletApi.saveWallet status: " + json.statusText )
            
            })
        }
    })
    return p1.then( ()=> this.wallet_object )
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
                console.error("WalletStorage:"+this.instance+"\tnotifySubscribers" , error, 'stack', error.stack)
        }
    })
}

function getPrivateApiKey(private_key, if_remote_copy_enabled = false) {
    
    if( ! private_key)
        return null
    
    if(if_remote_copy_enabled && (this.api == null || this.storage.state.get("remote_copy") !== true))
        return null
    
    let seed = this.getTokenSeed()
    if( seed == null)
        return null
    
    let [ /*email*/, api_key ] = seed.split("\t")
    assert(api_key, "Token is missing api_key")
    // console.log('api_key', api_key)
    return PrivateKey.fromSeed( private_key.toWif() + api_key )
}

// /** @return {Buffer} or undefined */
function localHash() {
    let local_hash = this.storage.state.get("local_hash")
    if( ! local_hash) return
    return new Buffer(local_hash, 'base64')
}

var toBase64 = data => data == null ? data :
    data["toBuffer"] ? data.toBuffer().toString('base64') :
    Buffer.isBuffer(data) ? data.toString('base64') : data

// required
function req(data, field_name) {
    if( data == null ) throw new Error(field_name + "_required")
    return data
}