import React from "react";

export default class LazyImage extends React.Component {
    constructor(props) {
        super(props);

        this._mounted = true;

        this.state = {
            src:
                "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==",
            loading: false,
            loaded: false
        };

        this.handleScroll = this.handleScroll.bind(this);
        this.handleResize = this.handleResize.bind(this);
    }

    componentDidMount() {
        this._mounted = true;

        this.addEventListener();
        this.checkImageViewport();
    }

    componentWillUnmount() {
        this._mounted = false;

        this.removeEventListener();
    }

    componentWillReceiveProps(props) {
        if (props.src !== this.props.src) {
            this.setState({
                loading: false,
                loaded: false
            });
        }
    }

    componentDidUpdate() {
        this.checkImageViewport();
    }

    addEventListener() {
        window.addEventListener("scroll", this.handleScroll);
        window.addEventListener("resize", this.handleResize);
    }

    removeEventListener() {
        window.removeEventListener("scroll", this.handleScroll);
        window.removeEventListener("resize", this.handleResize);
    }

    handleScroll() {
        this.checkImageViewport();
    }

    handleResize() {
        this.checkImageViewport();
    }

    checkImageViewport() {
        if (this._imgRef && !this.state.loading && !this.state.loaded) {
            const rect = this._imgRef.getBoundingClientRect();

            if (
                rect.top - window.innerHeight < 500 ||
                this.props.lazy === false
            ) {
                this.lazyLoadImage();
            }
        }
    }

    lazyLoadImage(src) {
        this.removeEventListener();

        this.setState({loading: true});

        let img = new Image();

        img.onload = () => {
            if (this._mounted) {
                this.setState({src: img.src, loading: false, loaded: true});
            }

            if (this.props.onLoad) {
                this.props.onLoad();
            }
        };

        img.onerror = () => {
            if (this._mounted) {
                this.setState({loading: false, loaded: true});
            }

            if (this.props.onError) {
                this.props.onError();
            }
        };

        img.src = src || this.props.src;
    }

    render() {
        const style = Object.assign({}, this.props.style || {});

        const img = (
            <img
                ref={r => (this._imgRef = r)}
                src={this.state.src}
                style={style}
            />
        );

        if (
            this.props.showProgress &&
            !this.state.loaded &&
            this.state.loading
        ) {
            // TODO add lightweight loading indicator
            return img;
        }

        return img;
    }
}

LazyImage.defaultProps = {
    showProgress: true,
    lazy: true
};

LazyImage.displayName = "LazyImage";
