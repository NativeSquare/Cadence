--- BRIEF --- 

# Cadence — Claude Code Brief

## Contexte général du portfolio

Ce projet est le **3ème volet** d'une série de landing pages portfolio pour **NativeSquare**, une agence de développement software basée à Paris. L'objectif global est de construire un portfolio Upwork qui démontre un niveau de web design premium à travers plusieurs projets fictifs ou réels, chacun avec une DA radicalement différente.

### Les 3 projets du portfolio — et pourquoi ils sont différents

| Projet | Type | DA | Palette |
|--------|------|-----|---------|
| **VAEL** | E-commerce luxury watches | Dark, cinématique, editorial | Noir + orange-rouge fire |
| **Verbrio** | SaaS B2B AI assistant | Light mode, clean, corporate premium | Blanc + gradient purple→blue |
| **Cadence** | Consumer mobile app, running AI coach | **À définir** — voir DA ci-dessous | Noir + lime green |

Le principe clé : **chaque landing page doit avoir une identité visuelle radicalement distincte**. Un client Upwork qui voit les 3 projets doit se dire que l'agence sait s'adapter à n'importe quel univers. La cohérence est dans la qualité d'exécution, pas dans le style.

---

## Ce qu'est Cadence

**Type :** Application mobile consumer (iOS/Android) — développée en interne par NativeSquare pour exploitation propre.

**Positionnement :** Coach de course à pied propulsé par l'IA. Pas une simple app de tracking GPS — un vrai coach personnel intelligent qui analyse tes performances, adapte ton plan d'entraînement, et te parle comme un vrai coach le ferait.

**Utilisateurs cibles :** Coureurs de tout niveau, de l'amateur motivé au semi-pro. Quelqu'un qui veut progresser sérieusement, pas juste tracker ses km.

**Différenciation vs concurrents (Strava, Nike Run Club, Garmin) :**

- L'IA qui génère un plan d'entraînement personnalisé et l'ajuste en temps réel
- Le debrief post-session : analyse de la session, feedback vocal du coach IA
- Les "phases d'entraînement" : l'app structure la saison en phases (base, build, peak, recovery) visibles sur un calendrier mensuel
- Pas juste des données — des recommandations actionnables

**Features clés à mettre en avant sur la landing :**

- Calendrier mensuel avec phase bands colorées (base = bleu, build = orange, peak = rouge, recovery = vert)
- Debrief post-session avec analyse IA
- Plan d'entraînement adaptatif
- Suivi de forme / fatigue
- Intégration Apple Watch / Garmin

---

## Direction artistique

### Style global : Sport Tech Premium Dark

**Dark mode.** C'est une app fitness — le dark mode est la norme dans cet espace (Nike, Whoop, Oura, Strava dark). Mais pas un dark mode générique : un dark mode avec une personnalité forte via le vert lime comme accent principal.

**L'énergie recherchée :** Entre la précision technique d'une app sport et l'énergie d'un vrai athlète. Pas corporate, pas "startup colorée" — quelque chose de plus raw, plus intense. On doit sentir la vitesse et l'effort.

**Références obligatoires à étudier :**

- **Oura Ring** — dark élégant, données santé, très soigné
- **Athletic Greens / AG1** — landing page consumer premium
- **Strava** — mais en beaucoup plus premium
- **Nike Training Club** — dark, bold, typographie athlétique

### Palette

```
Background:      #0A0A0A  ou  #0D0D0D  (noir pur)
Surface:         #141414  (cards, panels)
Surface élevée:  #1C1C1C  (éléments au-dessus)
Borders:         rgba(255,255,255,.08)

Texte:           #F5F5F5  (blanc quasi-pur)
Texte dim:       rgba(255,255,255,.45)
Texte très dim:  rgba(255,255,255,.25)

Accent PRIMARY:  #CCFF00  (lime green électrique — la couleur signature)
Accent glow:     rgba(204,255,0,.x)
Accent dim:      rgba(204,255,0,.15)  pour les backgrounds de badges
Accent dark:     #A8D400  (variante plus sombre pour les hover states)

Phase bands (pour le calendrier) :
  Base phase:     #3B82F6  (blue)
  Build phase:    #F97316  (orange)
  Peak phase:     #EF4444  (red)
  Recovery phase: #10B981  (emerald)
```

Le vert lime `#CCFF00` est **l'identité de Cadence**. Présent sur :

- Le CTA principal
- Les accents et highlights
- Les métriques clés dans le mockup app
- Les éléments de navigation active
- Le logo/brandmark

### Typographie

