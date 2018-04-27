import {struct, Str, Dat, Num, Obj, maybe, Arr} from "tcomb";

let WalletTcomb = struct(
    {
        public_name: Str,
        created: Dat,
        last_modified: Dat,
        backup_date: maybe(Dat),
        password_pubkey: Str,
        encryption_key: Str,
        encrypted_brainkey: maybe(Str),
        brainkey_pubkey: Str,
        brainkey_sequence: Num,
        brainkey_backup_date: maybe(Dat),
        deposit_keys: maybe(Obj),
        // password_checksum: Str,
        chain_id: Str
    },
    "WalletTcomb"
);

let PrivateKeyTcomb = struct(
    {
        id: maybe(Num),
        pubkey: Str,
        label: maybe(Str),
        import_account_names: maybe(Arr),
        brainkey_sequence: maybe(Num),
        encrypted_key: Str
    },
    "PrivateKeyTcomb"
);

export {WalletTcomb, PrivateKeyTcomb};
