import React from "react";
import CryptoBridgeStore from "stores/CryptoBridgeStore";
import {connect} from "alt-react";
import LazyImage from "./LazyImage";

class AssetImage extends React.Component {
    static propTypes = {
        name: React.PropTypes.string,
        marketId: React.PropTypes.string
    };

    constructor(props) {
        super();

        this.state = {
            src: this._getImgSrcFromProps(props)
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.cryptoBridgeAsset !== this.props.cryptoBridgeAsset) {
            this.setState({src: this._getImgSrcFromProps(nextProps)});
        }
    }

    _onImageError() {
        this.setState({src: null});
    }

    _getImgSrcFromProps(props) {
        let {name, marketId, cryptoBridgeAsset} = props;

        if (!name && marketId) {
            name = marketId.split("_").shift();
        }

        let imgSrc = cryptoBridgeAsset ? cryptoBridgeAsset.img : null;

        if (!imgSrc) {
            let imgName = "";

            if (name === "OPEN.BTC") {
                imgName = name;
            } else {
                const imgSplit = name.split(".");
                imgName = imgSplit.length === 2 ? imgSplit[1] : imgSplit[0];

                if (imgName === "BTC") {
                    // TODO remove once added to API
                    imgSrc = "https://crypto-bridge.org/img/btc.png";
                }

                if (imgName === "BCO") {
                    // TODO remove once added to API
                    imgSrc = "/asset-symbols/bco.png";
                }
            }

            if (!imgSrc) {
                imgSrc = `${__BASE_URL__}asset-symbols/${imgName.toLowerCase()}.png`;
            }
        }

        return imgSrc;
    }

    render() {
        const {style, lazy} = this.props;
        const {src} = this.state;

        return src ? (
            <LazyImage
                onError={this._onImageError.bind(this)}
                style={style || {}}
                src={src}
                lazy={lazy === true}
            />
        ) : (
            <span />
        );
    }
}

export default connect(AssetImage, {
    listenTo() {
        return [CryptoBridgeStore];
    },
    getProps(props) {
        const cryptoBridgeAsset = props.marketId
            ? CryptoBridgeStore.getState().markets.get(props.marketId)
            : CryptoBridgeStore.getState().assets.get(props.name);

        return {
            cryptoBridgeAsset
        };
    }
});
