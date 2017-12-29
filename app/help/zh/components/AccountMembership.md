[# lifetime]
### 可获得 {feesCashback}% 手续费返现奖励

终身会员可获得自己支付的每笔交易手续费的{feesCashback}%的现金返现，并自动作为推荐人加入引荐计划，通过引荐用户注册获得推荐奖励。升级到终身会员只需要花费 {price}。

[# annual]

如果你暂时不想成为终身会员，那么你还可以选择升级到年度会员，可获得 {feesCashback}% 的手续费返现。升级为年度会员，每年只需花费 {price}。

[# fee-division]
#### 手续费分配
每次 {account} 支付交易手续费时，该手续费将分配给多个不同账户。网络将收取 {networkFee}%，引荐 {account} 的推荐人账户将获得 {lifetimeFee}%。

_注册人账户_ 是在 {account} 注册时代其支付注册费的账户。注册人账户可自行决定剩余的 {referrerTotalFee}% 手续费如何在它自己及它的 _合作推荐人_ 之间分配。

{account}的注册人账户决定与它的_合作推荐人_分享{referrerFee}%手续费，自己保留{registrarFee}%。
                            
                            
#### 待结费用
{account} 支付的手续费每个维护周期 ({maintenanceInterval} 秒)在网络、推荐人和注册人之间结算一次。下一个维护时间在 {nextMaintenanceTime}。
                 
#### 待解冻金额

大部分获取手续费的利益账户可立即使用资金，但金额超过{vestingThreshold}的费用(比如支付升级终身会员的手续费、注册高级账户名的手续费等)则需要暂时冻结，并在{vestingPeriod}天内线性解冻释放。