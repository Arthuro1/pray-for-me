const THEMES = [
  {
    keywords: ['malade', 'maladie', 'santé', 'guérison', 'guérir', 'douleur', 'hôpital', 'cancer', 'opération', 'médecin', 'traitement', 'souffrance'],
    suggestions: [
      { title: 'Paix et confiance pendant la maladie', verse: 'Jérémie 17:14' },
      { title: 'Sagesse pour les médecins qui traitent', verse: 'Exode 15:26' },
      { title: 'Force pour la famille du malade', verse: 'Psaume 41:3' },
      { title: 'Foi pour croire à la guérison', verse: 'Jacques 5:15' },
      { title: 'Grâce pour accepter la volonté de Dieu', verse: '2 Corinthiens 12:9' },
    ],
  },
  {
    keywords: ['travail', 'emploi', 'chômage', 'entreprise', 'promotion', 'chef', 'collègue', 'licencié', 'cherche', 'carrière', 'business', 'projet'],
    suggestions: [
      { title: 'Faveur auprès des supérieurs', verse: 'Proverbes 16:7' },
      { title: 'Sagesse dans les décisions professionnelles', verse: 'Proverbes 3:5-6' },
      { title: 'Intégrité face aux pressions au travail', verse: 'Colossiens 3:23' },
      { title: 'Ouverture de nouvelles portes d\'opportunité', verse: 'Apocalypse 3:8' },
      { title: 'Relations saines avec les collègues', verse: 'Romains 12:18' },
    ],
  },
  {
    keywords: ['famille', 'enfant', 'parent', 'mari', 'femme', 'époux', 'épouse', 'frère', 'sœur', 'mariage', 'couple', 'divorce', 'réconciliation', 'fils', 'fille'],
    suggestions: [
      { title: 'Unité et paix dans la famille', verse: 'Psaume 133:1' },
      { title: 'Sagesse parentale dans l\'éducation', verse: 'Proverbes 22:6' },
      { title: 'Protection des enfants contre les influences négatives', verse: 'Ésaïe 54:13' },
      { title: 'Restauration de la communication dans le couple', verse: 'Éphésiens 4:32' },
      { title: 'Amour inconditionnel entre les membres', verse: '1 Corinthiens 13:4-7' },
    ],
  },
  {
    keywords: ['finances', 'argent', 'dette', 'pauvreté', 'provision', 'besoins', 'loyer', 'factures', 'dépenses', 'revenu', 'salaire', 'bénédiction'],
    suggestions: [
      { title: 'Provision divine pour les besoins quotidiens', verse: 'Philippiens 4:19' },
      { title: 'Sagesse dans la gestion des finances', verse: 'Proverbes 21:5' },
      { title: 'Libération du piège de l\'endettement', verse: 'Deutéronome 28:12' },
      { title: 'Esprit de contentement et de gratitude', verse: '1 Timothée 6:6' },
      { title: 'Générosité envers ceux dans le besoin', verse: 'Luc 6:38' },
    ],
  },
  {
    keywords: ['études', 'examen', 'école', 'université', 'diplôme', 'formation', 'apprentissage', 'bourse', 'stage', 'étudiant', 'classe', 'professeur'],
    suggestions: [
      { title: 'Sagesse et intelligence pour les études', verse: 'Jacques 1:5' },
      { title: 'Concentration et mémoire lors des examens', verse: 'Proverbes 2:6' },
      { title: 'Faveur auprès des enseignants', verse: 'Daniel 1:17' },
      { title: 'Persévérance face aux difficultés académiques', verse: 'Galates 6:9' },
      { title: 'Guidance divine sur la vocation', verse: 'Jérémie 29:11' },
    ],
  },
  {
    keywords: ['église', 'pasteur', 'ministère', 'culte', 'évangélisation', 'mission', 'prédication', 'cellule', 'revival', 'réveil', 'communauté', 'frères'],
    suggestions: [
      { title: 'Unité et amour entre les membres', verse: 'Jean 17:21' },
      { title: 'Onction sur les leaders et pasteurs', verse: 'Actes 1:8' },
      { title: 'Réveil spirituel dans la congrégation', verse: '2 Chroniques 7:14' },
      { title: 'Protection contre les divisions et faux enseignements', verse: 'Romains 16:17' },
      { title: 'Multiplication des disciples et conversions', verse: 'Matthieu 28:19' },
    ],
  },
  {
    keywords: ['paix', 'anxiété', 'angoisse', 'peur', 'stress', 'inquiétude', 'dépression', 'découragement', 'tristesse', 'pleure', 'souffre', 'mental'],
    suggestions: [
      { title: 'Paix qui surpasse tout entendement', verse: 'Philippiens 4:7' },
      { title: 'Délivrance de la peur et de l\'anxiété', verse: '2 Timothée 1:7' },
      { title: 'Joie du Seigneur comme force', verse: 'Néhémie 8:10' },
      { title: 'Renouvellement de l\'esprit et des pensées', verse: 'Romains 12:2' },
      { title: 'Présence consolatrice de l\'Esprit Saint', verse: 'Jean 14:16' },
    ],
  },
  {
    keywords: ['nation', 'gouvernement', 'politique', 'président', 'pays', 'guerre', 'paix', 'conflit', 'corruption', 'justice', 'dirigeant', 'autorité'],
    suggestions: [
      { title: 'Sagesse pour les dirigeants du pays', verse: 'Proverbes 11:14' },
      { title: 'Justice et intégrité dans le gouvernement', verse: 'Psaume 72:2' },
      { title: 'Paix et réconciliation entre les peuples', verse: 'Matthieu 5:9' },
      { title: 'Protection des innocents et des vulnérables', verse: 'Psaume 82:3' },
      { title: 'Évangile libre de circuler dans le pays', verse: '2 Thessaloniciens 3:1' },
    ],
  },
  {
    keywords: ['salut', 'conversion', 'non-croyant', 'incrédule', 'perdu', 'témoignage', 'évangile', 'repentance', 'retour', 'prodigal'],
    suggestions: [
      { title: 'Ramollissement du cœur de la personne', verse: 'Ézéchiel 36:26' },
      { title: 'Ouvriers du Seigneur envoyés vers eux', verse: 'Matthieu 9:38' },
      { title: 'Rencontres providentielles avec des témoins', verse: 'Actes 8:29' },
      { title: 'Repentance et retour aux sources de foi', verse: 'Luc 15:20' },
      { title: 'Destruction des forteresses spirituelles qui retiennent', verse: '2 Corinthiens 10:4' },
    ],
  },
  {
    keywords: ['protection', 'danger', 'accident', 'ennemi', 'attaque', 'voyage', 'sécurité', 'route', 'mal', 'démon', 'oppression', 'délivrance'],
    suggestions: [
      { title: 'Protection angélique au quotidien', verse: 'Psaume 91:11' },
      { title: 'Couverture spirituelle pour les voyages', verse: 'Psaume 121:8' },
      { title: 'Délivrance de toute oppression spirituelle', verse: 'Ésaïe 54:17' },
      { title: 'Discernement face aux pièges de l\'ennemi', verse: 'Éphésiens 6:11' },
      { title: 'Paix à la maison et dans l\'environnement', verse: 'Job 5:24' },
    ],
  },
];