```
Display/H1:   Barlow Condensed 700-900 (ou DM Sans 800) — large, athlétique, bold
              Alternative : Space Grotesk 700 si Barlow non dispo
Body:         DM Sans 400-500
Mono/data:    JetBrains Mono — pour les chiffres de perf (pace, distance, BPM)
```

Les chiffres de performance (5:42/km, 12.4km, 168bpm) doivent être en police monospace — ça renforce l'aspect data/précision.

---

## Structure des sections (ordre recommandé)

### 1. Nav

Dark, minimaliste. Logo Cadence à gauche (avec un petit icône lime). Liens centre. CTA "Download" à droite avec fond lime + texte noir. Fond transparent au scroll, légèrement frosté au scroll.

### 2. Hero

**C'est le plus important — voir détails ci-dessous.**

### 3. Stats / Social proof rapide

3-4 chiffres clés en grand : "50 000+ coureurs", "4.9★ sur l'App Store", "87% améliorent leur temps en 8 semaines". Fond légèrement différent du background.

### 4. Features — "Votre coach IA"

3 features principales avec mockup app à côté. Layout alterné gauche/droite.

- Feature 1 : Le plan adaptatif — mockup du calendrier avec phases
- Feature 2 : Le debrief post-session — mockup de l'écran debrief avec l'analyse IA
- Feature 3 : Le suivi de forme — mockup du dashboard avec les métriques

### 5. Calendrier / Phase system

Une section dédiée au système de phases d'entraînement — c'est un différenciateur fort. Montrer le calendrier mensuel avec les phase bands colorées. Expliquer la logique (Base → Build → Peak → Recovery).

### 6. Le Debrief IA

Section focus sur le debrief post-course — "Ce qui se passe après chaque run". Mockup du chat coach IA qui donne un feedback sur la session. C'est le feature le plus émotionnellement fort.

### 7. Testimonials

3 témoignages de coureurs fictifs avec photo, nom, niveau (débutant/intermédiaire/avancé), et une citation sur l'impact de l'app sur leur progression.

### 8. CTA Download

Section finale large avec les badges App Store / Google Play, un mockup app, et une headline forte. Fond avec un subtle glow lime en radial gradient.

### 9. Footer

Minimaliste, dark.

---

## Le Hero — détail

### Ce qui doit se passer dans le hero

C'est une **app mobile** — le hero doit montrer un (ou deux) screenshot(s) de l'app en phone mockup, centré(s), avec un fond dark dramatique.

Le "moment" du hero doit évoquer l'effort et la précision — pas une photo de coureur, pas une illustration générique. **Le produit lui-même est le visuel.**

**Structure du hero :**

- Headline : grande, bold, une ligne ou deux max. Ex : "Run smarter. Race faster." ou "Your AI running coach. Always on."
- Sous-titre : 1-2 lignes explicatives
- CTA : "Download on iOS" (fond lime) + "Get on Android" (outline)
- **Phone mockup(s)** : 1 ou 2 screenshots de l'app (créer en JSX — voir ci-dessous)
- Floating data cards autour du phone : "5:42 /km avg pace", "168 bpm", "+12% this week", "Week 3 of Build Phase"

**Ambiance visuelle du hero :**

- Fond noir avec un radial glow lime très subtil derrière le phone
- Possibilité d'une texture légère (grain, dot grid) sur le fond
- Les floating data cards : dark surface, border subtile, chiffres en vert lime ou monospace

---

## Les mockups app — créer en JSX

Comme pour Verbrio, des screen shots seront disponibles

### Mockup 1 — Écran principal / Dashboard

```
┌─────────────────────┐
│  ◉  Cadence    [≡]  │
├─────────────────────┤
│  Bonjour Alex 👋    │
│  Semaine 3 · Build  │
│                     │
│  [═══════════ 68%]  │  ← volume semaine
│                     │
│  ┌────┐ ┌────┐      │
│  │12.4│ │5:42│      │  ← km + pace
│  │ km │ │/km │      │
│  └────┘ └────┘      │
│                     │
│  Prochain run :     │
│  Tempo 8km · Demain │
│  [───────────────►] │
└─────────────────────┘
```

### Mockup 2 — Calendrier avec phases

```
┌─────────────────────┐
│  Novembre 2024      │
│  L  M  M  J  V  S  D│
│ [══BASE══][══BUILD══]│  ← phase bands
│  4   5   6   7   8  │
│  ✓   ✓   ·   ✓   ─  │  ← sessions réalisées/planifiées
│ 11  12  13  14  15  │
│  ✓   ✓   ✓   ·   ─  │
│                     │
│  Phase actuelle :   │
│  🟠 BUILD  Sem 3/6  │
│  [════════   ]  68% │
└─────────────────────┘
```

