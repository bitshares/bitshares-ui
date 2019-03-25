function mapExchange({ depositExchange, withdrawalExchange }) {
    return {
        backingCoinType: depositExchange.source.asset,
        deposit: {
            healthy: depositExchange.options.healthy &&
            depositExchange.options.status,
            maintenanceReason: depositExchange.options.maintenance_reason,
            amount: depositExchange.amount.destination,
            memo: depositExchange.memo.destination,
            exchangeId: depositExchange.id
        },
        gateFee: withdrawalExchange.fee.source.value,
        isAvailable: depositExchange.options.show.openledger_dex_gateway,
        maintenanceReason: depositExchange.options.comment,
        name: withdrawalExchange.source.asset,
        supportsMemos: withdrawalExchange.memo.source.enabled,
        symbol: withdrawalExchange.source.asset,
        walletType: depositExchange.source.asset,
        withdrawal: {
            healthy: withdrawalExchange.options.healthy &&
            withdrawalExchange.options.status,
            maintenanceReason: withdrawalExchange.options.maintenance_reason,
            limits: withdrawalExchange.limit.source,
            amount: withdrawalExchange.amount.destination,
            memo: withdrawalExchange.memo.destination,
            exchangeId: withdrawalExchange.id
        },
        isNewApi: true,
        withdrawalAllowed: withdrawalExchange.options.healthy,
        depositAllowed: depositExchange.options.healthy
    };
}

export function parseExchanges(exchanges) {
    return exchanges
        .filter(exchange => exchange.source.blockchain === "bitshares")
        .map(exchange => {
            const res = {};
            res.withdrawalExchange = exchange;
            res.depositExchange = exchanges.find(
                e => e.destination.asset === exchange.source.asset
            );
            return res;
        })
        .map(mapExchange);
}