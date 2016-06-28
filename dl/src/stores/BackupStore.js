import alt from "alt-instance"
import BackupActions from "actions/BackupActions"
import BaseStore from "stores/BaseStore"
import {hash, PublicKey} from "graphenejs-lib";

class BackupStore extends BaseStore {

    constructor() {
        super()
        this.state = this._getInitialState()
        this.bindListeners({
            onIncommingFile: BackupActions.incommingWebFile,
            onIncommingBuffer: BackupActions.incommingBuffer,
            onReset: BackupActions.reset
        })
        this._export("setWalletObjct")
    }

    _getInitialState() {
        return {
            name: null,
            contents: null,
            sha1: null,
            size: null,
            last_modified: null,
            public_key: null,
            wallet_object: null
        }
    }

    setWalletObjct(wallet_object) {
        this.setState({wallet_object})
    }

    onReset() {
        this.setState(this._getInitialState())
    }

    onIncommingFile({name, contents, last_modified}) {
        var sha1 = hash.sha1(contents).toString('hex')
        var size = contents.length
        var public_key = getBackupPublicKey(contents)
        this.setState({ name, contents, sha1, size, last_modified, public_key })
    }

    onIncommingBuffer({name, contents, public_key}) {
        this.onReset()
        var sha1 = hash.sha1(contents).toString('hex')
        var size = contents.length
        if( ! public_key) public_key = getBackupPublicKey(contents)
        this.setState({name, contents, sha1, size, public_key})
    }

}

export var BackupStoreWrapped = alt.createStore(BackupStore, "BackupStore");
export default BackupStoreWrapped

function getBackupPublicKey(contents) {
    try {
        return PublicKey.fromBuffer(contents.slice(0, 33))
    } catch(e) {
        console.error(e, e.stack)
    }
}
