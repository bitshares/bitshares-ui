Promise = require '../common/Promise'
PublicKey = require '../ecc/key_public'

v = require '../chain/serializer_validation'
chain_config = require '../chain/config'
chain_types = require '../chain/chain_types'
api = require('../rpc_api/ApiInstances').instance()
type = require './serializer_operation_types'

### Makes account, key, assset instance ID lookups very easy. All functions
    return an object with an attribute 'resolved' ( ex: {resolve: 1} ).  The
    resolve value may not be available until after the resolve() promise
    is finished (ex: resolve().then(...) ).
###
class Lookup
    
    constructor:->
        @_private = new Private()
    
    object:(id)->
        ret = resolve: undefined
        _private = @_private
        ((ret)->
            _private.deferred_lookup "object", id, (object)->
                ret.resolve = object
        )(ret)
        ret
    
    ###*
    Resolve an account id from an account name.  An account id resolves unchanged. 
    ###
    account_id:(name_or_id)->
        return resolve: name_or_id if v.is_empty name_or_id
        # account instance or account id
        i = @_private.try_simple_resolve "account", name_or_id
        return i unless i is undefined
        account_name = name_or_id
        @_private.deferred_property "accountname", "id", account_name
    
    ###*
    Resolve an asset id from an asset name.  An asset id resolves unchanged. 
    ###
    asset_id:(name_or_id)->
        return resolve: name_or_id if v.is_empty name_or_id
        i = @_private.try_simple_resolve "asset", name_or_id
        return i unless i is undefined
        asset_name = name_or_id
        return resolve: 0 if (
            asset_name is "CORE" or
            asset_name is chain_config.address_suffix
        )
        @_private.deferred_property "assetname", "id", asset_name
    
    asset_symbol_precision:(id)->
        ret = resolve: undefined
        _private = @_private
        ((ret)->
            _private.deferred_lookup "object", id, (asset)->
                ret.resolve = [asset.symbol, asset.precision]
        )(ret)
        ret
    
    ###* 
    Resolves a memo public key from an account name or account id.  A public key
    resolves as-is.
    ###
    memo_public_key:(name_key_or_id)->
        return resolve: name_key_or_id if v.is_empty name_key_or_id
        return resolve: name_key_or_id if name_key_or_id.Q # typeof is PublicKey
        if name_key_or_id.indexOf(chain_config.address_prefix) is 0
            return resolve: PublicKey.fromPublicKeyString name_key_or_id
        
        _private = @_private
        index_name = if name_key_or_id.indexOf("1." + chain_types.object_type.account + ".") is 0
            "object"
        else
            "accountname"
        
        ret = resolve: undefined
        ((ret)->
            _private.deferred_lookup index_name, name_key_or_id, (account)->
                # console.log('... account.options.memo_key',index_name,name_key_or_id,account.options)    
                ret.resolve = PublicKey.fromPublicKeyString account.options.memo_key
        )(ret)
        ret
    
    resolve:->
        @_private.resolve()

class Private
    
    ###
    Lookup map is erased (re-pointed to an empty map) before callback 
    function are called.  This allows the resolve to find additional 
    dependencies (they will appear in the new lookup_map).
    ###
    constructor: ->
        @lookup_map = {}
    
    try_simple_resolve:(type, name_or_id)->
        # v.is_digits is true when name_or_id is what we needed
        return resolve: name_or_id if v.is_empty(name_or_id) or v.is_digits(name_or_id)
        type_id = chain_types.object_type[type]
        if name_or_id.indexOf("1.#{type_id}.") is 0
            return resolve: name_or_id
        return undefined
    
    get_group_by:(key, map = @lookup_map)->
        # use non-numeric index into 'map' (ensures key order)
        if (value = map[""+key]) isnt undefined
            return value
        map[key] = {}
    
    get_list:(key)->
        if (value = @lookup_map[key]) isnt undefined
            return value
        @lookup_map[key] = []
    
    deferred_property: (index_name, result_property_name, lookup_value)->
        ret = resolve: undefined
        ((ret, result_property_name)=>
            @deferred_lookup index_name, lookup_value, (result)->
                if result is null
                    ret.resolve = null
                    return
                properties = result_property_name.split '.'
                _result = result
                for property in properties
                    _result = _result[property]
                ret.resolve = _result
                return
        )(ret, result_property_name)
        ret
    
    deferred_lookup:(index_name, lookup_value, lookup_callback)->
        if lookup_value.resolve
            throw new Error "Invalid lookup value #{lookup_value}"
        index_group = @get_group_by index_name
        value_group = @get_group_by lookup_value, index_group
        #console.log('... index_name + lookup_value\t',index_name + "\t" + lookup_value)
        defers = @get_list(index_name + "\t" + lookup_value)
        defers.push lookup_callback
        #console.log '... defers', defers
        return
    
    resolve:()->
        db = api.db_api()
        lookup_map = null
        promises = null
        query=(index_name, api_call, unique_key)->
            paramMap = lookup_map[index_name]
            if paramMap
                params = Object.keys paramMap
                # DEBUG console.log('... api_call',api_call)
                # DEBUG console.log '... params', JSON.stringify params
                promise_call = db.exec( api_call, [params] )
                ((params,index_name,unique_key)->
                    promises.push promise_call.then (results)->
                        for i in [0...results.length] by 1
                            result = results[i]
                            for lookup_callback in lookup_map[ index_name + "\t" + params[i] ]
                                lookup_callback(result)
                        return
                    , (e)->
                        console.error(
                            "lookup_callback error"
                            JSON.stringify(api_call)
                            JSON.stringify(params)
                            index_name
                            unique_key
                        )
                        throw e
                )(params,index_name,unique_key)
            return
        
        _resolve= =>
            promises = []
            lookup_map = @lookup_map
            @lookup_map = {} # clean slate, captures dependencies
            query "accountname", "lookup_account_names", "name"
            query "assetname", "lookup_asset_symbols", "symbol"
            query "object", "get_objects", "id"
            Promise.all(promises).then ()=>
                #console.log('... Object.keys(@lookup_map).length',Object.keys(@lookup_map).length)
                if Object.keys(@lookup_map).length isnt 0
                    _resolve()
                else
                    @lookup_map = {}
                    return
        _resolve()

module.exports = new Lookup()
