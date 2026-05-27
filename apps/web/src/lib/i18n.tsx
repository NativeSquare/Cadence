"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Locale = "en" | "fr";

const translations = {
  en: {
    // Hero
    hero: {
      badge: "Launching soon",
      headline1: "Not reactive.",
      headline2pre: "A coach that ",
      headline2highlight: "anticipates.",
      headline2post: "",
      subtitle:
        "Cadence reads your sleep, recovery, heart rate, and accumulated load — then adjusts tomorrow's session before you even open the app.",
      socialProofPre: "Join ",
      socialProofPost: " runners on the waitlist",
      inputPlaceholder: "Enter your email",
      button: "Join the waitlist",
      buttonLoading: "Joining...",
      success: "You're in!",
      already: "You're already on the list!",
      successSub: "Check your inbox — we sent you a welcome email.",
      alreadySub: "We already have your email. Stay tuned!",
      youAreNumber: "YOU ARE RUNNER #",
      disclaimer: "",
      error: "Something went wrong. Please try again.",
    },
    // Nav
    nav: {
      contact: "Contact",
    },
    // StatsBar
    statsBar: {
      heading: "Connects with your gear",
    },
    // Testimonials
    testimonials: {
      tag: "Early Testers",
      headlinePre: "What our first runners ",
      headlineHighlight: "are saying.",
      quotes: [
        {
          quote:
            "Cadence flagged my overtraining before I even noticed. Three days before a hard session it quietly dropped the intensity. I PR'd the following week.",
          name: "Sarah M.",
          level: "Intermediate",
          result: "5-min 5K improvement",
          meta: "Paris 15e · 10 weeks",
        },
        {
          quote:
            "The app adjusted my entire block when my sleep dropped. I didn't ask it to — it just did it, explained why, and it was exactly the right call.",
          name: "Thomas K.",
          level: "Advanced",
          result: "Sub-3:10 marathon",
          meta: "Paris 11e · 16 weeks",
        },
        {
          quote:
            "I never thought I'd need a coach. Cadence caught a warning sign I would've missed and reshuffled my week. No injury, no burnout.",
          name: "Léa R.",
          level: "Beginner",
          result: "First half marathon completed",
          meta: "Paris 3e · 14 weeks",
        },
      ],
    },
    // FeatureShowcase
    featureShowcase: {
      tag: "Your AI Coach",
      headlinePre: "Built to stay ",
      headlineHighlight: "one step ahead.",
      features: [
        {
          tag: "Full Intelligence",
          title: "The complete picture.",
          description:
            "Sleep, recovery, heart rate, cycles, nutrition, accumulated load. Not one indicator — the full image. Cadence tracks every signal your body sends, continuously, so every decision is grounded in reality.",
        },
        {
          tag: "Proactive Coach",
          title: "Acts before you open the app.",
          description:
            "Tomorrow's session is already adjusted. Cadence spots overload before it becomes injury, reshapes the week's block when recovery falls short, and keeps your plan aligned with how your body actually feels.",
        },
        {
          tag: "Reasoned Decisions",
          title: "Every decision explained.",
          description:
            "Each change comes with a reason. Cadence tells you what changed, why it changed, and what it means for the road ahead. Full transparency — no black box.",
        },
      ],
    },
    // PhaseCalendar
    phaseCalendar: {
      tag: "Training Phases",
      headlinePre: "Always knowing ",
      headlineHighlight: "where you stand.",
      subtitle:
        "Cadence structures your training into phases — and proactively adjusts within each one based on how your body is actually responding.",
      phases: [
        {
          name: "Base",
          weeks: "Weeks 1-4",
          description:
            "Build your aerobic foundation with easy runs and gradual volume increase.",
        },
        {
          name: "Build",
          weeks: "Weeks 5-10",
          description:
            "Introduce tempo runs, intervals, and race-specific workouts.",
        },
        {
          name: "Peak",
          weeks: "Weeks 11-13",
          description:
            "Sharpen performance with high-intensity, lower volume training.",
        },
        {
          name: "Recovery",
          weeks: "Weeks 14-16",
          description:
            "Taper and recover. Active rest and easy running to absorb gains.",
        },
      ],
    },
    // DebriefSection
    debrief: {
      tag: "Proactive Intelligence",
      headlinePre: "Adjusted ",
      headlineHighlight: "before you ask.",
      subtitle:
        "Cadence doesn't wait for you to report a problem. It monitors your signals continuously and acts — then explains exactly what it did and why.",
      coachLabel: "Coach",
      chatMessages: [
        {
          role: "coach" as const,
          text: "I've adjusted tomorrow's session. Your HRV has been declining for 3 days — recovery score: 61%.",
        },
        {
          role: "coach" as const,
          text: "I've reduced the interval sets from 6 to 4 and lowered the target pace by 15 sec/km.",
        },
        {
          role: "user" as const,
          text: "Should I still run?",
        },
        {
          role: "coach" as const,
          text: "Yes — at an easy pace. Your body needs to absorb last week's load. I've rescheduled the intensity work to Thursday.",
        },
      ],
    },
    // Pricing
    pricing: {
      tag: "Pricing",
      headlinePre: "Start free. ",
      headlineHighlight: "Stay coached.",
      subtitle: "14-day free trial, cancel anytime. No credit card required.",
      freeTrialLabel: "Free Trial",
      freeTrialPrice: "€0",
      freeTrialPeriod: "/14 days",
      freeTrialDescription: "Full access. See if Cadence is right for you.",
      freeTrialFeatures: [
        "Full onboarding conversation",
        "Runner profile + fitness score",
        "Adaptive training plan",
        "Proactive daily adjustments",
        "Decision audit log",
      ],
      freeTrialButton: "Start Free Trial",
      proLabel: "RECOMMENDED",
      proPrice: "€18.99",
      proPeriod: "/month",
      proDescription: "Everything in trial, plus continuous coaching.",
      proFeatures: [
        "Unlimited plan adaptations",
        "Daily proactive adjustments",
        "Injury-responsive reshaping",
        "Full body signal monitoring",
        "Priority wearable sync",
        "Complete coaching history",
      ],
      proButton: "Get Started",
    },
    // DownloadCta (bottom waitlist CTA)
    downloadCta: {
      headlinePre: "Your coach is already ",
      headlineHighlight: "watching.",
      subtitlePre: "Join ",
      subtitlePost: "+ runners already on the waitlist. Be first in line when we launch.",
      inputPlaceholder: "Enter your email",
      button: "Join the waitlist",
      buttonLoading: "Joining...",
      success: "You're in!",
      already: "You're already on the list!",
      successSub: "Check your inbox for a welcome email.",
      alreadySub: "Stay tuned — we'll reach out soon.",
      error: "Something went wrong. Please try again.",
    },
    // FaqSection
    faq: {
      tag: "FAQ",
      headline: "Questions you might have.",
      items: [
        {
          q: "How is Cadence different from other AI running apps?",
          a: "Most AI coaches wait for you to report a problem — then react. Cadence acts before you do. It reads your sleep, recovery, and load continuously and adjusts your plan autonomously, before you open the app.",
        },
        {
          q: "What data does Cadence use to make decisions?",
          a: "Sleep quality, HRV, resting heart rate, training load, nutrition signals, menstrual cycles where relevant, and workout history. The more connected devices you have, the richer the picture.",
        },
        {
          q: "How does Cadence adjust my plan automatically?",
          a: "Cadence monitors all your signals against expected recovery curves. When something's off — say, 3 days of declining HRV — it recalculates your next session or block and pushes the change, with a clear explanation.",
        },
        {
          q: "What if I disagree with a change Cadence made?",
          a: "You can override any adjustment. Cadence logs it, learns from the outcome, and factors your preferences into future decisions.",
        },
        {
          q: "Do I need a smartwatch to use Cadence?",
          a: "No. You can manually log runs or answer questions about your sessions. But the more data Cadence has, the more proactive it can be. With an Apple Watch or Garmin, it makes adjustments you'd never have thought to ask for.",
        },
      ],
    },
    // MarketLandscape
    marketLandscape: {
      tier1Label: "THE STANDARD — EVERYONE HAS IT",
      tier2Label: "WHAT WE'RE STARTING TO SEE",
      tier3Label: "WHAT DIDN'T EXIST YET",
      tier1Products: [
        {
          name: "KiprunPacer",
          tagline: "Plan + Watch",
          features: [
            { label: "Structured plan", status: "full" as const },
            { label: "Watch integration", status: "full" as const },
            { label: "Adaptive AI", status: "none" as const },
            { label: "Health data", status: "none" as const },
            { label: "Autonomy", status: "none" as const },
            { label: "Transparency", status: "none" as const },
          ],
        },
      ],
      tier2Products: [
        {
          name: "Nolio",
          tagline: "Plan + HRV + Human coach",
          features: [
            { label: "Structured plan", status: "full" as const },
            { label: "Watch integration", status: "full" as const },
            { label: "HRV (manual)", status: "partial" as const },
            { label: "Multi-signal data", status: "none" as const },
            { label: "Autonomy", status: "none" as const },
            { label: "Transparency", status: "none" as const },
          ],
        },
        {
          name: "Runna / Strava",
          tagline: "Plan + AI + Chat",
          features: [
            { label: "Structured plan", status: "full" as const },
            { label: "Watch integration", status: "full" as const },
            { label: "AI (load only)", status: "partial" as const },
            { label: "Multi-signal data", status: "none" as const },
            { label: "Autonomy", status: "none" as const },
            { label: "Transparency", status: "none" as const },
          ],
        },
        {
          name: "IAMCOACH / STAS",
          tagline: "AI Chat + watch data",
          features: [
            { label: "Flexible plan", status: "partial" as const },
            { label: "Watch integration", status: "full" as const },
            { label: "Conversational AI", status: "full" as const },
            { label: "Partial data", status: "partial" as const },
            { label: "Autonomy", status: "none" as const },
            { label: "Transparency", status: "none" as const },
          ],
        },
      ],
      tier3Products: [
        {
          name: "Cadence Coach",
          tagline: "Autonomous & transparent coach",
          features: [
            { label: "Structured plan", status: "full" as const },
            { label: "Watch integration", status: "full" as const },
            { label: "Conversational AI", status: "full" as const },
            { label: "Multi-signal data", status: "full" as const },
            { label: "Proactive autonomy", status: "full" as const },
            { label: "Full transparency", status: "full" as const },
          ],
        },
      ],
    },
    // Footer
    footer: {
      description:
        "AI coaching that observes, anticipates, and prevents. Like a world-class physio — always available.",
      productHeading: "Product",
      productLinks: ["Features", "How it works"],
      legalHeading: "Legal",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      mentionsLegales: "Legal Notice",
      support: "Support",
      integrationsHeading: "Integrations",
      copyright: "© 2026 Cadence. All rights reserved.",
      tagline: "Made for runners, by runners.",
    },
  },
  fr: {
    // Hero
    hero: {
      badge: "Bientôt disponible",
      headline1: "Pas un outil.",
      headline2pre: "Un coach qui ",
      headline2highlight: "anticipe.",
      headline2post: "",
      subtitle:
        "Cadence lit votre sommeil, récupération, fréquence cardiaque et charge accumulée — et ajuste la séance de demain avant même que vous ouvriez l’app.",
      socialProofPre: "Rejoignez ",
      socialProofPost: " coureurs sur la liste d’attente",
      inputPlaceholder: "Votre adresse email",
      button: "Réserver ma place",
      buttonLoading: "En cours...",
      success: "Vous êtes inscrit !",
      already: "Vous êtes déjà inscrit !",
      successSub:
        "Vérifiez votre boîte mail — un email de bienvenue vous attend.",
      alreadySub:
        "Nous avons déjà votre email. Restez à l’écoute !",
      youAreNumber: "VOUS ÊTES LE COUREUR #",
      disclaimer: "",
      error: "Une erreur est survenue. Veuillez réessayer.",
    },
    // Nav
    nav: {
      contact: "Contact",
    },
    // StatsBar
    statsBar: {
      heading: "Se connecte à votre équipement",
    },
    // Testimonials
    testimonials: {
      tag: "Premiers testeurs",
      headlinePre: "Ce que nos premiers coureurs ",
      headlineHighlight: "en disent.",
      quotes: [
        {
          quote:
            "Cadence a repéré mon surentraînement avant même que je m’en rende compte. Trois jours avant une séance difficile, il a baissé l’intensité. J’ai fait un PR la semaine suivante.",
          name: "Sarah M.",
          level: "Intermédiaire",
          result: "5 min de mieux sur 5 km",
          meta: "Paris 15e · 10 semaines",
        },
        {
          quote:
            "L’app a ajusté tout mon bloc quand mon sommeil a chuté. Je n’avais rien demandé — il l’a fait, expliqué pourquoi, et c’était exactement la bonne décision.",
          name: "Thomas K.",
          level: "Avancé",
          result: "Marathon sub-3:10",
          meta: "Paris 11e · 16 semaines",
        },
        {
          quote:
            "Je ne pensais pas avoir besoin d’un coach. Cadence a repéré un signal d’alerte que j’aurais raté et a réorganisé ma semaine. Ni blessure, ni burn-out.",
          name: "Léa R.",
          level: "Débutante",
          result: "Premier semi-marathon terminé",
          meta: "Paris 3e · 14 semaines",
        },
      ],
    },
    // FeatureShowcase
    featureShowcase: {
      tag: "Votre coach IA",
      headlinePre: "Conçu pour avoir ",
      headlineHighlight: "toujours un temps d’avance.",
      features: [
        {
          tag: "Intelligence complète",
          title: "L’image complète.",
          description:
            "Sommeil, récupération, fréquence cardiaque, cycles, nutrition, charge accumulée. Pas un indicateur — l’image complète. Cadence suit en continu chaque signal que votre corps envoie, pour que chaque décision soit ancrée dans la réalité.",
        },
        {
          tag: "Coach proactif",
          title: "Il agit avant que vous ouvriez l’app.",
          description:
            "La séance de demain est déjà ajustée. Cadence détecte la surcharge avant qu’elle devienne une blessure, restructure le bloc de la semaine quand la récupération ne suit pas, et garde votre plan aligné sur ce que ressent vraiment votre corps.",
        },
        {
          tag: "Décisions expliquées",
          title: "Chaque décision est expliquée.",
          description:
            "Chaque changement est accompagné d’une raison. Cadence vous dit ce qui a changé, pourquoi, et ce que ça implique pour la suite. Transparence totale — aucune boîte noire.",
        },
      ],
    },
    // PhaseCalendar
    phaseCalendar: {
      tag: "Phases d’entraînement",
      headlinePre: "Toujours savoir ",
      headlineHighlight: "où vous en êtes.",
      subtitle:
        "Cadence structure votre entraînement en phases — et ajuste de manière proactive au sein de chaque phase selon la façon dont votre corps répond réellement.",
      phases: [
        {
          name: "Base",
          weeks: "Semaines 1-4",
          description:
            "Construisez votre fondation aérobie avec des sorties faciles et une augmentation progressive du volume.",
        },
        {
          name: "Construction",
          weeks: "Semaines 5-10",
          description:
            "Introduisez les sorties tempo, les intervalles et les séances spécifiques course.",
        },
        {
          name: "Pic",
          weeks: "Semaines 11-13",
          description:
            "Affinez la performance avec un entraînement haute intensité et volume réduit.",
        },
        {
          name: "Récupération",
          weeks: "Semaines 14-16",
          description:
            "Affutage et récupération. Repos actif et course facile pour assimiler les gains.",
        },
      ],
    },
    // DebriefSection
    debrief: {
      tag: "Intelligence proactive",
      headlinePre: "Ajusté ",
      headlineHighlight: "avant même que vous demandiez.",
      subtitle:
        "Cadence n’attend pas que vous signalez un problème. Il surveille vos signaux en continu et agit — puis explique exactement ce qu’il a fait et pourquoi.",
      coachLabel: "Coach",
      chatMessages: [
        {
          role: "coach" as const,
          text: "J’ai ajusté la séance de demain. Votre HRV baisse depuis 3 jours — score de récupération : 61 %.",
        },
        {
          role: "coach" as const,
          text: "J’ai réduit les répétitions d’intervalles de 6 à 4 et abaissé l’allure cible de 15 sec/km.",
        },
        {
          role: "user" as const,
          text: "Est-ce que je dois quand même courir ?",
        },
        {
          role: "coach" as const,
          text: "Oui — mais en endurance fondamentale. Votre corps doit assimiler la charge de la semaine passée. J’ai reporté le travail intense à jeudi.",
        },
      ],
    },
    // Pricing
    pricing: {
      tag: "Tarifs",
      headlinePre: "Commencez gratuitement. ",
      headlineHighlight: "Restez coaché.",
      subtitle:
        "Essai gratuit de 14 jours, annulation à tout moment. Pas de carte bancaire requise.",
      freeTrialLabel: "Essai gratuit",
      freeTrialPrice: "€0",
      freeTrialPeriod: "/14 jours",
      freeTrialDescription:
        "Accès complet. Voyez si Cadence vous convient.",
      freeTrialFeatures: [
        "Conversation d’accueil complète",
        "Profil coureur + score de forme",
        "Plan d’entraînement adaptatif",
        "Ajustements quotidiens proactifs",
        "Journal des décisions",
      ],
      freeTrialButton: "Commencer l’essai gratuit",
      proLabel: "RECOMMANDÉ",
      proPrice: "€18,99",
      proPeriod: "/mois",
      proDescription:
        "Tout l’essai, plus un coaching continu.",
      proFeatures: [
        "Adaptations de plan illimitées",
        "Ajustements quotidiens proactifs",
        "Restructuration en cas de blessure",
        "Surveillance complète des signaux",
        "Sync wearable prioritaire",
        "Historique de coaching complet",
      ],
      proButton: "Commencer",
    },
    // DownloadCta (bottom waitlist CTA)
    downloadCta: {
      headlinePre: "Votre coach observe ",
      headlineHighlight: "déjà.",
      subtitlePre: "Rejoignez ",
      subtitlePost: "+ coureurs déjà sur la liste d’attente. Soyez les premiers informés au lancement.",
      inputPlaceholder: "Votre adresse email",
      button: "Réserver ma place",
      buttonLoading: "En cours...",
      success: "Vous êtes inscrit !",
      already: "Vous êtes déjà inscrit !",
      successSub: "Vérifiez votre boîte mail pour un email de bienvenue.",
      alreadySub: "Restez à l’écoute — nous vous contacterons bientôt.",
      error: "Une erreur est survenue. Veuillez réessayer.",
    },
    // FaqSection
    faq: {
      tag: "FAQ",
      headline: "Questions fréquentes.",
      items: [
        {
          q: "En quoi Cadence est différent des autres apps de running IA ?",
          a: "La plupart des coaches IA attendent que vous signalez un problème — puis réagissent. Cadence agit avant vous. Il lit votre sommeil, récupération et charge en continu et ajuste votre plan de façon autonome, avant que vous ouvriez l’app.",
        },
        {
          q: "Quelles données Cadence utilise-t-il pour prendre ses décisions ?",
          a: "Qualité du sommeil, HRV, fréquence cardiaque au repos, charge d’entraînement, signaux nutritionnels, cycles menstruels le cas échéant, et historique d’entraînement. Plus vous avez d’appareils connectés, plus l’image est précise.",
        },
        {
          q: "Comment Cadence ajuste-t-il mon plan automatiquement ?",
          a: "Cadence surveille tous vos signaux par rapport aux courbes de récupération attendues. Quand quelque chose dévie — par exemple, 3 jours de baisse de HRV — il recalcule votre prochaine séance ou bloc et pousse le changement, avec une explication claire.",
        },
        {
          q: "Et si je ne suis pas d’accord avec un changement ?",
          a: "Vous pouvez annuler n’importe quel ajustement. Cadence l’enregistre, apprend du résultat et intègre vos préférences dans les décisions futures.",
        },
        {
          q: "Ai-je besoin d’une montre connectée ?",
          a: "Non. Vous pouvez enregistrer manuellement vos sorties ou répondre à des questions sur vos séances. Mais plus Cadence a de données, plus il peut être proactif. Avec une Apple Watch ou un Garmin, il fait des ajustements auxquels vous n’auriez jamais pensé à demander.",
        },
      ],
    },
    // MarketLandscape
    marketLandscape: {
      tier1Label: "LE STANDARD — TOUT LE MONDE L'A",
      tier2Label: "CE QU'ON COMMENCE À VOIR",
      tier3Label: "CE QUI N'EXISTAIT PAS ENCORE",
      tier1Products: [
        {
          name: "KiprunPacer",
          tagline: "Plan + Montre",
          features: [
            { label: "Plan structuré", status: "full" as const },
            { label: "Intégration montre", status: "full" as const },
            { label: "IA adaptive", status: "none" as const },
            { label: "Données de santé", status: "none" as const },
            { label: "Autonomie", status: "none" as const },
            { label: "Transparence", status: "none" as const },
          ],
        },
      ],
      tier2Products: [
        {
          name: "Nolio",
          tagline: "Plan + HRV + Coach humain",
          features: [
            { label: "Plan structuré", status: "full" as const },
            { label: "Intégration montre", status: "full" as const },
            { label: "HRV (manuel)", status: "partial" as const },
            { label: "Données multi-facettes", status: "none" as const },
            { label: "Autonomie", status: "none" as const },
            { label: "Transparence", status: "none" as const },
          ],
        },
        {
          name: "Runna / Strava",
          tagline: "Plan + IA + Chat",
          features: [
            { label: "Plan structuré", status: "full" as const },
            { label: "Intégration montre", status: "full" as const },
            { label: "IA (charge seule)", status: "partial" as const },
            { label: "Données multi-facettes", status: "none" as const },
            { label: "Autonomie", status: "none" as const },
            { label: "Transparence", status: "none" as const },
          ],
        },
        {
          name: "IAMCOACH / STAS",
          tagline: "Chat IA + données montre",
          features: [
            { label: "Plan flexible", status: "partial" as const },
            { label: "Intégration montre", status: "full" as const },
            { label: "IA conversationnelle", status: "full" as const },
            { label: "Données partielles", status: "partial" as const },
            { label: "Autonomie", status: "none" as const },
            { label: "Transparence", status: "none" as const },
          ],
        },
      ],
      tier3Products: [
        {
          name: "Cadence Coach",
          tagline: "Coach autonome & transparent",
          features: [
            { label: "Plan structuré", status: "full" as const },
            { label: "Intégration montre", status: "full" as const },
            { label: "IA conversationnelle", status: "full" as const },
            { label: "Données multi-facettes", status: "full" as const },
            { label: "Autonomie proactive", status: "full" as const },
            { label: "Transparence totale", status: "full" as const },
          ],
        },
      ],
    },
    // Footer
    footer: {
      description:
        "Un coaching IA qui observe, anticipe et prévient. Comme un préparateur physique de classe mondiale — toujours disponible.",
      productHeading: "Produit",
      productLinks: ["Fonctionnalités", "Comment ça marche"],
      legalHeading: "Légal",
      privacyPolicy: "Politique de confidentialité",
      termsOfService: "Conditions d’utilisation",
      mentionsLegales: "Mentions légales",
      support: "Assistance",
      integrationsHeading: "Intégrations",
      copyright: "© 2026 Cadence. Tous droits réservés.",
      tagline: "Fait pour les coureurs, par des coureurs.",
    },
  },
};

type Translations = (typeof translations)["en"];

interface LocaleContextValue {
  t: Translations;
  locale: Locale;
}

const LocaleContext = createContext<LocaleContextValue>({
  t: translations.en,
  locale: "en",
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");

  useEffect(() => {
    const lang = navigator.language;
    if (lang.startsWith("fr")) {
      setLocale("fr");
    }
  }, []);

  return (
    <LocaleContext.Provider value={{ t: translations[locale], locale }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}
