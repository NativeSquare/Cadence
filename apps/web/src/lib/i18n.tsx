"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Locale = "en" | "fr";

const translations = {
  en: {
    // Hero
    hero: {
      badge: "Launching soon",
      headline1: "Elite coaching.",
      headline2pre: "For ",
      headline2highlight: "every",
      headline2post: " runner.",
      subtitle:
        "The training intelligence of a world-class coach — adaptive, personal, and always paying attention.",
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
            "Cadence saw what I couldn't — I was overtraining every easy day. Two weeks of slowing down and my tempo pace dropped by 15 seconds.",
          name: "Sarah M.",
          level: "Intermediate",
          result: "1:38 half marathon",
          meta: "Paris 15e · 12 weeks",
        },
        {
          quote:
            "The plan adapted after my knee flared up. It didn't just delete sessions — it restructured everything around the injury. No other app does that.",
          name: "Thomas K.",
          level: "Advanced",
          result: "Sub-3:15 marathon",
          meta: "Paris 11e · 16 weeks",
        },
        {
          quote:
            "I went from not running at all to completing my first 10K. The AI debrief after each run kept me motivated and accountable.",
          name: "Léa R.",
          level: "Beginner",
          result: "First 10K completed",
          meta: "Paris 3e · 8 weeks",
        },
      ],
    },
    // FeatureShowcase
    featureShowcase: {
      tag: "Your AI Coach",
      headlinePre: "Built to make you ",
      headlineHighlight: "faster.",
      features: [
        {
          tag: "Adaptive Plans",
          title: "A plan that evolves with you.",
          description:
            "No static templates. Cadence builds your training plan from your actual data — and reshapes it after every single run. Missed a session? It adapts. Feeling strong? It pushes you.",
        },
        {
          tag: "Phase System",
          title: "See the bigger picture.",
          description:
            "Your training is structured into phases — Base, Build, Peak, Recovery. Each phase has a clear purpose, and you always know exactly where you stand in your progression.",
        },
        {
          tag: "AI Debrief",
          title: "Your coach talks back.",
          description:
            "After every run, your AI coach analyzes pace consistency, heart rate zones, cadence patterns, and more. You get actionable feedback — not just numbers.",
        },
      ],
    },
    // PhaseCalendar
    phaseCalendar: {
      tag: "Training Phases",
      headlinePre: "Structured for ",
      headlineHighlight: "results.",
      subtitle:
        "Like a real coach, Cadence structures your season into phases. Each one has a purpose — and you always know where you are.",
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
      tag: "Post-Run Debrief",
      headlinePre: "What happens after ",
      headlineHighlight: "every run.",
      subtitle:
        "Your AI coach analyzes every session in real time. Pace consistency, heart rate zones, cadence patterns — then gives you feedback that actually helps you improve.",
      coachLabel: "Coach IA",
      chatMessages: [
        {
          role: "coach" as const,
          text: "Nice tempo session today! Your pace was remarkably consistent — only 0.3% variation across all splits.",
        },
        {
          role: "coach" as const,
          text: "Heart rate stayed in Zone 3 for 82% of the run. That's exactly where you should be for tempo work.",
        },
        {
          role: "user" as const,
          text: "My legs felt heavy in the last 2km though.",
        },
        {
          role: "coach" as const,
          text: "That's normal at this point in Build phase. Your cumulative fatigue is at 64%. Tomorrow is a recovery day — I've adjusted the pace down by 15 sec/km.",
        },
      ],
    },
    // Pricing
    pricing: {
      tag: "Pricing",
      headlinePre: "Start free. ",
      headlineHighlight: "Stay coached.",
      subtitle: "7-day free trial, cancel anytime. No credit card required.",
      freeTrialLabel: "Free Trial",
      freeTrialPrice: "\u20AC0",
      freeTrialPeriod: "/7 days",
      freeTrialDescription: "Full access. See if Cadence is right for you.",
      freeTrialFeatures: [
        "Full onboarding conversation",
        "Runner profile + radar chart",
        "10-week volume plan",
        "Weekly structure",
        "Decision audit",
      ],
      freeTrialButton: "Start Free Trial",
      proLabel: "RECOMMENDED",
      proPrice: "\u20AC9.99",
      proPeriod: "/month",
      proDescription: "Everything in trial, plus continuous coaching.",
      proFeatures: [
        "Unlimited plan adaptations",
        "Daily session adjustments",
        "Injury-responsive reshaping",
        "Race day predictions",
        "Priority wearable sync",
        "Full coaching history",
      ],
      proButton: "Get Started",
    },
    // DownloadCta (bottom waitlist CTA)
    downloadCta: {
      headlinePre: "Your next PR starts ",
      headlineHighlight: "today.",
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
          q: "How does Cadence differ from Strava or Nike Run Club?",
          a: "Strava and NRC are trackers — they record what you did. Cadence is a coach — it tells you what to do next and why. Every plan adapts in real time based on your actual performance data.",
        },
        {
          q: "Do I need a smartwatch to use Cadence?",
          a: "No. You can manually log runs or answer questions about your sessions. However, connecting a watch (Apple Watch, Garmin, COROS) gives the AI much richer data to work with.",
        },
        {
          q: "How does the AI build my plan?",
          a: "Cadence analyzes your running history, goals, available days, and current fitness level. It uses periodization principles (Base \u2192 Build \u2192 Peak \u2192 Recovery) and adjusts the plan after every session.",
        },
        {
          q: "What happens if I miss a training day?",
          a: "The plan reshapes automatically. Cadence doesn't just skip the session — it recalculates your weekly volume, adjusts upcoming intensity, and keeps you on track for your goal.",
        },
        {
          q: "Is it suitable for beginners?",
          a: "Absolutely. Cadence adapts to all levels. Whether you're running your first 5K or training for an ultra, the AI calibrates to your current fitness and progresses you safely.",
        },
      ],
    },
    // Footer
    footer: {
      description:
        "AI coaching that adapts to every run. Built for runners who want to understand their training.",
      productHeading: "Product",
      productLinks: ["Features", "How it works"],
      legalHeading: "Legal",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      mentionsLegales: "Legal Notice",
      integrationsHeading: "Integrations",
      copyright: "\u00A9 2026 Cadence. All rights reserved.",
      tagline: "Made for runners, by runners.",
    },
  },
  fr: {
    // Hero
    hero: {
      badge: "Bient\u00F4t disponible",
      headline1: "Coaching d'élite.",
      headline2pre: "Accessible à ",
      headline2highlight: "tous.",
      headline2post: "",
      subtitle:
        "L'intelligence d'entra\u00EEnement d'un coach de classe mondiale — adaptatif, personnel, et toujours attentif.",
      socialProofPre: "Rejoignez ",
      socialProofPost: " coureurs sur la liste d'attente",
      inputPlaceholder: "Votre adresse email",
      button: "Réserver ma place",
      buttonLoading: "En cours...",
      success: "Vous \u00EAtes inscrit !",
      already: "Vous \u00EAtes d\u00E9j\u00E0 inscrit !",
      successSub:
        "V\u00E9rifiez votre bo\u00EEte mail — un email de bienvenue vous attend.",
      alreadySub:
        "Nous avons d\u00E9j\u00E0 votre email. Restez \u00E0 l'\u00E9coute !",
      youAreNumber: "VOUS \u00CATES LE COUREUR #",
      disclaimer: "",
      error: "Une erreur est survenue. Veuillez r\u00E9essayer.",
    },
    // Nav
    nav: {
      contact: "Contact",
    },
    // StatsBar
    statsBar: {
      heading: "Se connecte \u00E0 votre \u00E9quipement",
    },
    // Testimonials
    testimonials: {
      tag: "Premiers testeurs",
      headlinePre: "Ce que nos premiers coureurs ",
      headlineHighlight: "en disent.",
      quotes: [
        {
          quote:
            "Cadence a vu ce que je ne voyais pas — je for\u00E7ais trop chaque jour facile. Deux semaines \u00E0 ralentir et mon allure tempo a baiss\u00E9 de 15 secondes.",
          name: "Sarah M.",
          level: "Intermédiaire",
          result: "1:38 semi-marathon",
          meta: "Paris 15e · 12 semaines",
        },
        {
          quote:
            "Le plan s'est adapté après ma douleur au genou. Il n'a pas juste supprimé des séances — il a tout restructuré autour de la blessure. Aucune autre app ne fait ça.",
          name: "Thomas K.",
          level: "Avancé",
          result: "Marathon sub-3:15",
          meta: "Paris 11e · 16 semaines",
        },
        {
          quote:
            "Je suis passée de zéro course à mon premier 10 km. Le débrief IA après chaque sortie m'a gardée motivée et responsable.",
          name: "Léa R.",
          level: "Débutante",
          result: "Premier 10 km terminé",
          meta: "Paris 3e · 8 semaines",
        },
      ],
    },
    // FeatureShowcase
    featureShowcase: {
      tag: "Votre coach IA",
      headlinePre: "Con\u00E7u pour vous rendre plus ",
      headlineHighlight: "rapide.",
      features: [
        {
          tag: "Plans adaptatifs",
          title: "Un plan qui \u00E9volue avec vous.",
          description:
            "Pas de templates fig\u00E9s. Cadence construit votre plan d'entra\u00EEnement \u00E0 partir de vos donn\u00E9es r\u00E9elles — et le remodelle apr\u00E8s chaque sortie. S\u00E9ance manqu\u00E9e ? Il s'adapte. En forme ? Il vous pousse.",
        },
        {
          tag: "Syst\u00E8me de phases",
          title: "Voyez la vue d'ensemble.",
          description:
            "Votre entra\u00EEnement est structur\u00E9 en phases — Base, Construction, Pic, R\u00E9cup\u00E9ration. Chaque phase a un objectif clair, et vous savez toujours o\u00F9 vous en \u00EAtes.",
        },
        {
          tag: "D\u00E9brief IA",
          title: "Votre coach vous r\u00E9pond.",
          description:
            "Apr\u00E8s chaque sortie, votre coach IA analyse la r\u00E9gularit\u00E9 de l'allure, les zones cardiaques, les patterns de cadence, et plus. Vous recevez des retours concrets — pas juste des chiffres.",
        },
      ],
    },
    // PhaseCalendar
    phaseCalendar: {
      tag: "Phases d'entra\u00EEnement",
      headlinePre: "Structur\u00E9 pour les ",
      headlineHighlight: "r\u00E9sultats.",
      subtitle:
        "Comme un vrai coach, Cadence structure votre saison en phases. Chacune a un objectif — et vous savez toujours o\u00F9 vous en \u00EAtes.",
      phases: [
        {
          name: "Base",
          weeks: "Semaines 1-4",
          description:
            "Construisez votre fondation a\u00E9robie avec des sorties faciles et une augmentation progressive du volume.",
        },
        {
          name: "Construction",
          weeks: "Semaines 5-10",
          description:
            "Introduisez les sorties tempo, les intervalles et les s\u00E9ances sp\u00E9cifiques course.",
        },
        {
          name: "Pic",
          weeks: "Semaines 11-13",
          description:
            "Affinez la performance avec un entra\u00EEnement haute intensit\u00E9 et volume r\u00E9duit.",
        },
        {
          name: "R\u00E9cup\u00E9ration",
          weeks: "Semaines 14-16",
          description:
            "Affutage et r\u00E9cup\u00E9ration. Repos actif et course facile pour assimiler les gains.",
        },
      ],
    },
    // DebriefSection
    debrief: {
      tag: "D\u00E9brief post-sortie",
      headlinePre: "Ce qui se passe apr\u00E8s ",
      headlineHighlight: "chaque sortie.",
      subtitle:
        "Votre coach IA analyse chaque s\u00E9ance en temps r\u00E9el. R\u00E9gularit\u00E9 de l'allure, zones cardiaques, patterns de cadence — puis vous donne des retours qui vous aident vraiment \u00E0 progresser.",
      coachLabel: "Coach IA",
      chatMessages: [
        {
          role: "coach" as const,
          text: "Belle s\u00E9ance tempo aujourd'hui ! Votre allure \u00E9tait remarquablement r\u00E9guli\u00E8re — seulement 0.3% de variation sur tous les splits.",
        },
        {
          role: "coach" as const,
          text: "La fr\u00E9quence cardiaque est rest\u00E9e en Zone 3 pendant 82% de la sortie. C'est exactement l\u00E0 o\u00F9 vous devez \u00EAtre pour un travail tempo.",
        },
        {
          role: "user" as const,
          text: "Mes jambes \u00E9taient lourdes sur les 2 derniers km quand m\u00EAme.",
        },
        {
          role: "coach" as const,
          text: "C'est normal \u00E0 ce stade de la phase Construction. Votre fatigue cumul\u00E9e est \u00E0 64%. Demain est un jour de r\u00E9cup\u00E9ration — j'ai ajust\u00E9 l'allure de -15 sec/km.",
        },
      ],
    },
    // Pricing
    pricing: {
      tag: "Tarifs",
      headlinePre: "Commencez gratuitement. ",
      headlineHighlight: "Restez coach\u00E9.",
      subtitle:
        "Essai gratuit de 7 jours, annulation \u00E0 tout moment. Pas de carte bancaire requise.",
      freeTrialLabel: "Essai gratuit",
      freeTrialPrice: "\u20AC0",
      freeTrialPeriod: "/7 jours",
      freeTrialDescription:
        "Acc\u00E8s complet. Voyez si Cadence vous convient.",
      freeTrialFeatures: [
        "Conversation d'accueil compl\u00E8te",
        "Profil coureur + graphique radar",
        "Plan de volume sur 10 semaines",
        "Structure hebdomadaire",
        "Audit des d\u00E9cisions",
      ],
      freeTrialButton: "Commencer l'essai gratuit",
      proLabel: "RECOMMAND\u00C9",
      proPrice: "\u20AC9,99",
      proPeriod: "/mois",
      proDescription:
        "Tout l'essai, plus un coaching continu.",
      proFeatures: [
        "Adaptations de plan illimit\u00E9es",
        "Ajustements quotidiens de s\u00E9ance",
        "Restructuration en cas de blessure",
        "Pr\u00E9dictions jour de course",
        "Sync wearable prioritaire",
        "Historique de coaching complet",
      ],
      proButton: "Commencer",
    },
    // DownloadCta (bottom waitlist CTA)
    downloadCta: {
      headlinePre: "Votre prochain record commence ",
      headlineHighlight: "aujourd'hui.",
      subtitlePre: "Rejoignez ",
      subtitlePost: "+ coureurs d\u00E9j\u00E0 sur la liste d'attente. Soyez les premiers inform\u00E9s au lancement.",
      inputPlaceholder: "Votre adresse email",
      button: "Réserver ma place",
      buttonLoading: "En cours...",
      success: "Vous \u00EAtes inscrit !",
      already: "Vous \u00EAtes d\u00E9j\u00E0 inscrit !",
      successSub: "V\u00E9rifiez votre bo\u00EEte mail pour un email de bienvenue.",
      alreadySub: "Restez \u00E0 l'\u00E9coute — nous vous contacterons bient\u00F4t.",
      error: "Une erreur est survenue. Veuillez r\u00E9essayer.",
    },
    // FaqSection
    faq: {
      tag: "FAQ",
      headline: "Questions fr\u00E9quentes.",
      items: [
        {
          q: "En quoi Cadence diff\u00E8re de Strava ou Nike Run Club ?",
          a: "Strava et NRC sont des trackers — ils enregistrent ce que vous avez fait. Cadence est un coach — il vous dit quoi faire ensuite et pourquoi. Chaque plan s'adapte en temps r\u00E9el selon vos donn\u00E9es de performance.",
        },
        {
          q: "Ai-je besoin d'une montre connect\u00E9e pour utiliser Cadence ?",
          a: "Non. Vous pouvez enregistrer manuellement vos sorties ou r\u00E9pondre \u00E0 des questions sur vos s\u00E9ances. Cependant, connecter une montre (Apple Watch, Garmin, COROS) donne \u00E0 l'IA des donn\u00E9es beaucoup plus riches.",
        },
        {
          q: "Comment l'IA construit-elle mon plan ?",
          a: "Cadence analyse votre historique de course, vos objectifs, vos jours disponibles et votre niveau actuel. Il utilise les principes de p\u00E9riodisation (Base \u2192 Construction \u2192 Pic \u2192 R\u00E9cup\u00E9ration) et ajuste le plan apr\u00E8s chaque s\u00E9ance.",
        },
        {
          q: "Que se passe-t-il si je manque un jour d'entra\u00EEnement ?",
          a: "Le plan se restructure automatiquement. Cadence ne supprime pas juste la s\u00E9ance — il recalcule votre volume hebdomadaire, ajuste l'intensit\u00E9 \u00E0 venir et vous garde sur la bonne voie pour votre objectif.",
        },
        {
          q: "Est-ce adapt\u00E9 aux d\u00E9butants ?",
          a: "Absolument. Cadence s'adapte \u00E0 tous les niveaux. Que vous couriez votre premier 5 km ou pr\u00E9pariez un ultra, l'IA se calibre sur votre forme actuelle et vous fait progresser en toute s\u00E9curit\u00E9.",
        },
      ],
    },
    // Footer
    footer: {
      description:
        "Un coaching IA qui s'adapte \u00E0 chaque sortie. Con\u00E7u pour les coureurs qui veulent comprendre leur entra\u00EEnement.",
      productHeading: "Produit",
      productLinks: ["Fonctionnalit\u00E9s", "Comment \u00E7a marche"],
      legalHeading: "L\u00E9gal",
      privacyPolicy: "Politique de confidentialit\u00E9",
      termsOfService: "Conditions d'utilisation",
      mentionsLegales: "Mentions l\u00E9gales",
      integrationsHeading: "Int\u00E9grations",
      copyright: "\u00A9 2026 Cadence. Tous droits r\u00E9serv\u00E9s.",
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
