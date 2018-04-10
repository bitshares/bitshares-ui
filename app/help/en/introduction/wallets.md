# Wallet

As you may have noticed already, this application is a web application and runs
in a browser. A connection is established to a trusted node in the network that
serves as a gateway to the rest of the ecosystem.

## Cloud Wallet

If you registered with a username and password, you have a cloud wallet. Although
nothing is technically stored in the cloud, we use the term Cloud Wallet because
you can use these credentials (username and password) from any web browser at any 
time to gain access to your account. The cloud wallet only allows for a single 
account to be accessed at a time. This is generally the correct choice for new users. 
While it is possible to change the auto-generated password, we do not recommend
doing so at this time. The team is working on a responsible way to manage the
password change that requires no technical knowledge. We will make an announcement
once it's released.

## Local Wallet

The local wallet creates a database within your browser. This means that access
to your funds it tied to **that browser only**. If you attempt to access your
local wallet from any other computer, or any other browser, it will fail unless
you actively import your backup file from the original browser backup file. The
process actually easy. See managing [backups](/help/introduction/backups).

## Security

Rest assured that our servers do not have access to your funds because none of
your private keys ever leave your browser. Instead, they are encrypted with your
passphrase and are stored in your local browser's database. As such, you should
make sure to have a proper [Backup](/help/introduction/backups) in the event
something happens to your computer or browser.

## Management

The user interface is capable of carrying and accessing several
separated wallets each containing possible several accounts and corresponding
funds. You can create, backup, and switch existing wallets in `Settings->Wallets`.
