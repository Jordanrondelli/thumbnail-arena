# Thumbnail Arena

A/B testing de miniatures YouTube par duels rapides. Tes participants votent en 1,5s, et tu obtiens un classement par score composite (Win Rate + Vitesse + Mémorisation).

## Stack

- **Frontend** : React 18 + Vite
- **Backend** : Express.js + SQLite (better-sqlite3)
- **Upload** : Multer
- **Déploiement** : Render

## Lancer en local

```bash
# Installer les dépendances
npm install
cd client && npm install && cd ..

# Lancer en dev (serveur + client)
npm run dev
```

Le client tourne sur `http://localhost:5173`, le serveur sur `http://localhost:3001`.

## Mot de passe par défaut

Le mot de passe admin par défaut est `admin123`. Tu peux le changer via l'API :

```bash
curl -X POST http://localhost:3001/api/config/password \
  -H "Content-Type: application/json" \
  -H "x-admin-password: admin123" \
  -d '{"newPassword": "ton_nouveau_mdp"}'
```

## Déploiement sur Render

### Méthode 1 — Via render.yaml (recommandée)

1. Pousse le code sur un repo GitHub
2. Va sur [Render Dashboard](https://dashboard.render.com)
3. Clique **New > Blueprint** et connecte ton repo
4. Render détecte le `render.yaml` et configure tout automatiquement
5. **Important** : ajoute un **Disk** dans les settings du service pour persister la base SQLite et les uploads

### Méthode 2 — Configuration manuelle

1. **New > Web Service** sur Render
2. Connecte ton repo GitHub
3. Configure :
   - **Build Command** : `npm install && cd client && npm install && npm run build`
   - **Start Command** : `npm start`
   - **Environment** : `NODE_ENV=production`
4. Ajoute un **Disk** :
   - Mount Path : `/opt/render/project/src/server/data`
   - Size : 1 GB
5. Ajoute un second **Disk** pour les uploads :
   - Mount Path : `/opt/render/project/src/server/uploads`
   - Size : 1 GB

### Note sur la persistance

Render utilise des containers éphémères. Sans Disk, tes données SQLite et uploads seront perdues à chaque redéploiement. Les Disks sont disponibles sur les plans payants (à partir de Starter, ~7$/mois).

## Structure du projet

```
thumbnail-arena/
├── client/                 # Frontend React + Vite
│   ├── src/
│   │   ├── components/     # Navbar, LoginGate, RadarChart
│   │   ├── views/          # BackOffice, Participant, Results
│   │   ├── hooks/          # useAuth
│   │   ├── utils/          # api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   └── vite.config.js
├── server/
│   ├── index.js            # Express server
│   ├── api.js              # Routes API
│   ├── db.js               # SQLite schema + connection
│   ├── uploads/            # Images uploadées
│   └── data/               # Base SQLite
├── render.yaml             # Config Render Blueprint
└── package.json
```

## API Endpoints

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/api/auth` | - | Vérifier le mot de passe |
| GET | `/api/thumbnails` | Admin | Lister les miniatures |
| POST | `/api/thumbnails` | Admin | Upload de miniatures |
| DELETE | `/api/thumbnails/:id` | Admin | Supprimer une miniature |
| GET | `/api/config` | - | État du test (actif/inactif) |
| POST | `/api/config/activate` | Admin | Activer le test |
| POST | `/api/config/deactivate` | Admin | Désactiver le test |
| POST | `/api/config/reset` | Admin | Réinitialiser les données |
| GET | `/api/session/pairs` | - | Obtenir les paires de duels |
| POST | `/api/session/:id/duels` | - | Soumettre les résultats de duels |
| POST | `/api/session/:id/memory` | - | Soumettre le test mémoire |
| GET | `/api/results` | Admin | Obtenir les résultats complets |

## Score composite

```
Score = Win Rate × 0.50 + Vitesse normalisée × 0.35 + Score mémorisation × 0.15
```

- **Win Rate** : % de duels gagnés
- **Vitesse normalisée** : (2800 - temps moyen ms) / (2800 - 500), clampée [0, 1]
- **Score mémorisation** : fois reconnue / fois testée
- Sessions filtrées si temps médian < 500ms ou > 2800ms
