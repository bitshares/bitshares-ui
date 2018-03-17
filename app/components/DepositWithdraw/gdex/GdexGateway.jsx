import React from "react";
import {fetchAssets, fetchUserInfo} from "common/gdexMethods";
import LoadingIndicator from "../../LoadingIndicator";
import Translate from "react-translate-component";
import GdexGatewayInfo from "./GdexGatewayInfo";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import SettingsActions from "actions/SettingsActions";
import GdexCache from "../../../lib/common/GdexCache";
import GdexHistory from "./GdexHistory";
import GdexAgreementModal from "./GdexAgreementModal";
import BaseModal from "../../Modal/BaseModal";
import ZfApi from "react-foundation-apps/src/utils/foundation-api";
import {
    fetchWithdrawRule,
    userAgreement
} from "../../../lib/common/gdexMethods";
var NodeRSA = require("node-rsa");
let gdexPublicKey = new NodeRSA(
    "-----BEGIN PUBLIC KEY-----\n" +
        "MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCH+QtHPKcWxdL25xL4pCuu16tKh6yPx/TFnd/8\n" +
        "cSt2TC+sPuYsD0h/sy4VKNxhBb7F7U/TLXjMxNcSfPVPjPM3X2LvOlmU9LOEcJGrmlmOOiyO/kws\n" +
        "yKKOhR4UyZ1NghhfHjuyDBj6V8fCL+xBZTJWsh/X61Z0wLCwOzXcQCsNJwIDAQAB\n" +
        "-----END PUBLIC KEY-----"
);

class GdexGateway extends React.Component {
    constructor(props) {
        super();
        const action = props.viewSettings.get(
            `${props.provider}Action`,
            "deposit"
        );

        this.state = {
            coins: null,
            activeCoinInfo: this._getActiveCoinInfo(props, {action}),
            action,
            down: false,
            isAvailable: true,
            user_info: null,
            isAgree: false,
            agreeChecked: true,
            agreeNotice: false,
            locale: props.viewSettings.get("locale"),
            intermediate: null,
            memo_rule: null
        };
        this.user_info_cache = new GdexCache();
    }

    _getActiveCoinInfo(props, state) {
        let cachedCoinName = props.viewSettings.get(
            `activeCoin_${props.provider}_${state.action}`,
            null
        );
        let cachedCoinId = props.viewSettings.get(
            `activeCoinId_${props.provider}`,
            null
        );
        let firstTimeCoinName = null;
        if (state.action == "deposit") {
            firstTimeCoinName = "BTC";
        } else {
            firstTimeCoinName = "GDEX.BTC";
        }
        let firstTimeCoinId = 1002;
        let activeCoinName = cachedCoinName
            ? cachedCoinName
            : firstTimeCoinName;
        let activeCoinId = cachedCoinId ? cachedCoinId : firstTimeCoinId;
        this._getWithdrawRule(activeCoinId);
        return {name: activeCoinName, id: activeCoinId};
    }

    _transformCoin(data) {
        var result = [];
        try {
            data
                .filter(asset => {
                    return asset.status != 0;
                })
                .forEach(asset => {
                    let coin = {};
                    if (asset.type == 1) {
                        // inner asset
                        coin.innerAssetId = asset.assetId;
                        coin.innerAssetName = asset.assetName;
                        coin.innerSymbol = asset.assetSymbol;
                        coin.outerAssetId = asset.relationId;
                        coin.outerAssetName = asset.relationSymbol;
                        coin.outerSymbol = asset.relationSymbol;
                        coin.status = asset.withdrawStatus;
                        coin.gateFee = asset.withdrawFees;
                        coin.needMemo = asset.needMemo;
                        coin.minTransactionAmount = asset.minWithdrawAmount;
                        coin.type = asset.type;
                        coin.relationPrecision = asset.relationPrecision;
                    } else if (asset.type == 2) {
                        // outer asset
                        coin.innerAssetId = asset.relationId;
                        coin.innerAssetName = asset.relationSymbol;
                        coin.innerSymbol = asset.relationSymbol;
                        coin.outerAssetId = asset.assetId;
                        coin.outerAssetName = asset.assetName;
                        coin.outerSymbol = asset.assetSymbol;
                        coin.status = asset.depositStatus;
                        coin.gateFee = asset.depositFees;
                        coin.needMemo = asset.needMemo;
                        coin.minTransactionAmount = asset.minDepositAmount;
                        coin.type = asset.type;
                        coin.relationPrecision = asset.relationPrecision;
                    } else {
                        coin = null;
                    }
                    if (coin) result.push(coin);
                });
        } catch (err) {
            console.log("Transform coin failed: ", err);
        }
        return result;
    }

