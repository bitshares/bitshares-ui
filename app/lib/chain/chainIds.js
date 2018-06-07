const chainIds = {
    MAIN_NET:
        "4018d7844c78f6a6c41c6a552b898022310fc5dec06da467ee7905a8dad512c8",
    TEST_NET:
        "2821abbb9923c830cf8300136c431674756270d9019f56c00e80b296e3afc079",
    DEV_NET: "2821abbb9923c830cf8300136c431674756270d9019f56c00e80b296e3afc079"
};

export class ChainUtilities {
    static isValidChainId(chainId) {
        return (
            Object.keys(chainIds).find(key => {
                return chainIds[key] === chainId;
            }) !== null
        );
    }
}

export default chainIds;
