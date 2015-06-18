class BaseStore {

    _export(...methods) {
        let publicMethods = {};
        methods.forEach((method) => {
            if(!this[method]) throw new Error(`BaseStore._export: method '${method}' not found in ${this.__proto__._storeName}`);
            this[method] = this[method].bind(this);
            publicMethods[method] = this[method];
        });
        this.exportPublicMethods(publicMethods);
    }
}

export default BaseStore;
