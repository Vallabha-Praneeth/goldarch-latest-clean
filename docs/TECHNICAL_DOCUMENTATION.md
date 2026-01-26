# Gold.Arch Construction CRM - Technical Documentation

**Version:** 1.0.0
**Last Updated:** January 2026
**Document Type:** Technical Reference
**Audience:** Software Engineers, DevOps, System Administrators, Technical Architects

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Project Structure](#4-project-structure)
5. [Database Schema](#5-database-schema)
6. [Authentication & Authorization](#6-authentication--authorization)
7. [API Reference](#7-api-reference)
8. [Component Architecture](#8-component-architecture)
9. [Data Flow & Synchronization](#9-data-flow--synchronization)
10. [Configuration Management](#10-configuration-management)
11. [Deployment Guide](#11-deployment-guide)
12. [Security Considerations](#12-security-considerations)
13. [Performance Optimization](#13-performance-optimization)
14. [Testing Strategy](#14-testing-strategy)
15. [Troubleshooting Guide](#15-troubleshooting-guide)
16. [Appendices](#16-appendices)

---

## 1. Executive Summary

### 1.1 Purpose

Gold.Arch Construction CRM is a web-based supplier management and customer relationship management (CRM) application designed specifically for construction companies. The system centralizes supplier relationships, project management, deal tracking, and quote management into a unified platform.

### 1.2 Key Capabilities

| Capability | Description |
|------------|-------------|
| Supplier Management | 70+ verified construction partners with real-time data sync |
| Project Tracking | Complete project lifecycle management |
| Deal Pipeline | Sales and negotiation pipeline with stage tracking |
| Quote Management | Automated quote creation, tracking, and email delivery |
| Task Management | Team task assignment and progress tracking |
| Activity Logging | Comprehensive audit trail of all interactions |
| Real-time Sync | Bi-directional synchronization between web and mobile |

### 1.3 System Requirements

| Component | Minimum Requirement |
|-----------|---------------------|
| Node.js | v18.0.0 or higher |
| npm | v9.0.0 or higher |
| Browser | Chrome 90+, Firefox 88+, Safari 14+, Edge 90+ |
| Memory | 4GB RAM (8GB recommended) |
| Storage | 500MB for application, variable for data |

---

## 2. System Architecture

### 2.1 High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              GOLD.ARCH ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │   Web Client    │    │  Mobile Client  │    │   Admin Panel   │          │
│  │   (Next.js)     │    │   (React Native)│    │   (Dashboard)   │          │
│  └────────┬────────┘    └────────┬────────┘    └────────┬────────┘          │
│           │                      │                      │                    │
│           └──────────────────────┼──────────────────────┘                    │
│                                  │                                           │
│                                  ▼                                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │                         VERCEL EDGE NETWORK                           │  │
│  │  ┌─────────────────────────────────────────────────────────────────┐  │  │
│  │  │                    Next.js App Router                           │  │  │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │  │  │
│  │  │  │  API Routes │  │   Pages     │  │  Server Components      │  │  │  │
│  │  │  │  /api/*     │  │   /app/*    │  │  (SSR/SSG)              │  │  │  │
│  │  │  └─────────────┘  └─────────────┘  └─────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                  │                                           │
│           ┌──────────────────────┼──────────────────────┐                    │
│           │                      │                      │                    │
│           ▼                      ▼                      ▼                    │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐          │
│  │    Supabase     │    │     Resend      │    │   Third-Party   │          │
│  │   PostgreSQL    │    │  Email Service  │    │      APIs       │          │
│  │  + Auth + RT    │    │                 │    │                 │          │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘          │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Interaction Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                         REQUEST/RESPONSE FLOW                                 │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   User Action                                                                 │
│       │                                                                       │
│       ▼                                                                       │
│   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐              │
│   │  React Query  │────▶│   Supabase    │────▶│  PostgreSQL   │              │
│   │   useQuery    │     │    Client     │     │   Database    │              │
│   └───────────────┘     └───────────────┘     └───────────────┘              │
│          │                     │                     │                        │
│          │                     │                     │                        │
│          ▼                     ▼                     ▼                        │
│   ┌───────────────┐     ┌───────────────┐     ┌───────────────┐              │
│   │    Cache      │◀────│   PostgREST   │◀────│     RLS       │              │
│   │   (5 min)     │     │     API       │     │   Policies    │              │
│   └───────────────┘     └───────────────┘     └───────────────┘              │
│          │                                                                    │
│          ▼                                                                    │
│   ┌───────────────┐                                                          │
│   │   UI Update   │                                                          │
│   │  (Component)  │                                                          │
│   └───────────────┘                                                          │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Pages     │  │ Components  │  │    UI Library           │  │
│  │  (app/*)    │  │ (shadcn)    │  │   (Radix + Tailwind)    │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Hooks     │  │  Providers  │  │      Utilities          │  │
│  │ (useAuth)   │  │ (AuthCtx)   │  │    (lib/utils)          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                      DATA LAYER                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │ React Query │  │  Supabase   │  │      API Routes         │  │
│  │  (Cache)    │  │  (Client)   │  │      (/api/*)           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Vercel    │  │   Supabase  │  │        Resend           │  │
│  │  (Hosting)  │  │ (Database)  │  │       (Email)           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### 3.1 Frontend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.0 | React framework with App Router |
| React | 19.2.3 | UI component library |
| TypeScript | 5.9.3 | Type-safe JavaScript |
| Tailwind CSS | 3.4.19 | Utility-first CSS framework |
| Radix UI | Latest | Accessible component primitives |
| TanStack Query | 5.90.12 | Server state management |
| React Hook Form | 7.69.0 | Form state management |
| Zod | 4.2.1 | Schema validation |

### 3.2 Backend Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| Supabase | 2.89.0 | PostgreSQL + Auth + Real-time |
| PostgREST | Built-in | Auto-generated REST API |
| Resend | 6.6.0 | Transactional email service |

### 3.3 Development Tools

| Tool | Purpose |
|------|---------|
| ESLint | Code linting |
| PostCSS | CSS processing |
| Autoprefixer | CSS vendor prefixes |

### 3.4 Dependency Graph

```
                            ┌─────────────────┐
                            │    Next.js      │
                            │    (16.1.0)     │
                            └────────┬────────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
     ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
     │     React       │    │   TypeScript    │    │   Tailwind CSS  │
     │    (19.2.3)     │    │    (5.9.3)      │    │    (3.4.19)     │
     └────────┬────────┘    └─────────────────┘    └─────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
    ▼                   ▼
┌───────────┐    ┌────────────────┐
│ Radix UI  │    │ TanStack Query │
│ (shadcn)  │    │   (5.90.12)    │
└───────────┘    └────────────────┘
```

---

## 4. Project Structure

### 4.1 Directory Layout

```
goldarch-web/
├── app/                          # Next.js App Router
│   ├── api/                      # API endpoints
│   │   ├── send-quote/
│   │   │   └── route.js         # Quote email endpoint
│   │   ├── send-notification/
│   │   │   └── route.js         # Notification endpoint
│   │   └── send-invite/
│   │       └── route.js         # Invitation endpoint
│   ├── app-dashboard/           # Protected dashboard
│   │   ├── layout.tsx           # Dashboard layout
│   │   ├── page.tsx             # Dashboard home
│   │   ├── suppliers/
│   │   │   └── page.tsx         # Supplier management
│   │   ├── projects/
│   │   │   └── page.tsx         # Project management
│   │   ├── deals/
│   │   │   └── page.tsx         # Deal pipeline
│   │   ├── quotes/
│   │   │   └── page.tsx         # Quote management
│   │   ├── tasks/
│   │   │   └── page.tsx         # Task management
│   │   └── activities/
│   │       └── page.tsx         # Activity log
│   ├── auth/
│   │   └── page.tsx             # Authentication page
│   ├── layout.js                # Root layout
│   ├── page.tsx                 # Landing page
│   └── globals.css              # Global styles
├── components/
│   ├── landing/                 # Landing page components
│   │   ├── Header.tsx           # Navigation header
│   │   ├── Hero.tsx             # Hero section
│   │   ├── Features.tsx         # Feature showcase
│   │   ├── Categories.tsx       # Category grid
│   │   ├── Dashboard.tsx        # Dashboard preview
│   │   ├── CTA.tsx              # Call-to-action
│   │   └── Footer.tsx           # Footer
│   ├── ui/                      # shadcn-ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   └── ... (43+ components)
│   ├── providers.tsx            # Root providers
│   └── toaster.tsx              # Toast notifications
├── lib/
│   ├── auth-provider.tsx        # Auth context
│   ├── supabase-client.ts       # Supabase initialization
│   ├── supabase-types.ts        # Generated types
│   ├── query-provider.tsx       # React Query setup
│   ├── use-suppliers.js         # Supplier data hook
│   ├── theme-context.js         # Theme context
│   └── utils.ts                 # Utility functions
├── hooks/
│   ├── use-mobile.tsx           # Mobile detection
│   └── use-toast.ts             # Toast hook
├── public/                      # Static assets
├── docs/                        # Documentation
├── .env.local                   # Environment variables
├── next.config.js               # Next.js config
├── tailwind.config.js           # Tailwind config
├── tsconfig.json                # TypeScript config
└── package.json                 # Dependencies
```

### 4.2 File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Pages | `page.tsx` | `app/auth/page.tsx` |
| Layouts | `layout.tsx` | `app/app-dashboard/layout.tsx` |
| Components | PascalCase | `Header.tsx`, `Features.tsx` |
| Hooks | camelCase with `use` prefix | `use-mobile.tsx` |
| Utilities | kebab-case | `supabase-client.ts` |
| API Routes | `route.js` | `app/api/send-quote/route.js` |

---

## 5. Database Schema

### 5.1 Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           DATABASE ENTITY RELATIONSHIPS                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐            │
│   │   PROFILES   │────────▶│   PROJECTS   │◀────────│PROJECT_ACCESS│            │
│   │              │         │              │         │              │            │
│   │ id (PK)      │         │ id (PK)      │         │ id (PK)      │            │
│   │ email        │         │ name         │         │ user_id (FK) │            │
│   │ full_name    │         │ owner_id(FK) │         │ project_id   │            │
│   │ role         │         │ status       │         │ access_level │            │
│   │ company_name │         │ budget       │         │              │            │
│   └──────┬───────┘         └──────┬───────┘         └──────────────┘            │
│          │                        │                                              │
│          │                        │                                              │
│          │                        ▼                                              │
│          │              ┌──────────────┐         ┌──────────────┐               │
│          │              │PROJECT_FILES │         │PROJECT_BOM   │               │
│          │              │              │         │_ITEMS        │               │
│          │              │ id (PK)      │         │              │               │
│          │              │ project_id   │         │ id (PK)      │               │
│          │              │ file_name    │         │ project_id   │               │
│          │              │ file_url     │         │ supplier_id  │               │
│          │              └──────────────┘         │ quantity     │               │
│          │                                       └──────┬───────┘               │
│          │                                              │                        │
│          ▼                                              │                        │
│   ┌──────────────┐                                      │                        │
│   │  CATEGORIES  │                                      │                        │
│   │              │◀─────────────────────────────────────┤                        │
│   │ id (PK)      │                                      │                        │
│   │ name         │                                      │                        │
│   │ slug         │                                      │                        │
│   │ icon_name    │                                      │                        │
│   └──────┬───────┘                                      │                        │
│          │                                              │                        │
│          ▼                                              ▼                        │
│   ┌──────────────┐         ┌──────────────┐    ┌──────────────┐                 │
│   │  SUPPLIERS   │────────▶│    DEALS     │───▶│    QUOTES    │                 │
│   │              │         │              │    │              │                 │
│   │ id (PK)      │         │ id (PK)      │    │ id (PK)      │                 │
│   │ name         │         │ title        │    │ quote_number │                 │
│   │ category_id  │         │ supplier_id  │    │ deal_id (FK) │                 │
│   │ verified     │         │ project_id   │    │ supplier_id  │                 │
│   │ owner_rating │         │ stage        │    │ total        │                 │
│   │ email        │         │ probability  │    │ status       │                 │
│   └──────┬───────┘         └──────┬───────┘    └──────────────┘                 │
│          │                        │                                              │
│          │                        │                                              │
│          ▼                        ▼                                              │
│   ┌──────────────┐         ┌──────────────┐         ┌──────────────┐            │
│   │  ACTIVITIES  │         │    TASKS     │         │    NOTES     │            │
│   │              │         │              │         │              │            │
│   │ id (PK)      │         │ id (PK)      │         │ id (PK)      │            │
│   │ supplier_id  │         │ title        │         │ content      │            │
│   │ project_id   │         │ assigned_to  │         │ supplier_id  │            │
│   │ activity_type│         │ status       │         │ project_id   │            │
│   │ outcome      │         │ priority     │         │ deal_id      │            │
│   └──────────────┘         └──────────────┘         └──────────────┘            │
│                                                                                  │
│   ┌──────────────┐         ┌──────────────┐                                     │
│   │SUPPLIER_RATING│        │IMPORT_BATCHES│                                     │
│   │_HISTORY      │         │              │                                     │
│   │              │         │ id (PK)      │                                     │
│   │ id (PK)      │         │ batch_name   │                                     │
│   │ supplier_id  │         │ source       │                                     │
│   │ rating       │         │ total_records│                                     │
│   │ rated_by     │         │              │                                     │
│   └──────────────┘         └──────────────┘                                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Table Definitions

#### 5.2.1 Suppliers Table

```sql
CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category_id UUID REFERENCES categories(id),
    contact_person TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    address TEXT,
    city TEXT,
    products TEXT,
    price TEXT,
    moq TEXT,
    catalog_title TEXT,
    catalog_url TEXT,
    logo_url TEXT,
    verified BOOLEAN DEFAULT false,
    featured BOOLEAN DEFAULT false,
    owner_rating NUMERIC(2,1),
    owner_rating_date TIMESTAMPTZ,
    external_rating NUMERIC(2,1),
    external_rating_count INTEGER,
    comments TEXT,
    export_notes TEXT,
    auto_categorized BOOLEAN DEFAULT false,
    auto_categorization_confidence NUMERIC(3,2),
    import_batch TEXT,
    user_id UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 5.2.2 Projects Table

```sql
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    owner_id UUID REFERENCES profiles(id),
    start_date DATE,
    end_date DATE,
    status project_status DEFAULT 'draft',
    budget NUMERIC(15,2),
    location TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enum definition
CREATE TYPE project_status AS ENUM (
    'draft', 'planning', 'design', 'procurement',
    'construction', 'completed', 'on_hold'
);
```

#### 5.2.3 Deals Table

```sql
CREATE TABLE deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    supplier_id UUID REFERENCES suppliers(id),
    project_id UUID REFERENCES projects(id),
    owner_id UUID REFERENCES profiles(id),
    estimated_value NUMERIC(15,2),
    quoted_value NUMERIC(15,2),
    final_value NUMERIC(15,2),
    currency TEXT DEFAULT 'USD',
    stage deal_stage DEFAULT 'inquiry',
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),
    is_won BOOLEAN,
    lost_reason TEXT,
    expected_close_date DATE,
    actual_close_date DATE,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    bom_item_ids UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enum definition
CREATE TYPE deal_stage AS ENUM (
    'inquiry', 'quote_requested', 'quote_received',
    'negotiation', 'won', 'lost'
);
```

#### 5.2.4 Quotes Table

```sql
CREATE TABLE quotes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_number TEXT NOT NULL,
    deal_id UUID REFERENCES deals(id),
    supplier_id UUID REFERENCES suppliers(id),
    items JSONB,
    subtotal NUMERIC(15,2),
    tax NUMERIC(15,2),
    total NUMERIC(15,2),
    currency TEXT DEFAULT 'USD',
    quote_date DATE,
    valid_until DATE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    quote_file_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 5.3 Database Enums

| Enum Name | Values |
|-----------|--------|
| `activity_type` | call, email, meeting, quote_request, quote_received, order_placed, delivery, payment, note, rating_change |
| `deal_stage` | inquiry, quote_requested, quote_received, negotiation, won, lost |
| `project_status` | draft, planning, design, procurement, construction, completed, on_hold |
| `task_priority` | low, medium, high, urgent |
| `task_status` | pending, in_progress, completed, cancelled |
| `user_role` | owner, vendor, procurement, admin |

---

## 6. Authentication & Authorization

### 6.1 Authentication Flow

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         AUTHENTICATION FLOW                                      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────┐                                                               │
│   │    User     │                                                               │
│   │   Action    │                                                               │
│   └──────┬──────┘                                                               │
│          │                                                                       │
│          ▼                                                                       │
│   ┌─────────────────────────────────────────────────────────────────┐           │
│   │                        SIGN IN FLOW                             │           │
│   │                                                                 │           │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │           │
│   │   │  Auth Page  │───▶│  Supabase   │───▶│  Validate   │        │           │
│   │   │  (/auth)    │    │    Auth     │    │ Credentials │        │           │
│   │   └─────────────┘    └─────────────┘    └──────┬──────┘        │           │
│   │                                                 │               │           │
│   │                                                 ▼               │           │
│   │                                          ┌─────────────┐        │           │
│   │                                          │  Generate   │        │           │
│   │                                          │    JWT      │        │           │
│   │                                          └──────┬──────┘        │           │
│   │                                                 │               │           │
│   │                                                 ▼               │           │
│   │                                          ┌─────────────┐        │           │
│   │                                          │   Store     │        │           │
│   │                                          │  Session    │        │           │
│   │                                          └──────┬──────┘        │           │
│   │                                                 │               │           │
│   └─────────────────────────────────────────────────┼───────────────┘           │
│                                                     │                            │
│                                                     ▼                            │
│   ┌─────────────────────────────────────────────────────────────────┐           │
│   │                      SESSION MANAGEMENT                         │           │
│   │                                                                 │           │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │           │
│   │   │ AuthProvider│───▶│  Listen to  │───▶│   Update    │        │           │
│   │   │  (Context)  │    │Auth Changes │    │   State     │        │           │
│   │   └─────────────┘    └─────────────┘    └─────────────┘        │           │
│   │                                                                 │           │
│   └─────────────────────────────────────────────────────────────────┘           │
│                                                                                  │
│                                                     │                            │
│                                                     ▼                            │
│                                              ┌─────────────┐                     │
│                                              │  Dashboard  │                     │
│                                              │   Access    │                     │
│                                              └─────────────┘                     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 6.2 Auth Provider Implementation

```typescript
// lib/auth-provider.tsx

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ... signIn, signUp, signOut implementations
}
```

### 6.3 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **owner** | Full access to all features and data |
| **admin** | Full access except user management |
| **procurement** | Access to suppliers, deals, quotes |
| **vendor** | Limited access to assigned deals and quotes |

### 6.4 Route Protection

```typescript
// Protected routes require authentication
const protectedRoutes = [
  '/app-dashboard',
  '/app-dashboard/suppliers',
  '/app-dashboard/projects',
  '/app-dashboard/deals',
  '/app-dashboard/quotes',
  '/app-dashboard/tasks',
  '/app-dashboard/activities'
];

// Public routes
const publicRoutes = [
  '/',
  '/auth',
  '/category',
  '/supplier'
];
```

---

## 7. API Reference

### 7.1 Email Service Endpoints

#### 7.1.1 Send Quote Email

**Endpoint:** `POST /api/send-quote`

**Request Body:**
```json
{
  "to": "supplier@example.com",
  "supplierName": "ABC Construction Supplies",
  "quoteDetails": "Steel beams, concrete mix",
  "quoteNumber": "QT-2026-001",
  "total": "15,000.00"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "msg_123abc",
    "from": "Gold.Arch <onboarding@resend.dev>",
    "to": "supplier@example.com"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Failed to send email: Invalid recipient"
}
```

#### 7.1.2 Send Notification

**Endpoint:** `POST /api/send-notification`

**Request Body:**
```json
{
  "to": "user@example.com",
  "subject": "New Deal Update",
  "message": "A new quote has been received for Project Alpha",
  "type": "deal"
}
```

**Notification Types & Icons:**
| Type | Emoji |
|------|-------|
| deal | 💼 |
| project | 🏗️ |
| task | ✅ |
| inventory | 📦 |
| quote | 📄 |
| default | 🔔 |

#### 7.1.3 Send Team Invitation

**Endpoint:** `POST /api/send-invite`

**Request Body:**
```json
{
  "to": "newuser@example.com",
  "inviterName": "John Doe",
  "role": "procurement",
  "inviteLink": "https://goldarch.com/invite?token=abc123"
}
```

**Role Display Names:**
| Role Value | Display Name |
|------------|--------------|
| owner | Owner |
| admin | Administrator |
| manager | Manager |
| procurement | Procurement Specialist |
| viewer | Viewer |

### 7.2 Supabase PostgREST API

The application uses Supabase's auto-generated PostgREST API for all CRUD operations.

**Base URL:** `https://oszfxrubmstdavcehhkn.supabase.co/rest/v1/`

#### Common Operations

**Get All Suppliers:**
```typescript
const { data, error } = await supabase
  .from('suppliers')
  .select('*, categories(name)')
  .order('created_at', { ascending: false });
```

**Create New Supplier:**
```typescript
const { data, error } = await supabase
  .from('suppliers')
  .insert({
    name: 'New Supplier',
    email: 'supplier@example.com',
    category_id: 'uuid-here'
  })
  .select();
```

**Update Supplier:**
```typescript
const { data, error } = await supabase
  .from('suppliers')
  .update({ verified: true })
  .eq('id', supplierId)
  .select();
```

**Delete Supplier:**
```typescript
const { error } = await supabase
  .from('suppliers')
  .delete()
  .eq('id', supplierId);
```

---

## 8. Component Architecture

### 8.1 Provider Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           PROVIDER HIERARCHY                                     │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌───────────────────────────────────────────────────────────────────────┐     │
│   │                          Root Layout                                  │     │
│   │   (app/layout.js)                                                    │     │
│   │                                                                       │     │
│   │   ┌───────────────────────────────────────────────────────────────┐  │     │
│   │   │                      ThemeProvider                            │  │     │
│   │   │   (next-themes)                                              │  │     │
│   │   │                                                               │  │     │
│   │   │   ┌───────────────────────────────────────────────────────┐  │  │     │
│   │   │   │                      Providers                        │  │  │     │
│   │   │   │   (components/providers.tsx)                         │  │  │     │
│   │   │   │                                                       │  │  │     │
│   │   │   │   ┌───────────────────────────────────────────────┐  │  │  │     │
│   │   │   │   │                  QueryProvider                │  │  │  │     │
│   │   │   │   │   (TanStack React Query)                     │  │  │  │     │
│   │   │   │   │                                               │  │  │  │     │
│   │   │   │   │   ┌───────────────────────────────────────┐  │  │  │  │     │
│   │   │   │   │   │              AuthProvider             │  │  │  │  │     │
│   │   │   │   │   │   (lib/auth-provider.tsx)            │  │  │  │  │     │
│   │   │   │   │   │                                       │  │  │  │  │     │
│   │   │   │   │   │   ┌───────────────────────────────┐  │  │  │  │  │     │
│   │   │   │   │   │   │           Toaster            │  │  │  │  │  │     │
│   │   │   │   │   │   │   (Toast notifications)      │  │  │  │  │  │     │
│   │   │   │   │   │   │                               │  │  │  │  │  │     │
│   │   │   │   │   │   │   ┌───────────────────────┐  │  │  │  │  │  │     │
│   │   │   │   │   │   │   │        Sonner         │  │  │  │  │  │  │     │
│   │   │   │   │   │   │   │   (Modern toasts)     │  │  │  │  │  │  │     │
│   │   │   │   │   │   │   │                       │  │  │  │  │  │  │     │
│   │   │   │   │   │   │   │   ┌───────────────┐  │  │  │  │  │  │  │     │
│   │   │   │   │   │   │   │   │   Children    │  │  │  │  │  │  │  │     │
│   │   │   │   │   │   │   │   │   (Pages)     │  │  │  │  │  │  │  │     │
│   │   │   │   │   │   │   │   └───────────────┘  │  │  │  │  │  │  │     │
│   │   │   │   │   │   │   └───────────────────────┘  │  │  │  │  │  │     │
│   │   │   │   │   │   └───────────────────────────────┘  │  │  │  │  │     │
│   │   │   │   │   └───────────────────────────────────────┘  │  │  │  │     │
│   │   │   │   └───────────────────────────────────────────────┘  │  │  │     │
│   │   │   └───────────────────────────────────────────────────────┘  │  │     │
│   │   └───────────────────────────────────────────────────────────────┘  │     │
│   └───────────────────────────────────────────────────────────────────────┘     │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 8.2 UI Component Library

The application uses **shadcn-ui** components built on **Radix UI** primitives.

| Category | Components |
|----------|------------|
| **Layout** | Card, Separator, ScrollArea, Sheet, Dialog |
| **Forms** | Input, Button, Checkbox, Radio, Select, Switch, Slider |
| **Data Display** | Badge, Avatar, Progress, Table |
| **Feedback** | Alert, Toast, Tooltip, HoverCard |
| **Navigation** | Tabs, Dropdown Menu, Context Menu, Menubar |
| **Overlay** | Dialog, Alert Dialog, Popover, Sheet |

### 8.3 Custom Hooks

#### useAuth Hook
```typescript
const { user, session, loading, signIn, signUp, signOut } = useAuth();
```

#### useSuppliers Hook
```typescript
const { data: suppliers, isLoading, error } = useSuppliers();
```

#### useMobile Hook
```typescript
const isMobile = useMobile(); // Returns true if viewport < 768px
```

#### useToast Hook
```typescript
const { toast } = useToast();
toast({
  title: "Success",
  description: "Operation completed",
  variant: "default" // or "destructive"
});
```

---

## 9. Data Flow & Synchronization

### 9.1 Data Synchronization Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        REAL-TIME SYNC ARCHITECTURE                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────┐                           ┌─────────────────┐             │
│   │   Web Client    │                           │  Mobile Client  │             │
│   │   (Next.js)     │                           │ (React Native)  │             │
│   └────────┬────────┘                           └────────┬────────┘             │
│            │                                             │                       │
│            │         ┌──────────────────────┐            │                       │
│            │         │                      │            │                       │
│            └────────▶│   Supabase Realtime  │◀───────────┘                       │
│                      │                      │                                    │
│                      │   - WebSocket        │                                    │
│                      │   - Broadcast        │                                    │
│                      │   - Presence         │                                    │
│                      │                      │                                    │
│                      └──────────┬───────────┘                                    │
│                                 │                                                │
│                                 ▼                                                │
│                      ┌──────────────────────┐                                    │
│                      │                      │                                    │
│                      │     PostgreSQL       │                                    │
│                      │      Database        │                                    │
│                      │                      │                                    │
│                      │  ┌────────────────┐  │                                    │
│                      │  │  RLS Policies  │  │                                    │
│                      │  │  (Public Read) │  │                                    │
│                      │  └────────────────┘  │                                    │
│                      │                      │                                    │
│                      └──────────────────────┘                                    │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 9.2 React Query Configuration

```typescript
// lib/query-provider.tsx

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### 9.3 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│                           USER INTERACTION                                       │
│                                  │                                               │
│          ┌───────────────────────┼───────────────────────┐                      │
│          │                       │                       │                      │
│          ▼                       ▼                       ▼                      │
│   ┌─────────────┐         ┌─────────────┐         ┌─────────────┐              │
│   │   Create    │         │    Read     │         │   Update    │              │
│   └──────┬──────┘         └──────┬──────┘         └──────┬──────┘              │
│          │                       │                       │                      │
│          │                       │                       │                      │
│          ▼                       ▼                       ▼                      │
│   ┌─────────────────────────────────────────────────────────────────┐          │
│   │                        React Query                              │          │
│   │                                                                 │          │
│   │   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │          │
│   │   │  useMutation│    │  useQuery   │    │  useMutation│        │          │
│   │   └─────────────┘    └─────────────┘    └─────────────┘        │          │
│   │                                                                 │          │
│   └────────────────────────────────┬────────────────────────────────┘          │
│                                    │                                            │
│                                    ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐          │
│   │                      Supabase Client                            │          │
│   │                                                                 │          │
│   │   supabase.from('table').insert() / select() / update()        │          │
│   │                                                                 │          │
│   └────────────────────────────────┬────────────────────────────────┘          │
│                                    │                                            │
│                                    ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐          │
│   │                        PostgREST API                            │          │
│   │                                                                 │          │
│   │   https://xxx.supabase.co/rest/v1/                             │          │
│   │                                                                 │          │
│   └────────────────────────────────┬────────────────────────────────┘          │
│                                    │                                            │
│                                    ▼                                            │
│   ┌─────────────────────────────────────────────────────────────────┐          │
│   │                        PostgreSQL                               │          │
│   │                                                                 │          │
│   │   Tables: suppliers, projects, deals, quotes, etc.             │          │
│   │                                                                 │          │
│   └─────────────────────────────────────────────────────────────────┘          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 10. Configuration Management

### 10.1 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `RESEND_API_KEY` | Resend email service API key | Yes |

### 10.2 Next.js Configuration

```javascript
// next.config.js
module.exports = {
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
  // Additional configuration as needed
};
```

### 10.3 Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: { /* custom gold palette */ },
        navy: { /* custom navy palette */ },
        // Component-specific colors
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        // ... additional semantic colors
      },
    },
  },
};
```

---

## 11. Deployment Guide

### 11.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ARCHITECTURE                                  │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐  │
│   │    Developer    │────────▶│     GitHub      │────────▶│     Vercel      │  │
│   │    Workstation  │   push  │   Repository    │  webhook│    Platform     │  │
│   └─────────────────┘         └─────────────────┘         └────────┬────────┘  │
│                                                                     │           │
│                                                                     │ deploy    │
│                                                                     ▼           │
│                                                            ┌─────────────────┐  │
│                                                            │  Vercel Edge    │  │
│                                                            │    Network      │  │
│                                                            └────────┬────────┘  │
│                                                                     │           │
│                               ┌─────────────────────────────────────┼───────┐   │
│                               │                                     │       │   │
│                               ▼                                     ▼       │   │
│                    ┌─────────────────┐                   ┌─────────────────┐│   │
│                    │  Static Assets  │                   │  Serverless     ││   │
│                    │  (CDN Cached)   │                   │  Functions      ││   │
│                    └─────────────────┘                   │  (/api/*)       ││   │
│                                                          └────────┬────────┘│   │
│                                                                   │         │   │
│                                                                   ▼         │   │
│                                                          ┌─────────────────┐│   │
│                                                          │    Supabase     ││   │
│                                                          │   PostgreSQL    ││   │
│                                                          └─────────────────┘│   │
│                                                                              │   │
└──────────────────────────────────────────────────────────────────────────────┘   │
                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Deployment Steps

#### Local Development

```bash
# 1. Clone repository
git clone https://github.com/your-org/goldarch-web.git
cd goldarch-web

# 2. Install dependencies
npm install

# 3. Create environment file
cp .env.example .env.local

# 4. Configure environment variables
# Edit .env.local with your Supabase and Resend credentials

# 5. Run development server
npm run dev
```

#### Production Deployment (Vercel)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy to production
vercel --prod

# 4. Configure environment variables in Vercel dashboard
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - RESEND_API_KEY
```

### 11.3 Build Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (port 3000) |
| `npm run build` | Create production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint checks |

---

## 12. Security Considerations

### 12.1 Security Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          SECURITY LAYERS                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        TRANSPORT LAYER                                  │   │
│   │   - HTTPS encryption (TLS 1.3)                                         │   │
│   │   - Vercel automatic SSL certificates                                  │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      APPLICATION LAYER                                  │   │
│   │   - Supabase JWT authentication                                        │   │
│   │   - Session management with auto-refresh                               │   │
│   │   - Protected route enforcement                                        │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                        DATA LAYER                                       │   │
│   │   - Row Level Security (RLS) policies                                  │   │
│   │   - Environment variable protection                                     │   │
│   │   - Input validation with Zod schemas                                  │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 12.2 Security Best Practices

| Area | Implementation |
|------|----------------|
| **Authentication** | Supabase Auth with JWT tokens |
| **Authorization** | Role-based access control (RBAC) |
| **Data Validation** | Zod schema validation on inputs |
| **API Security** | Server-side validation in API routes |
| **Environment** | Secrets stored in environment variables |
| **Transport** | HTTPS enforced in production |

### 12.3 Current RLS Configuration

> **Note:** The current configuration uses public access policies for data synchronization between web and mobile. This is suitable for internal company tools but should be reviewed for public-facing deployments.

```sql
-- Current policy (permissive for sync)
CREATE POLICY "Public full access" ON suppliers
  FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Recommended production policy
CREATE POLICY "Authenticated users only" ON suppliers
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

---

## 13. Performance Optimization

### 13.1 Caching Strategy

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          CACHING LAYERS                                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      BROWSER CACHE                                      │   │
│   │   - Static assets (JS, CSS, images)                                    │   │
│   │   - Service worker (PWA support)                                       │   │
│   │   - Local storage for user preferences                                 │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      REACT QUERY CACHE                                  │   │
│   │   - Server state caching (1 minute stale time)                         │   │
│   │   - Stale-while-revalidate pattern                                     │   │
│   │   - Automatic background refetch                                        │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                       │                                          │
│                                       ▼                                          │
│   ┌─────────────────────────────────────────────────────────────────────────┐   │
│   │                      VERCEL EDGE CACHE                                  │   │
│   │   - CDN caching for static pages                                       │   │
│   │   - Edge function caching                                               │   │
│   │   - Geographic distribution                                             │   │
│   └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 13.2 Optimization Techniques

| Technique | Implementation |
|-----------|----------------|
| **Code Splitting** | Automatic route-based splitting (Next.js) |
| **Image Optimization** | Next.js Image component with Sharp |
| **CSS Optimization** | Tailwind JIT compilation, unused CSS removal |
| **Bundle Analysis** | `npm run build` with bundle analyzer |
| **Lazy Loading** | Dynamic imports for heavy components |

### 13.3 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint (FCP) | < 1.8s | Lighthouse |
| Largest Contentful Paint (LCP) | < 2.5s | Lighthouse |
| Time to Interactive (TTI) | < 3.8s | Lighthouse |
| Cumulative Layout Shift (CLS) | < 0.1 | Lighthouse |

---

## 14. Testing Strategy

### 14.1 Testing Pyramid

```
                    ┌───────────────┐
                    │     E2E       │
                    │    Tests      │
                    └───────┬───────┘
                            │
               ┌────────────┴────────────┐
               │                         │
               │    Integration Tests    │
               │                         │
               └────────────┬────────────┘
                            │
      ┌─────────────────────┴─────────────────────┐
      │                                           │
      │              Unit Tests                   │
      │                                           │
      └───────────────────────────────────────────┘
```

### 14.2 Test Types

| Type | Framework | Coverage |
|------|-----------|----------|
| **Unit Tests** | Jest + React Testing Library | Component logic, utilities |
| **Integration Tests** | Cypress / Playwright | API integration, workflows |
| **E2E Tests** | Cypress / Playwright | Complete user flows |

### 14.3 Testing Commands

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run specific test file
npm run test -- --testPathPattern="suppliers"
```

---

## 15. Troubleshooting Guide

### 15.1 Common Issues

#### Authentication Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid JWT` | Expired or malformed token | Clear browser storage, re-login |
| `Auth session missing` | Session expired | Refresh page to trigger re-auth |
| `User not found` | Profile not created | Check `profiles` table triggers |

#### Database Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `RLS policy violation` | Insufficient permissions | Check RLS policies, verify user role |
| `Foreign key violation` | Invalid reference | Verify related record exists |
| `Unique constraint` | Duplicate entry | Check for existing records |

#### API Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `500 Internal Server Error` | Server-side exception | Check Vercel function logs |
| `429 Too Many Requests` | Rate limiting | Implement request throttling |
| `Failed to send email` | Invalid Resend config | Verify `RESEND_API_KEY` |

### 15.2 Debug Mode

```typescript
// Enable debug logging
// Add to .env.local
DEBUG=supabase:*

// Access debug page
// Navigate to /debug in development
```

### 15.3 Log Locations

| Log Type | Location |
|----------|----------|
| Client-side | Browser DevTools Console |
| Server-side | Vercel Function Logs |
| Database | Supabase Dashboard > Logs |
| Email | Resend Dashboard > Logs |

---

## 16. Appendices

### Appendix A: TypeScript Type Definitions

```typescript
// Key type definitions from lib/supabase-types.ts

interface Supplier {
  id: string;
  name: string;
  category_id: string | null;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  verified: boolean;
  owner_rating: number | null;
  created_at: string;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  owner_id: string | null;
  status: 'draft' | 'planning' | 'design' | 'procurement' | 'construction' | 'completed' | 'on_hold';
  budget: number | null;
  start_date: string | null;
  end_date: string | null;
}

interface Deal {
  id: string;
  title: string;
  supplier_id: string | null;
  project_id: string | null;
  stage: 'inquiry' | 'quote_requested' | 'quote_received' | 'negotiation' | 'won' | 'lost';
  estimated_value: number | null;
  probability: number | null;
}

interface Quote {
  id: string;
  quote_number: string;
  deal_id: string | null;
  supplier_id: string | null;
  total: number | null;
  status: 'pending' | 'accepted' | 'rejected';
  valid_until: string | null;
}
```

### Appendix B: API Response Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

### Appendix C: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Open search |
| `Ctrl/Cmd + /` | Toggle sidebar |
| `Esc` | Close modal/dialog |

### Appendix D: Glossary

| Term | Definition |
|------|------------|
| **BOM** | Bill of Materials - list of items for a project |
| **CRM** | Customer Relationship Management |
| **RLS** | Row Level Security - PostgreSQL access control |
| **PostgREST** | RESTful API auto-generator for PostgreSQL |
| **SSR** | Server-Side Rendering |
| **SSG** | Static Site Generation |

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | January 2026 | Technical Team | Initial release |

---

**End of Technical Documentation**
