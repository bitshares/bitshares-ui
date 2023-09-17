# ioxbank Instant Gateway Service
ioxbank instant gateway service is connecting cryptocurrencies between BitShares and other Blockchains. Blockchain transactions are being settled immediately once blocks are confirmed over Blockchain. You can easily identify those cryptocurrencies supported by ioxbank, they are prefixed with **IOB.** and can be found under assets explore page.

### Gateway Transparency Information

## XRP
- [XRPL Balance](https://livenet.xrpl.org/accounts/rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y)
- [IOB.XRP Current supply](/asset/IOB.XRP)

## XLM
- [XLM Balance](https://stellarchain.io/accounts/GCYDZS45X25IKBOOV7PJNYKH5RNGVGSDUH4TTYGXHFBBQMVHG7GVUHMH)
- [IOB.XLM Current supply](/asset/IOB.XLM)

## Gateway Features

### IOB.XRP Features
- Instant Gateway
- Min. amount: 50 XRP
- No KYC
- No limits
- 0% market fee for maker/taker
- Low withdraw fee

### IOB.XLM features
- Instant Gateway
- Min. amount: 50 XLM
- No KYC
- No limits
- 0% market fee for maker/taker
- Low withdraw fee

## Gateway Methods

### Deposit/Withdraw Using Referencec Wallet UI

- **Deposit:** Click on *Deposit* From the burger menu then pick up XRP or XLM; an Address and (Tag or Memo) will appear to you, you should use them externally to deposit to them; make sure you are mentioning Tag or Memo at source of your transaction to the Gateway.
- **Withdraw:** Click on *Withdraw* From the burger menu then pick up XRP or XLM; you should right carefully your destination withdraw Address and (Tag or Memo), you should use what was provided the address that was provided to you in case you're using an exchange address and not your own address.

### XRP Deposit in case you already know your BitShares **user-id**
- **XRP Gateway Destination Address:** rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y
- **XRP Gateway Destination (Tag or Memo):** BitShares user-id (without 1.2.)

### XLM Deposit in case you already know your BitShares **user-id**
- **XLM Gateway Destination Address:** GCYDZS45X25IKBOOV7PJNYKH5RNGVGSDUH4TTYGXHFBBQMVHG7GVUHMH
- **XLM Gateway Destination (Tag or Memo):** BitShares user-id (without 1.2.)

### Withdraw Manually using **send** assets

### For XRP Withdraw from your BitShares wallet to your XRP wallet
Send your **IOB.XRP** assets to BitShares Blockchain Account [ioxbank-gateway](/account/ioxbank-gateway) and include in BitShares Memo your XRP destination address and destination (Tag or Memo) as per the following examples, you need to replace *xrp-address* with your XRP destination address and replace **tag-or-memo-number** with your destination (Tag or Memo) number, in case you do NOT need (Tag or Memo) number as you might own the destination address keys then you can just send your **IOB.XRP** asset to [ioxbank-gateway](/account/ioxbank-gateway) and just include your **xrp-destination-address** without including any (Tag or Memo) number:

BitShares Memo Format
- xrp:**xrp-destination-address**:tag:**tag-or-memo-number**
- xrp:**xrp-destination-address**:tag:**tag-or-memo-number**:**any notes**
- xrp:**xrp-destination-address**

BitShares Memo Format Examples
- xrp:**rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y**:tag:**485738**
- xrp:**rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y**:tag:**485738**:thanks ioxbank
- xrp:**rDce39TBzszQJx2sshLy5jPXV3F9nEaQ9Y**

### For XLM Withdraw from your BitShares wallet to your XLM wallet
Send your **IOB.XLM** assets to BitShares Blockchain Account [ioxbank-gateway](/account/ioxbank-gateway) and include in BitShares Memo your XLM destination address and destination (Tag or Memo) as per the following examples, you need to replace *xlm-address* with your XLM destination address and replace **tag-or-memo-number** with your destination (Tag or Memo) number, in case you do NOT need (Tag or Memo) number as you might own the destination address keys then you can just send your **IOB.XLM** asset to [ioxbank-gateway](/account/ioxbank-gateway) and just include your **xlm-destination-address** without including any (Tag or Memo) number:

BitShares Memo Format
- xlm:**xlm-destination-address**:tag:**tag-or-memo-number**
- xlm:**xlm-destination-address**:tag:**tag-or-memo-number**:**any notes**
- xlm:**xlm-destination-address**

BitShares Memo Format Examples
- xlm:**GCYDZS45X25IKBOOV7PJNYKH5RNGVGSDUH4TTYGXHFBBQMVHG7GVUHMH**:tag:**485738**
- xlm:**GCYDZS45X25IKBOOV7PJNYKH5RNGVGSDUH4TTYGXHFBBQMVHG7GVUHMH**:tag:**485738**:thanks ioxbank
- xlm:**GCYDZS45X25IKBOOV7PJNYKH5RNGVGSDUH4TTYGXHFBBQMVHG7GVUHMH**

## Technical Support
- [Live Support](https://t.me/ioxbank)
- [Open a Ticket](https://support.ioxbank.com)
