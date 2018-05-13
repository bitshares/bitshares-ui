import alt from "alt-instance";
import BlockchainStore from "stores/BlockchainStore";
import BlockchainActions from "actions/BlockchainActions";
import assert from "assert";

describe("BlockchainStore", () => {
    it("Mounts", () => {
        assert(!!BlockchainStore);
    });

    afterEach(() => {
        BlockchainStore.blocks = BlockchainStore.getState().blocks.clear();
        BlockchainStore.latestBlocks = BlockchainStore.getState().latestBlocks.clear();
        BlockchainStore.latestTransactions = BlockchainStore.getState().latestTransactions.clear();
    });

    it("Contains state", () => {
        assert(Object.keys(BlockchainStore.getState()).length > 0);
    });

    it("Listens for getBlock action", () => {
        const action = BlockchainActions.GET_BLOCK;
        alt.dispatcher.dispatch({action, data: getBlockData});
        assert(BlockchainStore.getState().blocks.size === 1);
    });

    it("Listens for getLatest action", () => {
        const action = BlockchainActions.GET_LATEST;
        alt.dispatcher.dispatch({
            action,
            data: {block: getBlockData, maxBlock: 26760156}
        });
        assert.equal(BlockchainStore.getState().blocks.size, 1);
        assert.equal(BlockchainStore.getState().latestTransactions.size, 36);
        assert.equal(BlockchainStore.getState().latestBlocks.size, 1);
    });

    it("Keeps a max amount of ops in memory", () => {
        const action = BlockchainActions.GET_LATEST;
        const maxBlocks = BlockchainStore.getState().maxBlocks;
        const maxTransactions = BlockchainStore.getState().maxTransactions;
        for (var i = 26760089; i < 26760089 + maxBlocks + 5; i++) {
            let currentBlock = getLatest1;
            currentBlock.id = i;
            alt.dispatcher.dispatch({
                action,
                data: {block: currentBlock, maxBlock: 26760099}
            });
        }

        assert.equal(BlockchainStore.getState().latestBlocks.size, maxBlocks);
        assert.equal(
            BlockchainStore.getState().latestTransactions.size,
            maxTransactions
        );
    });

    it("Listens for RPC connection updates", () => {
        // TODO: Check the possible rpc updates and update this test accordingly
        const action = BlockchainActions.UPDATE_RPC_CONNECTION_STATUS;

        alt.dispatcher.dispatch({action, data: "error"});
        assert.equal(BlockchainStore.getState().no_ws_connection, true);

        alt.dispatcher.dispatch({action, data: "open"});
        assert.equal(BlockchainStore.getState().no_ws_connection, false);
    });
});

