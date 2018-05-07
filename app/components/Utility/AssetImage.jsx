import React from "react";
import {connect} from "alt-react";
import LazyImage from "./LazyImage";

export default class AssetImage extends React.Component {
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

        let imgName = "";

        if (name === "OPEN.BTC") {
            imgName = name;
        } else {
            const imgSplit = name.split(".");
            imgName = imgSplit.length === 2 ? imgSplit[1] : imgSplit[0];
        }

        let imgSrc = `${__BASE_URL__}assets/${imgName.toLowerCase()}.png`;

        if (
            imgSrc.match(/^\//) &&
            location.hostname !== "wallet.crypto-bridge.org"
        ) {
            imgSrc = "https://wallet.crypto-bridge.org" + imgSrc;
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
