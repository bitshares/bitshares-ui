import React from "react"
import Webcam from "lib/react-webcam"
import {PrivateKey, key} from "graphenejs-lib";
import qr from "common/qr-image";

var privKey = null;

class KeyGenComponent extends React.Component {

    constructor() {
        super();

        this.state = {
            ready: false,
            dictionary
        };
    }

    componentWillMount() {
        let dictionaryPromise = brainkey_plaintext ? null : fetch("/dictionary.json");
        return Promise.all([
            dictionaryPromise
        ]).then(res => {
            let [dictionary] = res.json();
            privkey = new BrainKeyUi().create();
            this.setState({
                ready: true
            })
        });
    }

    render() {
        if (!this.state.ready || !privKey) {
            return null
        };
        // var privkey = new BrainKeyUi().create()
        return <div>
            <QrScan/>
            <hr/>
            <ShowPrivateKey privkey={privkey}/>
            <QrCode data={privkey.toWif()}/>
        </div>
    }
    
}

class BrainKeyUi {
    
    create(entropy_string = "add mouse entropy...") {
        return key.suggest_brain_key(
            dictionary,
            key.browserEntropy() +
            entropy_string
        )
    }
}

class QrScan extends React.Component {
    
    render() {
        return <div>
            <div className="button" onclick="scanPicture()">SCAN</div>
            <Webcam noAudio/>
        </div>
    }
}

class QrCode extends React.Component {
    
    render() {
        var svg_string = qr.imageSync(this.props.data, { type: 'svg' })
        return <div>
            <img dangerouslySetInnerHTML={{__html: svg_string}} />
        </div>
    }
}

class ShowPrivateKey extends React.Component {
    
    render() {
        return <div>
            <div>Private Key {this.props.privkey.toWif()}</div>
        </div>
    }
}


export default KeyGenComponent
