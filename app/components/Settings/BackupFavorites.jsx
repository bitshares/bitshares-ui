import {saveAs} from "file-saver";
import React from "react";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";

class BackupFavorites extends React.Component {
    makeBackup() {
        let data = this.props.starredMarkets.toJS();

        let blob = new Blob([JSON.stringify(data)], {
            type: "application/json; charset=us-ascii"
        });

        saveAs(blob, "favorites.json");
    }

    render() {
        return (
            <div>
                <p>
                    <Translate content="settings.backup_favoritestext" />
                </p>
                <button
                    onClick={this.makeBackup.bind(this)}
                    className="button success"
                >
                    <Translate content="settings.backup_favoritesbtn" />
                </button>
            </div>
        );
    }
}

export default connect(BackupFavorites, {
    listenTo() {
        return [SettingsStore];
    },
    getProps() {
        return {
            starredMarkets: SettingsStore.getState().starredMarkets
        };
    }
});
