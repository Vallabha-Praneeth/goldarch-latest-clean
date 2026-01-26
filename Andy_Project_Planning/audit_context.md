# Audit Context Bundle

Generated: 2026-01-09 10:07:06

Root: `/Users/anitavallabha/goldarch-web`

- Total files: **1159**
- Total size: **14879853 bytes**
- Plan docs embedded: **0**
- Manifests embedded: **0**
- TODO hits: **12** (capped)

## Settings used

```json
{
  "include_plan_docs": true,
  "include_manifests": false,
  "include_todos": true,
  "top_files": 30,
  "todo_hits_cap": 200,
  "max_file_bytes": 200000
}
```

## Tree (truncated)

```text
goldarch-web/
├── .claude/
│   └── settings.local.json
├── .vercel/
│   ├── project.json
│   └── README.txt
├── activity_page/
│   ├── Activities.tsx
│   ├── ActivityFormDialog.tsx
│   ├── App-2.tsx
│   ├── DashboardLayout-3.tsx
│   └── DeleteConfirmDialog-3.tsx
├── add_pages/
│   ├── activity_page/
│   │   ├── Activities.tsx
│   │   ├── ActivityFormDialog.tsx
│   │   ├── App-2.tsx
│   │   ├── DashboardLayout-3.tsx
│   │   └── DeleteConfirmDialog-3.tsx
│   ├── auth_page/
│   │   ├── DashboardLayout.tsx
│   │   ├── DealFormDialog.tsx
│   │   ├── Deals.tsx
│   │   ├── DeleteConfirmDialog.tsx
│   │   ├── ProjectFormDialog.tsx
│   │   ├── Projects.tsx
│   │   ├── SupplierFormDialog.tsx
│   │   └── Suppliers.tsx
│   ├── quote_page/
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── Index.tsx
│   │   ├── main.tsx
│   │   ├── NotFound.tsx
│   │   ├── QuoteCard.tsx
│   │   ├── QuoteDetail.tsx
│   │   ├── Quotes.tsx
│   │   ├── tailwind.config.ts
│   │   ├── useQuotes.ts
│   │   └── utils.ts
│   ├── remix-of-stark-architect-showcase-main/
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   ├── placeholder.svg
│   │   │   └── robots.txt
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   ├── data/
│   │   │   ├── hooks/
│   │   │   ├── integrations/
│   │   │   ├── lib/
│   │   │   ├── pages/
│   │   │   ├── App.css
│   │   │   ├── App.tsx
│   │   │   ├── index.css
│   │   │   ├── main.tsx
│   │   │   └── vite-env.d.ts
│   │   ├── supabase/
│   │   │   ├── migrations/
│   │   │   └── config.toml
│   │   ├── .env
│   │   ├── .gitignore
│   │   ├── bun.lockb
│   │   ├── components.json
│   │   ├── eslint.config.js
│   │   ├── index.html
│   │   ├── package-lock.json
│   │   ├── package.json
│   │   ├── postcss.config.js
│   │   ├── README.md
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   └── vite.config.ts
│   ├── task_managment_page/
│   │   ├── App.tsx
│   │   ├── DashboardLayout-2.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── DealFormDialog.tsx
│   │   ├── Deals.tsx
│   │   ├── DeleteConfirmDialog-2.tsx
│   │   ├── DeleteConfirmDialog.tsx
│   │   ├── ProjectFormDialog.tsx
│   │   ├── Projects.tsx
│   │   ├── SupplierFormDialog.tsx
│   │   ├── Suppliers.tsx
│   │   ├── TaskFormDialog.tsx
│   │   └── Tasks.tsx
│   └── .DS_Store
├── app/
│   ├── api/
│   │   ├── framework-b/
│   │   │   ├── chat/
│   │   │   ├── documents/
│   │   │   ├── health/
│   │   │   └── README.md
│   │   ├── send-invite/
│   │   │   └── route.js
│   │   ├── send-notification/
│   │   │   └── route.js
│   │   └── send-quote/
│   │       └── route.js
│   ├── app-dashboard/
│   │   ├── activities/
│   │   │   └── page.tsx
│   │   ├── deals/
│   │   │   └── page.tsx
│   │   ├── documents/
│   │   │   └── page.tsx
│   │   ├── projects/
│   │   │   └── page.tsx
│   │   ├── quotes/
│   │   │   └── page.tsx
│   │   ├── suppliers/
│   │   │   └── page.tsx
│   │   ├── tasks/
│   │   │   └── page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── auth/
│   │   └── page.tsx
│   ├── category/
│   │   └── [category]/
│   │       └── page.js
│   ├── dashboard/
│   │   └── page.js
│   ├── debug/
│   │   └── page.js
│   ├── supplier/
│   │   └── [id]/
│   │       └── page.js
│   ├── test/
│   │   └── page.js
│   ├── globals.css
│   ├── layout.js
│   └── page.tsx
├── apply_theme/
│   ├── app/
│   │   ├── category/
│   │   │   └── [category]/
│   │   ├── dashboard/
│   │   │   └── page.js
│   │   ├── debug/
│   │   │   └── page.js
│   │   ├── supplier/
│   │   │   └── [id]/
│   │   ├── test/
│   │   │   └── page.js
│   │   ├── globals.css
│   │   ├── layout.js
│   │   └── page.js
│   ├── lib/
│   │   ├── supabase.js
│   │   ├── theme-context.js
│   │   └── use-suppliers.js
│   ├── public/
│   │   ├── apple-icon.png
│   │   ├── icon-dark-32x32.png
│   │   ├── icon-light-32x32.png
│   │   ├── icon.svg
│   │   ├── placeholder-logo.png
│   │   ├── placeholder-logo.svg
│   │   ├── placeholder-user.jpg
│   │   ├── placeholder.jpg
│   │   └── placeholder.svg
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   └── tailwind.config.js
├── auth_page/
│   ├── DashboardLayout.tsx
│   ├── DealFormDialog.tsx
│   ├── Deals.tsx
│   ├── DeleteConfirmDialog.tsx
│   ├── ProjectFormDialog.tsx
│   ├── Projects.tsx
│   ├── SupplierFormDialog.tsx
│   └── Suppliers.tsx
├── chat-bot_framework/
│   ├── Modular_Multi-AI_Project_Plan_Skeleton_Architecture.md
│   ├── Plan_for_Building_an_AI-Powered_Chatbot_Platform.md
│   ├── RAG Workflow For( Customer service chat-bot) copy.json
│   ├── RAG Workflow For( Customer service chat-bot).json
│   ├── RAG_Customer_Service_Chatbot_Business_Overview.docx
│   ├── RAG_Customer_Service_Chatbot_Business_Overview.pdf
│   ├── RAG_Customer_Service_Chatbot_Technical_Documentation.docx
│   └── RAG_Customer_Service_Chatbot_Technical_Documentation.pdf
├── components/
│   ├── landing/
│   │   ├── Categories.tsx
│   │   ├── CTA.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Features.tsx
│   │   ├── Footer.tsx
│   │   ├── Header.tsx
│   │   └── Hero.tsx
│   ├── ui/
│   │   ├── accordion.tsx
│   │   ├── alert-dialog.tsx
│   │   ├── alert.tsx
│   │   ├── aspect-ratio.tsx
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── button.tsx
│   │   ├── calendar.tsx
│   │   ├── card.tsx
│   │   ├── checkbox.tsx
│   │   ├── collapsible.tsx
│   │   ├── context-menu.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── form.tsx
│   │   ├── hover-card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── menubar.tsx
│   │   ├── navigation-menu.tsx
│   │   ├── popover.tsx
│   │   ├── progress.tsx
│   │   ├── radio-group.tsx
│   │   ├── scroll-area.tsx
│   │   ├── select.tsx
│   │   ├── separator.tsx
│   │   ├── sheet.tsx
│   │   ├── sidebar.tsx
│   │   ├── skeleton.tsx
│   │   ├── slider.tsx
│   │   ├── sonner.tsx
│   │   ├── switch.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── toast.tsx
│   │   ├── toaster.tsx
│   │   ├── toggle-group.tsx
│   │   ├── toggle.tsx
│   │   ├── tooltip.tsx
│   │   └── use-toast.ts
│   ├── ai-chat-widget.tsx
│   ├── document-filters.tsx
│   ├── document-summary-modal.tsx
│   └── providers.tsx
├── docs/
│   ├── TECHNICAL_DOCUMENTATION.docx
│   ├── TECHNICAL_DOCUMENTATION.md
│   ├── USER_MANUAL.docx
│   └── USER_MANUAL.md
├── Framework_B/
│   ├── api/
│   │   ├── chat/
│   │   │   └── route.example.ts
│   │   ├── documents/
│   │   └── search/
│   ├── config/
│   │   ├── ai-services.config.ts
│   │   ├── n8n-workflows.config.ts
│   │   └── pinecone.config.ts
│   ├── hooks/
│   │   ├── useAIChat.ts
│   │   ├── useDocumentProcessor.ts
│   │   └── useVectorSearch.ts
│   ├── n8n-workflows/
│   │   ├── chatbot-qa.json
│   │   └── document-ingestion.json
│   ├── services/
│   │   ├── ai-chat/
│   │   ├── document-processor/
│   │   ├── embeddings/
│   │   ├── rag/
│   │   └── vector-store/
│   ├── tests/
│   │   └── integration/
│   │       └── text-splitter.test.ts
│   ├── types/
│   │   ├── document.types.ts
│   │   ├── embeddings.types.ts
│   │   └── rag.types.ts
│   ├── utils/
│   │   └── text-splitter.ts
│   ├── .env.example
│   ├── ARCHITECTURE.md
│   ├── index.ts
│   ├── INTEGRATION_GUIDE.md
│   ├── package.json
│   ├── QUICKSTART.md
│   ├── README.md
│   └── SUMMARY.md
├── Framework_B_Implementation/
│   ├── config/
│   │   ├── ai-services.config.ts
│   │   ├── n8n-workflows.config.ts
│   │   └── pinecone.config.ts
│   ├── lib/
│   │   └── services.ts
│   ├── services/
│   │   ├── ai-chat/
│   │   │   ├── ChatService.ts
│   │   │   └── index.ts
│   │   ├── document-processor/
│   │   │   ├── extractors/
│   │   │   ├── DocumentProcessor.ts
│   │   │   └── index.ts
│   │   ├── document-summarizer/
│   │   │   └── DocumentSummarizer.ts
│   │   ├── embeddings/
│   │   │   ├── providers/
│   │   │   ├── batch.ts
│   │   │   ├── cache.ts
│   │   │   └── EmbeddingsService.ts
│   │   ├── rag/
│   │   │   ├── answer-generator.ts
│   │   │   ├── citation-tracker.ts
│   │   │   ├── context-retriever.ts
│   │   │   ├── prompt-builder.ts
│   │   │   ├── query-processor.ts
│   │   │   └── RAGEngine.ts
│   │   └── vector-store/
│   │       ├── namespace-manager.ts
│   │       ├── PineconeClient.ts
│   │       ├── query-builder.ts
│   │       └── VectorStore.ts
│   ├── types/
│   │   ├── document.types.ts
│   │   ├── embeddings.types.ts
│   │   └── rag.types.ts
│   ├── utils/
│   │   └── text-splitter.ts
│   ├── IMPLEMENTATION_SUMMARY.md
│   ├── index.ts
│   ├── README.md
│   └── SETUP.md
├── gold_arch_website/
│   ├── pics_of_the website/
│   │   └── .DS_Store
│   ├── public/
│   │   ├── placeholder.svg
│   │   └── robots.txt
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/
│   │   │   ├── ui/
│   │   │   ├── .DS_Store
│   │   │   └── NavLink.tsx
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Index.tsx
│   │   │   └── NotFound.tsx
│   │   ├── .DS_Store
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .DS_Store
│   ├── bun.lock
│   ├── components.json
│   ├── eslint.config.js
│   ├── gitignore.txt
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── README.md
│   ├── tailwind.config.ts
│   ├── tsconfig.app.json
│   ├── tsconfig.app.tsbuildinfo
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── tsconfig.node.tsbuildinfo
│   └── vite.config.ts
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── auth-provider.tsx
│   ├── document-indexer.ts
│   ├── query-provider.tsx
│   ├── supabase-client.ts
│   ├── supabase-types.ts
│   ├── supabase.js
│   ├── text-highlighter.tsx
│   ├── theme-context.js
│   ├── use-suppliers.js
│   └── utils.ts
├── pages/
├── public/
│   ├── favicon.ico
│   ├── placeholder.svg
│   └── robots.txt
├── quote_page/
│   ├── App.tsx
│   ├── index.css
│   ├── Index.tsx
│   ├── main.tsx
│   ├── NotFound.tsx
│   ├── QuoteCard.tsx
│   ├── QuoteDetail.tsx
│   ├── Quotes.tsx
│   ├── tailwind.config.ts
│   ├── useQuotes.ts
│   └── utils.ts
├── scripts/
│   ├── setup-pinecone.js
│   ├── test-pinecone.js
│   └── test-upsert.js
├── source_code/
│   ├── .DS_Store
│   ├── source_code.html
│   └── source_code.md
├── src/
│   ├── components/
│   │   ├── quotes/
│   │   │   ├── QuoteCard.tsx
│   │   │   └── QuoteComparison.tsx
│   │   ├── ui/
│   │   │   ├── accordion.tsx
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── alert.tsx
│   │   │   ├── aspect-ratio.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── breadcrumb.tsx
│   │   │   ├── button.tsx
│   │   │   ├── calendar.tsx
│   │   │   ├── card.tsx
│   │   │   ├── carousel.tsx
│   │   │   ├── chart.tsx
│   │   │   ├── checkbox.tsx
│   │   │   ├── collapsible.tsx
│   │   │   ├── command.tsx
│   │   │   ├── context-menu.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── drawer.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── hover-card.tsx
│   │   │   ├── input-otp.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── menubar.tsx
│   │   │   ├── navigation-menu.tsx
│   │   │   ├── pagination.tsx
│   │   │   ├── popover.tsx
│   │   │   ├── progress.tsx
│   │   │   ├── radio-group.tsx
│   │   │   ├── resizable.tsx
│   │   │   ├── scroll-area.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── sidebar.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── slider.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── switch.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── toast.tsx
│   │   │   ├── toaster.tsx
│   │   │   ├── toggle-group.tsx
│   │   │   ├── toggle.tsx
│   │   │   ├── tooltip.tsx
│   │   │   └── use-toast.ts
│   │   └── NavLink.tsx
│   ├── hooks/
│   │   ├── use-mobile.tsx
│   │   ├── use-toast.ts
│   │   └── useQuotes.ts
│   ├── integrations/
│   │   └── supabase/
│   │       ├── client.ts
│   │       └── types.ts
│   ├── lib/
│   │   └── utils.ts
│   ├── views/
│   │   ├── Index.tsx
│   │   ├── NotFound.tsx
│   │   ├── QuoteDetail.tsx
│   │   └── Quotes.tsx
│   ├── App.css
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── vite-env.d.ts
├── supabase/
│   └── config.toml
├── task_managment_page/
│   ├── App.tsx
│   ├── DashboardLayout-2.tsx
│   ├── DashboardLayout.tsx
│   ├── DealFormDialog.tsx
│   ├── Deals.tsx
│   ├── DeleteConfirmDialog-2.tsx
│   ├── DeleteConfirmDialog.tsx
│   ├── ProjectFormDialog.tsx
│   ├── Projects.tsx
│   ├── SupplierFormDialog.tsx
│   ├── Suppliers.tsx
│   ├── TaskFormDialog.tsx
│   └── Tasks.tsx
├── themes/
│   ├── cms-full-form-admin-dashboard-tailwind-templates/
│   │   ├── app/
│   │   │   ├── auth/
│   │   │   ├── blank/
│   │   │   ├── dashboard/
│   │   │   ├── dashboard-cms/
│   │   │   ├── dashboard-saas/
│   │   │   ├── plugins/
│   │   │   ├── settings/
│   │   │   ├── globals.css
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   ├── blank/
│   │   │   ├── cmsfullform/
│   │   │   ├── dashboard/
│   │   │   ├── dashboard-cms/
│   │   │   ├── dashboard-saas/
│   │   │   ├── plugins/
│   │   │   ├── settings/
│   │   │   ├── ui/
│   │   │   ├── theme-customizer.tsx
│   │   │   ├── theme-provider.tsx
│   │   │   └── theme-toggle.tsx
│   │   ├── hooks/
│   │   │   ├── use-mobile.tsx
│   │   │   └── use-toast.ts
│   │   ├── lib/
│   │   │   └── utils.ts
│   │   ├── public/
│   │   │   ├── apple-icon.png
│   │   │   ├── icon-dark-32x32.png
│   │   │   ├── icon-light-32x32.png
│   │   │   ├── icon.svg
│   │   │   ├── placeholder-logo.png
│   │   │   ├── placeholder-logo.svg
│   │   │   ├── placeholder-user.jpg
│   │   │   ├── placeholder.jpg
│   │   │   └── placeholder.svg
│   │   ├── styles/
│   │   │   └── globals.css
│   │   ├── .gitignore
│   │   ├── components.json
│   │   ├── next.config.mjs
│   │   ├── package.json
│   │   ├── pnpm-lock.yaml
│   │   ├── postcss.config.mjs
│   │   ├── tailwind.config.js
│   │   └── tsconfig.json
│   ├── material-dashboard-react-main/
│   │   ├── public/
│   │   │   ├── apple-icon.png
│   │   │   ├── favicon.png
│   │   │   ├── index.html
│   │   │   ├── manifest.json
│   │   │   └── robots.txt
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   ├── components/
│   │   │   ├── context/
│   │   │   ├── examples/
│   │   │   ├── layouts/
│   │   │   ├── App.js
│   │   │   ├── index.js
│   │   │   └── routes.js
│   │   ├── .eslintrc.json
│   │   ├── .gitignore
│   │   ├── .npmrc
│   │   ├── .prettierrc.json
│   │   ├── CHANGELOG.md
│   │   ├── genezio.yaml
│   │   ├── ISSUE_TEMPLATE.md
│   │   ├── jsconfig.json
│   │   ├── LICENSE.md
│   │   ├── package.json
│   │   └── README.md
│   └── skal-ventures-template/
│       ├── app/
│       │   ├── favicon.ico
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   └── page.tsx
│       ├── components/
│       │   ├── gl/
│       │   ├── ui/
│       │   ├── header.tsx
│       │   ├── hero.tsx
│       │   ├── logo.tsx
│       │   ├── mobile-menu.tsx
│       │   ├── pill.tsx
│       │   ├── theme-provider.tsx
│       │   └── utils.ts
… (tree truncated)
```

