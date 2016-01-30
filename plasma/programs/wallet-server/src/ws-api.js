import http from 'http'
import * as subscriptions from "./subscriptions"

// Response helpers..  Create: response_codes = { "Accepted": 202, ...}

var response_codes = {}
for(let code in http.STATUS_CODES) response_codes[http.STATUS_CODES[code].toLowerCase()] = code

export function wsResponse(ws, id, statusText, data = {}) {
    let status = response_codes[statusText.toLowerCase()]
    if( ! status ) throw 'Unknown HTTP Status message: ' + statusText
    let badRequest = /Bad Request/i.test(statusText)
    if( data == null || typeof data !== 'object') data = { message: data }
    data.status = status
    data.statusText = statusText
    let response = badRequest ? { error: data } : { result: data }
    response.id = id
    if( ws.websocket && ws.subscription_id != null ) {
        // Send a subscription reply
        ws.websocket.send(JSON.stringify({
            method: "notice",
            params: [ws.subscription_id, response.result || response.error]
        }))
    } else
        ws.send( JSON.stringify(response) )
}


/** Simple HTTP status callbacks used to reply to the client */
export function wsReplySugar( ws, id, action ) {
    
    action.walletNotify = (wallet) =>{
        wallet.encrypted_data = toBase64(wallet.encrypted_data)
        subscriptions.notifyOther(ws, "fetchWallet", wallet.public_key, wallet)
    }
    
    action.reply = ( message, data ) =>{
        if( message.then ) {// Promise
            message
            .then( data =>{
                if( typeof data === 'string' ) {
                    // Try to convert a valid reponse strings into a code: like 'Not Modified'
                    let code = response_codes[data.toLowerCase()]
                    if( code != null ) {
                        wsResponse(ws, id, data)
                        return
                    }
                }
                let code_description = data.code_description || "OK"
                wsResponse(ws, id, code_description, data)
            })
            .catch( error =>{
                console.error("ERROR\tws-api\treply\t", error, 'stack', error.stack)//, JSON.stringify(error))
                wsResponse(ws, id, "Bad Request", error)
            })
            return
        }
        wsResponse( ws, id, message, data )
    }
    action.reply.ok = data =>{ wsResponse( ws, id, "OK", data ) }
    action.reply.badRequest = data =>{ wsResponse( ws, id, "Bad Request", data ) }
}

var toBase64 = data => data == null ? data :
    data["toBuffer"] ? data.toBuffer().toString('base64') :
    Buffer.isBuffer(data) ? data.toString('base64') : data