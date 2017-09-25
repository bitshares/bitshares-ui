Please work off the staging branch and make pull requests to that branch. The master branch will only be updated for new releases.

The Bitshares UI team is supported by this [worker proposal](http://www.bitshares.foundation/workers/2017-08-bill-butler). It provides the funds needed to pay the coordinator and the bounties and the Bitshares Foundation.

If you would like to get involved, we have a [Telegram chatroom](https://t.me/BitSharesDEX) where you can ask questions and get help. You may also join [BitShares on Discord](https://discord.gg/GsjQfAJ)

- Coordinator: Bill Butler, @billbutler
- Lead Developer: Sigve Kvalsvik, @sigvek
- Developer: Calvin Froedge, @calvin
- Code Review: Fabian Schuh, @xeroc

## 贡献

Bitshares UI团队被这一[工作提案](https://steemit.com/bitshares/@billbutler/translated-by-zhaomu-l)支持。它提供用来支付协调者，悬赏金和比特股基金的资金。

如果你想参与贡献，我们有一个[Telegram 聊天室](https://t.me/BitSharesDEX)，在这里你可以问问题并得到帮助。

- 协调者: Bill Butler, @billbutler
- 主程序员: Sigve Kvalsvik, @sigvek
- 程序员: Calvin Froedge, @calvin
- 代码审核: Fabian Schuh, @xeroc

## Development process

- Milestones are numbered YYMMDD and refer to the **anticipated release date**.
- Bugs are always worked before enhancements
- Developers should work each issue according to a numbered branch corresponding to the issue `git checkout -b 123`
- We pay **bounties** for issues that have been estimated. An estimated issue is prefixed with a number in brackets like this: `[2] An nasty bug`. In this example, the bug is valued at two hours ($125 per hour). If you fix this issue according to these guidelines and your PR is accepted, this will earn you $250 bitUSD. You must have a Bitshares wallet and a Bitshares account to receive payment.
- If an issue is already claimed (assigned), do not attempt to claim it. Issues claimed by outside developers will indicate an assignment to wmbutler, but will mention the developer's github account in this the comments.
- To claim an issue, simply leave a comment with your request to claim.
- Do not claim an issue if you will be unable to complete it by the date indicated on the Milestone name. Milestone 170901 will be pushed on September 1, 2017.

## 开发流程

- 开发目标上标记的日期，是预计发表时间
- 修补漏洞优先于项目改进
- 开发者需要根据一个被标好数字（这个数字对应一个问题`git checkout -b 123`）的分叉（branch），对每个问题进行开发。
- 我们对已经被预算好的问题进行**悬赏**。一个被预算好的问题会被标记上前缀，像这样`[2] An nasty bug`。在这一例子中，这个问题被视作价值两个小时的工作时间（125美刀一小时）。如果你能通过这些指南修改这一问题，并且你的修改要求（Pull Request）被接受，你便会得到250 bitUSD。你必须拥有一个比特股钱包和比特股账号用来接收这一支付。
- 如果问题已经被认领（指派），不要尝试认领它。外部开发者认领问题意味着 wmbutler的指派，但是我会在评论里提及这一开发者的github账户。
- 简单地留下一条你要求认领的评论（comment），便能认领问题。
- 不要认领一个在开发目标上所写规定时间内完成不了的问题。列如 开发目标170901 需要在2017年9月1日前被推进完成.

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
