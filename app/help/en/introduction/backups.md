# Backups

## Local Wallet

It is recommended to make regular backups of your Local Wallet even though in most
cases a single backup may be sufficient. Please note that in order to recover
from a backup you will also need to provide the passphrase (password) because **backups
are encrypted**. Hence, if you either lose your wallet or your passphrase you
will be unable to access any of your funds again!

You can create a backup from [Settings -> Backup](/settings).

- Store this backup in at least two secure locations only accessible by you
- The backup is encrypted with your passphrase/password so do not store your passwrod in the same location

## Advanced Users Only

### Brainkey

> If you never manually imported an account key into your wallet, you can
alternatively backup your accounts and their funds by exporting the *brainkey*,
a string of words from which your keys are derived deterministically.

Remark: Hierarchical Authorities (advanced uses ONLY)

> If you are using hierarchical authorities (account and/or active permissions),
backing up your keys alone may not be sufficient to regain access to your funds!
Please revise the documentations about hierarchical authorities.