## Embedded docs

_None embedded (check settings)._ 

## Top files (largest)

| File | Size (bytes) |
|---|---:|
| `HONSOAR FRAMELESS CABINET LIST -2024.pdf` | 1768110 |
| `themes/material-dashboard-react-main/src/assets/images/illustrations/pattern-tree.svg` | 1759656 |
| `themes/material-dashboard-react-main/src/assets/images/home-decor-3.jpg` | 1159457 |
| `themes/material-dashboard-react-main/src/assets/images/home-decor-2.jpg` | 1088035 |
| `themes/material-dashboard-react-main/src/assets/images/home-decor-1.jpg` | 937206 |
| `themes/material-dashboard-react-main/src/assets/images/bg-sign-in-basic.jpeg` | 513703 |
| `themes/material-dashboard-react-main/src/assets/images/bg-profile.jpeg` | 317812 |
| `themes/material-dashboard-react-main/src/assets/images/bg-sign-up-cover.jpeg` | 317278 |
| `add_pages/remix-of-stark-architect-showcase-main/package-lock.json` | 247655 |
| `themes/material-dashboard-react-main/src/assets/images/bg-reset-cover.jpeg` | 238520 |
| `bun.lockb` | 198722 |
| `add_pages/remix-of-stark-architect-showcase-main/bun.lockb` | 197327 |
| `package-lock.json` | 173284 |
| `add_pages/remix-of-stark-architect-showcase-main/src/assets/hero-architecture.jpg` | 164687 |
| `gold_arch_website/tsconfig.app.tsbuildinfo` | 141735 |
| `gold_arch_website/bun.lock` | 119629 |
| `add_pages/remix-of-stark-architect-showcase-main/src/assets/blog-urban-planning.jpg` | 113086 |
| `add_pages/remix-of-stark-architect-showcase-main/src/assets/blog-sustainable-architecture.jpg` | 108441 |
| `docs/TECHNICAL_DOCUMENTATION.md` | 82852 |
| `docs/USER_MANUAL.md` | 72622 |
| `Plan_for_Building_an_AI-Powered_Chatbot_Platform.md` | 65171 |
| `chat-bot_framework/Plan_for_Building_an_AI-Powered_Chatbot_Platform.md` | 65171 |
| `apply_theme/package-lock.json` | 62823 |
| `add_pages/remix-of-stark-architect-showcase-main/src/assets/project-1.jpg` | 60803 |
| `themes/material-dashboard-react-main/src/assets/images/home-decor-4.jpeg` | 57641 |
| `chat-bot_framework/RAG_Customer_Service_Chatbot_Business_Overview.pdf` | 56884 |
| `add_pages/remix-of-stark-architect-showcase-main/src/assets/project-2.jpg` | 52641 |
| `chat-bot_framework/RAG_Customer_Service_Chatbot_Technical_Documentation.pdf` | 51144 |
| `add_pages/remix-of-stark-architect-showcase-main/src/assets/blog-minimalist-living.jpg` | 51107 |
| `gold_arch_website/tsconfig.node.tsbuildinfo` | 48202 |

