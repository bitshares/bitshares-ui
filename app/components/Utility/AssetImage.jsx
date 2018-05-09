import React from "react";
import {connect} from "alt-react";
import LazyImage from "./LazyImage";
import CryptoBridgeStore from "../../stores/CryptoBridgeStore";

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
        if (
            nextProps.cryptoBridgeMarket !== this.props.cryptoBridgeMarket ||
            nextProps.name !== this.props.name
        ) {
            this.setState({src: this._getImgSrcFromProps(nextProps)});
        }
    }

    _onImageError() {
        this.setState({src: null});
    }

    _getImgSrcFromProps(props) {
        let {name, marketId, cryptoBridgeMarket} = props;

        let img, symbol;

        if (cryptoBridgeMarket && cryptoBridgeMarket.img) {
            img = cryptoBridgeMarket.img;
        }

        if (!img) {
            if (!name && marketId) {
                symbol = marketId.split("_").shift();
            } else {
                const imgSplit = name.split(".");
                symbol = imgSplit.length === 2 ? imgSplit[1] : imgSplit[0];
            }

            img = `${__BASE_URL__}assets/${symbol.toLowerCase()}.png`;
        }

        if (
            img.match(/^\//) &&
            location.hostname !== "wallet.crypto-bridge.org"
        ) {
            img = "https://wallet.crypto-bridge.org" + img;
        }

        return img;
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
        return {
            cryptoBridgeMarket: props.marketId
                ? CryptoBridgeStore.getState().markets.get(props.marketId)
                : null
        };
    }
});
