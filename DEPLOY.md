# Deploy to GitHub

Repository: https://github.com/Prafullahire/onboarding_reviewer

## Option 1 — Double-click script (Windows)

1. Open Command Prompt in the project folder
2. Run:

```bat
deploy-github.bat
```

3. Enter GitHub credentials if prompted

## Option 2 — Manual commands

```bash
cd c:\Users\prafull.ahire\Desktop\Assessent

git init
git branch -M main
git remote add origin https://github.com/Prafullahire/onboarding_reviewer.git

git add .
git commit -m "feat: multi-agent onboarding case reviewer - full stack application"

git push -u origin main --force
```

> `--force` overwrites the empty README-only commit on GitHub with the full project.

## Before pushing — verify

- `.env` is NOT committed (only `.env.example` should be in the repo)
- `node_modules/` is NOT committed

```bash
git status
```

## After push

Your repo will contain:
- Complete source code (frontend + backend)
- README.md with full documentation
- SETUP.md with setup instructions
- `.env.example`
- `data/samples/` synthetic test cases
- Database schema and seed scripts
- 17 automated tests
