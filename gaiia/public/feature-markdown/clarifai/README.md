# Clarifai

## 🧠 Présentation

**Clarifai** est une démonstration d'assistant IA dédié à l’analyse critique de contenus textuels.  
L’objectif est d'illustrer comment les LLM peuvent être utilisés pour **détecter des affirmations factuelles**, **repérer les biais** (idéologiques, émotionnels, etc.) et **synthétiser un jugement raisonné** sur un texte.

Ce type d’approche est particulièrement utile pour :

- la **vérification d'information** (fact-checking),
- l’analyse de **discours médiatiques ou politiques**,
- la **formation à la pensée critique**,
- ou encore des cas internes comme l’audit de livrables textuels (comptes rendus, bilans, propositions…).

## 🔍 Exemples d’usage

- Identifier les biais dans un article d’opinion
- Repérer les phrases trompeuses dans un texte marketing
- Produire une synthèse critique d’un contenu publié

---

## ⚙️ Architecture technique

### 🧩 Stack utilisée

- **Next.js** (app directory, routing, server-side streaming)
- **shadcn/ui** (UI et composants typés)
- **Supabase** (authentification, persistance à terme)
- **LangGraph** (orchestration du raisonnement)
- **OpenAI** (modèles GPT pour analyse et génération)

### 🧠 Graphe LangGraph

Le graphe est structuré autour de plusieurs étapes :

1. **Segmentation du texte**
2. **Extraction des affirmations** (claims)
3. **Détection de biais** (émotion, cadrage, manipulation)
4. **Vérification factuelle** (LLM-only ou via sources)
5. **Synthèse critique structurée**

Chaque étape alimente des `update events` émis via SSE à l’interface utilisateur.

### 🔁 Communication client ↔️ graphe

- Un hook générique `useGraphRunner` permet d’invoquer un graphe via un `slug`, en gérant le stream SSE.
- Les événements `token`, `update`, `complete` sont capturés et affichés en temps réel.
- Chaque graphe est typé (input/output), isolé dans `/apps/[slug]`.

---

## 🧪 Objectifs pédagogiques

Cette démo montre comment :

- structurer un raisonnement complexe en étapes dans un graphe LangGraph,
- exposer proprement l’analyse en frontend avec un système unifié,
- intégrer des retours utilisateur potentiels pour boucler une IA réflexive.

---

## 🚀 Pour aller plus loin

- Ajouter une vérification par **recherche web ou base documentaire** (Tavily, RAG).
- Permettre à l’utilisateur de **noter la qualité de l’analyse**.
- Offrir un **mode comparaison** entre deux textes (ex. discours opposés).
