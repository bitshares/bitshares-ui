module.exports = {
    languages: {
        en: "Anglais",
        cn: "简体中文",
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
        was_reg_account: " a été créé par",
        create_asset: "A créé l'actif",
        limit_order: "A placé un ordre à limite pour vendre",
        limit_order_buy: "A placé un ordre à limite pour acheter",
        limit_order_cancel: "Annulation de l'ordre à limite avec id",
        short_order: "A placé un ordre à découvert pour vendre",
        at: "à",
        coll_of: "avec collateral de",
        call_order_update: "A mis à jour un ordre à découvert",
        upgrade_account: "A mis à niveau le compte",
        update_account: "A mis à jour le compte",
        whitelist_account: "A whitelisté le compte",
        whitelisted_by: "A été whitelisté par le compte",
        transfer_account: "A transferé le compte",
        update_asset: "A mis à jour l'actif",
        update_feed_producers: "A mis à jour les fornisseurs de flux de l'actif",
        feed_producer: "Est devenu un fornisseur de flux pour l'actif",
        asset_issue: "A assigné",
        was_issued: "A été assigné",
        by: "par",
        burn_asset: "A détruit",
        fund_pool: "A financé un pot de frais avec",
        asset_settle: "Requested settlement of",
        asset_global_settle: "Requested global settlement of",
        publish_feed: "A publié un nouveau flux pour l'actif",
        delegate_create: "A créé le délégué",
        witness_create: "A créé le témoin",
        witness_pay: "A retiré",
        proposal_create: "A créé une proposition",
        proposal_update: "A mis à jour une proposition",
        proposal_delete: "A supprimé une proposition",
        withdraw_permission_create: "A donné une permission de retrait du compte",
        withdraw_permission_update: "A mis à jour les permissions de retrait du compte",
        withdraw_permission_claim: "A pris les permissions de retrait du compte",
        withdraw_permission_delete: "A supprimé les permissions de retrait du compte",
        paid: "A payé",
        obtain: "pour obtenir",
        global_parameters_update: "A mis à jour les parametres globaux",
        file_write: "A écrit un fichier",
        vesting_balance_create: "a créé un solde bloqué pour",
        for: "pour",
        vesting_balance_withdraw: "A retiré du solde bloqué",
        bond_create_offer: "A créé une offre d'obligation",
        bond_cancel_offer: "A annulé l'offre d'obligation",
        bond_accept_offer: "A accepté l'offre d'obligation pour",
        bond_claim_collateral: "A récuperé un collateral de",
        bond_pay_collateral: "A payé un collateral de",
        create_worker: "A créé un ouvrier avec un salaire de",
        custom: "A créé une operation spéciale",
        order_id: "ID de l'ordre",
        trxTypes: {
            0: "Transfert",
            1: "Ordre à limite",
            2: "Annulation d'ordre à limite",
            3: "Mise à jour d'ordre à découvert",
            4: "Création de compte",
            5: "Mise à jour de compte",
            6: "Whiteliste de compte",
            7: "Mise à niveau de compte",
            8: "Transfert de compte",
            9: "Creation d'actif",
            10: "Mise à jour d'actif",
            11: "Mise à jour d'actif de marché",
            12: "Mise à jour des flux",
            13: "Assigner d'un actif",
            14: "Destruction d'actif",
            15: "Financement de pot de frais",
            16: "Couvrement d'actif",
            17: "Couvrement global d'actif",
            18: "Publication de flux",
            19: "Création de délégué",
            20: "Création de témoin",
            21: "Retrait de salaire de témoin",
            22: "Création d'une proposition",
            23: "Mise à jour d'une proposition",
            24: "Suppresion d'une proposition",
            25: "Accord de permission de retrait",
            26: "Mise à jour de permission de retrait",
            27: "Prise de permissions de retrait",
            28: "Suppresion des permissions de retrait",
            29: "Remplissage d'ordre",
            30: "Mise à jour des parametres globaux",
            31: "Création de solde bloqué",
            32: "Retrait de solde bloqué",
            33: "Création d'ouvrier",
            34: "Spécial"
        }
    },
    explorer: {
        accounts: {
            title: "Comptes"
        },
        blocks: {
            title: "Blockchain",
            globals: "Parametres globaux",
            recent: "Blocs recent"
        },
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
            key: "Cléf public",
            transactions: "Nombre de transactions",
            account_upgrade: "Compte à mettre à niveau",
            lifetime: "Devenir membre à vie",
            authorizing_account: "Compte donnant l'autorisation",
            listed_account: "Compte etant autorisé",
            new_listing: "Nouvel autorisation",
            asset_update: "Actif à mettre à jour",
            common_options: "Options",
            new_options: "Nouvelles options",
            new_producers: "Nouveaux fornisseurs de flux",
            asset_issue: "Montant à créer",
            max_margin_period_sec: "Periode max de marge (s)",
            call_limit: "Limite de couverture",
            short_limit: "Limite de short",
            settlement_price: "Prix de règlement"
        },
        assets: {
            title: "Actifs",
            market: "SmartCoins",
            user: "Actifs des utilisateurs",
            symbol: "Symbol",
            id: "ID",
            issuer: "Créateur",
            precision: "Précision"
        },
        asset: {
            title: "Actif"
        },
        witnesses: {
            title: "Témoins"
        },
        delegates: {
            title: "Délégués"
        },
        delegate: {
            title: "Delegate"
        },
        workers: {
            title: "Ouvriers"
        },
        proposals: {
            title: "Propositions"
        },
        account: {
            title: "Compte"
        }
    },
    settings: {
        inversed: "Orientation préféré pour les marchés",
        unit: "Unité de valeur préféré"
    }
};