    _getUserInfo(userName = null, isAgree = null) {
        if (!userName) userName = this.props.account.get("name");
        if (!isAgree) isAgree = this.state.isAgree;
        //User must agree to the agreement
        if (!isAgree) return;

        var result = fetchUserInfo({userAccount: userName, isAgree: isAgree});
        let _this = this;
        result.then(function(res) {
            var user = res.user;
            _this.setState({
                isAgree: true,
                user_info: {user_id: user.uid, status: user.status}
            });
            if (user.status == 0 && user.agreeAgreement) {
                _this.user_info_cache.cacheUserInfo(
                    userName,
                    user.uid,
                    user.status
                );
            } else {
                _this.user_info_cache.delUserInfo(userName);
            }
        });
        result.catch(err => {
            console.log("Exception in fetching user info: " + err);
        });
    }

    _getCoins() {
        var result = fetchAssets({userAccount: this.props.account.get("name")});

        let _this = this;
        result.then(
            function(data) {
                let trans_data = _this._transformCoin(data.assets);
                _this.setState({isAvailable: true, coins: trans_data});
            },
            function(errMsg) {
                console.log("fail" + errMsg);
            }
        );
        result.catch(err => {
            console.log(err);
            _this.setState({isAvailable: false});
        });
    }

    _checkIsAgree(userName = null) {
        if (!userName) userName = this.props.account.get("name");
        var user_info = this.user_info_cache.getUserInfo(userName);
        if (user_info) {
            this.setState({user_info: user_info, isAgree: true});
            return;
        }
        var result = userAgreement({userAccount: userName});
        let _this = this;
        result.then(
            function(data) {
                if (data.agree) {
                    _this.setState({isAgree: true});
                    _this._getUserInfo(userName, true);
                } else {
                    _this.setState({isAgree: false});
                }
            },
            function(errMsg) {
                console.log("fail" + errMsg);
            }
        );
        result.catch(err => {
            console.log(err);
            _this.setState({isAvailable: false});
        });
    }

    componentWillMount() {
        this._checkIsAgree();
        this._getCoins();
    }

    _getWithdrawAssetId(assetName) {
        let assetType = 1;
        let assetSymbol = "innerSymbol";
        if (this.state.action == "deposit") {
            assetType = 2;
            assetSymbol = "outerSymbol";
        }
        let assetId = this.state.coins.filter(coin => {
            return coin.type == assetType && coin[assetSymbol] == assetName;
        })[0].innerAssetId;
        return assetId;
    }

    onSelectCoin(e) {
        let activeCoinInfo = this.state.activeCoinInfo;
        activeCoinInfo.name = e.target.value;
        let assetId = this._getWithdrawAssetId(e.target.value);
        activeCoinInfo.id = assetId;
        this.setState({
            activeCoinInfo: activeCoinInfo
        });
        this._getWithdrawRule(assetId);
        let setting = {};
        setting[`activeCoin_${this.props.provider}_${this.state.action}`] =
            e.target.value;
        setting[`activeCoinId_${this.props.provider}`] = assetId;
        SettingsActions.changeViewSetting(setting);
    }

