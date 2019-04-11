import {Aes} from "bitsharesjs/es";
import {PublicKey} from "bitsharesjs";
import WalletDb from "../../stores/WalletDb";

export const signMemoWithKeys = (
    senderPrivateKey,
    recipientPublicKey,
    nonce,
    memo
) => {
    try {
        return Aes.encrypt_with_checksum(
            senderPrivateKey,
            recipientPublicKey,
            nonce,
            Buffer.from(memo)
        ).toString("hex");
    } catch (error) {
        console.log(`AccountUtils:signMemoWithKeys() - ${error}`);
    }
};

export const getRequestAccessOptions = (access, reCaptchaToken) => {
    const options = {
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            "App-Version":
                APP_VERSION + (APP_REVISION ? "-" + APP_REVISION : ""),
            "App-Platform": __ELECTRON__ ? "electron" : "web"
        },
        method: "GET",
        mode: "cors"
    };

    if (access) {
        options.headers.Authorization = `Bearer ${access.access_token}`;
    }

    if (reCaptchaToken) {
        options.headers.Recaptcha = reCaptchaToken;
    }

    return options;
};

export const getAuthKey = account => {
    if (!account || WalletDb.isLocked()) {
        return null;
    }

    const memoPublicKeyStr = account.getIn(["options", "memo_key"]);
    const memoPrivateKey = WalletDb.getPrivateKey(memoPublicKeyStr);

    const activePublicKeyStr = account
        .get("active")
        .get("key_auths")
        .get(0)
        .get(0);
    const activePrivateKey = WalletDb.getPrivateKey(activePublicKeyStr);

    const ownerPublicKeyStr = account
        .get("owner")
        .get("key_auths")
        .get(0)
        .get(0);
    const ownerPrivateKey = WalletDb.getPrivateKey(ownerPublicKeyStr);

    const key = memoPrivateKey || activePrivateKey || ownerPrivateKey;

    if (!key) {
        return null;
    }

    return key;
};

export const getRequestLoginOptions = account => {
    const key = getAuthKey(account);

    if (!key) {
        return null;
    }

    const recipientPublicKey = PublicKey.fromPublicKeyString(
        __CRYPTOBRIDGE_PUB_KEY__
    );

    const username = account.get("name");
    const nonce = 1;
    const password = signMemoWithKeys(
        key,
        recipientPublicKey,
        nonce,
        JSON.stringify({user: username, ts: Date.now()})
    );

    const options = {
        headers: {
            "Content-Type": "application/json",
            Authorization: `Basic ${btoa(username + ":" + password)}`
        },
        method: "POST",
        mode: "cors"
    };

    return options;
};
