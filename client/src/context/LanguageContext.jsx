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

// Core application translations. Unlisted explanatory copy deliberately
// falls back to English until it has been professionally reviewed.
const translations = {
  sv,
  nb: {
    home:"Hjem",expenses:"Utgifter",calendar:"Kalender",shopping:"Handling",chat:"Chat",family:"Familie",settings:"Innstillinger",more:"Mer",single:"Enkelt",signIn:"Logg inn",createAccount:"Opprett konto",email:"E-post",password:"Passord",name:"Navn",logout:"Logg ut",goodMorning:"God morgen",goodAfternoon:"God ettermiddag",goodEvening:"God kveld",addExpense:"Legg til utgift",thisMonth:"Denne måneden",monthlyBudget:"Månedsbudsjett",dueToday:"Forfaller i dag",editBudget:"Rediger budsjett",setBudget:"Angi budsjett",upcomingReminders:"Kommende påminnelser",viewCalendar:"Vis kalender",recentExpenses:"Nylige utgifter",seeAll:"Se alle",noExpenses:"Ingen utgifter ennå denne måneden",searchExpenses:"Søk i utgifter",all:"Alle",transactions:"transaksjoner",transaction:"transaksjon",save:"Lagre",cancel:"Avbryt",category:"Kategori",amount:"Beløp",date:"Dato",note:"Notat",calendarReminders:"Kalender og påminnelser",addReminder:"Legg til påminnelse",today:"I dag",addItem:"Legg til vare",remaining:"Gjenstår",shoppingList:"Handleliste",familyChat:"Familiechat",members:"Medlemmer",sharedExpenses:"Delte utgifter",typeMessage:"Skriv en melding…",clearChat:"Tøm chat",account:"Konto",preferences:"Preferanser",notifications:"Varsler",security:"Sikkerhet",privacyData:"Personvern og data",accessibility:"Tilgjengelighet",aboutSupport:"Om og støtte",currency:"Valuta",theme:"Tema",system:"System",light:"Lys",dark:"Mørk",largerText:"Større tekst",highContrast:"Høy kontrast",reduceMotion:"Reduser bevegelse",currentSession:"Gjeldende økt",active:"Aktiv",privacy:"Personvern",terms:"Bruksvilkår",about:"Om",contact:"Kontakt",createFamily:"Opprett familie",joinFamily:"Bli med i familie",loading:"Laster…",close:"Lukk"
  },
  da: {
    home:"Hjem",expenses:"Udgifter",calendar:"Kalender",shopping:"Indkøb",chat:"Chat",family:"Familie",settings:"Indstillinger",more:"Mere",single:"Enkelt",signIn:"Log ind",createAccount:"Opret konto",email:"E-mail",password:"Adgangskode",name:"Navn",logout:"Log ud",goodMorning:"Godmorgen",goodAfternoon:"God eftermiddag",goodEvening:"God aften",addExpense:"Tilføj udgift",thisMonth:"Denne måned",monthlyBudget:"Månedsbudget",dueToday:"Forfalder i dag",editBudget:"Rediger budget",setBudget:"Angiv budget",upcomingReminders:"Kommende påmindelser",viewCalendar:"Vis kalender",recentExpenses:"Seneste udgifter",seeAll:"Se alle",noExpenses:"Ingen udgifter endnu denne måned",searchExpenses:"Søg i udgifter",all:"Alle",transactions:"transaktioner",transaction:"transaktion",save:"Gem",cancel:"Annuller",category:"Kategori",amount:"Beløb",date:"Dato",note:"Note",calendarReminders:"Kalender og påmindelser",addReminder:"Tilføj påmindelse",today:"I dag",addItem:"Tilføj vare",remaining:"Resterende",shoppingList:"Indkøbsliste",familyChat:"Familiechat",members:"Medlemmer",sharedExpenses:"Delte udgifter",typeMessage:"Skriv en besked…",clearChat:"Ryd chat",account:"Konto",preferences:"Præferencer",notifications:"Notifikationer",security:"Sikkerhed",privacyData:"Privatliv og data",accessibility:"Tilgængelighed",aboutSupport:"Om og support",currency:"Valuta",theme:"Tema",system:"System",light:"Lys",dark:"Mørk",largerText:"Større tekst",highContrast:"Høj kontrast",reduceMotion:"Reducer bevægelse",currentSession:"Aktuel session",active:"Aktiv",privacy:"Privatliv",terms:"Brugsvilkår",about:"Om",contact:"Kontakt",createFamily:"Opret familie",joinFamily:"Deltag i familie",loading:"Indlæser…",close:"Luk"
  },
  fi: {
    home:"Koti",expenses:"Menot",calendar:"Kalenteri",shopping:"Ostokset",chat:"Keskustelu",family:"Perhe",settings:"Asetukset",more:"Lisää",single:"Yksittäinen",signIn:"Kirjaudu",createAccount:"Luo tili",email:"Sähköposti",password:"Salasana",name:"Nimi",logout:"Kirjaudu ulos",goodMorning:"Hyvää huomenta",goodAfternoon:"Hyvää iltapäivää",goodEvening:"Hyvää iltaa",addExpense:"Lisää meno",thisMonth:"Tässä kuussa",monthlyBudget:"Kuukausibudjetti",dueToday:"Erääntyy tänään",editBudget:"Muokkaa budjettia",setBudget:"Aseta budjetti",upcomingReminders:"Tulevat muistutukset",viewCalendar:"Näytä kalenteri",recentExpenses:"Viimeisimmät menot",seeAll:"Näytä kaikki",noExpenses:"Ei menoja tässä kuussa",searchExpenses:"Hae menoja",all:"Kaikki",transactions:"tapahtumaa",transaction:"tapahtuma",save:"Tallenna",cancel:"Peruuta",category:"Luokka",amount:"Summa",date:"Päivä",note:"Muistiinpano",calendarReminders:"Kalenteri ja muistutukset",addReminder:"Lisää muistutus",today:"Tänään",addItem:"Lisää tuote",remaining:"Jäljellä",shoppingList:"Ostoslista",familyChat:"Perhekeskustelu",members:"Jäsenet",sharedExpenses:"Jaetut menot",typeMessage:"Kirjoita viesti…",clearChat:"Tyhjennä keskustelu",account:"Tili",preferences:"Asetukset",notifications:"Ilmoitukset",security:"Turvallisuus",privacyData:"Tietosuoja ja tiedot",accessibility:"Saavutettavuus",aboutSupport:"Tietoja ja tuki",currency:"Valuutta",theme:"Teema",system:"Järjestelmä",light:"Vaalea",dark:"Tumma",largerText:"Suurempi teksti",highContrast:"Suuri kontrasti",reduceMotion:"Vähennä liikettä",currentSession:"Nykyinen istunto",active:"Aktiivinen",privacy:"Tietosuoja",terms:"Käyttöehdot",about:"Tietoja",contact:"Yhteystiedot",createFamily:"Luo perhe",joinFamily:"Liity perheeseen",loading:"Ladataan…",close:"Sulje"
  },
  de: {
    home:"Start",expenses:"Ausgaben",calendar:"Kalender",shopping:"Einkaufen",chat:"Chat",family:"Familie",settings:"Einstellungen",more:"Mehr",single:"Einzeln",signIn:"Anmelden",createAccount:"Konto erstellen",email:"E-Mail",password:"Passwort",name:"Name",logout:"Abmelden",goodMorning:"Guten Morgen",goodAfternoon:"Guten Tag",goodEvening:"Guten Abend",addExpense:"Ausgabe hinzufügen",thisMonth:"Dieser Monat",monthlyBudget:"Monatsbudget",dueToday:"Heute fällig",editBudget:"Budget bearbeiten",setBudget:"Budget festlegen",upcomingReminders:"Anstehende Erinnerungen",viewCalendar:"Kalender anzeigen",recentExpenses:"Letzte Ausgaben",seeAll:"Alle anzeigen",noExpenses:"Diesen Monat noch keine Ausgaben",searchExpenses:"Ausgaben suchen",all:"Alle",transactions:"Transaktionen",transaction:"Transaktion",save:"Speichern",cancel:"Abbrechen",category:"Kategorie",amount:"Betrag",date:"Datum",note:"Notiz",calendarReminders:"Kalender und Erinnerungen",addReminder:"Erinnerung hinzufügen",today:"Heute",addItem:"Artikel hinzufügen",remaining:"Verbleibend",shoppingList:"Einkaufsliste",familyChat:"Familienchat",members:"Mitglieder",sharedExpenses:"Geteilte Ausgaben",typeMessage:"Nachricht schreiben…",clearChat:"Chat leeren",account:"Konto",preferences:"Einstellungen",notifications:"Benachrichtigungen",security:"Sicherheit",privacyData:"Datenschutz und Daten",accessibility:"Barrierefreiheit",aboutSupport:"Info und Support",currency:"Währung",theme:"Design",system:"System",light:"Hell",dark:"Dunkel",largerText:"Größerer Text",highContrast:"Hoher Kontrast",reduceMotion:"Bewegung reduzieren",currentSession:"Aktuelle Sitzung",active:"Aktiv",privacy:"Datenschutz",terms:"Nutzungsbedingungen",about:"Über",contact:"Kontakt",createFamily:"Familie erstellen",joinFamily:"Familie beitreten",loading:"Wird geladen…",close:"Schließen"
  },
  fr: {
    home:"Accueil",expenses:"Dépenses",calendar:"Calendrier",shopping:"Achats",chat:"Discussion",family:"Famille",settings:"Paramètres",more:"Plus",single:"Individuel",signIn:"Se connecter",createAccount:"Créer un compte",email:"E-mail",password:"Mot de passe",name:"Nom",logout:"Se déconnecter",goodMorning:"Bonjour",goodAfternoon:"Bon après-midi",goodEvening:"Bonsoir",addExpense:"Ajouter une dépense",thisMonth:"Ce mois-ci",monthlyBudget:"Budget mensuel",dueToday:"Échéance aujourd’hui",editBudget:"Modifier le budget",setBudget:"Définir le budget",upcomingReminders:"Rappels à venir",viewCalendar:"Voir le calendrier",recentExpenses:"Dépenses récentes",seeAll:"Tout voir",noExpenses:"Aucune dépense ce mois-ci",searchExpenses:"Rechercher des dépenses",all:"Toutes",transactions:"transactions",transaction:"transaction",save:"Enregistrer",cancel:"Annuler",category:"Catégorie",amount:"Montant",date:"Date",note:"Note",calendarReminders:"Calendrier et rappels",addReminder:"Ajouter un rappel",today:"Aujourd’hui",addItem:"Ajouter un article",remaining:"Restant",shoppingList:"Liste de courses",familyChat:"Discussion familiale",members:"Membres",sharedExpenses:"Dépenses partagées",typeMessage:"Écrire un message…",clearChat:"Effacer la discussion",account:"Compte",preferences:"Préférences",notifications:"Notifications",security:"Sécurité",privacyData:"Confidentialité et données",accessibility:"Accessibilité",aboutSupport:"À propos et assistance",currency:"Devise",theme:"Thème",system:"Système",light:"Clair",dark:"Sombre",largerText:"Texte agrandi",highContrast:"Contraste élevé",reduceMotion:"Réduire les animations",currentSession:"Session actuelle",active:"Active",privacy:"Confidentialité",terms:"Conditions d’utilisation",about:"À propos",contact:"Contact",createFamily:"Créer une famille",joinFamily:"Rejoindre une famille",loading:"Chargement…",close:"Fermer"
  },
  es: {
    home:"Inicio",expenses:"Gastos",calendar:"Calendario",shopping:"Compras",chat:"Chat",family:"Familia",settings:"Ajustes",more:"Más",single:"Individual",signIn:"Iniciar sesión",createAccount:"Crear cuenta",email:"Correo",password:"Contraseña",name:"Nombre",logout:"Cerrar sesión",goodMorning:"Buenos días",goodAfternoon:"Buenas tardes",goodEvening:"Buenas noches",addExpense:"Añadir gasto",thisMonth:"Este mes",monthlyBudget:"Presupuesto mensual",dueToday:"Vence hoy",editBudget:"Editar presupuesto",setBudget:"Establecer presupuesto",upcomingReminders:"Próximos recordatorios",viewCalendar:"Ver calendario",recentExpenses:"Gastos recientes",seeAll:"Ver todo",noExpenses:"Aún no hay gastos este mes",searchExpenses:"Buscar gastos",all:"Todos",transactions:"transacciones",transaction:"transacción",save:"Guardar",cancel:"Cancelar",category:"Categoría",amount:"Importe",date:"Fecha",note:"Nota",calendarReminders:"Calendario y recordatorios",addReminder:"Añadir recordatorio",today:"Hoy",addItem:"Añadir artículo",remaining:"Restante",shoppingList:"Lista de compras",familyChat:"Chat familiar",members:"Miembros",sharedExpenses:"Gastos compartidos",typeMessage:"Escribe un mensaje…",clearChat:"Vaciar chat",account:"Cuenta",preferences:"Preferencias",notifications:"Notificaciones",security:"Seguridad",privacyData:"Privacidad y datos",accessibility:"Accesibilidad",aboutSupport:"Información y ayuda",currency:"Moneda",theme:"Tema",system:"Sistema",light:"Claro",dark:"Oscuro",largerText:"Texto más grande",highContrast:"Alto contraste",reduceMotion:"Reducir movimiento",currentSession:"Sesión actual",active:"Activa",privacy:"Privacidad",terms:"Términos de uso",about:"Acerca de",contact:"Contacto",createFamily:"Crear una familia",joinFamily:"Unirse a una familia",loading:"Cargando…",close:"Cerrar"
  },
  ar: {
    home:"الرئيسية",expenses:"المصروفات",calendar:"التقويم",shopping:"التسوق",chat:"الدردشة",family:"العائلة",settings:"الإعدادات",more:"المزيد",single:"فردي",signIn:"تسجيل الدخول",createAccount:"إنشاء حساب",email:"البريد الإلكتروني",password:"كلمة المرور",name:"الاسم",logout:"تسجيل الخروج",goodMorning:"صباح الخير",goodAfternoon:"مساء الخير",goodEvening:"مساء الخير",addExpense:"إضافة مصروف",thisMonth:"هذا الشهر",monthlyBudget:"الميزانية الشهرية",dueToday:"مستحق اليوم",editBudget:"تعديل الميزانية",setBudget:"تحديد الميزانية",upcomingReminders:"التذكيرات القادمة",viewCalendar:"عرض التقويم",recentExpenses:"المصروفات الأخيرة",seeAll:"عرض الكل",noExpenses:"لا توجد مصروفات هذا الشهر",searchExpenses:"البحث في المصروفات",all:"الكل",transactions:"معاملات",transaction:"معاملة",save:"حفظ",cancel:"إلغاء",category:"الفئة",amount:"المبلغ",date:"التاريخ",note:"ملاحظة",calendarReminders:"التقويم والتذكيرات",addReminder:"إضافة تذكير",today:"اليوم",addItem:"إضافة عنصر",remaining:"المتبقي",shoppingList:"قائمة التسوق",familyChat:"دردشة العائلة",members:"الأعضاء",sharedExpenses:"المصروفات المشتركة",typeMessage:"اكتب رسالة…",clearChat:"مسح الدردشة",account:"الحساب",preferences:"التفضيلات",notifications:"الإشعارات",security:"الأمان",privacyData:"الخصوصية والبيانات",accessibility:"إمكانية الوصول",aboutSupport:"حول والدعم",currency:"العملة",theme:"المظهر",system:"النظام",light:"فاتح",dark:"داكن",largerText:"نص أكبر",highContrast:"تباين عالٍ",reduceMotion:"تقليل الحركة",currentSession:"الجلسة الحالية",active:"نشطة",privacy:"الخصوصية",terms:"شروط الاستخدام",about:"حول",contact:"اتصال",createFamily:"إنشاء عائلة",joinFamily:"الانضمام إلى عائلة",loading:"جارٍ التحميل…",close:"إغلاق"
  },
  pl: {
    home:"Strona główna",expenses:"Wydatki",calendar:"Kalendarz",shopping:"Zakupy",chat:"Czat",family:"Rodzina",settings:"Ustawienia",more:"Więcej",single:"Pojedynczy",signIn:"Zaloguj się",createAccount:"Utwórz konto",email:"E-mail",password:"Hasło",name:"Nazwa",logout:"Wyloguj się",goodMorning:"Dzień dobry",goodAfternoon:"Dzień dobry",goodEvening:"Dobry wieczór",addExpense:"Dodaj wydatek",thisMonth:"Ten miesiąc",monthlyBudget:"Budżet miesięczny",dueToday:"Termin dzisiaj",editBudget:"Edytuj budżet",setBudget:"Ustaw budżet",upcomingReminders:"Nadchodzące przypomnienia",viewCalendar:"Pokaż kalendarz",recentExpenses:"Ostatnie wydatki",seeAll:"Pokaż wszystkie",noExpenses:"Brak wydatków w tym miesiącu",searchExpenses:"Szukaj wydatków",all:"Wszystkie",transactions:"transakcje",transaction:"transakcja",save:"Zapisz",cancel:"Anuluj",category:"Kategoria",amount:"Kwota",date:"Data",note:"Notatka",calendarReminders:"Kalendarz i przypomnienia",addReminder:"Dodaj przypomnienie",today:"Dzisiaj",addItem:"Dodaj produkt",remaining:"Pozostało",shoppingList:"Lista zakupów",familyChat:"Czat rodzinny",members:"Członkowie",sharedExpenses:"Wspólne wydatki",typeMessage:"Napisz wiadomość…",clearChat:"Wyczyść czat",account:"Konto",preferences:"Preferencje",notifications:"Powiadomienia",security:"Bezpieczeństwo",privacyData:"Prywatność i dane",accessibility:"Dostępność",aboutSupport:"Informacje i pomoc",currency:"Waluta",theme:"Motyw",system:"System",light:"Jasny",dark:"Ciemny",largerText:"Większy tekst",highContrast:"Wysoki kontrast",reduceMotion:"Ogranicz ruch",currentSession:"Bieżąca sesja",active:"Aktywna",privacy:"Prywatność",terms:"Warunki użytkowania",about:"O aplikacji",contact:"Kontakt",createFamily:"Utwórz rodzinę",joinFamily:"Dołącz do rodziny",loading:"Ładowanie…",close:"Zamknij"
  },
  it: {
    home:"Home",expenses:"Spese",calendar:"Calendario",shopping:"Acquisti",chat:"Chat",family:"Famiglia",settings:"Impostazioni",more:"Altro",single:"Singolo",signIn:"Accedi",createAccount:"Crea account",email:"E-mail",password:"Password",name:"Nome",logout:"Esci",goodMorning:"Buongiorno",goodAfternoon:"Buon pomeriggio",goodEvening:"Buonasera",addExpense:"Aggiungi spesa",thisMonth:"Questo mese",monthlyBudget:"Budget mensile",dueToday:"Scade oggi",editBudget:"Modifica budget",setBudget:"Imposta budget",upcomingReminders:"Promemoria in arrivo",viewCalendar:"Vedi calendario",recentExpenses:"Spese recenti",seeAll:"Vedi tutto",noExpenses:"Nessuna spesa questo mese",searchExpenses:"Cerca spese",all:"Tutte",transactions:"transazioni",transaction:"transazione",save:"Salva",cancel:"Annulla",category:"Categoria",amount:"Importo",date:"Data",note:"Nota",calendarReminders:"Calendario e promemoria",addReminder:"Aggiungi promemoria",today:"Oggi",addItem:"Aggiungi articolo",remaining:"Rimanente",shoppingList:"Lista della spesa",familyChat:"Chat di famiglia",members:"Membri",sharedExpenses:"Spese condivise",typeMessage:"Scrivi un messaggio…",clearChat:"Cancella chat",account:"Account",preferences:"Preferenze",notifications:"Notifiche",security:"Sicurezza",privacyData:"Privacy e dati",accessibility:"Accessibilità",aboutSupport:"Informazioni e supporto",currency:"Valuta",theme:"Tema",system:"Sistema",light:"Chiaro",dark:"Scuro",largerText:"Testo più grande",highContrast:"Contrasto elevato",reduceMotion:"Riduci movimento",currentSession:"Sessione corrente",active:"Attiva",privacy:"Privacy",terms:"Termini di utilizzo",about:"Informazioni",contact:"Contatti",createFamily:"Crea una famiglia",joinFamily:"Unisciti a una famiglia",loading:"Caricamento…",close:"Chiudi"
  },
};