## TODO / FIXME hits

| File | Line | Text |
|---|---:|---|
| `Framework_B/api/chat/route.example.ts` | 29 | // TODO: Implement actual RAG pipeline: |
| `deep_analysis_report.md` | 6 | - PDF/DOCX review adds evidence of authentication/secret handling concerns (mentions of auth, API keys, tokens) but no additional TODO/FIXME-style backlog items. |
| `gold_arch_website/index.html` | 6 | <!-- TODO: Set the document title to the name of your application --> |
| `gold_arch_website/index.html` | 11 | <!-- TODO: Update og:title to match your application name --> |
| `index.html` | 6 | <!-- TODO: Set the document title to the name of your application --> |
| `index.html` | 11 | <!-- TODO: Update og:title to match your application name --> |
| `source_code/source_code.html` | 7 | <!-- TODO: Set the document title to the name of your application --> |
| `source_code/source_code.html` | 12 | <!-- TODO: Update og:title to match your application name --> |
| `source_code/source_code.html` | 36 | <!-- TODO: Set the document title to the name of your application --> |
| `source_code/source_code.html` | 41 | <!-- TODO: Update og:title to match your application name --> |
| `themes/cms-full-form-admin-dashboard-tailwind-templates/components/plugins/allsite-seo/settings/content.tsx` | 710 | <Input placeholder="GA-XXXXXXXXX-X" className="h-8" /> |
| `themes/cms-full-form-admin-dashboard-tailwind-templates/components/plugins/allsite-seo/settings/content.tsx` | 714 | <Input placeholder="GTM-XXXXXXX" className="h-8" /> |
