# Third-Party Licenses and Attributions

## Original Codebase

This project is based on **Zella Trade Scribe** by riccorohl.

- **Repository**: https://github.com/riccorohl/trading-journal
- **License**: MIT License
- **Copyright**: © 2024-2025 riccorohl

The original MIT license allows for modification, distribution, and commercial use.

---

## Proprietary Components

The following components are proprietary to **Trading Mentor** (Baxahaun) and are NOT covered by the MIT license:

### SaaS Infrastructure
- `.agent/` - Agent instructions and workflows
- `docs/ROADMAP.md` - Development roadmap
- `functions/src/` - Cloud Functions (Stripe, AI, etc.)

### Admin Panel (when implemented)
- `src/pages/admin/` - Admin dashboard and management
- `src/services/adminService.ts` - Admin operations
- `src/types/admin.ts` - Admin type definitions

### Payment System (when implemented)
- `src/services/stripeService.ts` - Stripe integration
- `src/config/plans.ts` - Subscription plans

### AI Features (when implemented)
- `src/services/ai*.ts` - AI services
- `src/components/widgets/AI*.tsx` - AI widgets
- `functions/src/ai*.ts` - AI Cloud Functions

---

## How to Identify Proprietary Code

Files created after December 24, 2025 that fall into the categories above are proprietary.

You can check file creation dates via git:
```bash
git log --diff-filter=A --format='%ai %an' -- <filepath>
```

---

## Contact

For licensing inquiries regarding proprietary components:
- GitHub: @Baxahaun
- Project: https://github.com/Baxahaun/TheTradingMentorAPP
