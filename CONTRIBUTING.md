Please work off the develop branch and make pull requests to that branch. The master branch will only be updated for new releases.

The Bitshares UI team is supported by this [worker proposal](https://www.bitshares.foundation/workers/2019-02-bitshares-ui). It provides the funds needed to pay for the development team.

If you would like to get involved, we have a [Telegram chatroom](https://t.me/BitSharesDEX) where you can ask questions and get help. You may also join [BitShares on Discord](https://discord.gg/GsjQfAJ)

## Development process

- New issues will, after enough discussion and clarification, be assigned an estimate **Quality Hours** development time, as well as assigned to the next milestone, by a project coordinator.
- Milestones are numbered YYMMDD.
- Bugs are always worked before enhancements
- Developers should work each issue according to a numbered branch corresponding to the issue `git checkout -b 123`
- We pay **bounties** for issues that have been estimated. An estimated issue is prefixed with a number in brackets like this: `[2] An nasty bug`. In this example, the bug is valued at two **Quality Hours** ($125 per hour). If you fix this issue according to these guidelines and your PR is accepted, this will earn you $250 bitUSD. You must have a Bitshares wallet and a Bitshares account to receive payment.

**IMPORTANT NOTES FOR NEW DEVELOPERS**
- To claim an issue, simply leave a comment with your request to work on it.
- Bounty payment is **Quality Hours**, meaning an experienced developer could complete the task within the assigned hours. Inexperienced users may need more time, but still receives the same pay.
- To make sure no underpayment for development is made, it is important that if an issue would require more **Quality Hours** time, it should be stated clearly in the issue together with a reason and a new estimate.
- If an issue is already claimed (assigned), do not attempt to claim it. Issues claimed by outside developers will have no assigned dev, but have the developers name in brackets.
- Do not claim an issue if you will be unable to complete it by the date indicated on the Milestone name. If extra time is expected, clarify why in the claim.
- If an issue missed the intended milestone completion, be sure to make a comment on your progress including the reason for the delay. The issue is pushed to the next milestone. Failing to comment or complete the issue once more will result in release of the assigned issue and could result in no bounty pay.
- It's the developers responsibility to read comments on submitted PR to make sure merging is possible and issue is closed, failure to do so may result in no bounty pay.

## Coding style guideline

Our style guideline is based on 'Airbnb JavaScript Style Guide' (https://github.com/airbnb/javascript), with few exceptions:

- Strings are double quoted
- Additional trailing comma (in arrays and objects declaration) is optional
- 4 spaces tabs
- Spaces inside curly braces are optional

We strongly encourage to use _eslint_ to make sure the code adhere to our style guidelines.

## 代码风格
我们的代码指南基于[Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript),不过有一些例外：

 - 字符串需要被双引
 - 额外的尾随逗号（在定义数组和对象时）是随意的
 - 四个空格的缩进
 - 在花括号里的空格是随意的

我们强烈鼓励用  _eslint_ 确保代码依附于我们的代码风格指南
