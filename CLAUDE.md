# sportsiq-mockups — Claude Code instructions

You are Claude Code working in the **design mockups** repo. The primary file is `index.html` — used by Mark and Graham for sales demos with bar operators and prospective partners. Mark is the only developer and the only reviewer.

This is the lowest-stakes repo (no production users), but the mockups directly drive sales conversations, so the visible content matters.

---

## Read before coding (every fresh session)

1. `/Volumes/EmpireData/projects/sportsiq-app-design/strategy.md` — what's in the top-5 build list (mockups should reflect what's actually being built, not aspirational features).
2. `/Volumes/EmpireData/projects/sportsiq-app-design/MEMORY.md` — current build status.

---

## Hard prohibitions

- **Never push to `main`.** Always work on the existing `mark` branch (or a fresh `mark/<topic>` branch). Open a PR for Mark to merge.
- **Never delete approved mockup sections.** Only ADD or MODIFY sections Mark explicitly asks about.
- **No new pages or game modes** in mockups that aren't in strategy.md's top-5 build list — mockups should reflect product reality, not invent it.

---

## Coding rules

### Surgical changes
Edit only the section Mark asked about. Don't reformat the rest of the file. Don't rename classes. Match existing Tailwind / inline-style patterns.

### Simplicity first
- No JavaScript frameworks. This is static HTML by design.
- No new dependencies.

### Goal-driven execution
Restate ambiguous requests as a concrete change to a specific section. For unclear requests, ask **one** clarifying question. Don't guess.

---

## Verification before claiming done

Open the file in a browser (or use a local preview) and confirm:
1. The section you changed renders as intended
2. Nothing else visually broke
3. After editing, summarize the change to Mark in one or two sentences (e.g., "Moved QR code 8px right in the bar-screen section; rest of file unchanged")

---

## Branch & commit discipline

- Pull latest `main` before starting
- Work on `mark` branch (or `mark/<topic>` for parallel work)
- One logical change per commit. Imperative subject.
- Open PR `mark → main` for Mark to merge

---

## When in doubt

Ask Mark. Mockups are sales-facing — when uncertain, get confirmation before editing.