// Switzerland uses the reviewed German copy with Swiss date/number formats.
translations["de-CH"] = translations.de;

export const LANGUAGES = [
  ["en", "English", "en-GB"], ["sv", "Svenska", "sv-SE"],
  ["nb", "Norsk", "nb-NO"], ["da", "Dansk", "da-DK"],
  ["fi", "Suomi", "fi-FI"], ["de", "Deutsch", "de-DE"],
  ["fr", "Français", "fr-FR"], ["es", "Español", "es-ES"],
  ["ar", "العربية", "ar"], ["pl", "Polski", "pl-PL"],
  ["it", "Italiano", "it-IT"], ["de-CH", "Deutsch (Schweiz)", "de-CH"],
];

const languageCodes = new Set(LANGUAGES.map(([code]) => code));
const locales = Object.fromEntries(LANGUAGES.map(([code, , locale]) => [code, locale]));

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return languageCodes.has(stored) ? stored : "en";
  });

  function setLanguage(next) {
    const safe = languageCodes.has(next) ? next : "en";
    localStorage.setItem(STORAGE_KEY, safe);
    setLanguageState(safe);
  }

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  const value = useMemo(() => ({
    language,
    locale: locales[language] || "en-GB",
    setLanguage,
    t: (key, fallback) => language === "en" ? (fallback || key) : (translations[language]?.[key] || fallback || key),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
