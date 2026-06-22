<div align="center">

# 🙏 Pray For Me

**Votre compagnon de prière chrétien**

*"Priez sans cesse." — 1 Thessaloniciens 5:17*

[![React](https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-4-646cff?style=flat-square&logo=vite)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss)](https://tailwindcss.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

</div>

---

## ✨ Fonctionnalités

| Fonctionnalité | Description |
|---|---|
| 📋 **Sujets de prière** | Ajoutez vos prières personnelles et celles des autres |
| 🗂️ **Catégories** | Classez vos prières par thème (Famille, Santé, Église...) |
| 📅 **Plan hebdomadaire** | Priez pour une catégorie différente chaque jour |
| 🔔 **Notifications** | Rappels quotidiens, suivi des prières, rappel d'appel |
| ✅ **Suivi des exaucements** | Marquez les prières exaucées avec un témoignage |
| 📖 **Vue d'ensemble** | Consultez toutes vos prières — exaucées ou non |
| 💾 **Hors ligne** | Données stockées localement, aucune connexion requise |

---

## 📱 Aperçu

### Tableau de bord quotidien
Chaque jour, retrouvez un verset biblique, vos statistiques de prière et les sujets prévus selon votre plan hebdomadaire.

### Statuts des prières
- 🔵 **Actif** — en cours de prière
- ⏳ **En attente** — mis en pause
- ✅ **Exaucé** — Dieu a répondu! (affiché en vert, avec témoignage)

### Plan hebdomadaire
Assignez chaque catégorie à un ou plusieurs jours de la semaine pour structurer votre vie de prière.

---

## 🚀 Démarrage rapide

```bash
# Cloner le dépôt
git clone https://github.com/Arthuro1/pray-for-me.git
cd pray-for-me

# Installer les dépendances
npm install

# Lancer en développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

---

## 🛠️ Stack technique

- **[React 18](https://react.dev)** — Interface utilisateur
- **[Vite 4](https://vitejs.dev)** — Build tool ultra-rapide
- **[Tailwind CSS 3](https://tailwindcss.com)** — Styles utilitaires
- **[Zustand](https://zustand-demo.pmnd.rs/)** — Gestion d'état avec persistance localStorage
- **[Lucide React](https://lucide.dev)** — Icônes
- **[date-fns](https://date-fns.org)** — Formatage des dates en français
- **Web Notifications API** — Notifications navigateur natives

---

## 📁 Structure du projet

```
src/
├── components/
│   ├── Layout.jsx        # Navigation + header
│   ├── PrayerCard.jsx    # Carte d'un sujet de prière
│   └── PrayerForm.jsx    # Formulaire d'ajout/édition
├── pages/
│   ├── HomeTab.jsx       # Tableau de bord du jour
│   ├── PrayersTab.jsx    # Liste complète avec filtres
│   ├── PlanTab.jsx       # Plan hebdomadaire
│   └── SettingsTab.jsx   # Paramètres & notifications
├── store/
│   └── prayerStore.js    # État global (Zustand)
├── notifications.js      # Logique des notifications
└── App.jsx               # Composant racine
```

---

## 🙌 Contribuer

Les contributions sont les bienvenues! Si vous avez des idées pour améliorer cette application:

1. Forkez le projet
2. Créez une branche (`git checkout -b feature/ma-fonctionnalite`)
3. Committez vos changements (`git commit -m 'feat: ajouter ma fonctionnalité'`)
4. Poussez la branche (`git push origin feature/ma-fonctionnalite`)
5. Ouvrez une Pull Request

---

## 📜 Licence

Distribué sous licence MIT. Voir `LICENSE` pour plus d'informations.

---

<div align="center">

Fait avec ❤️ et foi

*"Je puis tout par celui qui me fortifie." — Philippiens 4:13*

</div>
