import {saveAs} from "file-saver";
import {ChainTypes as grapheneChainTypes, FetchChain} from "tuscjs";
import report from "tusc-report";
const {operations} = grapheneChainTypes;
const ops = Object.keys(operations);

const FULL = "FULL";
const COINBASE = "COINBASE";

export {FULL, COINBASE};

class AccountHistoryExporter {
    pad(number, length) {
        let str = "" + number;
        while (str.length < length) {
            str = "0" + str;
        }
        return str;
    }

    formatDate(d) {
        return (
            ("0" + d.getDate()).slice(-2) +
            "." +
            ("0" + (d.getMonth() + 1)).slice(-2) +
            "." +
            d.getFullYear() +
            " " +
            ("0" + d.getHours()).slice(-2) +
            ":" +
            ("0" + d.getMinutes()).slice(-2) +
            ":" +
            ("0" + d.getSeconds()).slice(-2) +
            " GMT" +
            ((d.getTimezoneOffset() < 0 ? "+" : "-") + // Note the reversed sign!
                this.pad(
                    parseInt(Math.floor(Math.abs(d.getTimezoneOffset() / 60))),
                    2
                ) +
                this.pad(Math.abs(d.getTimezoneOffset() % 60), 2))
        );
    }

    async generateCSV(accountsList, esNode, exportType) {
        let start = 0,
            limit = 150;
        let account = accountsList[0].get("id");
        let accountName = (await FetchChain("getAccount", account)).get("name");
        let recordData = {};

        while (true) {
            let res = await this._getAccountHistoryES(
                account,
                limit,
                start,
                esNode
            );
            if (!res.length) break;

            await report.resolveBlockTimes(res);

            /* Before parsing results we need to know the asset info (precision) */
            await report.resolveAssets(res);

            res.map(function(record) {
                const trx_id = record.id;
                // let timestamp = api.getBlock(record.block_num);
                const type = ops[record.op.type];
                const data = record.op.data;

                switch (type) {
                    case "vesting_balance_withdraw":
                        data.amount = data.amount_;
                        break;

                    case "transfer":
                        data.amount = data.amount_;
                        break;
                }
                switch (type) {
                    default:
                        recordData[trx_id] = {
                            timestamp: new Date(record.block_time),
                            type,
                            data
                        };
                }
            });
            start += res.length;
        }
        if (!Object.keys(recordData).length) {
            return;
        }

        let parsedData;
        if (exportType === FULL) {
            parsedData = [];
            for (let i in recordData) {
                parsedData.push([i, recordData[i]]);
            }
        } else {
            recordData = report.groupEntries(recordData);
            parsedData = report.parseData(recordData, account, accountName);
        }

        let blob = this.dataToCSV(parsedData, exportType);

        let today = new Date();
        saveAs(
            blob,
            "bitshares-account-history-" +
                accountName +
                "-" +
                today.getFullYear() +
                "-" +
                ("0" + (today.getMonth() + 1)).slice(-2) +
                "-" +
                ("0" + today.getDate()).slice(-2) +
                "-" +
                ("0" + today.getHours()).slice(-2) +
                ("0" + today.getMinutes()).slice(-2) +
                ".csv"
        );
    }

    _getAccountHistoryES(account_id, limit, start, esNode) {
        console.log(
            "query",
            esNode +
                "/get_account_history?account_id=" +
                account_id +
                "&from_=" +
                start +
                "&size=" +
                limit +
                "&sort_by=block_data.block_time&type=data&agg_field=operation_type"
        );
        return new Promise((resolve, reject) => {
            fetch(
                esNode +
                    "/get_account_history?account_id=" +
                    account_id +
                    "&from_=" +
                    start +
                    "&size=" +
                    limit +
                    "&sort_by=block_data.block_time&type=data&agg_field=operation_type"
            )
                .then(res => res.json())
                .then(result => {
                    let opHistory = result.map(r => {
                        return {
                            id: r.account_history.operation_id,
                            op: {
                                type: r.operation_type,
                                data: r.operation_history.op_object
                            },
                            result: JSON.parse(
                                r.operation_history.operation_result
                            ),
                            block_num: r.block_data.block_num,
                            block_time: r.block_data.block_time + "Z"
                        };
                    });

                    resolve(opHistory);
                })
                .catch(err => {
                    reject(err);
                });
        });
    }

    dataToCSV(data, exportType) {
        let csvString = "";
        for (let line of data) {
            if (exportType === COINBASE) {
                if (line.length >= 11 && line[10] instanceof Date) {
                    line[10] = this.formatDate(line[10]);
                }
                csvString += line.join(",") + "\n";
            } else {
                csvString += JSON.stringify(line) + "\n";
            }
        }
        return new Blob([csvString], {type: "text/csv;charset=utf-8"});
    }
}

export default AccountHistoryExporter;
