import React from "react";
import {BackupRestore} from "../Wallet/Backup";
import ImportKeys from "../Wallet/ImportKeys";
import Translate from "react-translate-component";
import counterpart from "counterpart";

export default class RestoreSettings extends React.Component {

    constructor() {
        super();
        this.state = {
            restoreType: 0,
            types: ["backup", "key", "legacy"]
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
            return <option value={type}>{counterpart.translate(`settings.backup_${type}`)} </option>;
        });

        let content;

        switch (types[restoreType]) {
        case "backup":
            content = (
                <div>
                    <BackupRestore />
                </div>
            );
            break;

        default:
            content = <ImportKeys privateKey={restoreType === 1} />;
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
