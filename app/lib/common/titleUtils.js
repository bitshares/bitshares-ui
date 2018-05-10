import counterpart from "counterpart";

export default class TitleUtils {
    /**
     *  uses the router path to generate titles
     *  @return string value to be used by document.title or equivalent
     */
    static GetTitleByPath(path) {
        let title = "BitShares";
        let lastPart = null;
        let prefix = " - ";

        path.split("/").forEach(part => {
            if (part == "") return;

            title += prefix;

            if (lastPart === "account") title += part;
            else if (lastPart === "market" && part.match(/_/))
                title += part.replace("_", " / ");
            else if (this.GetLocaleKey(part) != null)
                title += counterpart.translate(this.GetLocaleKey(part));
            else {
                if (part.match(/-|_/) !== -1)
                    part.split(/-|_/).forEach(piece => {
                        title +=
                            piece.charAt(0).toUpperCase() +
                            piece.substring(1) +
                            " ";
                    });
                else title += part.charAt(0).toUpperCase() + part.substring(1);
            }

            lastPart = part;
        });

        return title;
    }

    /**
     * Lookup for locale entry for various parts of the URL path
     */
    static GetLocaleKey(part) {
        switch (part) {
            case "access":
                return "settings.access";
            case "account":
                return "header.account";
            case "accounts":
                return "explorer.accounts.title";
            case "asset":
                return "explorer.asset.title";
            case "assets":
                return "explorer.assets.title";
            case "backup":
                return "settings.backup";
            case "block":
                return "explorer.block.title";
            case "blocks":
                return "explorer.blocks.title";
            case "committee-members":
                return "explorer.committee_members.title";
            case "dashboard":
                return "header.dashboard";
            case "faucet_address":
                return "settings.faucet_address";
            case "market":
                return "exchange.market";
            case "markets":
                return "markets.title";
            case "password":
                return "settings.password";
            case "settings":
                return "header.settings";
            case "reset":
                return "settings.reset";
            case "restore":
                return "settings.restore";
            case "signedmessages":
                return "account.signedmessages.title";
            case "voting":
                return "account.voting";
            case "wallet":
                return "wallet.title";
            case "witnesses":
                return "explorer.witnesses.title";
            default:
                return null;
        }
    }
}
