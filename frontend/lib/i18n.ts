export type Locale = "en" | "ua" | "ru"

export const locales: Locale[] = ["en", "ua", "ru"]

export const localeNames: Record<Locale, string> = {
  en: "English",
  ua: "Українська",
  ru: "Русский",
}

export const translations = {
  en: {
    // Header
    campaigns: "Campaigns",
    create: "Create",
    howItWorks: "How it Works",
    connectWallet: "Connect Wallet",
    connected: "Connected",
    profile: "Profile",

    // Hero
    heroTitle: "Fund the Future,",
    heroTitleAccent: "Own the Vision",
    heroSubtitle: "Back innovative projects on Base and earn token rewards as they succeed. Decentralized crowdfunding for the next generation of Web3 builders.",
    exploreCampaigns: "Explore Campaigns",
    launchCampaign: "Launch a Campaign",

    // Stats
    totalRaised: "Total Raised",
    activeCampaigns: "Active Campaigns",
    totalInvestors: "Total Investors",
    successfulCampaigns: "Successful Campaigns",
    totalCampaigns: "Total Campaigns",
    activeNow: "Active Now",
    successful: "Successful",
    investors: "Investors",
    creators: "Creators",

    // Featured Campaigns
    featuredCampaigns: "Featured Campaigns",
    featuredDescription: "Discover the most promising projects building on Base. Back them early and earn token rewards.",
    viewAllCampaigns: "View All Campaigns",
    viewCampaign: "View Campaign",

    // How It Works
    howItWorksTitle: "How It Works",
    howItWorksSubtitle: "Get started with BlockSpark in three simple steps",
    step1Title: "Create a Campaign",
    step1Desc: "Set your funding goal, deadline, and token details. Launch your project to the Base community.",
    step2Title: "Get Funded",
    step2Desc: "Investors back your project with ETH on Base Sepolia. Watch your campaign grow in real-time.",
    step3Title: "Earn Rewards",
    step3Desc: "Investors receive ERC20 tokens proportional to their contribution. Early backers get bonus tokens!",

    // Platform Stats
    platformStats: "Platform Statistics",
    platformStatsSubtitle: "Join a thriving community of creators and investors",

    // CTA
    ctaTitle: "Ready to Launch Your Idea?",
    ctaSubtitle: "Join the next generation of Web3 builders. Create your campaign today and let the community fund your vision.",
    startCampaign: "Start a Campaign",

    // Footer
    builtOn: "Built on Base Sepolia",

    // Campaign List
    allCampaigns: "All Campaigns",
    searchPlaceholder: "Search campaigns...",
    filterAll: "All",
    filterActive: "Active",
    filterSuccessful: "Successful",
    filterFailed: "Failed",
    sortNewest: "Newest",
    sortMostFunded: "Most Funded",
    sortEndingSoon: "Ending Soon",
    noCampaigns: "No campaigns found",
    noCampaignsDesc: "Try adjusting your search or filter criteria",

    // Campaign Detail
    backToCampaigns: "Back to Campaigns",
    invest: "Invest",
    raised: "Raised",
    target: "Target",
    timeLeft: "Time Left",
    backers: "Backers",
    aboutProject: "About this Project",
    tokenInfo: "Token Information",
    tokenName: "Token Name",
    tokenSymbol: "Symbol",
    tokenSupply: "Total Supply",
    recentContributions: "Recent Contributions",
    createdBy: "Created by",

    // Invest Box
    enterAmount: "Enter amount",
    ethToInvest: "ETH to invest",
    youWillReceive: "You will receive",
    tokens: "tokens",
    earlyBirdBonus: "Early bird bonus active!",
    investNow: "Invest Now",
    connectToInvest: "Connect Wallet to Invest",

    // Create Campaign
    createCampaign: "Create Campaign",
    projectDetails: "Project Details",
    fundingDetails: "Funding Details",
    tokenDetails: "Token Details",
    projectName: "Project Name",
    projectDescription: "Project Description",
    fundingGoal: "Funding Goal (ETH)",
    duration: "Duration (days)",
    enterTokenName: "Token Name",
    enterTokenSymbol: "Token Symbol (3-5 chars)",
    tokenTotalSupply: "Total Token Supply",
    preview: "Preview",
    next: "Next",
    back: "Back",
    launch: "Launch Campaign",

    // Profile
    myProfile: "My Profile",
    myInvestments: "My Investments",
    myCampaigns: "My Campaigns",
    totalInvested: "Total Invested",
    tokensEarned: "Tokens Earned",
    claimable: "Claimable",
    claimTokens: "Claim Tokens",
    claimed: "Claimed",
    viewDetails: "View Details",
    noInvestments: "No investments yet",
    noInvestmentsDesc: "Start backing projects you believe in",
    noCampaignsYet: "No campaigns created",
    noCampaignsYetDesc: "Launch your first campaign and start raising funds",
    createFirst: "Create Your First Campaign",
  },
  ua: {
    // Header
    campaigns: "Кампанії",
    create: "Створити",
    howItWorks: "Як це працює",
    connectWallet: "Підключити гаманець",
    connected: "Підключено",
    profile: "Профіль",

    // Hero
    heroTitle: "Фінансуй майбутнє,",
    heroTitleAccent: "Володій баченням",
    heroSubtitle: "Підтримуй інноваційні проекти на Base та отримуй токени як нагороду за їх успіх. Децентралізований краудфандинг для нового покоління Web3 будівельників.",
    exploreCampaigns: "Переглянути кампанії",
    launchCampaign: "Запустити кампанію",

    // Stats
    totalRaised: "Всього зібрано",
    activeCampaigns: "Активні кампанії",
    totalInvestors: "Всього інвесторів",
    successfulCampaigns: "Успішні кампанії",
    totalCampaigns: "Всього кампаній",
    activeNow: "Активні зараз",
    successful: "Успішні",
    investors: "Інвестори",
    creators: "Творці",

    // Featured Campaigns
    featuredCampaigns: "Рекомендовані кампанії",
    featuredDescription: "Відкрий найперспективніші проекти на Base. Підтримай їх рано та отримай токени.",
    viewAllCampaigns: "Всі кампанії",
    viewCampaign: "Переглянути",

    // How It Works
    howItWorksTitle: "Як це працює",
    howItWorksSubtitle: "Почни з BlockSpark за три прості кроки",
    step1Title: "Створи кампанію",
    step1Desc: "Встанови мету фінансування, дедлайн та деталі токена. Запусти свій проект для спільноти Base.",
    step2Title: "Отримай фінансування",
    step2Desc: "Інвестори підтримують твій проект ETH на Base Sepolia. Спостерігай за ростом у реальному часі.",
    step3Title: "Заробляй нагороди",
    step3Desc: "Інвестори отримують ERC20 токени пропорційно до їх внеску. Ранні бекери отримують бонуси!",

    // Platform Stats
    platformStats: "Статистика платформи",
    platformStatsSubtitle: "Приєднуйся до спільноти творців та інвесторів",

    // CTA
    ctaTitle: "Готовий запустити свою ідею?",
    ctaSubtitle: "Приєднуйся до нового покоління Web3 будівельників. Створи кампанію сьогодні і дай спільноті профінансувати твою візію.",
    startCampaign: "Почати кампанію",

    // Footer
    builtOn: "Побудовано на Base Sepolia",

    // Campaign List
    allCampaigns: "Всі кампанії",
    searchPlaceholder: "Пошук кампаній...",
    filterAll: "Всі",
    filterActive: "Активні",
    filterSuccessful: "Успішні",
    filterFailed: "Невдалі",
    sortNewest: "Найновіші",
    sortMostFunded: "Найбільш профінансовані",
    sortEndingSoon: "Скоро завершуються",
    noCampaigns: "Кампаній не знайдено",
    noCampaignsDesc: "Спробуй змінити пошук або фільтри",

    // Campaign Detail
    backToCampaigns: "До кампаній",
    invest: "Інвестувати",
    raised: "Зібрано",
    target: "Мета",
    timeLeft: "Залишилось",
    backers: "Інвесторів",
    aboutProject: "Про проект",
    tokenInfo: "Інформація про токен",
    tokenName: "Назва токена",
    tokenSymbol: "Символ",
    tokenSupply: "Загальна емісія",
    recentContributions: "Останні внески",
    createdBy: "Створено",

    // Invest Box
    enterAmount: "Введіть суму",
    ethToInvest: "ETH для інвестування",
    youWillReceive: "Ви отримаєте",
    tokens: "токенів",
    earlyBirdBonus: "Бонус для ранніх інвесторів!",
    investNow: "Інвестувати",
    connectToInvest: "Підключіть гаманець",

    // Create Campaign
    createCampaign: "Створити кампанію",
    projectDetails: "Деталі проекту",
    fundingDetails: "Фінансування",
    tokenDetails: "Деталі токена",
    projectName: "Назва проекту",
    projectDescription: "Опис проекту",
    fundingGoal: "Мета (ETH)",
    duration: "Тривалість (днів)",
    enterTokenName: "Назва токена",
    enterTokenSymbol: "Символ токена (3-5 символів)",
    tokenTotalSupply: "Загальна емісія",
    preview: "Попередній перегляд",
    next: "Далі",
    back: "Назад",
    launch: "Запустити",

    // Profile
    myProfile: "Мій профіль",
    myInvestments: "Мої інвестиції",
    myCampaigns: "Мої кампанії",
    totalInvested: "Всього інвестовано",
    tokensEarned: "Зароблено токенів",
    claimable: "Доступно",
    claimTokens: "Забрати токени",
    claimed: "Отримано",
    viewDetails: "Детальніше",
    noInvestments: "Поки що немає інвестицій",
    noInvestmentsDesc: "Почни підтримувати проекти, в які віриш",
    noCampaignsYet: "Кампаній не створено",
    noCampaignsYetDesc: "Запусти свою першу кампанію",
    createFirst: "Створити першу кампанію",
  },
  ru: {
    // Header
    campaigns: "Кампании",
    create: "Создать",
    howItWorks: "Как это работает",
    connectWallet: "Подключить кошелек",
    connected: "Подключено",
    profile: "Профиль",

    // Hero
    heroTitle: "Финансируй будущее,",
    heroTitleAccent: "Владей видением",
    heroSubtitle: "Поддержи инновационные проекты на Base и получай токены как награду за их успех. Децентрализованный краудфандинг для нового поколения Web3 строителей.",
    exploreCampaigns: "Смотреть кампании",
    launchCampaign: "Запустить кампанию",

    // Stats
    totalRaised: "Всего собрано",
    activeCampaigns: "Активные кампании",
    totalInvestors: "Всего инвесторов",
    successfulCampaigns: "Успешные кампании",
    totalCampaigns: "Всего кампаний",
    activeNow: "Активные сейчас",
    successful: "Успешные",
    investors: "Инвесторы",
    creators: "Создатели",

    // Featured Campaigns
    featuredCampaigns: "Рекомендуемые кампании",
    featuredDescription: "Открой самые перспективные проекты на Base. Поддержи их рано и получи токены.",
    viewAllCampaigns: "Все кампании",
    viewCampaign: "Просмотреть",

    // How It Works
    howItWorksTitle: "Как это работает",
    howItWorksSubtitle: "Начни с BlockSpark за три простых шага",
    step1Title: "Создай кампанию",
    step1Desc: "Установи цель финансирования, дедлайн и детали токена. Запусти свой проект для сообщества Base.",
    step2Title: "Получи финансирование",
    step2Desc: "Инвесторы поддерживают твой проект ETH на Base Sepolia. Наблюдай за ростом в реальном времени.",
    step3Title: "Зарабатывай награды",
    step3Desc: "Инвесторы получают ERC20 токены пропорционально их вкладу. Ранние бекеры получают бонусы!",

    // Platform Stats
    platformStats: "Статистика платформы",
    platformStatsSubtitle: "Присоединяйся к сообществу создателей и инвесторов",

    // CTA
    ctaTitle: "Готов запустить свою идею?",
    ctaSubtitle: "Присоединяйся к новому поколению Web3 строителей. Создай кампанию сегодня и дай сообществу профинансировать твое видение.",
    startCampaign: "Начать кампанию",

    // Footer
    builtOn: "Построено на Base Sepolia",

    // Campaign List
    allCampaigns: "Все кампании",
    searchPlaceholder: "Поиск кампаний...",
    filterAll: "Все",
    filterActive: "Активные",
    filterSuccessful: "Успешные",
    filterFailed: "Неудачные",
    sortNewest: "Новейшие",
    sortMostFunded: "Наиболее профинансированные",
    sortEndingSoon: "Скоро заканчиваются",
    noCampaigns: "Кампании не найдены",
    noCampaignsDesc: "Попробуй изменить поиск или фильтры",

    // Campaign Detail
    backToCampaigns: "К кампаниям",
    invest: "Инвестировать",
    raised: "Собрано",
    target: "Цель",
    timeLeft: "Осталось",
    backers: "Инвесторов",
    aboutProject: "О проекте",
    tokenInfo: "Информация о токене",
    tokenName: "Название токена",
    tokenSymbol: "Символ",
    tokenSupply: "Общая эмиссия",
    recentContributions: "Последние вклады",
    createdBy: "Создано",

    // Invest Box
    enterAmount: "Введите сумму",
    ethToInvest: "ETH для инвестирования",
    youWillReceive: "Вы получите",
    tokens: "токенов",
    earlyBirdBonus: "Бонус для ранних инвесторов!",
    investNow: "Инвестировать",
    connectToInvest: "Подключите кошелек",

    // Create Campaign
    createCampaign: "Создать кампанию",
    projectDetails: "Детали проекта",
    fundingDetails: "Финансирование",
    tokenDetails: "Детали токена",
    projectName: "Название проекта",
    projectDescription: "Описание проекта",
    fundingGoal: "Цель (ETH)",
    duration: "Продолжительность (дней)",
    enterTokenName: "Название токена",
    enterTokenSymbol: "Символ токена (3-5 символов)",
    tokenTotalSupply: "Общая эмиссия",
    preview: "Предпросмотр",
    next: "Далее",
    back: "Назад",
    launch: "Запустить",

    // Profile
    myProfile: "Мой профиль",
    myInvestments: "Мои инвестиции",
    myCampaigns: "Мои кампании",
    totalInvested: "Всего инвестировано",
    tokensEarned: "Заработано токенов",
    claimable: "Доступно",
    claimTokens: "Забрать токены",
    claimed: "Получено",
    viewDetails: "Подробнее",
    noInvestments: "Пока нет инвестиций",
    noInvestmentsDesc: "Начни поддерживать проекты, в которые веришь",
    noCampaignsYet: "Кампании не созданы",
    noCampaignsYetDesc: "Запусти свою первую кампанию",
    createFirst: "Создать первую кампанию",
  },
} as const

export type TranslationKey = keyof typeof translations.en

export function getTranslation(locale: Locale, key: TranslationKey): string {
  return translations[locale][key] || translations.en[key] || key
}

export function useTranslations(locale: Locale) {
  return (key: TranslationKey) => getTranslation(locale, key)
}
