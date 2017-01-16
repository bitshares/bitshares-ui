---------------------------------------------------------------------
Release 2.0.170116-rc1
---------------------------------------------------------------------

New features
--------
- Major refactor of market handling: improved order matching and market data processing
- Upgrade to Webpack 2, add ES6 code splitting and dynamic route loading
- [Blocktrades] Add internal conversion
- Major package upgrades: react, react-router, alt, file-saver ++
- Use Roboto font everywhere by default
- Add Equivalent values to Worker table, improve layout
- Add a warning for disabled markets and disable buy/sell
- Only redirect to account creation on direct navigation to "/"
- Update default markets and add some asset symbols

Bug fixes
--------
- [Blocktrades] Fix 'Calculating Internal Server Error'
- [Blocktrades] Fix displaying 'Deposit limit' for 'Internal conversion'
- [Blocktrades] Fix copy/paste for memo
- Fix dropdown font colors
- Fix missing connection translation key
- Improve multi-sig signing handling, exclude owner keys if not needed
- Hide tooltips on navigation
- Fix Account active state in Header
- Change 'No price available' to 'Unknown', and add a tooltip
- Fix account creation and dictionary loading
- Fix orderbook show more button
- Fix some invalid JSON

---------------------------------------------------------------------
Release 2.0.161031
---------------------------------------------------------------------

New features
--------
- Add Blockpay to default markets and update markets list
- Add btsabs and Transwiser API servers
- Allow the Chat box to be hidden from a docked state
- Vesting balance amounts are now updated correctly, and a Try claim all button has been added
- Chinese translation updates
- MetaExchange has been removed from the deposit withdraw providers

Bug fixes
--------
- Add Bitshares bloom filter for BTS 1 account imports
- Fix a GenesisFilter bug and update ImportKeys flow slightly
- Fix input of uppercase characters in AccountPermissions
- Fix Highcharts build issues
- Remove unused refcode inputs

---------------------------------------------------------------------
Release 2.0.160829
---------------------------------------------------------------------

New features
--------
- Hash checksums for all binaries
- Add copy address/memo buttons to deposit, improve mobile layout
- Improve transfer layout, add exchange scam account warnings
- Add option to move BuySell below Orderbook
- Add brainkey option to Settings Restore page
- Add API selection to SyncError page, improve the error message

Bug fixes
--------
- Fix price display in MarketCards
- Add proposed operation id to summary
- Add deposit/withdraw to mobile menu
- Fix hiding of disabled chat window
- Fix WalletCreate submit with invalid inputs, close #860
- Fix BackupBrainkey navigation
- Hide input spinner in Firefox
- Use newest version of node-libs-browser, fixes backups in Firefox close
- Fix HelpContent 'en' locale fallback

---------------------------------------------------------------------
Release 2.0.160813
---------------------------------------------------------------------

New features
--------
- Refactor account creation
- Disable chart indicators by default
- BlockTrades deposit/withdraw improvements
- Update Featured assets, add ICOO/PeerPlays
- Change depth chart tooltip to table layout
- Restore the Account link to the Header
- Disable Chat by default, make it easier to enable/disable
- Add current price to Dashboard MarketCards

Bug fixes
--------
- Rearrange Exchange components and improve responsive behaviour
- Adjust DepthChart min/max range
- Prevent infinite loop on bad system clock, add warning
- Filter out duplicate welcome messages from chat history
- Fix Orderbook click calculation
- Fix buy side order book click total calculation
- Fix for 1.0 balance claims

---------------------------------------------------------------------
Release 2.0.160702
---------------------------------------------------------------------
Bug fixes
--------
- Display 'New wallet' button for users with only one wallet
- Fix light wallet local file loading, use data-urls for some pngs
- Remove back call on wallet deletion
- Update electron version
- Center-align the advanced features button
- Fix backup restore submit button
- Fix api error redirection
- Fix Backup restore accept button close #858
- Fix initError loading issues and layout

