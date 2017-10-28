# Voting

> Voting is important in Bitshares in the same way it is important to the community in which you live. The weight of your vote is directly correlated to the number of BTS you own. If you aren't heavily involved in the community, you are encouraged to choose a proxy who represents your interests. If you would like to be more involved in the community, check out these [channels](/help/introduction/bitshares).

## Proxy

You may choose to **not** be active in the governance of Bitshares. If this is the case, it's important that you choose someone in the Bitshares community who you identify with and set that entity as your proxy. This gives them to the power to vote on your behalf with your BTS shares backing their vote. This is similar to electing a representative.

## Witnesses

Witnesses are entities that work for the blockchain by constructing new blocks. Their role is similar to the role of miners for Bitcoin and other blockchains. Each witness is approved by the shareholders and constructs and signs blocks from validated transactions. Every transaction made in the network is required to be validated by all witnesses.

### Consensus Mechanism

Who exactly is allowed to *produce* a block at which time instant is defined by a
consensus mechanism called *Delegated Proof of Stake*. In essence, you, the
shareholders of BitShares can cast a vote for your preferred block producers on the blockchain. Those *witnesses* with the most votes are allowed to produce blocks.


## Committee

The committee is a set of entities that are approved by the shareholders and set policy for the Bitshares blockchain including:

* Transaction and trading fees
* Blockchain parameters, such as block size, block interval
* Referral and vesting parameters such as cash back percentage and vesting periods

## Workers

Workers are proposals to perform a service in return for a salary from the blockchain. A worker proposal contains at a minimum the following information:

* A start and end date
* A daily pay
* A maximum total pay
* A link to a webpage where the worker proposal is explained

### Worker Lifecycle

#### Proposed
These worker proposals have been submitted to the blockchain and are being actively voted on. In order to become active, they must exceed the refund400k worker in total votes.
#### Active
These worker proposals have exceeded the threshold and are being actively paid. Active workers can be defunded if their vote threshold is reduced below the refund400k worker level.
#### Expired
These worker proposals are displayed for historical purposes. You will find propsals that have ended based upon their end date.

### Worker budget mechanics
Workers receive pay from a fixed daily budget on a first-come, first-serve basis until there are no more funds left.

* A daily total budget of 400k BTS for all workers
* 5 worker proposals with a positive votes total, with daily pay requests of 100k BTS each

Now the four workers with the most votes will all receive 100k BTS each per day, but once they've been paid the worker budget is empty. Therefore the fifth worker will receive nothing.