const EVOLUTION_SUGGESTIONS = [
  { trigger: ['mieux', 'amélioration', 'améliore', 'progresse', 'positif'], suggestions: [
    { title: 'Action de grâce pour les progrès observés', verse: 'Psaume 107:1' },
    { title: 'Persévérance pour aller jusqu\'à la victoire totale', verse: 'Galates 6:9' },
  ]},
  { trigger: ['pire', 'aggravé', 'difficile', 'dur', 'rien', 'toujours pas', 'pas de changement'], suggestions: [
    { title: 'Foi inébranlable malgré l\'absence visible de réponse', verse: 'Hébreux 11:1' },
    { title: 'Force pour tenir dans l\'attente', verse: 'Ésaïe 40:31' },
    { title: 'Confiance dans le timing parfait de Dieu', verse: 'Ecclésiaste 3:11' },
  ]},
  { trigger: ['exaucé', 'répondu', 'miracle', 'guéri', 'obtenu', 'réalisé', 'accompli'], suggestions: [
    { title: 'Témoignage public de la fidélité de Dieu', verse: 'Psaume 40:5' },
    { title: 'Intercession pour que d\'autres vivent la même grâce', verse: '1 Jean 5:14' },
  ]},
];

function normalize(text) {
  return text.toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function getRecommendations(text, type = 'new') {
  if (!text || text.trim().length < 3) return [];

  const normalized = normalize(text);
  const matched = new Set();
  const results = [];

  if (type === 'evolution') {
    for (const group of EVOLUTION_SUGGESTIONS) {
      if (group.trigger.some((t) => normalized.includes(normalize(t)))) {
        for (const s of group.suggestions) {
          if (!matched.has(s.title)) {
            matched.add(s.title);
            results.push(s);
          }
        }
      }
    }
    if (results.length > 0) return results.slice(0, 3);
  }

  for (const theme of THEMES) {
    const hits = theme.keywords.filter((k) => normalized.includes(normalize(k)));
    if (hits.length > 0) {
      for (const s of theme.suggestions) {
        if (!matched.has(s.title)) {
          matched.add(s.title);
          results.push({ ...s, _hits: hits.length });
        }
      }
    }
  }

  results.sort((a, b) => (b._hits || 0) - (a._hits || 0));
  return results.slice(0, 4);
}