---------------------------------------------------------------------
Release 2.0.160629
---------------------------------------------------------------------

New features
--------
- Api code moved to new graphenejs-ws library
- Crypto and blockchain state code moved to graphenejs-lib library
- Add OPEN.MKR deposit/withdrawal
- Limit chat messages to 140 characters
- Refactor MyMarkets selection to tabbed layout
- Remove MetaEx deposits, add warning and link
- Add OpenLedger deposit/withdrawal support for Omni & related coins (USDT, EURT)
- Updated header layout, new dropdown menu
- Add lightning bolt to indicate lifetime members
- Refactor Deposit/Withdraw tabs to a dropdown selection
- Modify OpenOrders layout, use x icon for Cancel order
- Big refactor of the Settings page to more friendly layout
- Hide advanced features by default

Bug fixes
--------
- Update several packages to newer versions
- Remove brainkey dictionary from app.js and load async instead
- Refactor language selection to fetch language files async on demand
- Improve build routine, reduce filesize
- Fix cancel button font color in WebSocketAddModal
- Fix buttons with invisible text
- Improve Exchange fee asset selection
- Disable chat in Safari
- Use 8 decimal prices for assets like BTC in markets list
- Make sure a valid price history bucket size is selected on load
- Improve visibility of Buy/Sell fee selector
- Improve initial load of AccountStore, should fix #827
- Update default markets
- Remove 'Ignore' button in AccountLeftPanel
- Lowercase account names in DashboardList, change filter style and text

---------------------------------------------------------------------
Release 2.0.160524
---------------------------------------------------------------------

New features
--------
- Improvements to account creation and wallet creation pages
- Improvements to wallet management
- Update several 3rd party libraries
- Add Lisk symbol and OPEN.LISK to dashboard, homogenize icon sizes

Bug fixes
--------
- Fix tooltip bug causing the screen to scroll to the top
- Add some padding to Dashboard sides
- Allow Transfer page recent history to take full height
- Change purple link/button color to blue
- Fix unrestrained icon height issues in the dashboard
- Scroll the Chat to the bottom if the footer visibility changes
- Chinese translation updates
- Fix Chatbox not scrolling to bottom on new messages
- Fix a bug that made the cli_wallet unable to decode GUI memos
- Fix the BlockTrades gateway, which was not validating withdrawal addresses correctly

---------------------------------------------------------------------
Release 2.0.160514
---------------------------------------------------------------------

New features
--------
- Simple p2p chat history
- More improvements to the deposit/withdraw screens
- Make trollbox dockable on right side
- Use separate support addresses for OpenLedger and BlockTrades deposits
- Add OPEN.ETH:OPEN.DAO market to featured markets