### Mockup 3 — Debrief post-session

```
┌─────────────────────┐
│  Session terminée ✓ │
│  Tempo Run · 9.2 km │
├─────────────────────┤
│  ┌──────────────┐   │
│  │  Coach IA    │   │
│  │              │   │
│  │ "Belle session│   │
│  │  Alex. Ton   │   │
│  │  pace était  │   │
│  │  très régul- │   │
│  │  ier (+0.3%) │   │
│  │  Continue !" │   │
│  └──────────────┘   │
│                     │
│  Récupération : 14h │
│  Forme : ████ 78%   │
└─────────────────────┘
```

Style des phone mockups : fond noir #0A0A0A, coin très arrondis `rounded-[44px]`, notch en haut, accent lime pour les éléments actifs, police monospace pour les chiffres.

---

## Architecture des composants

```
src/
├── app/
│   └── page.tsx
├── components/
│   └── cadence/
│       ├── Nav.tsx
│       ├── Hero.tsx                ← phone mockup + floating data cards
│       ├── StatsBar.tsx            ← chiffres clés
│       ├── FeatureShowcase.tsx     ← 3 features alternées
│       ├── PhaseCalendar.tsx       ← section calendrier/phases
│       ├── DebriefSection.tsx      ← focus sur le coach IA
│       ├── Testimonials.tsx
│       ├── DownloadCta.tsx         ← badges App Store + Google Play
│       ├── Footer.tsx
│       └── ui/
│           ├── PhoneMockup.tsx     ← wrapper phone frame réutilisable
│           ├── AppScreen.tsx       ← les différents screens en JSX
│           ├── DataCard.tsx        ← floating metric card
│           └── LimeButton.tsx      ← CTA lime réutilisable
├── lib/
│   └── constants.ts
└── styles/
    └── globals.css
```

---

## Règles de code

### Tailwind + CSS vars pour la palette

```css
/* globals.css */
:root {
  --lime: #ccff00;
  --lime-dim: rgba(204, 255, 0, 0.15);
  --surface: #141414;
  --surface-high: #1c1c1c;
}
```

```tsx
// Utiliser en Tailwind custom avec tailwind.config
theme: {
  extend: {
    colors: {
      lime: '#CCFF00',
      'lime-dim': 'rgba(204,255,0,0.15)',
      surface: '#141414',
    }
  }
}
```

### Animations — Framer Motion

```tsx
// Pattern standard pour les sections
<motion.div
  initial={{ opacity: 0, y: 32 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true, margin: "-60px" }}
  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
/>

// Phone mockup — entrée plus spectaculaire
<motion.div
  initial={{ opacity: 0, y: 60, scale: 0.92 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
/>

// Floating data cards — stagger
{cards.map((card, i) => (
  <motion.div
    key={i}
    initial={{ opacity: 0, x: i % 2 === 0 ? -20 : 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 0.4 + i * 0.15, duration: 0.7 }}
  />
))}
```

### Scroll parallax sur le hero phone

```tsx
const { scrollY } = useScroll();
const phoneY = useTransform(scrollY, [0, 500], [0, -40]);
// <motion.div style={{ y: phoneY }}>
```

---

## Ce qu'on ne veut PAS

- ❌ Couleurs flashy multiples — lime uniquement comme accent, pas de rainbow
- ❌ Photos de coureurs génériques / stock photos — le produit, pas les utilisateurs
- ❌ Layout corporate ou "app de santé" trop sage — énergie athlétique
- ❌ Animations trop complexes sur les mockups app — subtiles et fluides
- ❌ Fond gris foncé générique — noir pur `#0A0A0A`
- ❌ Rounded corners trop petits — les phones ont `rounded-[44px]`, les cards `rounded-2xl`
- ❌ Ressembler à Strava ou Nike — plus premium, plus data-driven, moins "fun"

---

## Résumé de la démarche

> Cadence est une app mobile — les gens téléchargent ce qu'ils voient. Les phone mockups en JSX sont le cœur visuel de toute la page. Chaque section doit avoir un mockup qui montre le produit sous un angle différent.

> Le vert lime `#CCFF00` est l'arme secrète. Utilisé avec parcimonie sur un fond très sombre, il crée un contraste maximal et une énergie électrique sans jamais être agressif. C'est la signature visuelle qui rend la page mémorable.

> L'utilisateur cible est un coureur sérieux qui veut progresser. Le copywriting doit parler de performance, de progression, de données — pas de "bien-être" ou de "plaisir de courir". Cadence est un outil de performance, pas une app lifestyle.

---
