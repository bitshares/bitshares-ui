const MenuItemType = Object.freeze({
    Never: Symbol("Never"),
    Always: Symbol("Always"),
    WhenUnlocked: Symbol("WhenUnlocked"),
    WhenAccount: Symbol("WhenAccount"),
    WhenNotMyAccount: Symbol("WhenNotMyAccount"),
    WhenNotInHeader: Symbol("WhenNotInHeader"),
    WhenMainnet: Symbol("WhenMainnet"),
    Dynamic: Symbol("Dynamic"),
    Divider: Symbol("Divider")
});

export default MenuItemType;