Bug fixes
--------
- Fix Settings page issue with chat disable
- Fix settings page causing the GUI to freeze (#842)
- Improvements to trollbox server to ensure uptime
- Fix chatbox select box height (thanks to nmywn)
- Turkish translation updates
- Add some filtering to BlockTrades coins to prevent errors
- Separate price and volume slightly in PriceChart, adjust colors
- Improve depth chart zoom level
- Improve Footer hide behaviour
- Fix trollbox mem leak and connection counter, improve error handling #844
- Update packages: react to 15.0.2, react-highcharts, fix breaking changes
- Fix an AccountSelector bug causing name resets while typing

---------------------------------------------------------------------
Release 2.0.160504
---------------------------------------------------------------------

New features
--------
- Trollbox has been added (with tipping!)
- Revamped deposit/withdraw for Blocktrades/Openledger
- Add and show more 'Featured Markets'
- Transaction filtering in recent transactions lists

Bug fixes
--------
- Chinese and Turkish translation updates
- Increase grid-container max-width to 70rem
- Change CCEDK in deposit/withdraw to Openledger
- Format MarketCard volumes, add some spacing
- Improve volume formatting
- Show more decimals for BTC equivalent balance values
- Show market name in AccountOverview asset popover market link
- Fix AccountPermissions width issue

---------------------------------------------------------------------
Release 2.0.160428
---------------------------------------------------------------------

New features
--------
- Enable OPEN.DGD deposits and withdrawals
- Add 'Featured Markets' to Home page, change page layout
- Add timestamp to backup names
- Enable the account selector on the Deposit/Withdraw page
- Restore Deposit/Withdraw to AccountLeftPanel, add 'Advanced' subheader
- Always show header account selector
- Account selector icon is now clickable and takes you to the account
- Always show 'Home' button in header

Bug fixes
--------
- Fix Safari load issues
- Chinese translation updates
- Fix InitError dropdown not displaying correct entry
- Chinese translation updates
- Fix TotalBalance tooltip when borrowing small amounts
- Replace n/a with 'No price available'
- Fix Asset popover title color, adjust some text
- Tweak some light-theme font colors

---------------------------------------------------------------------
Release 2.0.160420
---------------------------------------------------------------------

New features
--------
- Allow fees for order cancellation and shorting to be paid in assets other than BTS
- Enable OPEN.STEEM deposits and withdrawals

Bug fixes
--------
- Turkish translation updates
- Improve localStorage wrapper methods
- Blocktrades display fix

Notes
--------
Two new developers had commits accepted into this release: destenson and rulatir, and nmywn also continues to make useful contributions. Their efforts are much appreciated!

---------------------------------------------------------------------
Release 2.0.160413
---------------------------------------------------------------------

New features
--------
- Rename Trade to Exchange
- Change order of header entries
- Move Deposit/Withdraw to header
- Add support for bitassets with backing asset other than CORE in the exchange

Bug fixes
--------
- Fix some deposit page bugs and update the layouts
- Some external lib updates
- Hide empty parentheses in RecentTransactions header
- Increase depth chart range
- Update the Blocktrades bridge code to use the correct wallet symbols for MKR on the BitShares blockchain
- Fix ProposedOperation text for asset_create operation
- Chinese, Turkish and English translation updates
- Market trade date format fix + light theme hovering fixes and cosmetics
- Added OPEN.STEEM deposit option to CCEDK tab
- Only use 'bit' prefix for SmartCoins issued by the committee-account

---------------------------------------------------------------------
Release 2.0.160406
---------------------------------------------------------------------

New features
--------
- Display required approvals as percent for multi-sig with threshold higher than 10
- Add asset description to AssetName tooltip
- Add 'bit' prefix to bit assets, remove *, use smaller prefix for OPEN, TRADE and METAEX assets

Bug fixes
--------
- Sorting public keys by their converted address (per witness_node logic). #795
- Bug in BuySell fee asset selection
- Show account names as links in account permissions list #790
- Fix account selector issue
- Add warning about precision on asset creation #756
- Fix tooltips not appearing over modals
- Allow account upgrade, voting, permission changes and withdrawals to be paid in assets other than BTS if necessary #786


---------------------------------------------------------------------
Release 2.0.160330
---------------------------------------------------------------------

NEW FEATURES:
- Proposed transactions
- Add a 'Reset settings' button to Settings and InitError page
- Split workers table into proposed and active workers
- Remove negative votes
- Add set of known proxies, add lists of active witnesses and cm's to voting pages
- Add name replace for asset symbols in fee selection dropdown
- Improve worker approve/reject logic and add status coloring
- Add explanation of vesting balances
- Add memo support to asset issue modal and display memos in Operation/Transaction

BUG FIXES:
- Language settings not persisting in light client
- Fix some bugs and typos in AccountStore authority check
- In serializer for transactions, sort addresses and public keys in descending order
- Handle nested authorities for hierarchical multi-sig
- Set new accounts voting proxy to 'proxy-to-self' account #700
- Improve RecentTransactions sorting function #793
- Add Settings link to mobile menu #759
- Make sure negative votes are removed when updating votes #798
- Fix vesting balance styling #722
- Fix init loader white background
- Fix orderbook onClick not syncing after order has filled #768
- Translate csv and tooltip and move closer to title #780

---------------------------------------------------------------------
Release 2.0.160314
---------------------------------------------------------------------

NEW FEATURES:
- Updated with serializer types from stealth branch (adds better sorting in transactions)
- Improve DepthChart construction and plotting
- Increase websocket timeout to 5s

BUG FIXES:
- Refactor and fix error in onAmountChange function that prevents withdraw modal to pop up
- Enforce https for faucet address when on https domain
- Fix buy/sell collapse behaviour #779
- Show disabled buy/sell and my orders for users with no account #774
- Redirect to proper websocket url if user entered invalid URL #770

---------------------------------------------------------------------
Release 2.0.160309
---------------------------------------------------------------------

NEW FEATURES:
- Switch to using unique ethereum addresses for OpenLedger inputs
- Hide Footer in Exchange view
- Add preferred market pairing field to asset description
- Сoloring of price column headers in Orderbook
- Add + - buttons to the pricechart to change the height of the exchange charts
- Filter out 0 and Inf price values from pricechart data
- Put volume and price in the same chart
- Add zoom buttons for PriceChart, filter out bucket sizes below 5 minute

BUG FIXES:
- Prices with precision larger than asset precision causes incorrect final price #757
- Fix exchange box header background colors
- TransitionWrapper not reenabling after reset
- Fix Transfer fee asset selection for users with only one non-core asset

---------------------------------------------------------------------
Release 2.0.160302
---------------------------------------------------------------------

NEW FEATURES:
- Various exchange layout improvements
- Add rgba fill colors for depth charts
- Use full precision for Orderbook and MarketHistory asset amounts

BUG FIXES:
- Check for price equal to infinity when parsing fill history
- Fix membership button text being invisible #752
- Fix asset creation CER precision issues #753
- Fix disappearing faucet address in Settings #751
- Fix AccountMembership spelling errors, also remove reference to annual membership #749
- Fix AccountMembership margin issues and add referral link for lifetime members

---------------------------------------------------------------------
Release 2.0.160225
---------------------------------------------------------------------

NEW FEATURES:
- Add theming support and theme switch in Settings #576
- Add scrolling to RecentTransactions
- Add base groups to MyMarkets: BTS, BTC, USD or CNY + others

BUG FIXES:
- Fix BlockTrades select background color
- Ensure vertical orderbook layout is correct on mount
- Fix Fee schedule decimals issue
- Allow user to delete last number in Transfer amount entry
- Fix some styling issues after move to themes
- Fix matching of orders when clicking on order in orderbook #586
- Sum for_sale values when adding orders at same price

---------------------------------------------------------------------
Release 2.0.160217
---------------------------------------------------------------------

NEW FEATURES:
- Big trade page make over

BUG FIXES:
- Exchange buy fee selection
- Remove link to BTS:BTS market in asset popover, fix asset description #709
- Disable annual membership upgrade #730
- Fix My Orders not updating when flipping the market
- Fix Orderbook totals calculation
- Fix current price indicator not repositioning after window resize
- Fix fee subtraction when clicking on current balance
- Fix margin call mechanics, add dynamic update support for settle orders and feed price changes, improve market data fetching logic
- Fix number parsing for call orders and homogenize presentation with asks/bids/calls
- Fix vertical orderbook positioning and scrolling
- Link to /overview from Dashboard, change Orders to Open orders, #707 and #736
- Fix transfer fee mismatch #738
- Fix a bug in BlockTradesGatewayDepositRequest and change BridgeDepositRequest input types to 'number' #733
- Fix Blocktrades input and select colors #733


---------------------------------------------------------------------
Release 2.0.160208
---------------------------------------------------------------------

NEW FEATURES:
- Fee asset selection when trading on the exchange
- Allow funding of fee pool by accounts other than the issuer
- Enable fee claim operation
- OpenLedger gateway support for OPEN.ETH

BUG FIXES:
- Add a react key to gateway assets to prevent rendering the wrong data when swtiching tabs in the deposit/withdraw screen
- Include all orders when show all is active fix #727
- Hide Issue Asset button for MPAs

---------------------------------------------------------------------
Release 2.0.160203
---------------------------------------------------------------------

NEW FEATURES:
- Support address authorities in account permissions #660
- Ability to permanently ignore/unignore own accounts #697
- Support SmartCoins/UIAs/Prediction Market in Assets Explorer
- Support SmartCoins and Prediction Market Assets on Assets Creation page
- Added show all button to orderbook
- Better prediction markets support: one-click shorting, enforce market direction, set depth

BUG FIXES:
- Fix OpenLedger/ccedk's gateway mistakely labeled as a bridge #696
- Fix pubkey lookup method #660
- Fix Exchange scrolling issues
- Fix Orderbook scroll bars appearing when not necessary
- Fix some fee schedule bugs

---------------------------------------------------------------------
Release 2.0.160127
---------------------------------------------------------------------

NEW FEATURES:
- Bridge support for OPEN.BKS
- Better price precision on markets with low precision assets #692
- Improved operations display, added more op translation
- Simplify Exchange price handling, limit values to Satoshi amounts
- Ability to hide/show assets in the Overview balance list #687
- Some performance optimizations

BUG FIXES:
- Disappearing fee field in Transfer #678
- TimeAgo not updating, and update react-intl version
- Fix edge case in PriceChart update logic #669
- Per market price display direction  #415
- Update all memos when the wallet is unlocked #661

---------------------------------------------------------------------
Release 2.0.160121
---------------------------------------------------------------------

NEW FEATURES:
- USD, EUR, CNY fiat deposit/withdrawals via OpenLedger
- Added OPEN.EMC and OPEN.EGD to OpenLedger bridge
- Blocktrades support for TRADE.DASH/PPC/DOGE
- Table View for Workers #632
- Hide Workers with negative approval #632
- UTF-8 memo support #624
- Support for 'asset_reserve' operation
- Show lifetime membership fees
- Improved Fee Explorer: Cleanup, nicer tables, better translations
- Allow users to browse the Exchange even without having an account

BUG FIXES:
- My History / History alignment #568
- 'Missing Active Authority' permissions issue #676
- Show correct selected connection in Settings
- Allow shorting of prediction market assets, fix #667
- Refactor AccountVoting worker view to table layout, fix #632
- Fix 'span' as child of 'tr' error
- Subtract fees for filled orders, show fees paid, fix #658

---------------------------------------------------------------------
Release 2.0.160106
---------------------------------------------------------------------

NEW FEATURES:
- Add tooltips explaining why Buy/Sell buttons are disabled fix #628
- Add vesting balances page showing all vesting balance objects fix #640
- Enforce secure websocket connections when using https host fix #638
- Add tooltip showing full memo #636
- Add text and unlock button for transfers with memos when wallet is locked #636
- Wallet auto lock #265


BUG FIXES:
- Incorrect asset listed in "net worth" tooltip #633
- Persistence of language selection #634
- Settings screen "Preferred unit of account", wrong asset is selected #626
- Inconsistent toggle placement between Table View and Card View #613
- MetaExchange withdraw/deposit page, persist tab state
- Excel issue with transactions history csv format

---------------------------------------------------------------------
Release 2.0.151223
---------------------------------------------------------------------

NEW FEATURES:
- Membership page: show vested cashback balance and add Claim button next to it #500
- Ability to download account history as CSV file #611
- UX improvements to asset update and create

BUG FIXES:
- Many URLs in the GUI are not clickable #546
- Update Voting help text #589
- Add asset formatting to fee pool balance and issuer income #618
- Limit core exchange rate asset amounts by asset precision #617
- Fix 'cannot dispatch in the middle of dispatch' error #614
- Restrict min width of markets section #615
- Add vesting balance information and claim button #500
- Add CER (core exchange rate) to asset creation #543

---------------------------------------------------------------------
Release 2.0.151216
---------------------------------------------------------------------

NEW FEATURES:
- Dashboard makeover #590
- Total Value in header #584
- Show Date in All History #580
- Switch the default chart interval to 1 day #601
- Show one more decimal for prices in Exchange
- Show popup with additional info when user clicks on currency symbol


BUG FIXES:
- Failed to broadcast the transaction (now <= trx.expiration) #583
- Consolidated Open Orders screen bug #585
- Get rid of the horizontal scroll-bar in Recent Activity #470
- Unnecessary scroll-bars on the Create Asset confirmation screen #547
- Decimal Bug in Matching in 8-digit Assets #586
- In Lite wallet all website links result in broken pages #581

---------------------------------------------------------------------
Release 2.0.151202
---------------------------------------------------------------------

NEW FEATURES:
- Option to pay fees in BTS if possible #356
- Block explorer page that shows the current fee schedule #357
- Improved my history panel on Exchange page #527
- Exchange layout improvements: add borders, refactor statusbar, no-data text, panel headers #538
- Support for Fee Pool funding and Asset fee claims #495
- Exchange layout: add borders, refactor statusbar, no-data text, panel
- Ability to send all, subtract fees if paid in same asset #454
- Cease IE support and warn IE users that they need to switch to Edge, Chrome or Firefox #474

BUG FIXES:
- Active account name is missing on the top toolbar of the market page #545
- Don't show "This wallet has already been imported" if there are duplicate keys #565
- Populate empty pricedata with latest price if outside of bucket window #550
- Turkish ui buttons don't respond #539
- Changing indicators on market without history makes whole web wallet unresponsive #569


---------------------------------------------------------------------
Release 2.0.151125
---------------------------------------------------------------------

NEW FEATURES:
- Added "Back" and "Forward" buttons #453
- Show stake percentages at all times in wallet #522
- Display total assets of all account in chosen currency #512
- Request settlement of bit asset #493
- Show BTS balance in Accounts search results table #482
- Exchange > highlight active market state on bottom right #499
- Deposit/Withdraw page split into tabs (addresses #521)

BUG FIXES:
- Fix market issue: clicking on account balance vs Lowest Ask #469
- Transfer Dialog does not fall back to BTS fee when there is no core exchange rate or funded fee pool #329
- "Borrow Asset" window resets on new block on some accounts #505
- Clicking on lowest or highest buy/sell price does not result in an eligible market order #515
- Add the collateral ratio number of each asset to the overview page #397
- App crashes on the market page - argument is not an object id #520
- OS X Light Wallet Bug #525
- Market %change and volume do not match #528
- The [FAV MARKETS] / [ALL MARKETS] tabs don't work when accessed for the very first time. #519
- Cannot find some markets #526
- Account drop-down options are inconsistent with selected third-party account #523
- Market page shows loading indicator if user doesn't have any account - it should suggest to create account instead #507


---------------------------------------------------------------------
Release 2.0.151119
---------------------------------------------------------------------

NEW FEATURES:
- Warn users placing below the price market orders (e.g. 20% off market price) #445
- Feedback while adjusting collateral slider #451
- Account orders history on Exchange
- Markets overview page redisign, improved market search functionality
- Add 24h change and volume to markets list
- Improved favorite/unvoriete markets functionality
- Added support for deposits/withdrawals on blocktrades.us in bridge mode
- Added filtering and current supply to Assets overview
- Added TRADE.MUSE, METAFEES and OBITS to default favorite markets

BUG FIXES:
- Fixed several spelling and typos issues
- Issue building with the latest node.js on Windows #481
- "Promise not defined" build issue #488
- Orderbook and market history colors are missing for some numbers #490
- "Borrow Asset" window resets on new block on some accounts #505
- Animation on create account page - helps to safe space
- Fix asset creation fee estimation
