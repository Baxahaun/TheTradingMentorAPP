# Development Steering - Trading Mentor

> ⚠️ **PRIORITY**: Read this file BEFORE starting any development work.

## Pre-Work Checklist

Before executing ANY task, every agent MUST:

1. **Read the Roadmap**: `docs/ROADMAP.md`
2. **Check Task Status**: `.agent/tasks/STATUS.md`
3. **Identify Current Phase**: Determine which Q/phase we're in
4. **Verify Dependencies**: Ensure prerequisite tasks are complete
5. **Update Status**: Mark tasks as in-progress before starting

---

## Project Context

This project is being transformed from a personal trading journal (Zella Trade Scribe) into a **full SaaS product** called **Trading Mentor**.

### Current State (December 2025)
- ✅ App deployed at: https://trading-mentor-2024.web.app
- ✅ Firebase configured (Auth + Firestore)
- 🟡 SaaS infrastructure: NOT YET IMPLEMENTED
- 🟡 Payment system: NOT YET IMPLEMENTED
- 🟡 AI features: NOT YET IMPLEMENTED

---

## Development Priorities

### Immediate (Q1 2026)
1. `/branding` - Rename from "Zella Trade Scribe" to custom branding
2. `/backoffice-saas` - Admin panel + user management
3. Stripe integration - Payment processing

### Next (Q2 2026)  
4. `/ai-features` Phase 1 - Daily Insights, Sentiment Analysis

---

## Workflows Available

| Command | When to Use |
|---------|-------------|
| `/branding` | Changing app name, colors, logos |
| `/backoffice-saas` | Building admin panel, Stripe, plans |
| `/ai-features` | Implementing AI capabilities |

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `docs/ROADMAP.md` | Full development roadmap |
| `.agent/tasks/STATUS.md` | Current task status |
| `.agent/workflows/*.md` | Executable workflows |
| `.env` | Environment variables |
| `firebase.json` | Firebase configuration |

---

## After Completing Work

1. **Update `.agent/tasks/STATUS.md`** with completed items
2. **Test the changes** locally or in staging
3. **Document any blockers** or issues found
4. **Commit with descriptive messages**

---

## Important Notes

- **Firebase Project**: `trading-mentor-2024`
- **Hosting URL**: https://trading-mentor-2024.web.app
- **Console**: https://console.firebase.google.com/project/trading-mentor-2024
- **Original Repo**: https://github.com/riccorohl/trading-journal (read-only reference)
