import React from "react";
import {BackupCreate} from "../Wallet/Backup";
import BackupBrainkey from "../Wallet/BackupBrainkey";
import counterpart from "counterpart";

export default class BackupSettings extends React.Component {

    constructor() {
        super();
        this.state = {
            restoreType: 0,
            types: ["backup", "brainkey"]
        };
    }

    _changeType(e) {

        this.setState({
            restoreType: this.state.types.indexOf(e.target.value)
        });
    }

    render() {
        let {types, restoreType} = this.state;
        let options = types.map(type => {
            return <option key={type} value={type}>{counterpart.translate(`settings.backupcreate_${type}`)} </option>;
        });

        let content;

        switch (types[restoreType]) {
        case "backup":
            content = <BackupCreate />;
            break;

        case "brainkey":
            content = <BackupBrainkey />;
            break;

        default:
            break;
        }

        return (
            <div>
                <select
                    onChange={this._changeType.bind(this)}
                    className="bts-select"
                    value={types[restoreType]}
                >
                    {options}
                </select>

                {content}
            </div>
        );
    }
};
