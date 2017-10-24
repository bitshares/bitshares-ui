# Workers

Workers are proposals to perform a service in return for a salary from the blockchain. A worker proposal contains at a minimum the following information:

* A start and end date
* A daily pay
* A maximum total pay
* A link to a webpage where the worker proposal is explained

## Worker Lifecycle

### Proposed
These worker proposals have been submitted to the blockchain and are being actively voted on. In order to become active, they must exceed the refund400k worker in total votes.
### Active
These worker proposals have exceeded the threshold and are being actively paid. Active workers can be defunded if their vote threshold is reduced below the refund400k worker level.
### Expired
These worker proposals are displayed for historical purposes. You will find propsals that have ended based upon their end date.

## Worker budget mechanics
Workers receive pay from a fixed daily budget on a first-come, first-serve basis until there are no more funds left.

* A daily total budget of 400k BTS for all workers
* 5 worker proposals with a positive votes total, with daily pay requests of 100k BTS each

Now the four workers with the most votes will all receive 100k BTS each per day, but once they've been paid the worker budget is empty. Therefore the fifth worker will receive nothing.