    _getWithdrawRule(assetId) {
        var result = fetchWithdrawRule({assetId: assetId});
        let _this = this;
        result.then(
            function(data) {
                var intermediate = gdexPublicKey.decryptPublic(
                    data.transferToAccount,
                    "utf-8"
                );
                _this.setState({
                    intermediate: intermediate,
                    memo_rule: data.memoRule
                });
            },
            function(errMsg) {
                console.log("fail" + errMsg);
                _this.setState({intermediate: null});
            }
        );
        result.catch(err => {
            console.log(err);
            _this.setState({intermediate: null});
        });
    }
    changeAction(type) {
        let activeCoinInfo = this._getActiveCoinInfo(this.props, {
            action: type
        });
        this.setState({
            action: type,
            activeCoinInfo: activeCoinInfo
        });
        SettingsActions.changeViewSetting({
            [`${this.props.provider}Action`]: type
        });
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.account != nextProps.account) {
            this._checkIsAgree(nextProps.account.get("name"));
        }
    }

    _updateCheck() {
        this.setState({agreeChecked: !this.state.agreeChecked});
        this.setState({agreeNotice: false});
    }

    _showUserAgreement() {
        ZfApi.publish("gdex_agreement", "open");
    }

    _registerUser() {
        if (this.state.agreeChecked) {
            this._getUserInfo(null, true);
        } else {
            this.setState({agreeNotice: true});
        }
    }
    render() {
        let {account} = this.props;
        let {
            coins,
            activeCoinInfo,
            action,
            isAvailable,
            user_info,
            isAgree,
            agreeChecked,
            agreeNotice,
            intermediate,
            memo_rule
        } = this.state;
        let issuer = {
            ticket: "https://support.gdex.io/",
            qq: "602573197",
            telgram: "https://t.me/GDEXer"
        };
        let supportContent = (
            <div>
                {/*<label className="left-label">Support</label>*/}
                <br />
                <br />
                <Translate content="gateway.support_gdex" />
                <br />
                <br />
                <p>
                    Help:{" "}
                    <a
                        href={issuer.ticket}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {issuer.ticket}
                    </a>
                </p>
                <p>
                    QQ:{" "}
                    <a
                        target="_blank"
                        href="//shang.qq.com/wpa/qunwpa?idkey=5d192c325146762cf5a9256038fed9faef4fcace21a36882854354dd1d599f11"
                        rel="noopener noreferrer"
                    >
                        {issuer.qq}
                    </a>
                </p>
                <p>
                    Telegram:{" "}
                    <a
                        href={issuer.telgram}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {issuer.telgram}
                    </a>
                </p>
            </div>
        );
        if (!isAgree) {
            return (
                <div>
                    <span>
                        <input
                            type="checkbox"
                            style={{marginRight: "10px"}}
                            checked={agreeChecked}
                            onChange={this._updateCheck.bind(this)}
                        />
                        <Translate
                            className="txtlabel"
                            content="gateway.agreement.hint"
                        />
                        <a onClick={this._showUserAgreement.bind(this)}>
                            {" "}
                            <Translate
                                className="txtlabel"
                                content="gateway.agreement.name"
                            />
                        </a>
                    </span>
                    {agreeNotice ? (
                        <div className="has-error" style={{paddingTop: 10}}>
                            <Translate
                                className="txtlabel"
                                content="gateway.agreement.notice"
                            />
                        </div>
                    ) : null}

                    <div className="buttonGroup">
                        <span
                            style={{marginTop: "20px"}}
                            onClick={this._registerUser.bind(this)}
                            className=" button"
                        >
                            <Translate
                                className="txtlabel"
                                content="gateway.agreement.register"
                            />
                        </span>
                    </div>
                    <BaseModal id={"gdex_agreement"} overlay={true}>
                        <br />
                        <div className="grid-block vertical">
                            <GdexAgreementModal
                                locale={this.props.settings.get("locale", "en")}
                            />
                        </div>
                    </BaseModal>
                    {supportContent}
                </div>
            );
        }
        if (!coins && isAvailable) {
            return <LoadingIndicator />;
        }
        if (!isAvailable) {
            return (
                <div>
                    <Translate
                        className="txtlabel cancel"
                        content="gateway.unavailable"
                        component="h4"
                    />
                </div>
            );
        }

        var assetSymbol = null;
        var assetId = null;
        var actionType = null;
        if (action == "deposit") {
            assetId = "outerAssetId";
            assetSymbol = "outerSymbol";
            actionType = 2;
        } else {
            assetId = "innerAssetId";
            assetSymbol = "innerSymbol";
            actionType = 1;
        }
        coins = coins.filter(coin => {
            return coin.type == actionType;
        });
        let coinOptions = coins
            .map(coin => {
                return (
                    <option value={coin[assetSymbol]} key={coin[assetSymbol]}>
                        {coin[assetSymbol]}
                    </option>
                );
            })
            .filter(a => {
                return a !== null;
            });

        let coin = coins.filter(coin => {
            return coin[assetSymbol] == activeCoinInfo.name;
        })[0];

        let infos = null;
        if (!coin || coin.status != 0) {
            infos = (
                <label className="left-label">
                    <Translate
                        className="txtlabel cancel"
                        content="gateway.asset_unavailable"
                        asset={activeCoinInfo.name}
                        component="h4"
                    />
                </label>
            );
        } else if (!user_info) {
            infos = (
                <label className="left-label">
                    <Translate
                        className="txtlabel cancel"
                        content="gateway.user_unavailable"
                        component="h4"
                    />
                </label>
            );
        } else if (user_info.status != 0) {
            infos = (
                <label className="left-label">
                    <Translate
                        className="txtlabel cancel"
                        content="gateway.frozen"
                        account={account.get("name")}
                        component="h4"
                    />
                </label>
            );
        }

        return (
            <div style={this.props.style}>
                <div className="grid-block no-margin vertical medium-horizontal no-padding">
                    <div className="medium-4">
                        <div>
                            <label
                                style={{minHeight: "2rem"}}
                                className="left-label"
                            >
                                <Translate
                                    content={"gateway.choose_" + action}
                                />:{" "}
                            </label>
                            <select
                                className="external-coin-types bts-select"
                                onChange={this.onSelectCoin.bind(this)}
                                value={activeCoinInfo.name}
                            >
                                {coinOptions}
                            </select>
                        </div>
                    </div>

                    <div className="medium-6 medium-offset-1">
                        <label
                            style={{minHeight: "2rem"}}
                            className="left-label"
                        >
                            <Translate content="gateway.gateway_text" />:
                        </label>
                        <div style={{paddingBottom: 15}}>
                            <ul className="button-group segmented no-margin">
                                <li
                                    className={
                                        action === "deposit" ? "is-active" : ""
                                    }
                                >
                                    <a
                                        onClick={this.changeAction.bind(
                                            this,
                                            "deposit"
                                        )}
                                    >
                                        <Translate content="gateway.deposit" />
                                    </a>
                                </li>
                                <li
                                    className={
                                        action === "withdraw" ? "is-active" : ""
                                    }
                                >
                                    <a
                                        onClick={this.changeAction.bind(
                                            this,
                                            "withdraw"
                                        )}
                                    >
                                        <Translate content="gateway.withdraw" />
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
                {infos ? (
                    infos
                ) : (
                    <div>
                        <div style={{marginBottom: 15}}>
                            <GdexGatewayInfo
                                account={account}
                                coin={coin}
                                issuer_account={intermediate}
                                user_id={user_info.user_id}
                                action={this.state.action}
                                gateway={"gdex"}
                                btsCoin={coin.innerSymbol}
                                memo_rule={memo_rule}
                            />
                        </div>
                        <GdexHistory
                            userId={user_info.user_id}
                            userAccount={account.get("name")}
                            assetId={coin[assetId]}
                            assetName={coin[assetSymbol]}
                            compactView={true}
                            fullHeight={true}
                            recordType={action == "deposit" ? 1 : 2}
                            filter="transfer"
                            title={
                                <Translate
                                    content={
                                        "gateway.recent_" + this.state.action
                                    }
                                />
                            }
                        />
                    </div>
                )}

                {supportContent}
            </div>
        );
    }
}

export default connect(GdexGateway, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            viewSettings: SettingsStore.getState().viewSettings,
            settings: SettingsStore.getState().settings
        };
    }
});
