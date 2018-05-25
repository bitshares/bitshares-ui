import {ChainConfig} from "bitsharesjs-ws";

export function backupName(walletName, date = new Date()) {
    let name = walletName;
    let address_prefix = ChainConfig.address_prefix.toLowerCase();
    if (name.indexOf(address_prefix) !== 0) name = address_prefix + "_" + name;

    let month = date.getMonth() + 1;
    let day = date.getDate();
    let stampedName = `${name}_${date.getFullYear()}${
        month >= 10 ? month : "0" + month
    }${day >= 10 ? day : "0" + day}`;

    name = stampedName + ".bin";
    return name;
}