const getBlockData = {
    previous: "019853d189dec561ea99c8865f09b84d31efe9d3",
    timestamp: "2018-05-07T04:22:45",
    witness: "1.6.101",
    transaction_merkle_root: "4de33fd19a792e61e4314a2e5723bdb50efa3eb8",
    extensions: [],
    witness_signature:
        "2029e5ad6a52d7fa4efe66f64d5f5b1fa2181bb302b56e4f5f3f65741cce56b0ea73fdec81401849da29f50f5a63fcb6948c3e1184699da3c57c097fe2c33fab25",
    transactions: [
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:22:56",
            operations: [
                [
                    0,
                    {
                        fee: {amount: 10940, asset_id: "1.3.0"},
                        from: "1.2.660709",
                        to: "1.2.453016",
                        amount: {amount: 40400000, asset_id: "1.3.0"},
                        memo: {
                            from:
                                "BTS6WJsep4SNEsMqvPu6rz3hj5KzG7MpnyB5LkBdS7sGciW6b4c7p",
                            to:
                                "BTS4xMLom14peN6CzoZjMzt1UVRA4RHhSHyrkyCLRe16psos6RiFk",
                            nonce: "390570741375970",
                            message: "523c525df9ae2f5083bbe20c11c0ce5a"
                        },
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f1e5e03580a90578e2cac4d8f346e431add4d649859abac654e73604a637178c85a08b87cce3f92f4744d6ac2722092ad2f92af96f04242bbdd26012f0911c9fd"
            ],
            operation_results: [[0, {}]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:10",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.883285",
                        order: "1.7.69769521",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f2a2b38de482fff64335770abc198c5b7f43396b4839c1206013dc18486fc1a7c3a0f9cf80cddf1da20ec37e7ba94cf6920fc62cb5251f9c02304c10545c0c972"
            ],
            operation_results: [[2, {amount: 14344838, asset_id: "1.3.113"}]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.670909",
                        amount_to_sell: {amount: 29281679, asset_id: "1.3.0"},
                        min_to_receive: {amount: 894227, asset_id: "1.3.121"},
                        expiration: "2018-05-14T04:22:40",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f618d0f79d701f4910c6699bb6867ff73cbb2c1c0443ee2b26084c5065da0b04b297ed29c22d912339939af709cb34197108d48bd26307974c0fa0526bc1c5ded"
            ],
            operation_results: [[1, "1.7.69769559"]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:22:57",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.155948",
                        order: "1.7.69561573",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f0bad4bb57fdc10a1c807757465927e0f3f5e3e8c54ef1fd8157f16a5142b4cbb294cfe9ffa9507db5eaf9e4a8deadef586f4abe100d652a28a3c4b05bd80f840"
            ],
            operation_results: [[2, {amount: "4200000000", asset_id: "1.3.0"}]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:09",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.132834",
                        order: "1.7.69768285",
                        extensions: []
                    }
                ],
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.132834",
                        order: "1.7.69750504",
                        extensions: []
                    }
                ],
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.132834",
                        amount_to_sell: {amount: 32119619, asset_id: "1.3.0"},
                        min_to_receive: {amount: 129420, asset_id: "1.3.850"},
                        expiration: "2019-05-07T04:22:38",
                        fill_or_kill: false,
                        extensions: []
                    }
                ],
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.132834",
                        amount_to_sell: {amount: 151450, asset_id: "1.3.850"},
                        min_to_receive: {amount: 40207959, asset_id: "1.3.0"},
                        expiration: "2019-05-07T04:22:38",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "204cc12b25e29d73ee0e03d3644ad0250917d547321ee4d0777adae934e41af53102e13c8c3e89533a7706fea3f74cf71bf1d8ace5c96394540ec220697161f9cd"
            ],
            operation_results: [
                [2, {amount: 32119808, asset_id: "1.3.0"}],
                [2, {amount: 151450, asset_id: "1.3.850"}],
                [1, "1.7.69769560"],
                [1, "1.7.69769561"]
            ]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:11",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.881146",
                        amount_to_sell: {amount: 11491329, asset_id: "1.3.113"},
                        min_to_receive: {amount: 60000000, asset_id: "1.3.0"},
                        expiration: "2018-05-14T04:22:41",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f2763063704688311ae3ebc35a09e9cbfaf32142da20b1f13413e38742ff508f91510d5ce76d1c2cd0001fc3efa852339fe900b3501f2cda11fce96d68be55feb"
            ],
            operation_results: [[1, "1.7.69769562"]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:08",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.602724",
                        amount_to_sell: {amount: 14674990, asset_id: "1.3.113"},
                        min_to_receive: {amount: 76719757, asset_id: "1.3.0"},
                        expiration: "2018-05-14T04:22:37",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f1cf3e53b477457dac759c7bde89f94b1f637bf168c1c354c580e260b9ec40fad5dcead27e6d88226d084533c7d57f5735399df62da962ee93209439a7c38c292"
            ],
            operation_results: [[1, "1.7.69769563"]]
        },
        {
            ref_block_num: 21455,
            ref_block_prefix: 4193959067,
            expiration: "2018-05-07T04:23:07",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.556579",
                        order: "1.7.69769266",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f4abecf8796d5d4557f19b2583e28fa2f3de0866674de53cc3a32620ce50e222f3b8342b1a2391604684de84c1f25723159e206240098e8d81130a7f728bd73de"
            ],
            operation_results: [[2, {amount: 246989, asset_id: "1.3.1570"}]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:10",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.438680",
                        amount_to_sell: {amount: 957548, asset_id: "1.3.121"},
                        min_to_receive: {amount: 31617968, asset_id: "1.3.0"},
                        expiration: "2019-05-07T10:11:26",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "201f5eaa28dab4d61a3b70dbc045cd23543902619b3b88e2aa0a49ca1587aa1009603172f402c3f167af693277b73cb1b2a54fd58f9a86be6e2053329ffdb1be33"
            ],
            operation_results: [[1, "1.7.69769564"]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:11",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.883288",
                        amount_to_sell: {amount: 12180809, asset_id: "1.3.113"},
                        min_to_receive: {amount: 63600000, asset_id: "1.3.0"},
                        expiration: "2018-05-14T04:22:41",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2015a7aa5031daf0d3252623c567a9a46ca2ab70a1615e930384a1c618583f048a2e36bd60d96644365fca1ce3aeb897f94e3e376757d8a48e5cc809289d963ffd"
            ],
            operation_results: [[1, "1.7.69769565"]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:11",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.862646",
                        order: "1.7.69769530",
                        extensions: []
                    }
                ],
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.862646",
                        order: "1.7.69769465",
                        extensions: []
                    }
                ],
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.862646",
                        amount_to_sell: {amount: 391018120, asset_id: "1.3.0"},
                        min_to_receive: {amount: 75465950, asset_id: "1.3.113"},
                        expiration: "2038-01-19T03:14:07",
                        fill_or_kill: false,
                        extensions: []
                    }
                ],
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.862646",
                        amount_to_sell: {amount: 63668794, asset_id: "1.3.113"},
                        min_to_receive: {amount: 335040548, asset_id: "1.3.0"},
                        expiration: "2038-01-19T03:14:07",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f408f0e6709797527158b406aacdfa4c5f19ec889f15d7ebf2a6b3d51fe47d22e4ca50610583cde4117594f980bb79d07dcd736d33e5ed19ea1beeec8a5f6b25d"
            ],
            operation_results: [
                [2, {amount: 391018120, asset_id: "1.3.0"}],
                [2, {amount: 63668794, asset_id: "1.3.113"}],
                [1, "1.7.69769566"],
                [1, "1.7.69769567"]
            ]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.883287",
                        amount_to_sell: {amount: 11797765, asset_id: "1.3.113"},
                        min_to_receive: {amount: 61600000, asset_id: "1.3.0"},
                        expiration: "2018-05-14T04:22:41",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2072755b1b9374c00fa256c2dd98738e90354219dee96a8e586af1877d5a51d7654ebce928aafbf928f29a9ab33a3f4aef1774cd0cf52ef89c8077e75fcf660c54"
            ],
            operation_results: [[1, "1.7.69769568"]]
        },
        {
            ref_block_num: 21455,
            ref_block_prefix: 4193959067,
            expiration: "2018-05-07T04:22:55",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.478220",
                        amount_to_sell: {amount: 5000000, asset_id: "1.3.113"},
                        min_to_receive: {amount: 26019988, asset_id: "1.3.0"},
                        expiration: "2019-05-07T04:22:39",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f1e44860f10e7c1d2618d277a8003dba041ebc2167c3b9b11182e205085b77be454ccbf221b6e96431cbb0dece80d00db2f51023eb54e5918a3a2c53a47eb8905"
            ],
            operation_results: [[1, "1.7.69769569"]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:10",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.438673",
                        amount_to_sell: {amount: 2680724, asset_id: "1.3.0"},
                        min_to_receive: {amount: 81388, asset_id: "1.3.121"},
                        expiration: "2019-05-07T10:11:26",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2073325738d591ecd54ea8fb4689641ae10894ebd039493a8aeeadb186a885e743471dd45498883d2a68ff9d98c66fea2bd0f43a769116627ceb63958f5b4e0a39"
            ],
            operation_results: [[1, "1.7.69769570"]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.883285",
                        amount_to_sell: {amount: 14345010, asset_id: "1.3.113"},
                        min_to_receive: {amount: 74900000, asset_id: "1.3.0"},
                        expiration: "2018-05-14T04:22:41",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "202218591e3fe0c7b9466ecd9ba343b98d43d895a244f1a7e5bb785c8394a49a283567244057d4e0c7fd18128d0d2e008691150c70e4ba8554176b4c8482859147"
            ],
            operation_results: [[1, "1.7.69769571"]]
        },
        {
            ref_block_num: 21455,
            ref_block_prefix: 4193959067,
            expiration: "2018-05-07T04:22:54",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 2312, asset_id: "1.3.3422"},
                        seller: "1.2.899466",
                        amount_to_sell: {amount: 4700357, asset_id: "1.3.3422"},
                        min_to_receive: {amount: 246768, asset_id: "1.3.1570"},
                        expiration: "2023-05-07T04:22:27",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f4263b71f7c4253c282a3709ab2837b0da13f5adcae1ce82bdeed2c098de8e2136759f5e32c91a1c1816cb6b960ae8cdd38a4f7baf8a7d616c2be071b657c38f2"
            ],
            operation_results: [[1, "1.7.69769572"]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:22:58",
            operations: [
                [
                    14,
                    {
                        fee: {amount: 10425, asset_id: "1.3.0"},
                        issuer: "1.2.374566",
                        asset_to_issue: {
                            amount: 120000000,
                            asset_id: "1.3.3475"
                        },
                        issue_to_account: "1.2.665909",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f65a8b19c70aef3d1225f26e2cc44a7e18246167a06cc6a1bba0d823e3952020235e69cdb50b753c15ed7de1414d68edc28dd0f37fca71dc1bc886bd71dfde2d4"
            ],
            operation_results: [[0, {}]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    19,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        publisher: "1.2.564",
                        asset_id: "1.3.114",
                        feed: {
                            settlement_price: {
                                base: {amount: 55495, asset_id: "1.3.114"},
                                quote: {amount: 94441, asset_id: "1.3.0"}
                            },
                            maintenance_collateral_ratio: 1750,
                            maximum_short_squeeze_ratio: 1100,
                            core_exchange_rate: {
                                base: {amount: 68323, asset_id: "1.3.114"},
                                quote: {amount: 96893, asset_id: "1.3.0"}
                            }
                        },
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f573b3a0ca0c3821843fc48fe902cfd927f0a989996f0a71e7c7377dfb5cdb4655da3ff430a3ce9b88775d3ceacd27b282adbebf54ab4b28618aaa0730b3a837b"
            ],
            operation_results: [[0, {}]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:13",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.896148",
                        order: "1.7.69769553",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f1b9215c5975758e861571d621f9d38b4db762962bd0c42ddcc230ce2bf61d28d7fdddb1c908bfa84d516915e5c1a1692f6a299028f8e5f4363cd4de07d4f28fd"
            ],
            operation_results: [[2, {amount: 60400000, asset_id: "1.3.0"}]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.144",
                        amount_to_sell: {amount: 1000000000, asset_id: "1.3.0"},
                        min_to_receive: {
                            amount: 195990000,
                            asset_id: "1.3.113"
                        },
                        expiration: "2018-06-06T04:22:43",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2020655a92d981c08d011342fdd847a2891c80644c609c2c50c696e71443f881a1600edde578dd3c2d51f144442c90bb2d8e6da51aaf84ff6c578b33bccf8fc884"
            ],
            operation_results: [[1, "1.7.69769573"]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.895924",
                        order: "1.7.69769554",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "205ec20707ed2fa589c38847415bc6538fd33068defc7c6ee8c317357f3e7841a2714ff511772eed36de9c6f1a0720bd1f24114754af213a959e4d3c66a480d8b4"
            ],
            operation_results: [[2, {amount: 69300000, asset_id: "1.3.0"}]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:22:56",
            operations: [
                [
                    0,
                    {
                        fee: {amount: 10420, asset_id: "1.3.0"},
                        from: "1.2.31411",
                        to: "1.2.31823",
                        amount: {amount: 2000000000, asset_id: "1.3.0"},
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f04d13e2a822a5febbe5e04126c0145b96871303807789c6643ab8c629f27dcfb7fb74acae612e5d72a8ed8af5092283e74509525f1e28426398d2786e9c9e7f1"
            ],
            operation_results: [[0, {}]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:11",
            operations: [
                [
                    19,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        publisher: "1.2.656195",
                        asset_id: "1.3.1382",
                        feed: {
                            settlement_price: {
                                base: {amount: 19339965, asset_id: "1.3.1382"},
                                quote: {amount: 671530524, asset_id: "1.3.0"}
                            },
                            maintenance_collateral_ratio: 2000,
                            maximum_short_squeeze_ratio: 1100,
                            core_exchange_rate: {
                                base: {amount: 19339965, asset_id: "1.3.1382"},
                                quote: {amount: 537224419, asset_id: "1.3.0"}
                            }
                        },
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f63165c722fa63712f96e31048d4e29294dfea0565f8d27a0b9ed41ebbfc2909253fc365e2b424cca8de5f2d2615ccab778ad472d7622296b942389962b5873c9"
            ],
            operation_results: [[0, {}]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:13",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.893637",
                        order: "1.7.69769552",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2066e4b410bdcb0ef8215096e421ff5f1c2986e3526f206b892e9fd5dd7d4c4c1137f3019bdbb2f9539d1a356dabc31088e42bdef212d0fb83bb9c9257598f8044"
            ],
            operation_results: [[2, {amount: 170400000, asset_id: "1.3.0"}]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:04",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.789433",
                        amount_to_sell: {amount: 124840597, asset_id: "1.3.0"},
                        min_to_receive: {amount: 3866540, asset_id: "1.3.121"},
                        expiration: "2018-05-14T04:22:34",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f6c41bdd1c7dc5242871e7791450e9fd4cece39b22cb0cb3e982ac669ec9508205d1c9a8b2d8a4588ca59d3716917ad2fb80efc87f34e2d5b733bf7df55460299"
            ],
            operation_results: [[1, "1.7.69769574"]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    19,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        publisher: "1.2.711128",
                        asset_id: "1.3.112",
                        feed: {
                            settlement_price: {
                                base: {amount: 24840000, asset_id: "1.3.112"},
                                quote: {amount: 569500000, asset_id: "1.3.0"}
                            },
                            maintenance_collateral_ratio: 1750,
                            maximum_short_squeeze_ratio: 1100,
                            core_exchange_rate: {
                                base: {amount: 38420000, asset_id: "1.3.112"},
                                quote: {amount: 838900000, asset_id: "1.3.0"}
                            }
                        },
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "202bb27fe7df9f656c96c02923c009b898cbcc382abd0cb9a4922422ba6721bc7f6be7ad510d80f12cdd1e81ed3461fbf1b09bb1125500e9321fd67d6983214a0e"
            ],
            operation_results: [[0, {}]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:13",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.880184",
                        amount_to_sell: {amount: 150000, asset_id: "1.3.121"},
                        min_to_receive: {amount: 5013769, asset_id: "1.3.0"},
                        expiration: "2018-05-14T04:22:42",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "207fa84067d5f6e9a8820974f709abc7421e6ae4c4a6009df99262d80c80af9c255219713febb2f3600a201699d13ac30c344b8cc816f9c632bee647232cfdfd32"
            ],
            operation_results: [[1, "1.7.69769575"]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:00",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.625280",
                        order: "1.7.69769500",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2077905c1c9e1fa04e8d1609517aeceff3cfa2c07eabc8d03eeeb5ea11bb35901b1663ef09b870935cd887a5e086188483adc3aa7692d5c9d6e2bbce72d8b5c40b"
            ],
            operation_results: [[2, {amount: 5709155, asset_id: "1.3.113"}]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.126225",
                        order: "1.7.69769556",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2001e794a820d5eeb4252add92a6b093097288127cccf8e12e198652f1e523150d74c400f319128be9ffd16a4c2bfc9b5884d234d42c141d8a3e10f0d91be5ed3f"
            ],
            operation_results: [[2, {amount: 4855200, asset_id: "1.3.0"}]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.126225",
                        amount_to_sell: {amount: 4871295, asset_id: "1.3.0"},
                        min_to_receive: {amount: 150000, asset_id: "1.3.121"},
                        expiration: "2023-05-06T04:22:44",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f07745e47edab3262483cbfe69647856cc7039fe561bce3431cbe8bc86c4000021a91a63e452ebb8fee72bac0dba1100251d4043634484fe35ec895e9b71fd13b"
            ],
            operation_results: [[1, "1.7.69769576"]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:13",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.896148",
                        amount_to_sell: {amount: 60400000, asset_id: "1.3.0"},
                        min_to_receive: {amount: 1844530, asset_id: "1.3.121"},
                        expiration: "2018-05-14T04:22:43",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f6b851dcf19c511816216e174c39fb8430268dec7fbcf04a732ef5869aa4ad8021401bb409d88cdbc6fa3e9d089f2af492a77a82d0b5e7559f7717ffdac6bbb88"
            ],
            operation_results: [[1, "1.7.69769577"]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.116747",
                        order: "1.7.69769555",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "203c999f4d82b579d195d95c90203ac0d74f6936e6a9117ab57386fe3bace5b583236395078073f75da6cb425cbda8f56cede128b7914d82860c7ac70fdb74e2a3"
            ],
            operation_results: [[2, {amount: 22657950, asset_id: "1.3.0"}]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.116747",
                        amount_to_sell: {amount: 22733060, asset_id: "1.3.0"},
                        min_to_receive: {amount: 700000, asset_id: "1.3.121"},
                        expiration: "2023-05-06T04:22:44",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2006d8211930acc5e7346f1917d9e005fe496cb50b9249a35279b70c7cdcc8b8536c90e84cbd3a4afb42495162b9f6e82f895f531e113ace7ef6dfd8ca755b2c53"
            ],
            operation_results: [[1, "1.7.69769578"]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:14",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.89472",
                        order: "1.7.69769448",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "20260669b5baa50463bb4cd4bddf38b9486c6883673e9e7365c70307cd0b86403960e237ced4acfbec3776a2d1942f0f3944b90c3487edffbbcb815dd1eb6caab6"
            ],
            operation_results: [[2, {amount: 667955, asset_id: "1.3.121"}]]
        },
        {
            ref_block_num: 21457,
            ref_block_prefix: 1640357513,
            expiration: "2018-05-07T04:23:14",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.895924",
                        amount_to_sell: {amount: 69300000, asset_id: "1.3.0"},
                        min_to_receive: {amount: 2146281, asset_id: "1.3.121"},
                        expiration: "2018-05-14T04:22:43",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f73c5c302cfb434f816b9adbeab9e0e9abd28701efb5f20c2a3f78b6521045e8f494a689cefbeccf4de761dd8cde319988253fc1b635acdddc912dd68c23041f8"
            ],
            operation_results: [[1, "1.7.69769579"]]
        },
        {
            ref_block_num: 21456,
            ref_block_prefix: 293831337,
            expiration: "2018-05-07T04:23:12",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.110360",
                        order: "1.7.69767570",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "204dd7cbbb238c370232163f27a223ac6b7591737c9e1419f20263148dacd386dc0e961acb9bedea0522782c8b10163599f676ad442ee6f47c54e9717552437a11"
            ],
            operation_results: [[2, {amount: 143513895, asset_id: "1.3.0"}]]
        }
    ],
    id: 26760146
};

const getLatest1 = {
    previous: "0198539810a4c296481e7280fc41e7c8ab3a2f06",
    timestamp: "2018-05-07T04:19:54",
    witness: "1.6.75",
    transaction_merkle_root: "ba0691509ece4faed916993e8cdbf5e1bae492d9",
    extensions: [],
    witness_signature:
        "206224bbf7ffa27bbde0ee7659ecfaac7a9109de73fc0d1d590a1f9f2d2dd2c00945e761b47133c9e1fb65dbf687b82d7bf3dffbf672c05aecb7dda99c748cbdd9",
    transactions: [
        {
            ref_block_num: 21399,
            ref_block_prefix: 3172018939,
            expiration: "2018-05-07T04:20:09",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.905637",
                        order: "1.7.69414768",
                        extensions: []
                    }
                ],
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.905637",
                        order: "1.7.69413186",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f6da501034c5510616294230b67b3ea6b8a364c1d8f25805fdc117d8d6e6cb2fd210a3ee4450105e8d6b40f90a68565aa85d371e890cd72395cb60c772018ebe0"
            ],
            operation_results: [
                [2, {amount: 20000, asset_id: "1.3.113"}],
                [2, {amount: 10000, asset_id: "1.3.113"}]
            ]
        },
        {
            ref_block_num: 21399,
            ref_block_prefix: 3172018939,
            expiration: "2018-05-07T04:20:06",
            operations: [
                [
                    14,
                    {
                        fee: {amount: 10425, asset_id: "1.3.0"},
                        issuer: "1.2.374566",
                        asset_to_issue: {
                            amount: 2000000000,
                            asset_id: "1.3.3770"
                        },
                        issue_to_account: "1.2.676178",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "202c8a45ee71e7f81794f7ec6640ed9fa99ba48e2d2dd0e16031592d5e7dd17a0146907b2e50a46b1cba68027eea9640896400211084218e164ef2b10205be3b28"
            ],
            operation_results: [[0, {}]]
        },
        {
            ref_block_num: 21399,
            ref_block_prefix: 3172018939,
            expiration: "2018-05-07T04:20:06",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.433473",
                        amount_to_sell: {
                            amount: 134313744,
                            asset_id: "1.3.2635"
                        },
                        min_to_receive: {
                            amount: 134650370,
                            asset_id: "1.3.1999"
                        },
                        expiration: "2018-05-07T04:29:50",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f49da8bf71ada1a63dfd699a7b96a0958d5f4f32506ac42cdbf0d90dccc77119d1718167231f29c630260c2d864f0c7dd25f1b7c7d92755c6991b79fbebe699bf"
            ],
            operation_results: [[1, "1.7.69768863"]]
        },
        {
            ref_block_num: 21399,
            ref_block_prefix: 3172018939,
            expiration: "2018-05-07T04:20:06",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 57, asset_id: "1.3.1570"},
                        seller: "1.2.897561",
                        amount_to_sell: {amount: 60745, asset_id: "1.3.1570"},
                        min_to_receive: {
                            amount: 188708101,
                            asset_id: "1.3.3256"
                        },
                        expiration: "2023-05-07T04:19:47",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "201007ae08c1d2ac27bf659dbbc266ed3b7eec130a2887ab4ea39133c0ff96c3442bd4cde07e6e4c1aa6dd6e135a6e7c6be88ba220e0b52aee66bfd6709930e28c"
            ],
            operation_results: [[1, "1.7.69768864"]]
        },
        {
            ref_block_num: 21399,
            ref_block_prefix: 3172018939,
            expiration: "2018-05-07T04:20:22",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.833671",
                        amount_to_sell: {
                            amount: "20600548634",
                            asset_id: "1.3.3750"
                        },
                        min_to_receive: {amount: 1203070, asset_id: "1.3.1570"},
                        expiration: "2018-05-14T04:19:52",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "20762e965597d893ce760b99a25b8a8dfefef6d66d022310dce01af5751d7a810116782537ca00007dafdb1ffe8889bb48abfc9137c6c378551c7608b3639b9865"
            ],
            operation_results: [[1, "1.7.69768865"]]
        },
        {
            ref_block_num: 21398,
            ref_block_prefix: 2742826407,
            expiration: "2018-05-07T04:20:17",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.556579",
                        order: "1.7.69768687",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f118e29bf04ccdf1af4011ca433be165d3c9be8f0909d61bfa848189c2d78223f06143dd1113c05c93ed489e6535ad57b0155801f40b1d4c0e778d228bfe25f8b"
            ],
            operation_results: [[2, {amount: 275889, asset_id: "1.3.1570"}]]
        },
        {
            ref_block_num: 21399,
            ref_block_prefix: 3172018939,
            expiration: "2018-05-07T04:20:20",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.665475",
                        amount_to_sell: {amount: 90855202, asset_id: "1.3.0"},
                        min_to_receive: {
                            amount: 18376210,
                            asset_id: "1.3.1538"
                        },
                        expiration: "2018-05-12T04:19:50",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f0c5ccb0d44103ce0cc919eb0getf2a6705c4ed4eeb7abf0f9d68af13e698f65233a5e1193161b416cc7afde996b2058721c3d1b01ac385b280ae65dc429481b2c7e"
            ],
            operation_results: [[1, "1.7.69768866"]]
        },
        {
            ref_block_num: 21399,
            ref_block_prefix: 3172018939,
            expiration: "2018-05-07T04:20:23",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.833671",
                        amount_to_sell: {
                            amount: 760476000,
                            asset_id: "1.3.3773"
                        },
                        min_to_receive: {amount: 200689, asset_id: "1.3.1570"},
                        expiration: "2018-05-14T04:19:53",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f0e7d4dea57ebd5b1d50eeebc09f37a059aaf805f7de6c31b0e17990fbedfe49d24b65518bcb960e49ac42fc0acafb85407e8fc1c8b99b3e447ff77d43f41f563"
            ],
            operation_results: [[1, "1.7.69768867"]]
        },
        {
            ref_block_num: 21400,
            ref_block_prefix: 2529338384,
            expiration: "2018-05-07T04:20:09",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.625280",
                        amount_to_sell: {amount: 5693104, asset_id: "1.3.113"},
                        min_to_receive: {amount: 29725542, asset_id: "1.3.0"},
                        expiration: "2018-05-07T05:19:53",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "202b17eb6c692f0e7cbb281111c27c9f44f58ebfbda4e777b7bb370007572bd5540238343ec16598e8d10de1f35164a96cad383de03999aa3dedd008872d049986"
            ],
            operation_results: [[1, "1.7.69768868"]]
        },
        {
            ref_block_num: 21399,
            ref_block_prefix: 3172018939,
            expiration: "2018-05-07T04:20:17",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.602724",
                        order: "1.7.69768853",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f55f4cc90ccb78262dce88a31429f2132864f36a1a3fb08407235b30bb7a04b6e7463c6cc3841b048bf74131e760f88cc488255324b2fc7d9f2a406deabeb768f"
            ],
            operation_results: [[2, {amount: 640000, asset_id: "1.3.121"}]]
        },
        {
            ref_block_num: 21398,
            ref_block_prefix: 2742826407,
            expiration: "2018-05-07T04:20:01",
            operations: [
                [
                    14,
                    {
                        fee: {amount: 10425, asset_id: "1.3.0"},
                        issuer: "1.2.374566",
                        asset_to_issue: {amount: 134307, asset_id: "1.3.3422"},
                        issue_to_account: "1.2.749671",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "20185e29fa0361aa065a489ea9da51a9e5f8d56cf252d969515ea802654dcfc82e63ca092bc32bf7374bf63ddab117e3bd0065d8f9e44d11e6a6b8721c10939745"
            ],
            operation_results: [[0, {}]]
        },
        {
            ref_block_num: 21399,
            ref_block_prefix: 3172018939,
            expiration: "2018-05-07T04:20:22",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.862646",
                        order: "1.7.69768847",
                        extensions: []
                    }
                ],
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.862646",
                        amount_to_sell: {amount: 38980894, asset_id: "1.3.113"},
                        min_to_receive: {amount: 203534219, asset_id: "1.3.0"},
                        expiration: "2038-01-19T03:14:07",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2015cb02223256a5c52988cf3bacf99757ed53ba790da01e08464af3e590d4fe2e4b1810a0b96ded5faeb20f61c777f096599e0466b7bcf7dd9aa8bf04f84314bf"
            ],
            operation_results: [
                [2, {amount: 38980894, asset_id: "1.3.113"}],
                [1, "1.7.69768869"]
            ]
        },
        {
            ref_block_num: 21398,
            ref_block_prefix: 2742826407,
            expiration: "2018-05-07T04:20:15",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.895282",
                        amount_to_sell: {
                            amount: "4427423288",
                            asset_id: "1.3.3822"
                        },
                        min_to_receive: {amount: 1680643, asset_id: "1.3.1570"},
                        expiration: "2018-05-14T04:19:45",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2078f0a6f30685008697168c9da0243b486512813deee10a8a2eb580c0514458601ec9b10bab731ba129194a7a47decb736a6f7d6eb2d313bf5337811ffb2010be"
            ],
            operation_results: [[1, "1.7.69768870"]]
        },
        {
            ref_block_num: 21400,
            ref_block_prefix: 2529338384,
            expiration: "2018-05-07T04:20:23",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.833671",
                        amount_to_sell: {
                            amount: "3858816894",
                            asset_id: "1.3.3803"
                        },
                        min_to_receive: {amount: 3308935, asset_id: "1.3.1570"},
                        expiration: "2018-05-14T04:19:53",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f26a1f6a0b0a2f66e2350205c2713b314f923b0e378f32e9e4ebd2b18cfc7f13179a8bdd88494767c1a2c90a892639521f381d2d94348aa5f1b5e8c09d0bb7547"
            ],
            operation_results: [[1, "1.7.69768871"]]
        },
        {
            ref_block_num: 21400,
            ref_block_prefix: 2529338384,
            expiration: "2018-05-07T04:20:08",
            operations: [
                [
                    14,
                    {
                        fee: {amount: 10425, asset_id: "1.3.0"},
                        issuer: "1.2.374566",
                        asset_to_issue: {amount: 934197, asset_id: "1.3.3422"},
                        issue_to_account: "1.2.712883",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2024d4d2b8a0c656b27dab5d6e88e8366f2a2ae6dd5a938bf0cb34baff7490b99936b4aac69ac9e6a6fbf3274f08173c955c93ff0cf91cacadf734ac923161a47d"
            ],
            operation_results: [[0, {}]]
        },
        {
            ref_block_num: 21400,
            ref_block_prefix: 2529338384,
            expiration: "2018-05-07T04:20:21",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.893637",
                        order: "1.7.69768844",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "206fff398b469bc6a8eb2b7cd082722ac3466d8d6c21bbee8f814d09bcfeaf50041a05b556c517e7c73f8b2aac5cf4428c4a40085c9290ce5d743f05c6e924e7d0"
            ],
            operation_results: [[2, {amount: 490977, asset_id: "1.3.121"}]]
        },
        {
            ref_block_num: 21400,
            ref_block_prefix: 2529338384,
            expiration: "2018-05-07T04:20:07",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.620003",
                        amount_to_sell: {
                            amount: 478694746,
                            asset_id: "1.3.3871"
                        },
                        min_to_receive: {amount: 388269, asset_id: "1.3.1570"},
                        expiration: "2023-05-07T04:19:49",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2004fa4b26530a7f6702660a2eebbda7aa31e13e2e52301725397501b0ab7e7925543090a88d2b5320086916c40a12a85d59e056893a3eba930959869196be2db9"
            ],
            operation_results: [[1, "1.7.69768872"]]
        },
        {
            ref_block_num: 21400,
            ref_block_prefix: 2529338384,
            expiration: "2018-05-07T04:20:22",
            operations: [
                [
                    2,
                    {
                        fee: {amount: 57, asset_id: "1.3.0"},
                        fee_paying_account: "1.2.33015",
                        order: "1.7.69767351",
                        extensions: []
                    }
                ],
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.33015",
                        amount_to_sell: {amount: 50000000, asset_id: "1.3.113"},
                        min_to_receive: {amount: 263296330, asset_id: "1.3.0"},
                        expiration: "1963-11-29T12:38:45",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f16d7ea269fc30ef517eb8c3755143631434de893f243537d652e4d5f4f7c1e3e0be7c22a599251fde8e567247e32105b0e7f0842ceecce8a58038ae8f72d352e"
            ],
            operation_results: [
                [2, {amount: 50000000, asset_id: "1.3.113"}],
                [1, "1.7.69768873"]
            ]
        },
        {
            ref_block_num: 21400,
            ref_block_prefix: 2529338384,
            expiration: "2018-05-07T04:20:09",
            operations: [
                [
                    14,
                    {
                        fee: {amount: 10425, asset_id: "1.3.0"},
                        issuer: "1.2.374566",
                        asset_to_issue: {
                            amount: "6000000000",
                            asset_id: "1.3.3770"
                        },
                        issue_to_account: "1.2.735418",
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "2030b0325c1f391588c62f461143ce033d3db02a9ba9d2384737be284d0adb721e6786b4843b064535dff72da878cb889fb229bebeb90eb36602063c5c33f2e78e"
            ],
            operation_results: [[0, {}]]
        },
        {
            ref_block_num: 21400,
            ref_block_prefix: 2529338384,
            expiration: "2018-05-07T04:20:24",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.833671",
                        amount_to_sell: {
                            amount: "3744314200",
                            asset_id: "1.3.3805"
                        },
                        min_to_receive: {amount: 2607520, asset_id: "1.3.1570"},
                        expiration: "2018-05-14T04:19:54",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f15a5a05bc22201b0238cec296a9eb24229e3ed1e7b2f67e6ef36e2b7c2a13a1256c1cd70371cc7918f8f926ed7d1903a958cb4d721b09f780ae3da24fcacc927"
            ],
            operation_results: [[1, "1.7.69768874"]]
        },
        {
            ref_block_num: 21400,
            ref_block_prefix: 2529338384,
            expiration: "2018-05-07T04:20:19",
            operations: [
                [
                    1,
                    {
                        fee: {amount: 578, asset_id: "1.3.0"},
                        seller: "1.2.602724",
                        amount_to_sell: {amount: 672000, asset_id: "1.3.121"},
                        min_to_receive: {amount: 4262227, asset_id: "1.3.113"},
                        expiration: "2018-05-14T04:19:49",
                        fill_or_kill: false,
                        extensions: []
                    }
                ]
            ],
            extensions: [],
            signatures: [
                "1f0613dac42bc6afeb8162c60ec744e9b49ea5f839e4575659fb9768c1d7aacef20a5c09d3a973f128934d031230e41f99fe87b7fa33f165e985395434955f167f"
            ],
            operation_results: [[1, "1.7.69768875"]]
        }
    ],
    id: 26760089
};
