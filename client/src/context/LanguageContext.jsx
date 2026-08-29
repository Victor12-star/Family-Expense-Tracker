import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "fet_language";
const LanguageContext = createContext(null);

const sv = {
  home: "Hem", expenses: "Utgifter", calendar: "Kalender", shopping: "Inköp",
  chat: "Chatt", family: "Familj", settings: "Inställningar", more: "Mer",
  single: "Enskild", signIn: "Logga in", createAccount: "Skapa konto",
  email: "E-post", password: "Lösenord", name: "Namn", logout: "Logga ut",
  goodMorning: "God morgon", goodAfternoon: "God eftermiddag", goodEvening: "God kväll",
  addExpense: "Lägg till utgift", thisMonth: "Denna månad", monthlyBudget: "Månadsbudget",
  dueToday: "Förfaller idag", editBudget: "Redigera budget", setBudget: "Ange budget",
  upcomingReminders: "Kommande påminnelser", viewCalendar: "Visa kalender",
  reminder: "Påminnelse", recentExpenses: "Senaste utgifterna", seeAll: "Visa alla",
  noExpenses: "Inga utgifter ännu denna månad", addFirstExpense: "Lägg till första utgiften",
  createFamilyForBudget: "Skapa en familj för att ange en budget", expense: "Utgift",
  latestActivity: "Senaste aktivitet", recentExpensesHelp: "Dina senaste utgifter visas här när du börjar registrera dem.",
  trackSpending: "Spåra, hitta och granska dina utgifter.", searchExpenses: "Sök utgifter",
  all: "Alla", transactions: "transaktioner", transaction: "transaktion",
  noExpensesFound: "Inga utgifter hittades", save: "Spara", cancel: "Avbryt",
  category: "Kategori", amount: "Belopp", date: "Datum", note: "Anteckning",
  calendarReminders: "Kalender och påminnelser", calendarSubtitle: "Håll koll på räkningar, möten och viktiga datum.",
  addReminder: "Lägg till påminnelse", reminderSound: "Påminnelseljud", preview: "Förhandslyssna",
  browserNotifications: "Webbläsaraviseringar", monthlyView: "Månadsvy", today: "Idag",
  noUpcomingReminders: "Inga kommande påminnelser", clearReminders: "Rensa påminnelser",
  shoppingSubtitle: "Planera inköp, förstå kostnaden och håll koll på månadsbudgeten.",
  addItem: "Lägg till vara", spentThisMonth: "Spenderat denna månad", remaining: "Återstår",
  currentListEstimate: "Nuvarande listans uppskattning", shoppingList: "Inköpslista",
  shoppingListEmpty: "Din inköpslista är tom", addFirstItem: "Lägg till första varan",
  shoppingSpending: "Inköpsutgifter", shoppingHistory: "Inköpshistorik",
  familyChat: "Familjechatt", members: "Medlemmar", sharedExpenses: "Delade utgifter",
  typeMessage: "Skriv ett meddelande…", copyAll: "Kopiera alla meddelanden",
  clearChat: "Rensa chatten", copyMessage: "Kopiera meddelande", deleteMessage: "Ta bort meddelande",
  delivered: "Levererat", account: "Konto", preferences: "Inställningar",
  notifications: "Aviseringar", security: "Säkerhet", privacyData: "Integritet och data",
  accessibility: "Tillgänglighet", aboutSupport: "Om och support", currency: "Valuta",
  theme: "Tema", system: "System", light: "Ljust", dark: "Mörkt",
  largerText: "Större text", highContrast: "Hög kontrast", reduceMotion: "Minska rörelser",
  currentSession: "Aktuell session", active: "Aktiv", privacy: "Integritet",
  terms: "Användarvillkor", licenses: "Licenser för öppen källkod", about: "Om",
  builtBy: "Byggd av", contact: "Kontakt", yourFamily: "Din familj",
  openFamilyChat: "Öppna familjechatten", invitations: "Inbjudningar",
  createFamily: "Skapa en familj", joinFamily: "Gå med i en familj",
  connectFamily: "Anslut din familj", familyName: "Familjenamn", inviteCode: "Inbjudningskod",
  createInvitation: "Skapa inbjudan", noInvitations: "Inga aktiva inbjudningar ännu",
  role: "Roll", remove: "Ta bort", loading: "Laddar…", close: "Stäng",
  description: "Beskrivning", addedBy: "Tillagd av", actions: "Åtgärder",
  newTransaction: "Ny transaktion", privateExpense: "Privat utgift", shareFamilyChat: "Dela i familjechatten",
  schedule: "Schema", title: "Titel", hour: "Timme", minute: "Minut", second: "Sekund",
  remindMe: "Påminn mig", repeat: "Upprepa", never: "Aldrig", daily: "Dagligen",
  weekly: "Varje vecka", monthly: "Varje månad", yearly: "Varje år",
  item: "Vara", storeOptional: "Butik (valfritt)", quantity: "Antal", unit: "Enhet",
  notesOptional: "Anteckningar (valfritt)", addToList: "Lägg till i listan",
  completeShopping: "Slutför inköp", clearPurchased: "Rensa köpta", noBudget: "Ingen budget angiven",
  saveBudget: "Spara budget", estimatedTotal: "Uppskattad totalsumma", actualPaid: "Faktiskt betalt belopp",
};

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => localStorage.getItem(STORAGE_KEY) === "sv" ? "sv" : "en");

  function setLanguage(next) {
    const safe = next === "sv" ? "sv" : "en";
    localStorage.setItem(STORAGE_KEY, safe);
    setLanguageState(safe);
  }

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const value = useMemo(() => ({
    language,
    locale: language === "sv" ? "sv-SE" : "en-GB",
    setLanguage,
    t: (key, fallback) => language === "sv" ? (sv[key] || fallback || key) : (fallback || key),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
