module.exports = {
    languages: {
        en: "English",
        cn: "简体中文",
        fr: "French",
        ko: "한국어",
        switch: "언어 전환"
    },
    header: {
        title: "그래핀 UI",
        dashboard: "대시보드",
        explorer: "탐색기",
        exchange: "거래소",
        payments: "전송",
        logout: "로그아웃",
        settings: "설정",
        current: "현재 계정"
    },
    account: {
        asset: "자산",
        market_value: "시가총액",
        hour_24: "24시간 변동액",
        recent: "최근 활동",
        name: "계정명",
        member: {
            stats: "회원 정보",
            join: "가입일",
            reg: "Registered by",
            ref: "Referred by",
            referrals: "Referrals",
            rewards: "Cashback Rewards",
            cashback: "캐쉬백",
            vested: "Vested"
        },
        connections: {
            known: "Known by",
            "black": "Blacklisted by"
        }
    },
    transfer: {
        from: "보내는 사람",
        amount: "금액",
        to: "받는 사람",
        memo: "메모",
        fee: "수수료",
        send: "전송",
        final: "전송 후 잔고",
        balances: "잔고",
        errors: {
            req: "필수 입력",
            pos: "금액은 양수를 입력해주세요",
            valid: "유효한 값을 입력해주세요"
        },
        back: "뒤로가기",
        confirm: "확인",
        broadcast: "전송요청이 네트워크에 전파되었습니다",
        again: "전송요청 추가",
        see: "전송내역 보기"
    },
    transaction: {
        sent: "전송됨",
        to: "받는 사람",
        received: "수신됨",
        from: "보낸 사람",
        amount_sell: "판매 금액",
        expiration: "만기",
        fill_or: "Fill or kill",
        min_receive: "Minimum amount to receive",
        seller: "판매자",
        collateral: "담보",
        coll_ratio: "초기 담보 비율",
        coll_maint: "담보 유지 비율",
        "create_key": "공개키 생성",
        reg_account: "계정 등록",
        was_reg_account: "registered by",
        create_asset: "자산 생성",
        limit_order: "매도주문 요청",
        limit_order_buy: "매수주문 요청",
        limit_order_cancel: "주문 취소",
        short_order: "공매도주문 요청",
        short_order_cancel: "공매도 취소",
        at: "at",
        coll_of: "with collateral of",
        call_order_update: "콜 주문 업데이트",
        upgrade_account: "평생회원으로 업그레이드",
        update_account: "계정 업데이트",
        whitelist_account: "계정을 화이트리스트에 추가",
        whitelisted_by: "화이트리스트에 추가됨",
        transfer_account: "계정 이전",
        update_asset: "자산 업데이트",
        update_feed_producers: "Updated the feed producers of asset",
        feed_producer: "자산에 대한 가격정보 제공자로 추가됨",
        asset_issue: "발행",
        was_issued: "발행됨",
        by: "by",
        burn_asset: "소각",
        fund_pool: "자산 수수료 기금을 충전",
        asset_settle: "다음 자산에 대한 강제청산을 요청",
        asset_global_settle: "전체 자산 강제청산을 요청",
        publish_feed: "자산에 대한 가격정보를 발행",
        delegate_create: "대표자 생성",
        witness_create: "증인 생성",
        witness_pay: "증인 봉급을 다음 계정으로 인출",
        witness_receive: "Received witness from witness",
        proposal_create: "제안서를 생성",
        proposal_update: "제안서를 업데이트",
        proposal_delete: "제안서를 삭제",
        withdraw_permission_create: "다음 계정에 출금 권한을 부여",
        withdraw_permission_update: "다음 계정의 출금 권한을 업데이트",
        withdraw_permission_claim: "다음 계정에 출금 권한을 요청",
        withdraw_permission_delete: "다음 계정에 출금 권한을 삭제",
        paid: "지불됨",
        obtain: "to obtain",
        global_parameters_update: "전체 매개변수를 업데이트",
        file_write: "파일 쓰기",
        vesting_balance_create: "created vesting balance of",
        for: "for",
        vesting_balance_withdraw: "Withdrew vesting balance of",
        bond_create_offer: "Created bond offer",
        bond_cancel_offer: "Cancelled bond offer",
        bond_accept_offer: "Accepted bond offer of",
        bond_claim_collateral: "Claimed collateral of",
        bond_pay_collateral: "Paid collateral of",
        create_worker: "Created a worker with a pay of",
        custom: "Created a custom operation",
        order_id: "주문 ID",
        trxTypes: {
            0: "전송",
            1: "주문",
            2: "주문 취소",
            3: "Update call order",
            4: "계정 생성",
            5: "계정 업데이트",
            6: "계정 화이트리스트",
            7: "계정 업그레이드",
            8: "계정 거래",
            9: "자산 생성",
            10: "자산 업데이트",
            11: "스마트코인 업데이트",
            12: "자산 피드 생성자 업데이트",
            13: "자산 발행",
            14: "자산 소각",
            15: "자산 수수료 기금 충전",
            16: "자산 강제청산",
            17: "자산 전체 강제청산",
            18: "자산 가격정보 발행",
            19: "대표자 생성",
            20: "증인 생성",
            21: "증인 봉급 인출",
            22: "제안서 생성",
            23: "제안서 업데이트",
            24: "제안서 삭제",
            25: "출금권한 생성",
            26: "출금권한 업데이트",
            27: "출금권한 요청",
            28: "출금권한 삭제",
            29: "매매 체결",
            30: "전체 매개변수 업데이트",
            31: "Create vesting balance",
            32: "Withdraw vesting balance",
            33: "직원 생성",
            34: "사용자 정의"
        }
    },
    explorer: {
        accounts: {
            title: "계정"
        },
        blocks: {
            title: "블록체인",
            globals: "Global parameters",
            recent: "최근 블록"
        },
        block: {
            title: "블록",
            id: "블록 ID",
            witness: "증인",
            count: "거래 수",
            date: "일시",
            previous: "이전",
            previous_secret: "이전 비밀해쉬",
            next_secret: "다음 비밀해쉬",
            op: "Operation",
            trx: "거래",
            op_type: "Operation type",
            fee_payer: "수수료 지불 계정",
            key: "공개키",
            transactions: "거래 수",
            account_upgrade: "업그레이드할 계정",
            lifetime: "평생회원으로 업그레이드",
            authorizing_account: "계정 인증",
            listed_account: "Listed account",
            new_listing: "New listing",
            asset_update: "업데이트할 자산",
            common_options: "Common options",
            new_options: "New options",
            new_producers: "새로운 가격정보 발행자",
            asset_issue: "발행량",
            max_margin_period_sec: "Max margin period (s)",
            call_limit: "콜 한도",
            short_limit: "공매도 한도",
            settlement_price: "강제청산 가격"
        },
        assets: {
            title: "자산",
            market: "스마트코인",
            user: "사용자 자산",
            symbol: "기호",
            id: "ID",
            issuer: "발행자",
            precision: "소수 자리수"
        },
        asset: {
            title: "자산"
        },
        witnesses: {
            title: "증인"
        },      
        delegates: {
            title: "대표자"
        },
        delegate: {
            title: "대표자"
        },
        workers: {
            title: "직원"
        },
        proposals: {
            title: "제안서"
        },
        account: {
            title: "계정"
        }
    },
    settings: {
        inversed: "선호하는 거래단위",
        unit: "선호하는 단위"
    }
};
