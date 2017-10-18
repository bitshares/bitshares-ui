export default {
    tableHeightMountInterval(){
        let interval = setInterval(function(){
            let appTables = this.refs.appTables;

            if(!appTables) return;

            if(parseInt(appTables.style.height) !== appTables.clientHeight){
                appTables.style.height = `${appTables.clientHeight}px`;
            }
        }.bind(this), 10);

        return interval;
    },
    adjustHeightOnChangeTab(){
        let appTables = this.refs.appTables;
        if (appTables) this.refs.appTables.style.height = "auto";
    }
};
