import repl from "repl"
import repl_history from "repl.history"
import { promisify} from "repl-promised"
import createServer from "./server"

import {Address, Aes, PrivateKey, PublicKey, Signature} from "@graphene/ecc"

module.exports = {
    
    Address, Aes, PrivateKey, PublicKey, Signature,
    
    start: done =>{
        if( global.server ) {
            module.exports.stop(_done =>{ module.exports.start(done) })
            return
        } 
        global.server = createServer().server
        if( done ) done()
    },
    stop: done =>{
        if( global.server ) {
            global.server.close()
            global.server = null
        }
        if( done ) done()
        // WaterlineDb.close( ()=>{ if( done ) done() })
    },
    cli: ()=>{
        var repl_instance = repl.start({
            prompt: "Wallet-Server> ",
            input: process.stdin,
            output: process.stdout,
            ignoreUndefined: true
        })
        promisify( repl_instance )
        for (var obj in module.exports)
            repl_instance.context[obj] = module.exports[obj]

        repl_instance.on("exit", ()=>{ module.exports.stop() })
        console.log("Command line history saved: ~/.wallet_server_history")
        console.log("Type help() or use Ctrl+C several times to exit")
        var hist_file = process.env.HOME + "/.wallet_server_history";
        repl_history(repl_instance, hist_file);
    },
    help: ()=> {
        for (var obj in module.exports) {
            if( obj === 'cli' ) continue
            console.log(obj)
        }
    }
}