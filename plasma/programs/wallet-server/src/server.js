
import reducer from './reducer'
import {createStore} from 'redux'
// import {createStore, applyMiddleware} from 'redux'
// import createMiddleware from './middleware'
import * as actions from './actions'
import { wsResponse, wsReplySugar } from "./ws-api"
import {checkToken} from "@graphene/time-token"
import { Set, Map } from "immutable"
import * as subscriptions from "./subscriptions"
import RateLimit from "./RateLimit"

const {
    /** Server listen port */
    npm_package_config_network_port,
    
    /** Limit the number of wallet requests it accepts per IP address to a fixed number per hour. */
    npm_package_config_network_ip_requests_per_hour,
    
} = process.env

const ratelimitConfig = {
    duration: 60 * 60 * 1000, // 1 hour
    max: npm_package_config_network_ip_requests_per_hour
}

let limit = new RateLimit(ratelimitConfig)

let sockets = Set()
let WebSocketServer = require("ws").Server

export default function createServer() {
    // const createStoreWithMiddleware = applyMiddleware( createMiddleware() )(createStore)
    // const store = createStoreWithMiddleware( reducer )
    const store = createStore( reducer )

    let wss = new WebSocketServer({port: npm_package_config_network_port})
    wss.on('listening', ()=>{ if(global.INFO) console.log('INFO\tserver\tlistening port %d', npm_package_config_network_port) })
    wss.on('close', ()=>{ if(global.INFO) console.log('INFO\tserver\tclosed port %d', npm_package_config_network_port) })
    wss.on('error', error =>{ console.error('ERROR\tserver\tonerror', error, 'stack', error.stack) })
     
    // Limit number of requests per hour by IP
    if(global.INFO) console.log("INFO\tserver\tLimit by IP address", {
        max: ratelimitConfig.max,
        duration: ratelimitConfig.duration/1000/60+' min'
    })
    
    wss.on("connection", ws => { try {
    
        sockets = sockets.add(ws)
        if(global.INFO) console.log('INFO\tserver\tNEW SOCKET',"\tIP", ipAddress(ws), "\tTotal sockets", sockets.count())
        
        ws.on('close', ()=> { try {
            subscriptions.remove(ws)
            sockets = sockets.remove(ws)
            if(global.INFO) console.log("INFO\tserver\tclose", "remaining sockets", sockets.count(),
                "remaining subscriptions", subscriptions.count())
        } catch(error) { console.error("ERROR\tserver\tclose", error, 'stack', error.stack) } })
        
        ws.on('message', msg => {
            
            // be carefull, an exception here (before the "try") will crash the server!
            
            let id
            let wsType = ws // standared non-subscription reply
            
            try {
                
                if( limit.over(ipAddress(ws)) ) {
                    wsResponse(ws, id, "Too Many Requests")
                    ws.close()
                    return
                }
                
                if( ws.upgradeReq.url !== "/") {
                    wsResponse(wsType, id, "Bad Request", { error: "Unknown URL: " + ws.upgradeReq.url})
                    return
                }
            
                let payload = JSON.parse(msg)

                id = payload.id
                let { method, params } = payload
                let { subscribe_id, unsubscribe_id, subscribe_key } = params
                
                if( subscribe_id != null || unsubscribe_id != null) {
                    if( ! subscribe_key ) {
                        wsResponse(wsType, id, "Bad Request", { error: "Missing subscribe_key" })
                        return
                    }
                    
                    // un-wrap parameters
                    params = params.params
                    
                    if( subscribe_id != null ) {
                        
                        if( subscriptions.subscribe(ws, method, subscribe_key, subscribe_id)) {
                            
                            // Send the OK that the subscription was successful
                            wsResponse(wsType, id, "OK")
                            
                            // Setup subscription reply (this format is detected in ws-api)
                            wsType = { websocket: ws, subscription_id: subscribe_id }
                            
                            // Do NOT return, allow the subscription call to execute below
                        } else {
                            wsResponse(wsType, id, "Bad Request", { error: "Already subscribed" })
                            return
                        }
                        
                    } else if( unsubscribe_id != null ) {
                        if( subscriptions.unsubscribe(ws, method, subscribe_key, unsubscribe_id)) {
                            wsResponse(wsType, id, "OK")
                        } else {
                            wsResponse(wsType, id, "Bad Request", { error: "Unknown unsubscription" })
                        }
                        return
                    }
                }
                
                let methodFunction = actions[method]
                if( ! methodFunction ) {
                    if( debug ) console.error("ERROR\tunknown method", method)
                    wsResponse(wsType, id, "Bad Request", { error: "Unknown method" })
                    return
                }
                let action = methodFunction( params )
                if(global.DEBUG) {
                    let str = JSON.stringify(action)
                    str = str.replace(/[A-Za-z0-9+/]{60,}=*/g, "...base64...")
                    console.log("DEBUG\tserver\tmessage", method, str)
                }
                if( ! action || ! store.dispatch ) {
                    wsResponse( wsType, id, "OK" )
                    return
                }
                //  Allow the reducer to reply with a message
                wsReplySugar( wsType, id, action ) // Add a reply function to "action"
                store.dispatch( action )
            } catch( error ) { try {
                console.error("ERROR\tserver\t", error, 'stack', error.stack)
                wsResponse(wsType, id, "Bad Request", typeof error === "string" ? {error} : undefined)
            } catch( error ) {
                console.error("ERROR\tserver\t", error, 'stack', error.stack)
            }} 
        })
    
    } catch(error) { console.error("ERROR\tserver\t", error, 'stack', error.stack) } })
    
    return { server: wss }
}

let ipAddress = ws => {
    try {
        // x-forwarded-for, behind a reverse proxy (like Nginx)
        return (ws.upgradeReq && (ws.upgradeReq.headers['x-forwarded-for']) ||
            ws.upgradeReq.connection.remoteAddress)
        
    }catch(e) {
        return
    }
}
