import alt from "alt-instance"
import iDB from "idb-instance"
import lzma from "lzma"
import {saveAs} from "common/filesaver.js"
import { Aes, PrivateKey, PublicKey, key } from "@graphene/ecc"
import WalletActions from "actions/WalletActions"
import WalletDb from "stores/WalletDb"

class BackupActions {
    
    incommingWebFile(file) {
        var reader = new FileReader()
        reader.onload = evt => {
            var contents = new Buffer(evt.target.result, 'binary')
            var name = file.name
            var last_modified = file.lastModifiedDate.toString()
            this.dispatch({name, contents, last_modified})
        }
        reader.readAsBinaryString(file)
    }
    
    incommingBuffer(params) {
        this.dispatch(params)
    }
    
    reset() {
        this.dispatch()
    }

}

var BackupActionsWrapped = alt.createActions(BackupActions)
export default BackupActionsWrapped