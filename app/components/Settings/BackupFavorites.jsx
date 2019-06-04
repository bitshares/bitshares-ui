import {saveAs} from "file-saver";
import React from "react";
import Translate from "react-translate-component";
import {connect} from "alt-react";
import SettingsStore from "stores/SettingsStore";
import {Button} from "bitshares-ui-style-guide";

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
                <Button type="primary" onClick={this.makeBackup.bind(this)}>
                    <Translate content="settings.backup_favoritesbtn" />
                </Button>
            </div>
        );
    }
}

export default connect(
    BackupFavorites,
    {
        listenTo() {
            return [SettingsStore];
        },
        getProps() {
            return {
                starredMarkets: SettingsStore.getState().starredMarkets
            };
        }
    }
);
