# Contributing to CrickBox 🏏

Welcome! This guide will help you get set up and start contributing.

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/ashwkun/crickbox.git
cd crickbox
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Environment Variables
1. Copy the example env file:
   ```bash
   cp .env.example .env.local
   ```
2. Ask the project owner for the actual Firebase credentials
3. Paste them into your `.env.local` file

### 4. Run Locally
```bash
npm start
```

---

## 🌿 Git Workflow

We use **branch protection** on `main`. All changes must go through pull requests.

### Creating a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### Pushing Your Work
```bash
git add .
git commit -m "feat: describe your changes"
git push origin feature/your-feature-name
```

### Opening a Pull Request
1. Go to the [repository on GitHub](https://github.com/ashwkun/crickbox)
2. Click "Compare & pull request"
3. Describe your changes and submit

---

## 🔥 Firebase Deployment

### Deploy to Dev Environment
Always deploy to the dev site for testing:
```bash
npm run deploy:dev
```

This deploys to **boxcric-dev.web.app**.

### First Time Setup
1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login to Firebase: `firebase login`
3. You should be added as a collaborator on the Firebase project

---

## 📁 Project Structure

```
boxcric/
├── src/
│   ├── components/    # React components
│   ├── utils/         # Helper functions
│   └── firebase.ts    # Firebase config
├── dist/              # Build output (don't edit)
└── firebase.json      # Firebase hosting config
```

---

## ❓ Need Help?

Reach out to the project owner if you have questions!
