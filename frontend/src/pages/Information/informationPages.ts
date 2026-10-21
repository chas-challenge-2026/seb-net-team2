export const informationPages = [
    { id: "about", to: "/om-projektet" },
    { id: "privacy", to: "/integritet" },
    { id: "terms", to: "/anvandningsvillkor" },
    { id: "storage", to: "/lokal-lagring" },
] as const;

export type InformationPageId = typeof informationPages[number]["id"];

export const informationSections: Record<InformationPageId, string[]> = {
    about: ["purpose", "features", "contact"],
    privacy: ["data", "purpose", "sharing", "retention", "rights", "responsibility"],
    terms: ["demo", "responsibility", "payments", "rates", "availability"],
    storage: ["overview", "session", "language", "currency", "control"],
};
