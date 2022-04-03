# ioxbank Instant Gateway Service
ioxbank instant gateway service is connecting cryptocurrencies between BitShares and other Blockchains. Blockchains transactions are being settled immediately once blocks are confirmed over Blockchains. You can easily identify those cryptocurrencies supported by ioxbank, they are prefixed with **IOB.** and can be found under assets explore page.

## Help Docs
[https://support.ioxbank.com/docs](https://support.ioxbank.com/docs)

## Technical Support
- [Live Support](https://t.me/ioxbank)
- [Open a Ticket](https://support.ioxbank.com)

## IOB.XRP features
- Instant Gateway
- Min. amount: 20 XRP
- No KYC
- No limits
- 0/0.1% market fee for maker/taker
- Low withdraw fee

### Gateway Transparency Information
- [XRPL Balance](https://livenet.xrpl.org/accounts/rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y)
- [IOB.XRP Current supply](/asset/IOB.XRP)

### Deposit to your BitShares wallet from your XRP wallet
- **XRP Destination address:** rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y
- **XRP Destination tag (ONLY NUMBERS):** BitShares user ID (without 1.2.)

### Withdraw from your BitShares wallet to your XRP wallet
Send your **IOB.XRP** assets to BitShares Blockchain Account [ioxbank-gateway](/account/ioxbank-gateway) and use one of the following memo options in your memo, you need to replace *xrp-address* with your xrp destination address and *tag-number* with your destination tag number, in case you have no tag number you can send memo without including a tag with just xrp:*xrp-address* in your memo and replace *xrp-address* with your xrp destination address:
- xrp:**xrp-address**:tag:**tag-number**:**memo**
- xrp:**xrp-address**:tag:**tag-number**
- xrp:**xrp-address**

### Withdraw Examples: 
If you want to withdraw your XRPs to your XRP address **rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y** and your tag is **485738**; <br />
The memo that needs to be included with the send operation of **IOB.XRP**: 
- **xrp:rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y:tag:485738**
- **xrp:rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y:tag:485738:thanks for the wonderful bridge**


If you want to withdraw your XRPs to your XRP address **rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y**, in case you own the private keys of the XRP address; <br />
You don't need to include a tag or memo with the send operation of **IOB.XRP**: <br />
- **xrp:rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y**
