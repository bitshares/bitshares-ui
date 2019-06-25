import React from "react";
import {BackupCreate} from "../Wallet/Backup";
import BackupBrainkey from "../Wallet/BackupBrainkey";
import counterpart from "counterpart";
import BackupFavorites from "./BackupFavorites";
import {Select} from "bitshares-ui-style-guide";

const Option = Select.Option;

export default class BackupSettings extends React.Component {
    constructor() {
        super();
        this.state = {
            restoreType: 0,
            types: ["backup", "brainkey", "favorites"]
        };
    }

    _changeType(value) {
        this.setState({
            restoreType: this.state.types.indexOf(value)
        });
    }

    render() {
        let {types, restoreType} = this.state;
        let options = types.map(type => {
            return (
                <Option key={type} value={type}>
                    {counterpart.translate(`settings.backupcreate_${type}`)}{" "}
                </Option>
            );
        });

        let content;

        switch (types[restoreType]) {
            case "backup":
                content = <BackupCreate />;
                break;

            case "brainkey":
                content = <BackupBrainkey />;
                break;

            case "favorites":
                content = <BackupFavorites />;
                break;

            default:
                break;
        }

        return (
            <div>
                <Select
                    onChange={this._changeType.bind(this)}
                    className="bts-select"
                    value={types[restoreType]}
                    style={{marginBottom: "16px"}}
                >
                    {options}
                </Select>

                {content}
            </div>
        );
    }
}
