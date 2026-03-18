export const LANGUAGES = ['en', 'uk'] as const;
export type Language = typeof LANGUAGES[number];

export const LANG_COOKIE = 'lang';
export const DEFAULT_LANG: Language = 'en';

const translations = {
  en: {
    // Nav
    appName: 'Fuel Tracker',
    signOut: 'Sign out',
    // Auth
    signIn: 'Sign in',
    username: 'Username',
    password: 'Password',
    signingIn: 'Signing in…',
    noAccount: 'No account?',
    register: 'Register',
    createAccount: 'Create account',
    minPasswordChars: 'Minimum 6 characters',
    creatingAccount: 'Creating account…',
    alreadyHaveAccount: 'Already have an account?',
    loginFailed: 'Login failed',
    registrationFailed: 'Registration failed',
    // Vehicles list
    myVehicles: 'My Vehicles',
    addVehicle: '+ Add Vehicle',
    noVehicles: 'No vehicles yet',
    noVehiclesDesc: 'Add your first vehicle to start tracking fuelings.',
    car: 'Car',
    motorcycle: 'Motorcycle',
    // New vehicle form
    backToVehicles: 'Vehicles',
    addVehicleTitle: 'Add Vehicle',
    vehicleName: 'Name',
    namePlaceholder: 'e.g. Honda Civic',
    vehicleType: 'Type',
    fuelType: 'Fuel Type',
    otherFuelType: 'Other…',
    enterFuelType: 'Enter fuel type',
    saving: 'Saving…',
    fuelTypeRequired: 'Fuel type is required',
    failedCreateVehicle: 'Failed to create vehicle',
    // Fuel type presets
    fuelPetrol95: 'Petrol 95',
    fuelPetrol98: 'Petrol 98',
    fuelDiesel: 'Diesel',
    fuelLPG: 'LPG',
    fuelElectric: 'Electric',
    fuelHybrid: 'Hybrid',
    // Vehicle detail
    addFueling: '+ Add Fueling',
    fuelingsCount: 'Fuelings',
    totalFuel: 'Total Fuel',
    totalSpent: 'Total Spent',
    noFuelings: 'No fuelings yet',
    noFuelingsDesc: 'Add your first fueling record.',
    // Fueling table
    dateTime: 'Date & Time',
    station: 'Station',
    mileageKm: 'Mileage (km)',
    mileageDiff: 'Diff. (km)',
    days: 'Days',
    amountL: 'Amount (L)',
    pricePerL: 'Price (€/L)',
    totalEur: 'Total (€)',
    full: 'Full',
    edit: 'Edit',
    // Fueling form
    date: 'Date',
    time: 'Time',
    fuelStation: 'Fuel Station',
    stationPlaceholder: 'e.g. Shell, BP',
    mileagePlaceholder: 'e.g. 125000',
    amountPlaceholder: 'e.g. 40.00',
    pricePerLitre: 'Price per litre (€)',
    pricePlaceholder: 'e.g. 1.659',
    totalCost: 'Total cost',
    fullTank: 'Full tank',
    saveChanges: 'Save Changes',
    delete: 'Delete',
    confirmDelete: 'Delete this fueling record?',
    failedSave: 'Failed to save',
    // Fueling pages
    addFuelingTitle: 'Add Fueling',
    editFueling: 'Edit Fueling',
    // Vehicle card stats
    maxMileage: 'Total mileage',
    avgConsumption: 'Avg. consumption',
    // Edit vehicle modal
    editVehicle: 'Edit Vehicle',
    deleteVehicle: 'Delete Vehicle',
    confirmDeleteVehicle: 'Delete this vehicle and all its fueling records?',
    failedUpdateVehicle: 'Failed to update vehicle',
    failedDeleteVehicle: 'Failed to delete vehicle',
  },
  uk: {
    // Nav
    appName: 'Fuel Tracker',
    signOut: 'Вийти',
    // Auth
    signIn: 'Увійти',
    username: "Ім'я користувача",
    password: 'Пароль',
    signingIn: 'Вхід…',
    noAccount: 'Немає акаунту?',
    register: 'Зареєструватись',
    createAccount: 'Створити акаунт',
    minPasswordChars: 'Мінімум 6 символів',
    creatingAccount: 'Створення акаунту…',
    alreadyHaveAccount: 'Вже є акаунт?',
    loginFailed: 'Помилка входу',
    registrationFailed: 'Помилка реєстрації',
    // Vehicles list
    myVehicles: 'Мої автомобілі',
    addVehicle: '+ Додати транспорт',
    noVehicles: 'Немає транспортних засобів',
    noVehiclesDesc: 'Додайте перший транспортний засіб для відстеження заправок.',
    car: 'Автомобіль',
    motorcycle: 'Мотоцикл',
    // New vehicle form
    backToVehicles: 'Транспорт',
    addVehicleTitle: 'Додати транспорт',
    vehicleName: 'Назва',
    namePlaceholder: 'напр. Honda Civic',
    vehicleType: 'Тип',
    fuelType: 'Тип пального',
    otherFuelType: 'Інше…',
    enterFuelType: 'Введіть тип пального',
    saving: 'Збереження…',
    fuelTypeRequired: "Тип пального є обов'язковим",
    failedCreateVehicle: 'Помилка створення транспортного засобу',
    // Fuel type presets
    fuelPetrol95: 'Бензин А-95',
    fuelPetrol98: 'Бензин А-98',
    fuelDiesel: 'Дизель',
    fuelLPG: 'ГПГ',
    fuelElectric: 'Електро',
    fuelHybrid: 'Гібрид',
    // Vehicle detail
    addFueling: '+ Додати заправку',
    fuelingsCount: 'Заправки',
    totalFuel: "Загальний об'єм",
    totalSpent: 'Загальні витрати',
    noFuelings: 'Немає записів заправок',
    noFuelingsDesc: 'Додайте перший запис заправки.',
    // Fueling table
    dateTime: 'Дата і час',
    station: 'Станція',
    mileageKm: 'Пробіг (км)',
    mileageDiff: 'Різн. (км)',
    days: 'Днів',
    amountL: "Об'єм (л)",
    pricePerL: 'Ціна (€/л)',
    totalEur: 'Сума (€)',
    full: 'Повний',
    edit: 'Ред.',
    // Fueling form
    date: 'Дата',
    time: 'Час',
    fuelStation: 'Заправна станція',
    stationPlaceholder: 'напр. ОККО, WOG',
    mileagePlaceholder: 'напр. 125000',
    amountPlaceholder: 'напр. 40.00',
    pricePerLitre: 'Ціна за літр (€)',
    pricePlaceholder: 'напр. 1.659',
    totalCost: 'Загальна сума',
    fullTank: 'Повний бак',
    saveChanges: 'Зберегти зміни',
    delete: 'Видалити',
    confirmDelete: 'Видалити цей запис заправки?',
    failedSave: 'Помилка збереження',
    // Fueling pages
    addFuelingTitle: 'Додати заправку',
    editFueling: 'Редагувати заправку',
    // Vehicle card stats
    maxMileage: 'Загальний пробіг',
    avgConsumption: 'Сер. витрата',
    // Edit vehicle modal
    editVehicle: 'Редагувати транспорт',
    deleteVehicle: 'Видалити транспорт',
    confirmDeleteVehicle: 'Видалити цей транспортний засіб і всі записи заправок?',
    failedUpdateVehicle: 'Помилка оновлення транспортного засобу',
    failedDeleteVehicle: 'Помилка видалення транспортного засобу',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

export function getT(lang: Language) {
  return (key: TranslationKey): string => translations[lang][key];
}

// Fuel type options: value stored in DB (always English), label translated
export const FUEL_TYPE_KEYS: { value: string; labelKey: TranslationKey }[] = [
  { value: 'Petrol 95', labelKey: 'fuelPetrol95' },
  { value: 'Petrol 98', labelKey: 'fuelPetrol98' },
  { value: 'Diesel', labelKey: 'fuelDiesel' },
  { value: 'LPG', labelKey: 'fuelLPG' },
  { value: 'Electric', labelKey: 'fuelElectric' },
  { value: 'Hybrid', labelKey: 'fuelHybrid' },
];
