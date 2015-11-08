import React from "react";

class BaseComponent extends React.Component {
    constructor(props, store) {
        super(props);
        if (store) {
            this.stores = {};
            this.state = {};
            if (store.length === undefined) {
                this.stores[store.StoreModel.name] = store;
                this.state = store.getState();
            } else if (store.length >= 1) {
                for (let i = 0; i < store.length; i++) {
                    let storeName = store[i].StoreModel.name;
                    this.stores[storeName] = store[i];
                    let storeState = store[i].getState();
                    for (let key in storeState) {
                        this.state[key] = storeState[key];
                    }
                }
            }
        }
    }

    _bind(...methods) {
        methods.forEach((method) => this[method] = this[method].bind(this));
    }

    componentWillMount() {
        if (this.stores) {
            for (let storeName in this.stores) {
                this.stores[storeName].listen(this.onChange.bind(this));
            }
        }
    }

    componentWillUnmount() {
        if (this.stores) {
            for (let storeName in this.stores) {
                this.stores[storeName].unlisten(this.onChange.bind(this));
            }
        }
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //console.log("[BaseComponent.jsx:20] ----- shouldComponentUpdate ----->", nextProps, nextState);
    // return this.props !== nextProps || this.state !== nextState;
    // }

    onChange(newState) {
        if (newState) {
            this.setState(newState);
        }
    }
}

export default BaseComponent;
