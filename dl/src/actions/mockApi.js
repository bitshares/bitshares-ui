// Fire rpc call to unlock (this will be a rpc lib call)
let accounts = {
  bytemaster: {
    id: 1,
    name: "bytemaster",
    isMyAccount: true,
    primeMember: true,
    realName: "Dan Larimer",
    org: ["Bitshares", "Graphene", "FollowMyVote", "Peertracks"],
    blackList: ["Ethereum", "Counterparty"],
    registration: {
      date: new Date(1431682554238),
      referrer: "Invictus",
      registrar: "Invictus"
    },
    referals: {
      members: 10,
      users: 30
    },
    rewards: {
      cashback: 5123,
      vested: 4300
    },
    balances: [{
      id: 0,
      asset: "BTS",
      amount: 11210
    }, {
      id: 22,
      asset: "USD",
      amount: 112
    }, {
      id: 17,
      asset: "CNY",
      amount: 9889494
    }]
  },
  Account_B: {
    id: 2,
    name: "Account_B",
    isMyAccount: true,
    primeMember: false,
    balances: [{
      id: 0,
      asset: "BTS",
      amount: 0
    }]
  },
  nakamoto: {
    id: 3,
    name: "nakamoto",
    isMyAccount: false,
    primeMember: false,
    org: ["Bitcoin"],
    balances: [{
      id: 0,
      asset: "BTS",
      amount: 0
    }, {
      id: 14,
      asset: "BTC",
      amount: 1000000
    }]
  },
  Invictus: {
    id: 5,
    name: "Invictus",
    isMyAccount: false,
    primeMember: true,
    org: ["Bitshares"],
    registration: {
      date: new Date(1430482554238),
      referrer: "",
      registrar: "Invictus"
    },
    referals: {
      members: 354,
      users: 35
    },
    rewards: {
      cashback: 46547,
      vested: 15400
    },
    balances: [{
      id: 0,
      asset: "BTS",
      amount: 24644750
    }]
  }
};

let blockExample = {
  "previous": "000000a2f22ba89f7f20b48967c5c59dfd69d242",
  "timestamp": "2015-04-28T15:35:45",
  "witness": "1.7.5",
  "next_secret_hash": "752a5f6e39e2b9b62391c042b7f8f237b1c99a9f982ece955af9d120",
  "previous_secret": "0a62ac0c6ed80c1ec78f25f575803dd6e4d5e865d1e23191934197f2",
  "transactions": [{
      "ref_block_num": 0,
      "ref_block_prefix": 0,
      "expiration": Math.round(Date.now()/1000) + 10*60,
      "operations": [[
          6,{
            "fee_paying_account": "1.2.15",
            "fee": {
              "amount": 0,
              "asset_id": "1.3.0"
            },
            "key_data": [
              1,
              "BTS6KZmQMPKz2ztNFAqye4Hcmh5iN8kj2qXsw56sCHifmTRAeGqrJ"
            ]
          }
        ],[
          6,{
            "fee_paying_account": "1.2.15",
            "fee": {
              "amount": 0,
              "asset_id": "1.3.0"
            },
            "key_data": [
              1,
              "BTS7QYTULyoaLDo5Gc9yn4nFAEUECjpewevfBpdSwCxbUYbUJ5ynY"
            ]
          }
        ],[
          7,{
            "registrar": "1.2.15",
            "fee": {
              "amount": 0,
              "asset_id": "1.3.0"
            },
            "referrer": "1.2.0",
            "referrer_percent": 100,
            "name": "slave",
            "owner": {
              "weight_threshold": 1,
              "auths": [[
                  "0.2.0",
                  1
                ]
              ]
            },
            "active": {
              "weight_threshold": 1,
              "auths": [[
                  "0.2.1",
                  1
                ]
              ]
            },
            "voting_account": "1.2.0",
            "memo_key": "0.2.1",
            "num_witness": 101,
            "num_committee": 11,
            "vote": []
          }
        ]
      ],
      "signatures": [
        "204e401553fca4479ef638af83aa3b9a31c6892445d9d8715fc79717ed06a8a84b5f41ad53a0b36c539095d68f21e46250f1512d515d8941d6cf01a0f821ba1e72"
      ],
      "operation_results": [[
          0,
          "1.2.4"
        ],[
          0,
          "1.2.5"
        ],[
          0,
          "1.2.13"
        ]
      ]
    }
  ],
  "delegate_signature": "2019d8cd00455afd029e1c65e578a84472178330a92265659271cd104626179eef3f0b2897c6fc228c26e8d8bce78eed922ef9d61cbc48a35c5b3c5c9a7d5ca5d8"
}

module.exports = {
  getMock: function() {
    return new Promise((resolve) => {
      // simulate an asynchronous action where data is fetched on
      // a remote server somewhere.
      setTimeout(() => {
        // resolve with some mock data
        resolve(true);
      }, 500);
    });
  },

  getMockBlock: function(height) {
    return new Promise((resolve) => {
      // simulate an asynchronous action where data is fetched on
      // a remote server somewhere.
      setTimeout(() => {
        // resolve with some mock data
        resolve(blockExample);
      }, 100);
    });
  },

  getMockAccount: function(name) {
    return new Promise((resolve) => {
      // simulate an asynchronous action where data is fetched on
      // a remote server somewhere.
      setTimeout(() => {
        // resolve with some mock data
        resolve(accounts[name]);
      }, 100);
    });
  },

  getMockAccounts: function() {
    return new Promise((resolve) => {
      // simulate an asynchronous action where data is fetched on
      // a remote server somewhere.
      setTimeout(() => {
        // resolve with some mock data
        resolve([accounts["bytemaster"], accounts["Account_B"]]);
      }, 500);
    });
  }
};
