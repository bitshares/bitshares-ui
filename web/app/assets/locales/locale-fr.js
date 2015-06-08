module.exports = {
    languages: {
        en: "Anglais",
        fr: "Français",
        switch: "Changer de langue"
    },
    header: {
        title: "Graphene",
        dashboard: "Accueil",
        explorer: "Explorer",
        exchange: "Échange",
        payments: "Paiments",
        logout: "Déconnexion",
        settings: "Options",
        current: "Mon Compte"
    },
    account: {
        assets: "Actifs",
        value: "Valeur",
        hour_24: "24hrs",
        recent: "Activité recent",
        name: "Nom du compte",
        member: {
            stats: "Stats membre",
            join: "Inscription",
            reg: "Enregistré par",
            ref: "Recruté par",
            referrals: "Recrutements",
            rewards: "Gains totaux",
            cashback: "Gagné",
            vested: "Bloqué"
        },
        connections: {
            known: "Connu par",
            "black": "Blacklisté par"
        }
    },
    transfer: {
        from: "De",
        amount: "Montant",
        to: "À",
        memo: "Message",
        fee: "Frais",
        send: "Envoyer",
        final: "Soldes finaux",
        balances: "Soldes",
        errors: {
            req: "Champ obligatoire",
            pos: "Le montant doit étre positif",
            valid: "Veuillez rentrer un chiffre positif"
        },
        back: "REVENIR",
        confirm: "CONFIRMER",
        broadcast: "Votre transfert a bien été soumis au reseau",
        again: "FAIRE UN AUTRE TRANSFERT",
        see: "VOIRE MES TRANSFERTS"
    },
    transaction: {
        sent: "A envoyé",
        to: "à",
        received: "A reçu",
        from: "de",
        amount_sell: "Montant à vendre",
        expiration: "Expiration",
        fill_or: "Fill or kill",
        min_receive: "Montant minimum à recevoir",
        seller: "Vendeur",
        collateral: "Collateral",
        coll_ratio: "Ratio de collateral initiale",
        coll_maint: "Ratio de Collateral de maintenance",
        create_key: "A créé une cléf public",
        reg_account: "A créé le compte",
        create_asset: "A créé l'actif",
        limit_order: "A placé un ordre à limite pour vendre",
        limit_order_cancel: "Annulation de l'ordre à limite avec id",
        short_order: "A placé un ordre à découvert pour vendre",
        at: "à",
        coll_of: "avec collateral de",        
        trxTypes: {
            0: "Transfert",
            1: "Ordre à limite",
            2: "Ordre à découvert",
            3: "Annulation d'ordre à limite",
            4: "Annulation d'ordre à découvert",
            6: "Creation de cléf",
            7: "Creation de compte",
            11: "Creation d'actif"
        }
    },
    explorer: {
        accounts: "Comptes",
        blocks: "Blocs",
        block: {
            title: "Bloc",
            id: "ID du bloc",
            witness: "Témoin",
            count: "Nombre de transactions",
            date: "Date",
            previous: "Précédent",
            previous_secret: "Précédent secret",
            next_secret: "Prochain hash secret",
            op: "Operation",
            trx: "Transaction",
            op_type: "Type d'operation",
            fee_payer: "Compte payant le frai",
            key: "Cléf public"

        },
        assets: {
            title: "Actifs",
            symbol: "Symbol",
            id: "ID",
            issuer: "Créateur",
            precision: "Précision"
        }

    }
};
