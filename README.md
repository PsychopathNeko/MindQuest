# MindQuest 心灵探索

> Free, open-source bilingual psychology self-assessment platform.
>
> 免费开源的中英双语心理自评平台。

[Live Demo](https://mindquest-psychopathneko.vercel.app) · [量表列表](#scales)

---

## Features / 功能特点

- **157+ Validated Scales** — Covers depression, anxiety, stress, personality, sleep, and more
- **Bilingual** — Full Chinese & English support, switchable anytime
- **Privacy First** — All data stored locally in your browser, no server, no login
- **Dark Mode** — System / Light / Dark toggle
- **Smart Recommendations** — Suggests related scales based on your history
- **Assessment Queue** — Batch multiple scales for sequential completion
- **Visual Reports** — Bar, radar, gauge charts with score trends over time
- **PWA** — Installable as a standalone app on mobile
- **Responsive** — Works on desktop, tablet, and mobile

## Tech Stack / 技术栈

- **Framework**: Vue 3 (Composition API, `<script setup>`)
- **Build**: Vite
- **Charts**: ECharts
- **Styling**: CSS Custom Properties (no UI framework)
- **Deployment**: Vercel / GitHub Pages

## Quick Start / 快速开始

```bash
git clone https://github.com/PsychopathNeko/mindquest.git
cd mindquest
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Project Structure / 项目结构

```
src/
├── views/              # Page views (Home, Assessment, Report, History)
├── components/
│   ├── common/         # Header, Sidebar, TagFilter, ScaleCard
│   ├── questions/      # LikertQuestion, YesNoQuestion, SingleChoice
│   └── report/         # BarChart, RadarChart, GaugeChart, Timeline
├── composables/        # Reactive logic (useAssessment, useTheme, etc.)
├── engine/             # Scoring & report generation
├── router/             # Vue Router config
└── assets/styles/      # CSS variables, global styles

public/data/scales/     # 157 scale definitions (JSON, zh + en)
```

## Scales / 量表 {#scales}

157 scales across 5 categories:

| Category | Examples |
|----------|----------|
| **Mood & Stress** 情绪与压力 | PHQ-9, GAD-7, DASS-21, PSS-10, HADS, CES-D, K10 |
| **Personality & Cognition** 人格与认知 | BFI-10, TIPI, Rosenberg, NPI-16, BIS-15, SD3 |
| **Social & Relationships** 人际与社交 | ECR-RS, LSNS-6, SPIN, LSAS-SR, SSOSH |
| **Body & Lifestyle** 身体与习惯 | ISI, PSQI, ESS, EAT-26, AUDIT, CAGE, FSS-9 |
| **Positive Psychology** 积极心理 | WHO-5, SWLS, PERMA, CD-RISC-10, FFMQ-15, GQ-6 |

All scales are public domain or free-to-use validated instruments.

## Adding a Scale / 添加量表

Each scale is a JSON file in `public/data/scales/`. Create `{id}.zh.json` and `{id}.en.json`, then register in `_index.json`.

See any existing scale file (e.g., `phq-9.zh.json`) for the format:
- `meta` — name, description, author, instruction
- `questions` — array of items with text and type
- `commonChoices` — shared response options
- `scoring` — method, subscales, reverse items
- `interpretation` — score ranges with labels and suggestions

## License

MIT

## Disclaimer / 免责声明

本站量表仅供自我了解参考，不构成医学诊断。如有心理健康困扰，请咨询专业人士。

Scales on this site are for self-understanding only and do not constitute medical diagnosis. Please consult a professional for mental health concerns.
