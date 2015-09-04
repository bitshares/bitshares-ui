import ChainStore from "api/ChainStore";

export default function FetchChainObject(method, object_id, timeout) {
    return new Promise((resolve, reject) => {

        function onUpdate() {
            let res = method.bind(ChainStore)(object_id);
            if(res !== undefined) {
                ChainStore.unsubscribe(onUpdate);
                resolve(res);
            }
        }

        ChainStore.subscribe(onUpdate);
        onUpdate();

        if(timeout) setTimeout(() => {
            ChainStore.unsubscribe(onUpdate);
            reject("timeout");
        }, timeout);

    });

}
