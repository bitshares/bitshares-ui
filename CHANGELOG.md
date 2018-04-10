---------------------------------------------------------------------
Release 2.0.180402
---------------------------------------------------------------------
Bug fixes and improvements
--------
- Fix #1376: Hide expiration for margin calls in My Orders
- Fix #1374: Incorrect CSP making the logo not load
- Fix #1373: AccountStore init console errors

---------------------------------------------------------------------
Release 2.0.180401
---------------------------------------------------------------------
New features
--------
- #1223 - Access Node Popup / Access Nodes List
- #1190: Show incognito warning for wallet users
- #1331: Add Page 404
- #1343: Reduce bundle size by ~30%

Bug fixes and improvements
--------
- #999 Add QRScanner component
- #999 Update Content-Security-Policy to support camera capture
- #999 Add https server for local development
- #999 Add react-qr-reader package
- #1371: Show 404 page for non-existing accounts
- #1342: Add asset_claim_fees in fee schedule
- #1344- Remove references to transwiser
- Cleanup Transfer, SendModal and AccountSelector following #1340
- #1190: Fix incognito warning wallet mode detection, modify warning
- #1341 and #1364: Fix fetching of vote ids
- Fix #1364: Sort active committee members array from API
- Resolve tab index issue in find markets
- #1331 Store last expiration on localStorage
- #1331 Display Expiration DatePicker above field
- #1331 Add 1 year option and make it as default
- #1338: Set set_subscribe_callback boolean to false
- Fix #1349: Use new get_all_workers API to fetch workers
- Added Japanese translation for #1335
- Added Openledger component and minor context fix
- #984: Enabled Buy/Sell widgets on Exchange
- #1283: Fix wallet unlock behavior
- UI Fixes for Borrow modal (#1327)

---------------------------------------------------------------------
Release 2.0.180315
---------------------------------------------------------------------
New features
--------
- #1258 Add ability to sort Portfolio by QTY
- #1303 Tabs change for asset update
- #1191 Add 'MaximizeDebt' button to Borrow modal
- #1271 Add an ability to filter portfolio by asset name
- #1256 Add an ability to star markets on dashboard
- #1265 Fix accounts list toggle
- #450 Add transaction id to account activity
- #17: Set custom expiration time for orders
- Add Sweden API node
- #1277: Min deposit limit message
- #981: Send modal alert on known scammer accounts
- #1287: Add new RUDEX tokens and icons
- #1280: Add Russia API node
- Support gxs asset and add asset symbols

Bug fixes and improvements
--------
- #984: Enable header menu items for all accounts
- Fix #1272: Workaround for routerTransition being called multiple times
- Fix #1281 and other references to bit assets
- Update bitsharesjs for better handling of incoming proposed transactions
- #1243: Translation fixes
- Fix broken asset/gateway logic
- #1278: Tab subtext disappears when collapsed
- #1260: Reduce renders due to asset dynamic data updates
- #1250: Modal theme fixes
- #1251: Modal fixes
- #1247: Allow wallet to connect to hidden nodes when none other are available
- Update electron and electron-builder

---------------------------------------------------------------------
Release 2.0.180302
---------------------------------------------------------------------
New features
--------
- #588: New withdrawal modal
- #1142: New dashboard layout
- #691: Portfolio pulse on price change
- #1189: Japanese translation
- #1002: Visual representation of asset allocation

Bug fixes
--------
- Fix for margin positions modal not showing existing positions
- Improve explorer block fetching, reduce ops displayed
- Fix bug in Orderbook when horizontal
- Fix #1240: Reduce the ChainStore dispatch frequency and improve BindToChainState performance
- Fix #1239: Don't defer market stats fetching
- Fix Tab color for Nodes #1236
- #1229: Memoize and cache certain calls in BlocktradesMethods
- #1179: Open dropdown when clicking on chevron
- Fix Issue #1179
- Fix #1220: Force one market direction for stats checks
- #1149: Fix latency overlapping
- #1133: Add ability to turn off autoscroll
- Fix Issue #1195 - Asset Equivalent Price Issue
- Fix ##1219: Incorrect feed prices break the exchange page
- #1199: Modal theme issues
- Fix error in url assignment
- Fix #1070: Asset search
- #995: Remove 'sign as owner' in account update
- Fix #1201: Settings redirection

---------------------------------------------------------------------
Release 2.0.180215
---------------------------------------------------------------------
New features
--------
- #686: Browser notifications for transfers
- #904: Implement Settings UX
- Page walkthrough guides implemented for #1139
- #359: Added green pulsing buy button when BTS is under 1 BTS
- Nodes hiding functionality (#1148)
- #1091: Display Accounts ID on Accounts Page
- #1061: Deduct Hidden Assets from Portolio Total and provide Total for Hidden
- #776 add force settlement offset and delay to asset page (#1123)

Bug fixes
--------
- #1130: Contacts page bugs and improvements
- Fix styles of hidden accounts divider #1130
- Fix issues with colours after changes in PR #1143
- Deduct hiddenAssets from Header Account Balance #1061
- Add valid accounts to AccountSelector typeahead for selection #993
- #993: Enable reset of search for TypeAhead component
- Fix #1147: Make sure backup filename is converted to lowercase
- Help pages for #1107
- Update steem package, fix #887
- Remove duplicate API node entry
- Fix Issue #889
- Use native font family for active/hidden bold (#1128)
- Add total balance for Hidden assets table #1061
- Deduct hidden assets balance from total portfolio balance #1061
- Enable deposit/withdraw links for cloud model accounts while unlocked
- Fix issue with FormattedPrice decimals
- Add minimal deposit warning (#1122)
- Fix Settlement / Feed Price (#1113)
- #1099 - Tweak account active/hidden styling
- Fix some Exchange warnings
- Fix for Winex gateway not generating addresses properly
- Implemented updated UI styles
- Fix for the asset page where unwanted wrapping occurs when there isn't a market description
- Fixed some more typos in the German translation
- Added colspan to fix issue with daily budget on active worker proposal
- Removed round edges from the side of input touching the copy button.
- Update winex gateway，need to manually get deposit address

---------------------------------------------------------------------
Release 2.0.180115
---------------------------------------------------------------------
New features
--------
- Change exchange header #888
- Show Balance on Margin Positions Tab #994
- #985 - Move account table out from market dashboard
- update gdex api service (#1017)

Bug fixes
--------
- Electron build - Add context menu for copy/paste support
- Fix similar names appearing as active in the header dropdown
- Fix Issue #1001
- Hide the header unlock icon on small screens
- Unlock wallet doesn't unlock operations until refresh
- Updated blckchnd api node info
- Fix flash of modal and input not being cleared
- Fix #996: change LTM fee rate for asset creation
- Fix #991: move the lock button out of the menu area

---------------------------------------------------------------------
Release 2.0.180108
---------------------------------------------------------------------
New features
--------
- Add Winex gateway service (ETH, ETC, HSR)

Bug fixes
--------
- #982: Clear send modal form inputs on closing
- Increase precision of Collateral Slider in BorrowModal
- Update Russian locale
- #976 - Indicate clickable orderbook rows
- #557 - Deposit Modal Fixes

---------------------------------------------------------------------
Release 2.0.180105
---------------------------------------------------------------------
New features
--------
- #901: Add "Maximize Collateral" button to Borrow Modal.
- Add new GDEX assets
- #557 New Deposit Modal (beta)
- #828: Clearly identify known accounts when sending
- Update Help Page's Styleguide
- Blocktrades Announcements
- Change Caret To Burger (#931)
- Moved language selection to account register page #883
- Add South Africa API node
- Add Kansas City, USA API Node

Bug fixes
--------
- Fix for Issue #956
- Fix #949: Change icon color to fit the theme
- Show call price instead of market price in margin positions, fixes #921
- Update russian translations
- Fix #938: Add white background to qrcode
- Fixed floating width of login/register modal #883
- "undefined" when copy deposit address with CTRL+C
- Fix #932: Remove filtering of orders with extreme prices
- Fix #927: Inverting market assets
- Remove Transwiser from CSP
- Revise and update Chinese translation
- Fix Issue #919
- #823: Fixed exchange input filter events prevent from pasting data
- Fix incorrect news publish date, part of #887
- Bugfix: cleanup when fetch address error in gdex api (#886)
- #733 - Open Order Assets

---------------------------------------------------------------------
Release 2.0.171219
---------------------------------------------------------------------
New features
--------
- #874: Check cloud wallet password against local wallet
- New faucet according to infrastructure worker proposal (#867)
- Add some new markets to the default lists #843
- Create a typeahead component for selecting asset symbols (#847)
- Added gold and silver to margin positions #833
- Improved navigation in of explorer components #647
- Rename Openledger Dark theme to Midnight
- #452 private feed producers
- #699: Add News section with content from Steemit
- Add RPC Node wss://us-ny.bitshares.apasia.tech/ws (#817)
- Add API node: wss://dex.rnglab.org (#810)
- Show pricechart grid

Bug fixes
--------
- Fix #875: overflow hidden hiding password characters
- Add button to create new account #800
- Fixed login mode change on registration page visit #831
- Fix invalid signed message signature notice in English (#859)
- Correctly parse signed message (#864)
- Remove duplicated asset in topMarkets (#860)
- Fix some potential Exchange issues with switching markets and bucketsizes
- fix address and balance issue for gdex api (#879)
- Fix Fees layout scrolling issues #647
- Fix some Header active and hover states
- Fine Tune UI #819
- Fix Issue #807 - Accounts Tab Settings
- fixed wrong positioning of elements in account selector #796
- Fixed: Unable to specify bitCNY as Fee ... #803
- Fixed: Cancel button doesn't work when creating assets #799
- Update locale-es.json (#806)
- Remove border from tables and add a row hover state #813
- Fix #777: Missing error message when memo key is missing
- Fix some minor header and dropdown css issues
- Catch a price comparison error
- Prevent cross-pollination of market data fix #811

---------------------------------------------------------------------
Release 2.0.171205
---------------------------------------------------------------------
New features
--------
- #558 Add UI for cancelling orders in bulk
- #167 Contact list support (to be expanded upon)
- #630 Header and right menu Dropdown
- #781 - Add/Remove Contacts
- #556 Add new Send modal (beta)
- Add GDEX API server

Bug fixes
--------
- #765 fixed usage of some undefined properties on withdrawal
- #771 match styles to new account dashboard look
- Fix #715 and #772: Dropdown menu can't scroll
- Fix #723: Missing asset name in translation
- Set more theme specific API Status colors. (#788)
---------------------------------------------------------------------
Release 2.0.171102
---------------------------------------------------------------------
Bug fixes
--------
- Fix exchange page not loading for bit assets with force called margin positions
- Fix 'Invalid date' issue
- Restore ask/bid price colors in exchange orderbook

---------------------------------------------------------------------
Release 2.0.171101
---------------------------------------------------------------------
New features
--------
- #634 The hosted wallet is now available at wallet.bitshares.org
- #530 Withdraw amounts now factor in the gate fee
- #538 The voting page has been completely revamped
- #579 The margin position tab now includes a set of default assets
- #632 The connection status is now visible throughout the app
- #302 Your own orders are highlighted in the order book
- #623 The Chinese translation has been updated
- #670 My Trades now show dates instead of block numbers
- #581 Market fees are now shown in the exchange page
- #633 Clicking on connection status now takes you to Settings --> Access
- #430 The asset page for bit assets now includes a sortable list of open margin position
- #583 The portfolio is now sortable

Bug fixes
--------
- #658 BTS trade button missing from portfolio view
- #627 Display Feed Published value as an actual date/time in localized time zone
- #52 Show a warning about core_exchange_rate at asset create/update page
- #455 Trollbox has been removed completely
- #645 Kexcoin has been removed from the dashboard
- #622 Login screens have been harmonized
- #580 Annual membership fee now is now shown as disabled
- #607 Long line wrapping issue has been fixed
- #590 'Reserve asset' changed to 'Burn asset'
- #586 Input fields clear properly when switching between markets
- #594 Leading decimals can now be input correctly in the exchange
- #498 Orderbook scrollbars always visible
- #673 Account tab headers are now highlighted

---------------------------------------------------------------------
Release 2.0.171015
---------------------------------------------------------------------
New features
--------
- Tables Rewrite - Account Dashboard #378
- Add an optional encrypted qr code for the private key (#542)
- #545: Show gateway status as down for unavailable coins
- #471: Add label to Find Markets add header
- #560 Show unavailable messages for openledger and rudex if they time out
- Add whitelisting to asset update page fix #70 and fix #462
- Clear transfer form once completed (#564)
- Use new tables styling in dashboard, add accounts/recent switching
- #500: Set testnet/mainnet faucets depending on current API node
- #488: Hover state + click toggle for account name QR code
- Filter out insecure websocket urls when using https
- #572: Make sure exchange input only allows numbers, no negative input
- #543: Add sync status check interval, 'Synced/Out of sync/Disconnnected' warning

Bug fixes
--------
- #496: Ensure tables retain correct height
- Remove forced create account step position #576
- Fix #578: Open orders not displaying all orders
- Fix ChainStore failing to notify after reset and latency check counter
- Fix #563: Settlement box width
- Fix App.jsx synced state to mean blockchain sync status #543
- Fix #571
- Fix #479: Max supply bug in asset creation and update
- #574: Remove nodes that are no longer available
- Fix issue #294 (#575)
- Reset backup store when wallet is changed (#570)
- Fix Backup dashboard link
- Set cloud wallet login to default, improve settings switching logic
- #Fix 501: Asset explorer table alignment
- Fix #567: Explorer My Markets page does not load
- Round up `for_sale` and down `to_receive`, #562 (#565)
- Simplify and improve app init chain #531
- Fix #529: Withrawal modal inputs
- Fix #483: Remove TRADE.X from dropdown and remove blocktrades gateway
- #531: Catch some app init errors and redirect, update indexeddbshim
- Add an image for QR code, fix some styling and translations #444
- Harmonize login forms between modes
- Use account.assets from new API to display list of issued assets
- Set password and username type/name/ids for password managers #527
- Fix #535: remove ellipsis and cap password length at 45 chars
- Fix typo (oherwise -> otherwise) (#534)
- fix: parseInt for minimum_feeds when create asset (#539)
- #532 change noone to no one

---------------------------------------------------------------------
Release 2.0.170914
---------------------------------------------------------------------
New features
--------
- Issue #315 - Add Chart Clamp To Settings Dropdown (#373)
- Issue #364 - Present an error message that disallows the use of Incognito with the BTS wallet (#394)
- Issue #311 - Allow for hiding user issued assets (#397)
- Iss #43 - Notification for new version availability (#382)
- Display all committee members and witnesses, fix #53
- #224 build automation (#371)
- Iss #279 - When selecting a new Node under Settings -> Access, don't hard reload the browser (#380)

Bug fixes
--------
- fixed #392 (#401)
- Fix password manager issue and ChainStore account fetching for logins close #403
- Fix edge and tooltip formats when switching between markets
- fix issue #385 make height is same with open orders (#396)
- Make sure period will be placed when selected text has period keyed (#395)
- Iss 351 - Failed to Sync with API Server UI (#381)
- Update display price when changing amounts to stay consistent with confirmation screen fix #314
- Fix #374 (#375)
- Use only the first part of the remote API errors when broadcasting trx fails #342
- Fix worker creation submit error close #366
- Improve order matching when clicking orderbook orders #200
- Fix #358 (#363)
- Fix values displayed in MyOpenOrders
- Remove special treatment of call pricing making it non-invertable #204
- Fix find market invalid asset warnings close #292
- Enforce at least 2 decimals for price text #186
- fix collateral ratios is NAN issue (#362)
- Fix #345 (#357)
- Fix Issue #341 (#355)
- Fix some setState on unmounted component errors
- Fix MyMarkets console errors
- Fix 'span cannot appear as child of tbody' error
- Fix warning in header (td in a) (#338)
- Update bitsharesjs, #346, fix #304
- Update apiLatencies after connection
- Fix API nodes sorting #346

---------------------------------------------------------------------
Release 2.0.170829
---------------------------------------------------------------------
New features
--------
- Add memo fee estimation to WithdrawModalBlockTrades and Transfer
- Show status of all API servers
- Add WanCloud API servers
- Allow Modal Close with Keyboard Control
- Transwiser: add bankwire withdraw option
- Force very strong generated password on account creation

Bug fixes
--------
- Fix #188: Total calculation (BTS) is not displayed correctly
- Add localStorage fallback to BlockTradesDepositAddressCache, fix #327
- Update BindToChainState for getAccount autosubscribe option, fix #202
- Ensure proxy props changing updates component state
- Ensure that vesting balances are updated when hot switching accounts
- Improve exchange fee calc with pool and balance checks, prevent placing orders when fees are not payable
- Add balance and fee pool checks to withdrawals
- Ensure primary asset shows up in balance calculations
- Add balance and fee pool checks to withdrawals, remove dead code
- Fix 'unknown value' displayed for 0 amount
- Fix error message for expired transactions
- Fix broken telegram chat room link
- Disable the trollbox, remove password change entry in settings for password logins
- Fix a rounding issue when estimating non-BTS fees in the exchange
- Fix Header not showing unlock state properly after wallet/account creation
- Add a worker creation form
- Fix depth chart for markets with extreme spreads

---------------------------------------------------------------------
Release 2.0.170410
---------------------------------------------------------------------
New features
--------
- Allow the mini depth chart to be hidden by the user
- Refactor the MyMarkets component, 'show star only' and revamped search
- Display up to 20 rows of the orderbook by default instead of 10
- Add Trade and Borrow links to the default assets in AccountOverview

Bug fixes
--------
- Fix an issue with blocktrades deposit addresses being set incorrectly
- Change positioning of some tooltips
- Fix password score checker freezing on very long passwords
- Hide 'something for nothing order history items
- Update bitsharesjs to fix proposals array undefined error
- Fix 'Cannot use 'in' operator to search for 'translate'' error in api dropdown
- Fix order rounding when modifying the 'Total' after clicking an order from the orderbook
- Improve first-time brainkey lookup to check at least 10 positions
- Log pub keys when creating a new account
- Fix some Account permissions css issues and add some loggin
- Also check if generated active key matches owner key and vice versa
- Fix account create with faucet not rejecting errors properly
- Fix password strength meter turning red for long passwords
- Fix gateway actions in progress return
---------------------------------------------------------------------
Release 2.0.170327
---------------------------------------------------------------------
New features
--------
- Add password based login using account+role+password as private key seed
- Add a Migration option to add password based keys to an existing account
- Add password strength checker to password input
- Update account creation using password login method
- Use AccountImage in header instead of User icon
- Add language selection dropdown with flag symbols to Header
- Add a 'Quick buy' modal for blocktrades bridge deposit requests
- Add blocktrades bridge deposits to the Exchange Buy/Sell box
- Make OPEN.X trade links default to X_USD pair
- Add CSP policies for improved security
- Allow users to disable auto-lock by setting timeout to 0
- Include OPEN.DASH as one of the default assets available for deposits
- Restore the small depth chart
- Move the 'borrow X' buttons to the Buy/Sell boxes

Bug fixes
--------
- Add a wallet creation link to WalletUnlockModal
- Fix some missing translation
- Ensure all href links have window.opener clobbered
- Remove TCNY deposits
- Add vesting_balance_withdraw to ProposedOperation.jsx
- Fix the calling of calcMarketStats in onSubscribeMarket
- Improve how low volume markets are determined, add OPEN.DASH
- Fix some pricechart resizing issues, put all controls on the same line
- Tweak the dropdown css
- Improve the price calculation of getMarketStats
- Add missing translation of deposit withdraw title
- Refactor Create account layout, add some text
- Fix some minor header and Chat issues
- Add missing translation key for supposed scammer accounts
- Fix some possible issues in BlocktradesMethods and WithdrawModalBlocktrades
- Wrap localStorage 'get' in try/catch to catch parsing errors, fixes Deposit/Withdraw issues for some accounts
- Adjust the xAxis range for depth charts with no bids but asks
- Fix blocktrades dropdown colors
- Make the openledger fiat registration open in a separate browser
- Fix some minor issues in Header and WithdrawModal
- Fix transfer asset selection dropdown not showing more than 9 assets
- Adjust the positioning of the cog header dropdown
- Remove the borders in the electron header navigation buttons
- Use default cursor to indicate account is not clickable with 1 account
- Fix error when clicking on Header account with only 1 account present

---------------------------------------------------------------------
Release 2.0.170314
---------------------------------------------------------------------
New features
--------
- Make the account dropdown a direct link when only one account is present
- Add a 'choose automatically' option for API server selection.
- Add tooltips for bitassets, open.x and trade.x assets
- Add 'to' account to deposit/withdraw summary, and show full asset name
- Add several markets to dashboard list, filter out low volume markets
- Implement some design ideas from @etherdesign
- Refactor Transfer page, add new asset dropdown
- Refactor AccountLeftPanel using etherdesign's designs
- Increase max. KAPITAL withdraw limit to 100k
- Improve the determination of low volume markets
- Refactor DepositWithdraw layout according to design by @etherdesign
- Add a dropdown to AccountSelector, use it in Transfer to show your accounts in From field
- Change Tabs styling to use segmented button class
- Modify the switch colors to make it very clear what's the checked state
- Update the header account link behaviour to always switch the active account, add notification
- Make the header balance value depend on the active account
- Put Explore, Help and Settings behind a dropdown using the cog icon
- Move the price chart controls below the chart itself
- Fetch 3x as much data for price charts

Bug fixes
--------
- Make event listeners passive, ensure removal
- Add theme as query param to BitKapital iframe urls
- Improve MarketCard shouldComponentUpdate logic
- Improve the borders and display of market cards in the Dashboard
- Fix top markets list disappearing due to low volume check
- Rename 'pay' to 'send to
- Sort call orders by id for consistent sort in CollateralPosition
- Move the date in the operation list to a third column
- Always set the 'from' account in Transfer.jsx
- Fix account registration without referral id
- Fix KAPITAL:OPEN.BTC price display in dashboard
- Fix BuySell input style after Transfer refactor
- Improve the Identicon question mark color
- Include accounts with partial authority in list of my accounts
- Only render mobileMenu on small screens
- Filter Blocktrades backed coins by active wallets
- Fix Exchange balance check
- Fix BuySell balance asset construction
- Fix withdrawal modal input check for amounts < 0
- Fix fee subtraction in BuySell
- Fix removal of ws api nodes in WebSocketAddModal
- Persist backedCoins in localStorage
- Persist map of low volume markets

---------------------------------------------------------------------
Release 2.0.170303
---------------------------------------------------------------------
New features
--------
- API node hopping: fallback to next API server if current API is down
- API latency checks: all known API servers are regularly polled for latency, the ranking is used for fallback attempts
- Notifications for confirmed transactions instead of second OK button
- Big Russian language update
- Delay Chat component appearance, default user name is now the first account in the user's wallet
- Add empty input warning to WithdrawModalBlocktrades
- Persist BlockTradesGateway deposit/withdraw setting

Bug fixes
--------
- Remove redirect from / to /dashboard
- Store referral account in localStorage, fixes account creation referrals
- Fix brainkey sequence sync issues with account creation failure, add reset/decrement methods, resolve process_transaction properly on trx inclusion
- Trigger account ref lookup immediately on AccountStore loadDbData, fixes slow Dashboard load
- Fix for MyOrders incorrect amounts
- Fix Exchange insufficient funds message
- Fix order cancellations not updating properly
- Filter out OPEN.X coins that are currently unavailable from preset list
- Modify app init Chain to better handle sync error redirects
- Add missing getFee method for SimpleDepositWithdraw

---------------------------------------------------------------------
Release 2.0.170224
---------------------------------------------------------------------
New features
--------
- New modal for quick deposit/withdraw of OPEN.X assets on account overview page
- A set of default assets are available for deposits on the account overview page
- New summary of open orders on account overview page
- Set precision for bitCNY and bitUSD to 5 in orderbook display
- Flip CNY:OPEN.BTC market in dashboard
- Add bitSilver asset icon
- Add Chinese intro text by bitcrab
- Add grid lines and y axis labels to the depth chart

Bug fixes
--------
- Fix Popover links so they work within the router context
- Update react-router to v3.0.2
- Refactor blockTrades withdrawal address caching
- Scroll orderbook to top when changing markets
- Don't set feed price in MarketStore for markets without call orders
- Fix setting of highestBid in MarketStore
- Update bitsharesjs, fixes vesting balances not loading properly
- Fix persistence of indicator settings
- Fix PriceChart resize on switching to/from left orderbook
- Update Dashboard markets, add loading indication until accounts are ready
- Fix Operation display of asset_global_settle operation

---------------------------------------------------------------------
Release 2.0.170215
---------------------------------------------------------------------
New features
- New intro text has been added to the Dashboard for new users
- Several settings and wallet related parameters have been made dependent on the chain id, and will thus switch accordingly if you connect to the testnet for example.
- Windows light client installer will now remove personal data properly if checked

Bug fixes
--------
- Fix Russian language selection
- Fix proxy selection
- Fix committee/witness pages
- A bug when importing old BTS 1 balances has been fixed
- App init flow has been improved
- Fix asset creation precision slider
- Fix HelpContent links
- Only trigger MarketCard img onerror update once
- [Blocktrades] Fix issue with 'calculating crashes' in Blocktrades Bridge
- [Blocktrades] Disable 'withdraw now' and 'convert now' buttons if no funds
- [Blocktrades] Move amount from output withdraw section to withdraw dialog in Blocktrades Bridge
- [Blocktrades] Fix displaying MKR coin
- [Blocktrades] Add ability to move balance to 'Amount selector' in withdraw dialog on mouse click

---------------------------------------------------------------------
Release 2.0.170201
---------------------------------------------------------------------
New features
- Charting revamp: new charts using [react-stockchart](https://github.com/rrag/react-stockcharts)
- Russian language translation thanks to @rusteemitblog and @testzcrypto
- Add brainkey restoration to create-account, improve brainkey restoration
- All open orders, collateral and debt are now included when estimating total account value on the account screen
- A 'Borrow' action added to the account assets table
- A 'Reset settings' button added to the Settings page
- Dates have been added to the Chat (requires implementation by other clients like Openledger also)
- Hide 'OPEN.' prefix from Openledger assets
- The dashboard market cards have been modified to be more clear

- Hempsweet UIA symbol added ahead of their launch

Bug fixes
--------
- Many tweaks and fixes to colors, positioning and more
- Make sure transfer asset stays synced
- Fix bug in CER input during asset creation
- Move 'show hidden accounts' inside DashboardList, improve the layout

---------------------------------------------------------------------
Release 2.0.170123
---------------------------------------------------------------------
Bug fixes
--------
- Use relative paths for fetching assets, fixed wallet creation issues
- Fix some links in the light wallets
- Fix market flipping for UIAs
- Fix several bugs related to hash-history react router config
- Change Graphene to BitShares
- Replace graphenejs-lib with bitsharesjs
- Fix npm errors
- Fix line breaks for memos with very long words
- Make sure asset actions render properly in AccountOverview
- Ensure proxy accounts get resolved properly in Voting

---------------------------------------------------------------------
Release 2.0.170118
---------------------------------------------------------------------

New features
--------
- Helpul tooltips have been added in multiple locations, such as login/unlock, margin mechanics ++
- Proposed transaction summaries added to transaction history lists
- Always display settings cog in header

Bug fixes
--------
- Fix display of asset page for bit assets with no valid feeds
- Remove maximum_short_squeeze_ratio requirement for minimum collateral
- Base Call Order forSale/toReceive calculation on debt instead of collateral
- Fix TimeAgo tooltip positioning
- Hide 'show hidden assets' button when no assets are hidden
- Update Chinese translations
- Set depth chart xaxis properly when no asks are present
- Fix price being set when clicking on orderbook order
- Add a tooltip explaning that buy amounts are minimum to receive
- Filter call orders on feed update

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
- Add BitShares bloom filter for BTS 1 account imports
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
