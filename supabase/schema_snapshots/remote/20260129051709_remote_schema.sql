create extension if not exists "vector" with schema "extensions";

drop extension if exists "pg_net";

create type "public"."access_level" as enum ('none', 'view', 'edit');

create type "public"."activity_type" as enum ('call', 'email', 'meeting', 'quote_request', 'quote_received', 'order_placed', 'delivery', 'payment', 'note', 'rating_change');

create type "public"."crm_section" as enum ('dashboard', 'suppliers', 'projects', 'deals', 'quotes', 'documents', 'plans', 'tasks', 'activities', 'team', 'client_portal');

create type "public"."deal_stage" as enum ('inquiry', 'quote_requested', 'quote_received', 'negotiating', 'po_sent', 'confirmed', 'in_production', 'shipped', 'delivered', 'completed', 'lost');

create type "public"."project_status" as enum ('planning', 'design', 'procurement', 'construction', 'completed', 'on_hold');

create type "public"."task_priority" as enum ('low', 'medium', 'high', 'urgent');

create type "public"."task_status" as enum ('pending', 'in_progress', 'completed', 'cancelled');

create type "public"."user_role" as enum ('owner', 'vendor', 'procurement', 'admin');

create sequence "public"."pages_clone_id_seq";

drop trigger if exists "trg_quotation_lines_touch" on "public"."quotation_lines";

drop trigger if exists "trg_quotations_touch" on "public"."quotations";

drop trigger if exists "trg_quote_compliance_rules_touch" on "public"."quote_compliance_rules";

drop trigger if exists "trg_quote_customer_tiers_touch" on "public"."quote_customer_tiers";

drop trigger if exists "trg_quote_email_tracking_touch" on "public"."quote_email_tracking";

drop trigger if exists "extraction_adjustments_updated_at" on "public"."quote_extraction_adjustments";

drop trigger if exists "trg_quote_leads_touch" on "public"."quote_leads";

drop trigger if exists "trg_quote_regions_touch" on "public"."quote_regions";

drop policy "quotation_audit_log_admin_insert" on "public"."quotation_audit_log";

drop policy "quotation_audit_log_admin_select" on "public"."quotation_audit_log";

drop policy "quotation_lines_all_via_parent" on "public"."quotation_lines";

drop policy "quotation_lines_select_via_parent" on "public"."quotation_lines";

drop policy "quotation_versions_insert_via_parent" on "public"."quotation_versions";

drop policy "quotation_versions_select_via_parent" on "public"."quotation_versions";

drop policy "quotations_delete_own_or_admin" on "public"."quotations";

drop policy "quotations_insert_own_or_admin" on "public"."quotations";

drop policy "quotations_select_own_or_admin" on "public"."quotations";

drop policy "quotations_update_own_or_admin" on "public"."quotations";

drop policy "quote_compliance_rules_admin_all" on "public"."quote_compliance_rules";

drop policy "quote_compliance_rules_select" on "public"."quote_compliance_rules";

drop policy "quote_customer_tiers_admin_all" on "public"."quote_customer_tiers";

drop policy "quote_customer_tiers_select" on "public"."quote_customer_tiers";

drop policy "System can insert email tracking" on "public"."quote_email_tracking";

drop policy "System can update email tracking" on "public"."quote_email_tracking";

drop policy "Users can view their quote email tracking" on "public"."quote_email_tracking";

drop policy "quote_email_tracking_admin_write" on "public"."quote_email_tracking";

drop policy "quote_email_tracking_select_via_quote" on "public"."quote_email_tracking";

drop policy "Users can create adjustments for their jobs" on "public"."quote_extraction_adjustments";

drop policy "Users can delete their adjustments" on "public"."quote_extraction_adjustments";

drop policy "Users can update their adjustments" on "public"."quote_extraction_adjustments";

drop policy "Users can view their job adjustments" on "public"."quote_extraction_adjustments";

drop policy "quote_leads_delete_own_or_admin" on "public"."quote_leads";

drop policy "quote_leads_insert_own" on "public"."quote_leads";

drop policy "quote_leads_select_own_or_admin" on "public"."quote_leads";

drop policy "quote_leads_update_own_or_admin" on "public"."quote_leads";

drop policy "quote_pricing_rules_admin_all" on "public"."quote_pricing_rules";

drop policy "quote_pricing_rules_select" on "public"."quote_pricing_rules";

drop policy "quote_product_visibility_admin_all" on "public"."quote_product_visibility";

drop policy "quote_regions_admin_all" on "public"."quote_regions";

drop policy "quote_regions_select" on "public"."quote_regions";

drop policy "Service role can manage user roles" on "public"."user_roles";

drop policy "Users can view their own roles" on "public"."user_roles";

alter table "public"."quotations" drop constraint "quotations_lead_id_fkey";

alter table "public"."quote_email_tracking" drop constraint "quote_email_tracking_quotation_id_fkey";

alter table "public"."quote_extraction_adjustments" drop constraint "quote_extraction_adjustments_adjusted_by_fkey";

alter table "public"."quote_extraction_adjustments" drop constraint "quote_extraction_adjustments_job_id_fkey";

alter table "public"."quotations" drop constraint "quotations_user_id_fkey";

alter table "public"."quote_leads" drop constraint "quote_leads_user_id_fkey";

drop function if exists "public"."count_job_adjustments"(p_job_id uuid);

drop function if exists "public"."count_product_images"(product_images jsonb);

drop function if exists "public"."get_adjustment_for_item"(p_job_id uuid, p_category text, p_item_type text);

drop function if exists "public"."get_job_adjustment_summary"(p_job_id uuid);

drop function if exists "public"."get_product_primary_image"(product_images jsonb);

drop function if exists "public"."is_app_admin"();

drop function if exists "public"."quote_touch_updated_at"();

drop function if exists "public"."update_extraction_adjustments_updated_at"();

alter table "public"."user_roles" drop constraint "user_roles_pkey";

drop index if exists "public"."idx_email_tracking_quotation";

drop index if exists "public"."idx_email_tracking_sent";

drop index if exists "public"."idx_quote_customer_tiers_active";

drop index if exists "public"."idx_quote_customer_tiers_priority";

drop index if exists "public"."idx_versions_unique";

drop index if exists "public"."idx_pricing_unique_active";

drop index if exists "public"."user_roles_pkey";


  create table "public"."activities" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "supplier_id" uuid,
    "project_id" uuid,
    "user_id" uuid,
    "activity_type" public.activity_type not null,
    "title" text not null,
    "description" text,
    "outcome" text,
    "next_follow_up_date" date,
    "attachment_urls" text[],
    "created_at" timestamp with time zone default now()
      );


alter table "public"."activities" enable row level security;


  create table "public"."api_usage_logs" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "endpoint" text not null,
    "method" text not null,
    "status_code" integer not null,
    "response_time_ms" integer,
    "success" boolean not null default true,
    "project_id" uuid,
    "supplier_id" uuid,
    "tokens_used" integer default 0,
    "embedding_tokens" integer default 0,
    "completion_tokens" integer default 0,
    "cost_estimate" numeric(10,6) default 0,
    "metadata" jsonb,
    "error_message" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."api_usage_logs_clone" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid,
    "endpoint" text not null,
    "method" text not null,
    "status_code" integer not null,
    "response_time_ms" integer,
    "success" boolean not null default true,
    "project_id" uuid,
    "supplier_id" uuid,
    "tokens_used" integer default 0,
    "embedding_tokens" integer default 0,
    "completion_tokens" integer default 0,
    "cost_estimate" numeric(10,6) default 0,
    "metadata" jsonb,
    "error_message" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."barcode_scans" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text,
    "barcode_type" text not null,
    "barcode_data" text not null,
    "parsed_type" text,
    "parsed_data" jsonb,
    "matched_entity_type" text,
    "matched_entity_id" text,
    "scanned_at" timestamp with time zone default now()
      );


alter table "public"."barcode_scans" enable row level security;


  create table "public"."bom_alert_config" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "project_id" text not null,
    "user_id" text,
    "enabled" boolean default true,
    "budget_threshold" integer default 90,
    "price_increase_threshold" integer default 10,
    "low_stock_alert" boolean default true,
    "expiring_quotes_alert" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."bom_alert_config" enable row level security;


  create table "public"."bom_alerts" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "project_id" text not null,
    "alert_type" text not null,
    "severity" text default 'warning'::text,
    "title" text not null,
    "message" text,
    "data" jsonb,
    "dismissed" boolean default false,
    "dismissed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."bom_alerts" enable row level security;


  create table "public"."categories" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "slug" text not null,
    "description" text,
    "icon_name" text,
    "icon_type" text,
    "icon_color" text,
    "display_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "icon" text,
    "color" text
      );


alter table "public"."categories" enable row level security;


  create table "public"."client_accounts" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "status" text not null default 'active'::text,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."client_accounts" enable row level security;


  create table "public"."client_drive_folders" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "drive_folder_id" text not null,
    "drive_folder_name" text,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."client_drive_folders" enable row level security;


  create table "public"."client_memberships" (
    "id" uuid not null default gen_random_uuid(),
    "client_id" uuid not null,
    "user_id" uuid not null,
    "role" text not null default 'client_user'::text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."client_memberships" enable row level security;


  create table "public"."crm_section_access" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "section" public.crm_section not null,
    "access_level" public.access_level not null default 'none'::public.access_level,
    "created_by" uuid,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."crm_section_access" enable row level security;


  create table "public"."deal_activities" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "deal_id" text not null,
    "user_id" text,
    "activity_type" text not null,
    "title" text not null,
    "description" text,
    "scheduled_at" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "outcome" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."deal_activities" enable row level security;


  create table "public"."deal_attachments" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "deal_id" text not null,
    "file_name" text not null,
    "file_type" text,
    "file_size" integer,
    "uri" text,
    "remote_url" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."deal_attachments" enable row level security;


  create table "public"."deal_templates" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text,
    "name" text not null,
    "type" text default 'deal'::text,
    "data" jsonb not null,
    "source_deal_id" text,
    "usage_count" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."deal_templates" enable row level security;


  create table "public"."deals" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "supplier_id" uuid not null,
    "project_id" uuid,
    "owner_id" uuid,
    "title" text not null,
    "description" text,
    "stage" public.deal_stage default 'inquiry'::public.deal_stage,
    "probability" integer,
    "estimated_value" numeric(15,2),
    "quoted_value" numeric(15,2),
    "final_value" numeric(15,2),
    "currency" text default 'USD'::text,
    "expected_close_date" date,
    "expected_delivery_date" date,
    "actual_close_date" date,
    "actual_delivery_date" date,
    "is_won" boolean default false,
    "lost_reason" text,
    "bom_item_ids" uuid[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "notes" text,
    "assigned_to" uuid
      );


alter table "public"."deals" enable row level security;


  create table "public"."deals_clone" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "supplier_id" uuid not null,
    "project_id" uuid,
    "owner_id" uuid,
    "title" text not null,
    "description" text,
    "stage" public.deal_stage default 'inquiry'::public.deal_stage,
    "probability" integer,
    "estimated_value" numeric(15,2),
    "quoted_value" numeric(15,2),
    "final_value" numeric(15,2),
    "currency" text default 'USD'::text,
    "expected_close_date" date,
    "expected_delivery_date" date,
    "actual_close_date" date,
    "actual_delivery_date" date,
    "is_won" boolean default false,
    "lost_reason" text,
    "bom_item_ids" uuid[],
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "notes" text,
    "assigned_to" uuid
      );



  create table "public"."document_access_rules" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "project_id" uuid,
    "supplier_id" uuid,
    "deal_id" uuid,
    "document_id" uuid,
    "access_level" text not null default 'read'::text,
    "granted_by" uuid,
    "granted_at" timestamp with time zone default now(),
    "expires_at" timestamp with time zone,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."documents" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "document_type" text not null default 'other'::text,
    "file_url" text not null,
    "file_name" text,
    "file_size" integer,
    "file_type" text,
    "supplier_id" uuid,
    "project_id" uuid,
    "deal_id" uuid,
    "user_id" uuid,
    "tags" text[],
    "metadata" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."documents" enable row level security;


  create table "public"."documents_clone" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "document_type" text not null default 'other'::text,
    "file_url" text not null,
    "file_name" text,
    "file_size" integer,
    "file_type" text,
    "supplier_id" uuid,
    "project_id" uuid,
    "deal_id" uuid,
    "user_id" uuid,
    "tags" text[],
    "metadata" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."email_templates" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "subject" text not null,
    "body" text not null,
    "category" text,
    "variables" text[],
    "created_by" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."email_templates" enable row level security;


  create table "public"."import_batches" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "batch_name" text not null,
    "source" text,
    "total_records" integer,
    "successful_imports" integer,
    "failed_imports" integer,
    "auto_categorized_count" integer,
    "import_metadata" jsonb,
    "imported_by" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."import_batches" enable row level security;


  create table "public"."inventory" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "description" text,
    "category" text default 'Other'::text,
    "sku" text,
    "unit" text default 'pieces'::text,
    "quantity" numeric(10,2) default 0,
    "min_quantity" numeric(10,2) default 10,
    "unit_price" numeric(15,2) default 0,
    "supplier_id" uuid,
    "location" text,
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."inventory" enable row level security;


  create table "public"."material_standards" (
    "id" uuid not null default gen_random_uuid(),
    "jurisdiction_name" text,
    "category" text,
    "content" text,
    "metadata" jsonb,
    "embedding" extensions.vector(1536)
      );



  create table "public"."message_templates" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text,
    "name" text not null,
    "category" text default 'general'::text,
    "subject" text,
    "body" text not null,
    "variables" jsonb,
    "is_default" boolean default false,
    "usage_count" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."message_templates" enable row level security;


  create table "public"."notes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "content" text not null,
    "supplier_id" uuid,
    "project_id" uuid,
    "deal_id" uuid,
    "author_id" uuid,
    "mentions" uuid[],
    "is_pinned" boolean default false,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."notes" enable row level security;


  create table "public"."notifications" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "title" text not null,
    "message" text,
    "type" text default 'info'::text,
    "is_read" boolean default false,
    "link" text,
    "data" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."notifications" enable row level security;


  create table "public"."pages_clone" (
    "id" bigint not null default nextval('public.pages_clone_id_seq'::regclass),
    "catalog_id" text not null,
    "page_num" integer not null,
    "image_path" text,
    "embedding_id" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."plan_analyses" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "model" text not null,
    "quantities" jsonb not null,
    "confidence" jsonb not null,
    "evidence" jsonb not null,
    "needs_review" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."plan_job_artifacts" (
    "id" uuid not null default gen_random_uuid(),
    "job_id" uuid not null,
    "kind" text not null,
    "page_no" integer,
    "artifact_path" text not null,
    "meta" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."price_books" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "currency" text not null default 'INR'::text,
    "is_active" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."price_history" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "supplier_id" text not null,
    "product_id" text,
    "product_name" text,
    "price" numeric(12,2) not null,
    "currency" text default 'INR'::text,
    "notes" text,
    "recorded_at" timestamp with time zone default now(),
    "recorded_by" text,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."price_history" enable row level security;


  create table "public"."price_items" (
    "id" uuid not null default gen_random_uuid(),
    "price_book_id" uuid not null,
    "sku" text not null,
    "category" text not null,
    "variant" text not null,
    "unit" text not null,
    "unit_price" numeric(10,2) not null,
    "meta" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );



  create table "public"."product_assets" (
    "id" uuid not null default gen_random_uuid(),
    "product_id" uuid not null,
    "kind" text not null,
    "asset_path" text not null,
    "meta" jsonb not null default '{}'::jsonb,
    "created_at" timestamp with time zone not null default now()
      );



  create table "public"."products" (
    "id" uuid not null default gen_random_uuid(),
    "sku" text not null,
    "name" text not null,
    "category" text not null,
    "material" text,
    "brand" text,
    "base_price" numeric(10,2),
    "attributes" jsonb not null default '{}'::jsonb,
    "is_active" boolean not null default true,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "images" jsonb default '[]'::jsonb
      );



  create table "public"."profiles" (
    "id" uuid not null,
    "email" text not null,
    "full_name" text,
    "role" public.user_role not null default 'vendor'::public.user_role,
    "company_name" text,
    "phone" text,
    "avatar_url" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."profiles" enable row level security;


  create table "public"."project_access" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "project_id" uuid not null,
    "user_id" uuid not null,
    "access_level" text not null,
    "can_view_drawings" boolean default false,
    "can_view_bom" boolean default true,
    "can_edit" boolean default false,
    "granted_by" uuid,
    "granted_at" timestamp with time zone default now()
      );


alter table "public"."project_access" enable row level security;


  create table "public"."project_bom_items" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "project_id" uuid not null,
    "item_name" text not null,
    "item_category" text,
    "description" text,
    "quantity" numeric(10,2),
    "unit" text,
    "supplier_id" uuid,
    "unit_price" numeric(15,2),
    "total_price" numeric(15,2) generated always as ((quantity * unit_price)) stored,
    "status" text default 'pending'::text,
    "procurement_notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."project_bom_items" enable row level security;


  create table "public"."project_files" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "project_id" uuid not null,
    "file_name" text not null,
    "file_type" text,
    "file_url" text not null,
    "file_size" bigint,
    "mime_type" text,
    "description" text,
    "uploaded_by" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."project_files" enable row level security;


  create table "public"."project_milestones" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "project_id" text not null,
    "name" text not null,
    "description" text,
    "start_date" timestamp with time zone not null,
    "end_date" timestamp with time zone not null,
    "duration" integer,
    "dependencies" text[],
    "assignee" text,
    "assignee_name" text,
    "status" text default 'pending'::text,
    "progress" integer default 0,
    "color" text default '#2196F3'::text,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."project_milestones" enable row level security;


  create table "public"."project_photos" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "project_id" text not null,
    "user_id" text,
    "uri" text,
    "remote_url" text,
    "thumbnail_url" text,
    "width" integer,
    "height" integer,
    "milestone" text,
    "category" text default 'general'::text,
    "description" text,
    "tags" text[],
    "location" jsonb,
    "exif" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."project_photos" enable row level security;


  create table "public"."projects" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "status" public.project_status default 'planning'::public.project_status,
    "owner_id" uuid,
    "location" text,
    "budget" numeric(15,2),
    "start_date" date,
    "end_date" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "progress" integer default 0
      );


alter table "public"."projects" enable row level security;


  create table "public"."projects_clone" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "description" text,
    "status" public.project_status default 'planning'::public.project_status,
    "owner_id" uuid,
    "location" text,
    "budget" numeric(15,2),
    "start_date" date,
    "end_date" date,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "progress" integer default 0
      );



  create table "public"."push_tokens" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text,
    "token" text not null,
    "platform" text not null,
    "device_name" text,
    "is_active" boolean default true,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."push_tokens" enable row level security;


  create table "public"."quotes_clone" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "deal_id" uuid not null,
    "supplier_id" uuid not null,
    "quote_number" text,
    "quote_date" date not null,
    "valid_until" date,
    "items" jsonb,
    "subtotal" numeric(15,2),
    "tax" numeric(15,2),
    "total" numeric(15,2),
    "currency" text default 'USD'::text,
    "quote_file_url" text,
    "status" text default 'pending'::text,
    "notes" text,
    "created_at" timestamp with time zone default now()
      );



  create table "public"."reminders" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text,
    "title" text not null,
    "description" text,
    "due_date" timestamp with time zone not null,
    "type" text default 'general'::text,
    "related_id" text,
    "related_name" text,
    "priority" text default 'normal'::text,
    "completed" boolean default false,
    "completed_at" timestamp with time zone,
    "notification_id" text,
    "snoozed_at" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."reminders" enable row level security;


  create table "public"."search_history" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text,
    "query" text not null,
    "search_type" text default 'text'::text,
    "result_count" integer default 0,
    "metadata" jsonb,
    "searched_at" timestamp with time zone default now()
      );


alter table "public"."search_history" enable row level security;


  create table "public"."security_audit_logs" (
    "id" uuid not null default gen_random_uuid(),
    "actor_user_id" uuid,
    "action" text not null,
    "target_type" text not null,
    "target_id" text not null,
    "metadata" jsonb,
    "ip" text,
    "user_agent" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."security_audit_logs" enable row level security;


  create table "public"."stock_movements" (
    "id" uuid not null default gen_random_uuid(),
    "inventory_id" uuid,
    "movement_type" text not null,
    "quantity" numeric(10,2) not null,
    "reference_type" text,
    "reference_id" uuid,
    "notes" text,
    "performed_by" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."stock_movements" enable row level security;


  create table "public"."supplier_access_rules" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "category_id" uuid,
    "region" text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "notes" text,
    "rule_data" jsonb
      );


alter table "public"."supplier_access_rules" enable row level security;


  create table "public"."supplier_access_rules_clone" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "category_id" uuid,
    "region" text,
    "created_by" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "notes" text
      );



  create table "public"."supplier_interactions" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text,
    "supplier_id" text not null,
    "interaction_type" text not null,
    "weight" integer default 1,
    "metadata" jsonb,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."supplier_interactions" enable row level security;


  create table "public"."supplier_rating_history" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "supplier_id" uuid not null,
    "rating_type" text not null,
    "rating" numeric(3,2),
    "notes" text,
    "source" text,
    "rated_by" uuid,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."supplier_rating_history" enable row level security;


  create table "public"."suppliers" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "category_id" uuid,
    "contact_person" text,
    "phone" text,
    "email" text,
    "website" text,
    "address" text,
    "city" text,
    "products" text,
    "catalog_title" text,
    "catalog_url" text,
    "comments" text,
    "price" text,
    "moq" text,
    "export_notes" text,
    "logo_url" text,
    "verified" boolean default false,
    "featured" boolean default false,
    "owner_rating" numeric(3,2),
    "owner_rating_notes" text,
    "owner_rating_date" timestamp with time zone,
    "external_rating" numeric(3,2),
    "external_rating_count" integer default 0,
    "external_rating_source" text,
    "external_rating_url" text,
    "external_rating_last_updated" timestamp with time zone,
    "import_batch" text,
    "auto_categorized" boolean default false,
    "auto_categorization_confidence" numeric(3,2),
    "user_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "region" text
      );


alter table "public"."suppliers" enable row level security;


  create table "public"."suppliers_clone" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "name" text not null,
    "category_id" uuid,
    "contact_person" text,
    "phone" text,
    "email" text,
    "website" text,
    "address" text,
    "city" text,
    "products" text,
    "catalog_title" text,
    "catalog_url" text,
    "comments" text,
    "price" text,
    "moq" text,
    "export_notes" text,
    "logo_url" text,
    "verified" boolean default false,
    "featured" boolean default false,
    "owner_rating" numeric(3,2),
    "owner_rating_notes" text,
    "owner_rating_date" timestamp with time zone,
    "external_rating" numeric(3,2),
    "external_rating_count" integer default 0,
    "external_rating_source" text,
    "external_rating_url" text,
    "external_rating_last_updated" timestamp with time zone,
    "import_batch" text,
    "auto_categorized" boolean default false,
    "auto_categorization_confidence" numeric(3,2),
    "user_id" uuid,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now(),
    "region" text
      );



  create table "public"."tasks" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "title" text not null,
    "description" text,
    "supplier_id" uuid,
    "project_id" uuid,
    "deal_id" uuid,
    "assigned_to" uuid,
    "created_by" uuid,
    "priority" public.task_priority default 'medium'::public.task_priority,
    "status" public.task_status default 'pending'::public.task_status,
    "due_date" timestamp with time zone,
    "completed_at" timestamp with time zone,
    "reminder_sent" boolean default false,
    "reminder_time" timestamp with time zone,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."tasks" enable row level security;


  create table "public"."team_invitations" (
    "id" uuid not null default gen_random_uuid(),
    "email" text not null,
    "role" text default 'viewer'::text,
    "status" text default 'pending'::text,
    "invited_by" uuid,
    "invited_at" timestamp with time zone default now(),
    "accepted_at" timestamp with time zone,
    "created_at" timestamp with time zone default now()
      );


alter table "public"."team_invitations" enable row level security;


  create table "public"."user_favorites" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text not null,
    "supplier_id" text not null,
    "supplier_name" text,
    "category" text,
    "added_at" timestamp with time zone default now()
      );


alter table "public"."user_favorites" enable row level security;


  create table "public"."user_pinned" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text not null,
    "supplier_id" text not null,
    "supplier_name" text,
    "category" text,
    "sort_order" integer default 0,
    "pinned_at" timestamp with time zone default now()
      );


alter table "public"."user_pinned" enable row level security;


  create table "public"."user_preferences" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text not null,
    "theme" text default 'system'::text,
    "notification_settings" jsonb,
    "display_settings" jsonb,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."user_preferences" enable row level security;


  create table "public"."user_roles_clone" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" uuid not null,
    "role" text not null,
    "assigned_by" uuid,
    "assigned_at" timestamp with time zone default now(),
    "notes" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );



  create table "public"."voice_notes" (
    "id" uuid not null default extensions.uuid_generate_v4(),
    "user_id" text,
    "entity_type" text not null,
    "entity_id" text not null,
    "title" text,
    "description" text,
    "uri" text,
    "remote_url" text,
    "duration" integer,
    "file_size" integer,
    "transcription" text,
    "created_at" timestamp with time zone default now(),
    "updated_at" timestamp with time zone default now()
      );


alter table "public"."voice_notes" enable row level security;

alter table "public"."plan_jobs" add column "error" text;

alter table "public"."plan_jobs" add column "file_path" text not null;

alter table "public"."plan_jobs" add column "file_type" text not null;

alter table "public"."plan_jobs" add column "status" text not null default 'queued'::text;

alter table "public"."plan_jobs" alter column "user_id" set not null;

alter table "public"."quotation_audit_log" drop column "changes";

alter table "public"."quotation_audit_log" add column "field_name" text;

alter table "public"."quotation_audit_log" add column "ip_address" inet;

alter table "public"."quotation_audit_log" add column "new_value" text;

alter table "public"."quotation_audit_log" add column "old_value" text;

alter table "public"."quotation_audit_log" add column "reason" text;

alter table "public"."quotation_lines" drop column "evidence";

alter table "public"."quotation_lines" drop column "extraction_meta";

alter table "public"."quotation_lines" drop column "title";

alter table "public"."quotation_lines" drop column "unit";

alter table "public"."quotation_lines" drop column "updated_at";

alter table "public"."quotation_lines" drop column "line_total";

alter table "public"."quotation_lines" add column "extraction_evidence" jsonb;

alter table "public"."quotation_lines" add column "notes" text;

alter table "public"."quotation_lines" add column "subcategory" text;

alter table "public"."quotation_lines" add column "unit_of_measure" text default 'ea'::text;

alter table "public"."quotation_lines" add column "line_total" numeric(10,2) generated always as (((quantity)::numeric * unit_price)) stored;

alter table "public"."quotation_lines" alter column "category" set not null;

alter table "public"."quotation_lines" alter column "description" set not null;

alter table "public"."quotation_lines" alter column "quantity" set not null;

alter table "public"."quotation_lines" alter column "quantity" set data type integer using "quantity"::integer;

alter table "public"."quotation_lines" alter column "unit_price" set not null;

alter table "public"."quotation_lines" alter column "unit_price" set data type numeric(10,2) using "unit_price"::numeric(10,2);

alter table "public"."quotation_versions" drop column "reason";

alter table "public"."quotation_versions" drop column "version";

alter table "public"."quotation_versions" add column "change_summary" text;

alter table "public"."quotation_versions" add column "version_number" integer not null;

alter table "public"."quotations" drop column "discount_total";

alter table "public"."quotations" drop column "notes";

alter table "public"."quotations" drop column "tax_total";

alter table "public"."quotations" add column "created_by" uuid;

alter table "public"."quotations" add column "customer_notes" text;

alter table "public"."quotations" add column "discount_amount" numeric(10,2) default 0;

alter table "public"."quotations" add column "internal_notes" text;

alter table "public"."quotations" add column "opened_at" timestamp with time zone;

alter table "public"."quotations" add column "sent_at" timestamp with time zone;

alter table "public"."quotations" add column "sent_to_email" text;

alter table "public"."quotations" add column "tax_placeholder" numeric(10,2) default 0;

alter table "public"."quotations" add column "terms_and_conditions" text;

alter table "public"."quotations" alter column "subtotal" set default 0;

alter table "public"."quotations" alter column "subtotal" set not null;

alter table "public"."quotations" alter column "subtotal" set data type numeric(10,2) using "subtotal"::numeric(10,2);

alter table "public"."quotations" alter column "total" set default 0;

alter table "public"."quotations" alter column "total" set not null;

alter table "public"."quotations" alter column "total" set data type numeric(10,2) using "total"::numeric(10,2);

alter table "public"."quote_compliance_rules" drop column "rule_description";

alter table "public"."quote_compliance_rules" drop column "severity";

alter table "public"."quote_compliance_rules" drop column "updated_at";

alter table "public"."quote_compliance_rules" add column "applies_to_products" jsonb;

alter table "public"."quote_compliance_rules" add column "description" text not null;

alter table "public"."quote_compliance_rules" add column "effective_date" date default CURRENT_DATE;

alter table "public"."quote_compliance_rules" add column "expires_date" date;

alter table "public"."quote_compliance_rules" add column "rule_type" text not null;

alter table "public"."quote_compliance_rules" disable row level security;

alter table "public"."quote_customer_tiers" drop column "updated_at";

alter table "public"."quote_email_tracking" drop column "message_id";

alter table "public"."quote_email_tracking" alter column "provider" set default 'resend'::text;

alter table "public"."quote_email_tracking" alter column "provider" set not null;

alter table "public"."quote_email_tracking" alter column "quotation_id" set not null;

alter table "public"."quote_email_tracking" alter column "sent_at" set default now();

alter table "public"."quote_email_tracking" alter column "sent_at" set not null;

alter table "public"."quote_email_tracking" alter column "status" set default 'sent'::text;

alter table "public"."quote_email_tracking" alter column "status" set not null;

alter table "public"."quote_email_tracking" alter column "subject" set not null;

alter table "public"."quote_email_tracking" disable row level security;

alter table "public"."quote_extraction_adjustments" disable row level security;

alter table "public"."quote_leads" drop column "full_name";

alter table "public"."quote_leads" drop column "notes";

alter table "public"."quote_leads" add column "address" text;

alter table "public"."quote_leads" add column "city" text;

alter table "public"."quote_leads" add column "company" text;

alter table "public"."quote_leads" add column "name" text not null;

alter table "public"."quote_leads" add column "project_notes" text;

alter table "public"."quote_leads" add column "project_type" text;

alter table "public"."quote_leads" add column "source" text;

alter table "public"."quote_leads" add column "state" text;

alter table "public"."quote_leads" add column "zip" text;

alter table "public"."quote_leads" alter column "email" set not null;

alter table "public"."quote_leads" disable row level security;

alter table "public"."quote_pricing_rules" alter column "markup_pct" drop not null;

alter table "public"."quote_pricing_rules" disable row level security;

alter table "public"."quote_product_visibility" add column "created_by" uuid;

alter table "public"."quote_product_visibility" add column "notes" text;

alter table "public"."quote_product_visibility" disable row level security;

alter table "public"."quote_regions" add column "country" text default 'USA'::text;

alter table "public"."quote_regions" alter column "state" set not null;

alter table "public"."quote_regions" disable row level security;

alter table "public"."quote_status_history" add column "created_at" timestamp with time zone default now();

alter table "public"."quote_status_history" alter column "metadata" set default '{}'::jsonb;

alter table "public"."user_roles" add column "assigned_at" timestamp with time zone default now();

alter table "public"."user_roles" add column "assigned_by" uuid;

alter table "public"."user_roles" add column "id" uuid not null default extensions.uuid_generate_v4();

alter table "public"."user_roles" add column "notes" text;

alter table "public"."user_roles" add column "updated_at" timestamp with time zone default now();

alter table "public"."user_roles" alter column "created_at" drop not null;

alter sequence "public"."pages_clone_id_seq" owned by "public"."pages_clone"."id";

CREATE UNIQUE INDEX activities_pkey ON public.activities USING btree (id);

CREATE INDEX api_usage_logs_clone_cost_estimate_idx ON public.api_usage_logs_clone USING btree (cost_estimate DESC) WHERE (cost_estimate > (0)::numeric);

CREATE INDEX api_usage_logs_clone_created_at_idx ON public.api_usage_logs_clone USING btree (created_at DESC);

CREATE INDEX api_usage_logs_clone_created_at_idx1 ON public.api_usage_logs_clone USING btree (created_at DESC) WHERE (success = false);

CREATE INDEX api_usage_logs_clone_endpoint_idx ON public.api_usage_logs_clone USING btree (endpoint);

CREATE UNIQUE INDEX api_usage_logs_clone_pkey ON public.api_usage_logs_clone USING btree (id);

CREATE INDEX api_usage_logs_clone_project_id_idx ON public.api_usage_logs_clone USING btree (project_id) WHERE (project_id IS NOT NULL);

CREATE INDEX api_usage_logs_clone_supplier_id_idx ON public.api_usage_logs_clone USING btree (supplier_id) WHERE (supplier_id IS NOT NULL);

CREATE INDEX api_usage_logs_clone_user_id_created_at_idx ON public.api_usage_logs_clone USING btree (user_id, created_at DESC);

CREATE INDEX api_usage_logs_clone_user_id_idx ON public.api_usage_logs_clone USING btree (user_id);

CREATE UNIQUE INDEX api_usage_logs_pkey ON public.api_usage_logs USING btree (id);

CREATE UNIQUE INDEX barcode_scans_pkey ON public.barcode_scans USING btree (id);

CREATE UNIQUE INDEX bom_alert_config_pkey ON public.bom_alert_config USING btree (id);

CREATE UNIQUE INDEX bom_alert_config_project_id_key ON public.bom_alert_config USING btree (project_id);

CREATE UNIQUE INDEX bom_alerts_pkey ON public.bom_alerts USING btree (id);

CREATE UNIQUE INDEX categories_name_key ON public.categories USING btree (name);

CREATE UNIQUE INDEX categories_pkey ON public.categories USING btree (id);

CREATE UNIQUE INDEX categories_slug_key ON public.categories USING btree (slug);

CREATE UNIQUE INDEX client_accounts_pkey ON public.client_accounts USING btree (id);

CREATE UNIQUE INDEX client_drive_folders_client_id_drive_folder_id_key ON public.client_drive_folders USING btree (client_id, drive_folder_id);

CREATE UNIQUE INDEX client_drive_folders_pkey ON public.client_drive_folders USING btree (id);

CREATE UNIQUE INDEX client_memberships_client_id_user_id_key ON public.client_memberships USING btree (client_id, user_id);

CREATE UNIQUE INDEX client_memberships_pkey ON public.client_memberships USING btree (id);

CREATE UNIQUE INDEX crm_section_access_pkey ON public.crm_section_access USING btree (id);

CREATE UNIQUE INDEX crm_section_access_user_id_section_key ON public.crm_section_access USING btree (user_id, section);

CREATE UNIQUE INDEX deal_activities_pkey ON public.deal_activities USING btree (id);

CREATE UNIQUE INDEX deal_attachments_pkey ON public.deal_attachments USING btree (id);

CREATE UNIQUE INDEX deal_templates_pkey ON public.deal_templates USING btree (id);

CREATE UNIQUE INDEX deals_clone_pkey ON public.deals_clone USING btree (id);

CREATE INDEX deals_clone_stage_idx ON public.deals_clone USING btree (stage);

CREATE INDEX deals_clone_supplier_id_idx ON public.deals_clone USING btree (supplier_id);

CREATE UNIQUE INDEX deals_pkey ON public.deals USING btree (id);

CREATE UNIQUE INDEX document_access_rules_pkey ON public.document_access_rules USING btree (id);

CREATE UNIQUE INDEX documents_clone_pkey ON public.documents_clone USING btree (id);

CREATE UNIQUE INDEX documents_pkey ON public.documents USING btree (id);

CREATE UNIQUE INDEX email_templates_pkey ON public.email_templates USING btree (id);

CREATE INDEX idx_activities_created_at ON public.activities USING btree (created_at DESC);

CREATE INDEX idx_activities_supplier_id ON public.activities USING btree (supplier_id);

CREATE INDEX idx_assets_kind ON public.product_assets USING btree (product_id, kind);

CREATE INDEX idx_assets_product ON public.product_assets USING btree (product_id);

CREATE INDEX idx_client_drive_folders_client_id ON public.client_drive_folders USING btree (client_id);

CREATE INDEX idx_client_memberships_user_id ON public.client_memberships USING btree (user_id);

CREATE INDEX idx_deals_stage ON public.deals USING btree (stage);

CREATE INDEX idx_deals_supplier_id ON public.deals USING btree (supplier_id);

CREATE INDEX idx_document_access_deal ON public.document_access_rules USING btree (deal_id) WHERE (deal_id IS NOT NULL);

CREATE INDEX idx_document_access_document ON public.document_access_rules USING btree (document_id) WHERE (document_id IS NOT NULL);

CREATE INDEX idx_document_access_expires ON public.document_access_rules USING btree (expires_at) WHERE (expires_at IS NOT NULL);

CREATE INDEX idx_document_access_project ON public.document_access_rules USING btree (project_id) WHERE (project_id IS NOT NULL);

CREATE INDEX idx_document_access_supplier ON public.document_access_rules USING btree (supplier_id) WHERE (supplier_id IS NOT NULL);

CREATE INDEX idx_document_access_user_id ON public.document_access_rules USING btree (user_id);

CREATE INDEX idx_document_access_user_project ON public.document_access_rules USING btree (user_id, project_id);

CREATE INDEX idx_inventory_category ON public.inventory USING btree (category);

CREATE INDEX idx_inventory_supplier_id ON public.inventory USING btree (supplier_id);

CREATE INDEX idx_job_artifacts_job ON public.plan_job_artifacts USING btree (job_id);

CREATE INDEX idx_job_artifacts_kind ON public.plan_job_artifacts USING btree (kind);

CREATE INDEX idx_job_artifacts_page ON public.plan_job_artifacts USING btree (job_id, page_no);

CREATE INDEX idx_notifications_is_read ON public.notifications USING btree (user_id, is_read);

CREATE INDEX idx_notifications_user_id ON public.notifications USING btree (user_id);

CREATE INDEX idx_plan_analyses_review ON public.plan_analyses USING btree (needs_review);

CREATE INDEX idx_plan_jobs_created ON public.plan_jobs USING btree (created_at DESC);

CREATE INDEX idx_plan_jobs_status ON public.plan_jobs USING btree (status);

CREATE INDEX idx_plan_jobs_user ON public.plan_jobs USING btree (user_id);

CREATE INDEX idx_price_books_active ON public.price_books USING btree (is_active);

CREATE INDEX idx_price_items_book ON public.price_items USING btree (price_book_id);

CREATE INDEX idx_price_items_cat_var ON public.price_items USING btree (category, variant);

CREATE INDEX idx_price_items_sku ON public.price_items USING btree (price_book_id, sku);

CREATE INDEX idx_products_active ON public.products USING btree (is_active);

CREATE INDEX idx_products_brand ON public.products USING btree (brand);

CREATE INDEX idx_products_cat_mat ON public.products USING btree (category, material);

CREATE INDEX idx_products_images ON public.products USING gin (images);

CREATE INDEX idx_project_bom_project_id ON public.project_bom_items USING btree (project_id);

CREATE INDEX idx_projects_owner_id ON public.projects USING btree (owner_id);

CREATE INDEX idx_section_access_user ON public.crm_section_access USING btree (user_id);

CREATE INDEX idx_supplier_access_rules_category ON public.supplier_access_rules USING btree (category_id);

CREATE INDEX idx_supplier_access_rules_region ON public.supplier_access_rules USING btree (region);

CREATE INDEX idx_supplier_access_rules_user_category ON public.supplier_access_rules USING btree (user_id, category_id);

CREATE INDEX idx_supplier_access_rules_user_id ON public.supplier_access_rules USING btree (user_id);

CREATE INDEX idx_suppliers_category_id ON public.suppliers USING btree (category_id);

CREATE INDEX idx_suppliers_city ON public.suppliers USING btree (city);

CREATE INDEX idx_suppliers_name_search ON public.suppliers USING gin (to_tsvector('english'::regconfig, name));

CREATE INDEX idx_suppliers_owner_rating ON public.suppliers USING btree (owner_rating);

CREATE INDEX idx_suppliers_region ON public.suppliers USING btree (region);

CREATE INDEX idx_tasks_assigned_to ON public.tasks USING btree (assigned_to);

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);

CREATE INDEX idx_usage_logs_cost ON public.api_usage_logs USING btree (cost_estimate DESC) WHERE (cost_estimate > (0)::numeric);

CREATE INDEX idx_usage_logs_created_at ON public.api_usage_logs USING btree (created_at DESC);

CREATE INDEX idx_usage_logs_endpoint ON public.api_usage_logs USING btree (endpoint);

CREATE INDEX idx_usage_logs_errors ON public.api_usage_logs USING btree (created_at DESC) WHERE (success = false);

CREATE INDEX idx_usage_logs_project ON public.api_usage_logs USING btree (project_id) WHERE (project_id IS NOT NULL);

CREATE INDEX idx_usage_logs_supplier ON public.api_usage_logs USING btree (supplier_id) WHERE (supplier_id IS NOT NULL);

CREATE INDEX idx_usage_logs_user_id ON public.api_usage_logs USING btree (user_id);

CREATE INDEX idx_usage_logs_user_time ON public.api_usage_logs USING btree (user_id, created_at DESC);

CREATE INDEX idx_user_roles_assigned_by ON public.user_roles USING btree (assigned_by);

CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role);

CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id);

CREATE UNIQUE INDEX import_batches_pkey ON public.import_batches USING btree (id);

CREATE UNIQUE INDEX inventory_pkey ON public.inventory USING btree (id);

CREATE UNIQUE INDEX material_standards_pkey ON public.material_standards USING btree (id);

CREATE UNIQUE INDEX message_templates_pkey ON public.message_templates USING btree (id);

CREATE UNIQUE INDEX notes_pkey ON public.notes USING btree (id);

CREATE UNIQUE INDEX notifications_pkey ON public.notifications USING btree (id);

CREATE UNIQUE INDEX pages_clone_catalog_page_idx ON public.pages_clone USING btree (catalog_id, page_num);

CREATE UNIQUE INDEX pages_clone_pkey ON public.pages_clone USING btree (id);

CREATE UNIQUE INDEX plan_analyses_pkey ON public.plan_analyses USING btree (id);

CREATE UNIQUE INDEX plan_job_artifacts_pkey ON public.plan_job_artifacts USING btree (id);

CREATE UNIQUE INDEX price_books_pkey ON public.price_books USING btree (id);

CREATE UNIQUE INDEX price_history_pkey ON public.price_history USING btree (id);

CREATE UNIQUE INDEX price_items_pkey ON public.price_items USING btree (id);

CREATE UNIQUE INDEX product_assets_pkey ON public.product_assets USING btree (id);

CREATE UNIQUE INDEX products_pkey ON public.products USING btree (id);

CREATE UNIQUE INDEX products_sku_key ON public.products USING btree (sku);

CREATE UNIQUE INDEX profiles_email_key ON public.profiles USING btree (email);

CREATE UNIQUE INDEX profiles_pkey ON public.profiles USING btree (id);

CREATE UNIQUE INDEX project_access_pkey ON public.project_access USING btree (id);

CREATE UNIQUE INDEX project_access_project_id_user_id_key ON public.project_access USING btree (project_id, user_id);

CREATE UNIQUE INDEX project_bom_items_pkey ON public.project_bom_items USING btree (id);

CREATE UNIQUE INDEX project_files_pkey ON public.project_files USING btree (id);

CREATE UNIQUE INDEX project_milestones_pkey ON public.project_milestones USING btree (id);

CREATE UNIQUE INDEX project_photos_pkey ON public.project_photos USING btree (id);

CREATE INDEX projects_clone_owner_id_idx ON public.projects_clone USING btree (owner_id);

CREATE UNIQUE INDEX projects_clone_pkey ON public.projects_clone USING btree (id);

CREATE UNIQUE INDEX projects_pkey ON public.projects USING btree (id);

CREATE UNIQUE INDEX push_tokens_pkey ON public.push_tokens USING btree (id);

CREATE UNIQUE INDEX push_tokens_token_key ON public.push_tokens USING btree (token);

CREATE UNIQUE INDEX quotes_clone_pkey ON public.quotes_clone USING btree (id);

CREATE UNIQUE INDEX reminders_pkey ON public.reminders USING btree (id);

CREATE UNIQUE INDEX search_history_pkey ON public.search_history USING btree (id);

CREATE UNIQUE INDEX security_audit_logs_pkey ON public.security_audit_logs USING btree (id);

CREATE UNIQUE INDEX stock_movements_pkey ON public.stock_movements USING btree (id);

CREATE INDEX supplier_access_rules_clone_category_id_idx ON public.supplier_access_rules_clone USING btree (category_id);

CREATE UNIQUE INDEX supplier_access_rules_clone_pkey ON public.supplier_access_rules_clone USING btree (id);

CREATE INDEX supplier_access_rules_clone_region_idx ON public.supplier_access_rules_clone USING btree (region);

CREATE INDEX supplier_access_rules_clone_user_id_category_id_idx ON public.supplier_access_rules_clone USING btree (user_id, category_id);

CREATE INDEX supplier_access_rules_clone_user_id_idx ON public.supplier_access_rules_clone USING btree (user_id);

CREATE UNIQUE INDEX supplier_access_rules_pkey ON public.supplier_access_rules USING btree (id);

CREATE UNIQUE INDEX supplier_interactions_pkey ON public.supplier_interactions USING btree (id);

CREATE UNIQUE INDEX supplier_rating_history_pkey ON public.supplier_rating_history USING btree (id);

CREATE INDEX suppliers_clone_category_id_idx ON public.suppliers_clone USING btree (category_id);

CREATE INDEX suppliers_clone_city_idx ON public.suppliers_clone USING btree (city);

CREATE INDEX suppliers_clone_owner_rating_idx ON public.suppliers_clone USING btree (owner_rating);

CREATE UNIQUE INDEX suppliers_clone_pkey ON public.suppliers_clone USING btree (id);

CREATE INDEX suppliers_clone_region_idx ON public.suppliers_clone USING btree (region);

CREATE INDEX suppliers_clone_to_tsvector_idx ON public.suppliers_clone USING gin (to_tsvector('english'::regconfig, name));

CREATE UNIQUE INDEX suppliers_pkey ON public.suppliers USING btree (id);

CREATE UNIQUE INDEX tasks_pkey ON public.tasks USING btree (id);

CREATE UNIQUE INDEX team_invitations_pkey ON public.team_invitations USING btree (id);

CREATE UNIQUE INDEX uq_plan_analyses_job ON public.plan_analyses USING btree (job_id);

CREATE UNIQUE INDEX user_favorites_pkey ON public.user_favorites USING btree (id);

CREATE UNIQUE INDEX user_favorites_user_id_supplier_id_key ON public.user_favorites USING btree (user_id, supplier_id);

CREATE UNIQUE INDEX user_pinned_pkey ON public.user_pinned USING btree (id);

CREATE UNIQUE INDEX user_pinned_user_id_supplier_id_key ON public.user_pinned USING btree (user_id, supplier_id);

CREATE UNIQUE INDEX user_preferences_pkey ON public.user_preferences USING btree (id);

CREATE UNIQUE INDEX user_preferences_user_id_key ON public.user_preferences USING btree (user_id);

CREATE INDEX user_roles_clone_assigned_by_idx ON public.user_roles_clone USING btree (assigned_by);

CREATE UNIQUE INDEX user_roles_clone_pkey ON public.user_roles_clone USING btree (id);

CREATE INDEX user_roles_clone_role_idx ON public.user_roles_clone USING btree (role);

CREATE INDEX user_roles_clone_user_id_idx ON public.user_roles_clone USING btree (user_id);

CREATE UNIQUE INDEX user_roles_clone_user_id_key ON public.user_roles_clone USING btree (user_id);

CREATE UNIQUE INDEX user_roles_user_id_key ON public.user_roles USING btree (user_id);

CREATE UNIQUE INDEX voice_notes_pkey ON public.voice_notes USING btree (id);

CREATE UNIQUE INDEX idx_pricing_unique_active ON public.quote_pricing_rules USING btree (product_id, COALESCE(region_id, '00000000-0000-0000-0000-000000000000'::uuid), COALESCE(tier_id, '00000000-0000-0000-0000-000000000000'::uuid), effective_date) WHERE (expires_date IS NULL);

CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id);

alter table "public"."activities" add constraint "activities_pkey" PRIMARY KEY using index "activities_pkey";

alter table "public"."api_usage_logs" add constraint "api_usage_logs_pkey" PRIMARY KEY using index "api_usage_logs_pkey";

alter table "public"."api_usage_logs_clone" add constraint "api_usage_logs_clone_pkey" PRIMARY KEY using index "api_usage_logs_clone_pkey";

alter table "public"."barcode_scans" add constraint "barcode_scans_pkey" PRIMARY KEY using index "barcode_scans_pkey";

alter table "public"."bom_alert_config" add constraint "bom_alert_config_pkey" PRIMARY KEY using index "bom_alert_config_pkey";

alter table "public"."bom_alerts" add constraint "bom_alerts_pkey" PRIMARY KEY using index "bom_alerts_pkey";

alter table "public"."categories" add constraint "categories_pkey" PRIMARY KEY using index "categories_pkey";

alter table "public"."client_accounts" add constraint "client_accounts_pkey" PRIMARY KEY using index "client_accounts_pkey";

alter table "public"."client_drive_folders" add constraint "client_drive_folders_pkey" PRIMARY KEY using index "client_drive_folders_pkey";

alter table "public"."client_memberships" add constraint "client_memberships_pkey" PRIMARY KEY using index "client_memberships_pkey";

alter table "public"."crm_section_access" add constraint "crm_section_access_pkey" PRIMARY KEY using index "crm_section_access_pkey";

alter table "public"."deal_activities" add constraint "deal_activities_pkey" PRIMARY KEY using index "deal_activities_pkey";

alter table "public"."deal_attachments" add constraint "deal_attachments_pkey" PRIMARY KEY using index "deal_attachments_pkey";

alter table "public"."deal_templates" add constraint "deal_templates_pkey" PRIMARY KEY using index "deal_templates_pkey";

alter table "public"."deals" add constraint "deals_pkey" PRIMARY KEY using index "deals_pkey";

alter table "public"."deals_clone" add constraint "deals_clone_pkey" PRIMARY KEY using index "deals_clone_pkey";

alter table "public"."document_access_rules" add constraint "document_access_rules_pkey" PRIMARY KEY using index "document_access_rules_pkey";

alter table "public"."documents" add constraint "documents_pkey" PRIMARY KEY using index "documents_pkey";

alter table "public"."documents_clone" add constraint "documents_clone_pkey" PRIMARY KEY using index "documents_clone_pkey";

alter table "public"."email_templates" add constraint "email_templates_pkey" PRIMARY KEY using index "email_templates_pkey";

alter table "public"."import_batches" add constraint "import_batches_pkey" PRIMARY KEY using index "import_batches_pkey";

alter table "public"."inventory" add constraint "inventory_pkey" PRIMARY KEY using index "inventory_pkey";

alter table "public"."material_standards" add constraint "material_standards_pkey" PRIMARY KEY using index "material_standards_pkey";

alter table "public"."message_templates" add constraint "message_templates_pkey" PRIMARY KEY using index "message_templates_pkey";

alter table "public"."notes" add constraint "notes_pkey" PRIMARY KEY using index "notes_pkey";

alter table "public"."notifications" add constraint "notifications_pkey" PRIMARY KEY using index "notifications_pkey";

alter table "public"."pages_clone" add constraint "pages_clone_pkey" PRIMARY KEY using index "pages_clone_pkey";

alter table "public"."plan_analyses" add constraint "plan_analyses_pkey" PRIMARY KEY using index "plan_analyses_pkey";

alter table "public"."plan_job_artifacts" add constraint "plan_job_artifacts_pkey" PRIMARY KEY using index "plan_job_artifacts_pkey";

alter table "public"."price_books" add constraint "price_books_pkey" PRIMARY KEY using index "price_books_pkey";

alter table "public"."price_history" add constraint "price_history_pkey" PRIMARY KEY using index "price_history_pkey";

alter table "public"."price_items" add constraint "price_items_pkey" PRIMARY KEY using index "price_items_pkey";

alter table "public"."product_assets" add constraint "product_assets_pkey" PRIMARY KEY using index "product_assets_pkey";

alter table "public"."products" add constraint "products_pkey" PRIMARY KEY using index "products_pkey";

alter table "public"."profiles" add constraint "profiles_pkey" PRIMARY KEY using index "profiles_pkey";

alter table "public"."project_access" add constraint "project_access_pkey" PRIMARY KEY using index "project_access_pkey";

alter table "public"."project_bom_items" add constraint "project_bom_items_pkey" PRIMARY KEY using index "project_bom_items_pkey";

alter table "public"."project_files" add constraint "project_files_pkey" PRIMARY KEY using index "project_files_pkey";

alter table "public"."project_milestones" add constraint "project_milestones_pkey" PRIMARY KEY using index "project_milestones_pkey";

alter table "public"."project_photos" add constraint "project_photos_pkey" PRIMARY KEY using index "project_photos_pkey";

alter table "public"."projects" add constraint "projects_pkey" PRIMARY KEY using index "projects_pkey";

alter table "public"."projects_clone" add constraint "projects_clone_pkey" PRIMARY KEY using index "projects_clone_pkey";

alter table "public"."push_tokens" add constraint "push_tokens_pkey" PRIMARY KEY using index "push_tokens_pkey";

alter table "public"."quotes_clone" add constraint "quotes_clone_pkey" PRIMARY KEY using index "quotes_clone_pkey";

alter table "public"."reminders" add constraint "reminders_pkey" PRIMARY KEY using index "reminders_pkey";

alter table "public"."search_history" add constraint "search_history_pkey" PRIMARY KEY using index "search_history_pkey";

alter table "public"."security_audit_logs" add constraint "security_audit_logs_pkey" PRIMARY KEY using index "security_audit_logs_pkey";

alter table "public"."stock_movements" add constraint "stock_movements_pkey" PRIMARY KEY using index "stock_movements_pkey";

alter table "public"."supplier_access_rules" add constraint "supplier_access_rules_pkey" PRIMARY KEY using index "supplier_access_rules_pkey";

alter table "public"."supplier_access_rules_clone" add constraint "supplier_access_rules_clone_pkey" PRIMARY KEY using index "supplier_access_rules_clone_pkey";

alter table "public"."supplier_interactions" add constraint "supplier_interactions_pkey" PRIMARY KEY using index "supplier_interactions_pkey";

alter table "public"."supplier_rating_history" add constraint "supplier_rating_history_pkey" PRIMARY KEY using index "supplier_rating_history_pkey";

alter table "public"."suppliers" add constraint "suppliers_pkey" PRIMARY KEY using index "suppliers_pkey";

alter table "public"."suppliers_clone" add constraint "suppliers_clone_pkey" PRIMARY KEY using index "suppliers_clone_pkey";

alter table "public"."tasks" add constraint "tasks_pkey" PRIMARY KEY using index "tasks_pkey";

alter table "public"."team_invitations" add constraint "team_invitations_pkey" PRIMARY KEY using index "team_invitations_pkey";

alter table "public"."user_favorites" add constraint "user_favorites_pkey" PRIMARY KEY using index "user_favorites_pkey";

alter table "public"."user_pinned" add constraint "user_pinned_pkey" PRIMARY KEY using index "user_pinned_pkey";

alter table "public"."user_preferences" add constraint "user_preferences_pkey" PRIMARY KEY using index "user_preferences_pkey";

alter table "public"."user_roles_clone" add constraint "user_roles_clone_pkey" PRIMARY KEY using index "user_roles_clone_pkey";

alter table "public"."voice_notes" add constraint "voice_notes_pkey" PRIMARY KEY using index "voice_notes_pkey";

alter table "public"."user_roles" add constraint "user_roles_pkey" PRIMARY KEY using index "user_roles_pkey";

alter table "public"."activities" add constraint "activities_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL not valid;

alter table "public"."activities" validate constraint "activities_project_id_fkey";

alter table "public"."activities" add constraint "activities_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."activities" validate constraint "activities_supplier_id_fkey";

alter table "public"."activities" add constraint "activities_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."activities" validate constraint "activities_user_id_fkey";

alter table "public"."api_usage_logs" add constraint "api_usage_logs_method_check" CHECK ((method = ANY (ARRAY['GET'::text, 'POST'::text, 'PUT'::text, 'DELETE'::text, 'PATCH'::text]))) not valid;

alter table "public"."api_usage_logs" validate constraint "api_usage_logs_method_check";

alter table "public"."api_usage_logs" add constraint "api_usage_logs_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL not valid;

alter table "public"."api_usage_logs" validate constraint "api_usage_logs_project_id_fkey";

alter table "public"."api_usage_logs" add constraint "api_usage_logs_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL not valid;

alter table "public"."api_usage_logs" validate constraint "api_usage_logs_supplier_id_fkey";

alter table "public"."api_usage_logs" add constraint "api_usage_logs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."api_usage_logs" validate constraint "api_usage_logs_user_id_fkey";

alter table "public"."api_usage_logs_clone" add constraint "api_usage_logs_method_check" CHECK ((method = ANY (ARRAY['GET'::text, 'POST'::text, 'PUT'::text, 'DELETE'::text, 'PATCH'::text]))) not valid;

alter table "public"."api_usage_logs_clone" validate constraint "api_usage_logs_method_check";

alter table "public"."bom_alert_config" add constraint "bom_alert_config_project_id_key" UNIQUE using index "bom_alert_config_project_id_key";

alter table "public"."categories" add constraint "categories_name_key" UNIQUE using index "categories_name_key";

alter table "public"."categories" add constraint "categories_slug_key" UNIQUE using index "categories_slug_key";

alter table "public"."client_accounts" add constraint "client_accounts_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."client_accounts" validate constraint "client_accounts_created_by_fkey";

alter table "public"."client_drive_folders" add constraint "client_drive_folders_client_id_drive_folder_id_key" UNIQUE using index "client_drive_folders_client_id_drive_folder_id_key";

alter table "public"."client_drive_folders" add constraint "client_drive_folders_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.client_accounts(id) ON DELETE CASCADE not valid;

alter table "public"."client_drive_folders" validate constraint "client_drive_folders_client_id_fkey";

alter table "public"."client_drive_folders" add constraint "client_drive_folders_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."client_drive_folders" validate constraint "client_drive_folders_created_by_fkey";

alter table "public"."client_memberships" add constraint "client_memberships_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.client_accounts(id) ON DELETE CASCADE not valid;

alter table "public"."client_memberships" validate constraint "client_memberships_client_id_fkey";

alter table "public"."client_memberships" add constraint "client_memberships_client_id_user_id_key" UNIQUE using index "client_memberships_client_id_user_id_key";

alter table "public"."client_memberships" add constraint "client_memberships_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."client_memberships" validate constraint "client_memberships_user_id_fkey";

alter table "public"."crm_section_access" add constraint "crm_section_access_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."crm_section_access" validate constraint "crm_section_access_created_by_fkey";

alter table "public"."crm_section_access" add constraint "crm_section_access_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."crm_section_access" validate constraint "crm_section_access_user_id_fkey";

alter table "public"."crm_section_access" add constraint "crm_section_access_user_id_section_key" UNIQUE using index "crm_section_access_user_id_section_key";

alter table "public"."deals" add constraint "deals_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES auth.users(id) not valid;

alter table "public"."deals" validate constraint "deals_assigned_to_fkey";

alter table "public"."deals" add constraint "deals_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."deals" validate constraint "deals_owner_id_fkey";

alter table "public"."deals" add constraint "deals_probability_check" CHECK (((probability >= 0) AND (probability <= 100))) not valid;

alter table "public"."deals" validate constraint "deals_probability_check";

alter table "public"."deals" add constraint "deals_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL not valid;

alter table "public"."deals" validate constraint "deals_project_id_fkey";

alter table "public"."deals" add constraint "deals_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."deals" validate constraint "deals_supplier_id_fkey";

alter table "public"."deals_clone" add constraint "deals_probability_check" CHECK (((probability >= 0) AND (probability <= 100))) not valid;

alter table "public"."deals_clone" validate constraint "deals_probability_check";

alter table "public"."document_access_rules" add constraint "document_access_rules_access_level_check" CHECK ((access_level = ANY (ARRAY['read'::text, 'write'::text, 'admin'::text]))) not valid;

alter table "public"."document_access_rules" validate constraint "document_access_rules_access_level_check";

alter table "public"."document_access_rules" add constraint "document_access_rules_check" CHECK (((project_id IS NOT NULL) OR (supplier_id IS NOT NULL) OR (deal_id IS NOT NULL) OR (document_id IS NOT NULL))) not valid;

alter table "public"."document_access_rules" validate constraint "document_access_rules_check";

alter table "public"."document_access_rules" add constraint "document_access_rules_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE not valid;

alter table "public"."document_access_rules" validate constraint "document_access_rules_deal_id_fkey";

alter table "public"."document_access_rules" add constraint "document_access_rules_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES auth.users(id) not valid;

alter table "public"."document_access_rules" validate constraint "document_access_rules_granted_by_fkey";

alter table "public"."document_access_rules" add constraint "document_access_rules_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."document_access_rules" validate constraint "document_access_rules_project_id_fkey";

alter table "public"."document_access_rules" add constraint "document_access_rules_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."document_access_rules" validate constraint "document_access_rules_supplier_id_fkey";

alter table "public"."document_access_rules" add constraint "document_access_rules_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."document_access_rules" validate constraint "document_access_rules_user_id_fkey";

alter table "public"."documents" add constraint "documents_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE SET NULL not valid;

alter table "public"."documents" validate constraint "documents_deal_id_fkey";

alter table "public"."documents" add constraint "documents_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE SET NULL not valid;

alter table "public"."documents" validate constraint "documents_project_id_fkey";

alter table "public"."documents" add constraint "documents_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL not valid;

alter table "public"."documents" validate constraint "documents_supplier_id_fkey";

alter table "public"."email_templates" add constraint "email_templates_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) not valid;

alter table "public"."email_templates" validate constraint "email_templates_created_by_fkey";

alter table "public"."import_batches" add constraint "import_batches_imported_by_fkey" FOREIGN KEY (imported_by) REFERENCES public.profiles(id) not valid;

alter table "public"."import_batches" validate constraint "import_batches_imported_by_fkey";

alter table "public"."notes" add constraint "notes_author_id_fkey" FOREIGN KEY (author_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."notes" validate constraint "notes_author_id_fkey";

alter table "public"."notes" add constraint "notes_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE not valid;

alter table "public"."notes" validate constraint "notes_deal_id_fkey";

alter table "public"."notes" add constraint "notes_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."notes" validate constraint "notes_project_id_fkey";

alter table "public"."notes" add constraint "notes_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."notes" validate constraint "notes_supplier_id_fkey";

alter table "public"."plan_analyses" add constraint "plan_analyses_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.plan_jobs(id) ON DELETE CASCADE not valid;

alter table "public"."plan_analyses" validate constraint "plan_analyses_job_id_fkey";

alter table "public"."plan_job_artifacts" add constraint "plan_job_artifacts_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.plan_jobs(id) ON DELETE CASCADE not valid;

alter table "public"."plan_job_artifacts" validate constraint "plan_job_artifacts_job_id_fkey";

alter table "public"."price_items" add constraint "price_items_price_book_id_fkey" FOREIGN KEY (price_book_id) REFERENCES public.price_books(id) ON DELETE CASCADE not valid;

alter table "public"."price_items" validate constraint "price_items_price_book_id_fkey";

alter table "public"."product_assets" add constraint "product_assets_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."product_assets" validate constraint "product_assets_product_id_fkey";

alter table "public"."products" add constraint "products_sku_key" UNIQUE using index "products_sku_key";

alter table "public"."profiles" add constraint "profiles_email_key" UNIQUE using index "profiles_email_key";

alter table "public"."profiles" add constraint "profiles_id_fkey" FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."profiles" validate constraint "profiles_id_fkey";

alter table "public"."project_access" add constraint "project_access_granted_by_fkey" FOREIGN KEY (granted_by) REFERENCES public.profiles(id) not valid;

alter table "public"."project_access" validate constraint "project_access_granted_by_fkey";

alter table "public"."project_access" add constraint "project_access_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_access" validate constraint "project_access_project_id_fkey";

alter table "public"."project_access" add constraint "project_access_project_id_user_id_key" UNIQUE using index "project_access_project_id_user_id_key";

alter table "public"."project_access" add constraint "project_access_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."project_access" validate constraint "project_access_user_id_fkey";

alter table "public"."project_bom_items" add constraint "project_bom_items_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_bom_items" validate constraint "project_bom_items_project_id_fkey";

alter table "public"."project_bom_items" add constraint "project_bom_items_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE SET NULL not valid;

alter table "public"."project_bom_items" validate constraint "project_bom_items_supplier_id_fkey";

alter table "public"."project_files" add constraint "project_files_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."project_files" validate constraint "project_files_project_id_fkey";

alter table "public"."project_files" add constraint "project_files_uploaded_by_fkey" FOREIGN KEY (uploaded_by) REFERENCES public.profiles(id) not valid;

alter table "public"."project_files" validate constraint "project_files_uploaded_by_fkey";

alter table "public"."projects" add constraint "projects_owner_id_fkey" FOREIGN KEY (owner_id) REFERENCES public.profiles(id) ON DELETE CASCADE not valid;

alter table "public"."projects" validate constraint "projects_owner_id_fkey";

alter table "public"."push_tokens" add constraint "push_tokens_token_key" UNIQUE using index "push_tokens_token_key";

alter table "public"."quotation_lines" add constraint "quotation_lines_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL not valid;

alter table "public"."quotation_lines" validate constraint "quotation_lines_product_id_fkey";

alter table "public"."quotations" add constraint "quotations_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."quotations" validate constraint "quotations_created_by_fkey";

alter table "public"."quotations" add constraint "quotations_extraction_job_id_fkey" FOREIGN KEY (extraction_job_id) REFERENCES public.plan_jobs(id) ON DELETE SET NULL not valid;

alter table "public"."quotations" validate constraint "quotations_extraction_job_id_fkey";

alter table "public"."quote_pricing_rules" add constraint "quote_pricing_rules_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."quote_pricing_rules" validate constraint "quote_pricing_rules_product_id_fkey";

alter table "public"."quote_product_visibility" add constraint "quote_product_visibility_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."quote_product_visibility" validate constraint "quote_product_visibility_created_by_fkey";

alter table "public"."quote_product_visibility" add constraint "quote_product_visibility_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE not valid;

alter table "public"."quote_product_visibility" validate constraint "quote_product_visibility_product_id_fkey";

alter table "public"."security_audit_logs" add constraint "security_audit_logs_actor_user_id_fkey" FOREIGN KEY (actor_user_id) REFERENCES auth.users(id) not valid;

alter table "public"."security_audit_logs" validate constraint "security_audit_logs_actor_user_id_fkey";

alter table "public"."supplier_access_rules" add constraint "supplier_access_rules_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_access_rules" validate constraint "supplier_access_rules_category_id_fkey";

alter table "public"."supplier_access_rules" add constraint "supplier_access_rules_check" CHECK (((category_id IS NOT NULL) OR (region IS NOT NULL))) not valid;

alter table "public"."supplier_access_rules" validate constraint "supplier_access_rules_check";

alter table "public"."supplier_access_rules" add constraint "supplier_access_rules_created_by_fkey" FOREIGN KEY (created_by) REFERENCES auth.users(id) not valid;

alter table "public"."supplier_access_rules" validate constraint "supplier_access_rules_created_by_fkey";

alter table "public"."supplier_access_rules" add constraint "supplier_access_rules_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_access_rules" validate constraint "supplier_access_rules_user_id_fkey";

alter table "public"."supplier_access_rules_clone" add constraint "supplier_access_rules_check" CHECK (((category_id IS NOT NULL) OR (region IS NOT NULL))) not valid;

alter table "public"."supplier_access_rules_clone" validate constraint "supplier_access_rules_check";

alter table "public"."supplier_rating_history" add constraint "supplier_rating_history_rated_by_fkey" FOREIGN KEY (rated_by) REFERENCES public.profiles(id) not valid;

alter table "public"."supplier_rating_history" validate constraint "supplier_rating_history_rated_by_fkey";

alter table "public"."supplier_rating_history" add constraint "supplier_rating_history_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."supplier_rating_history" validate constraint "supplier_rating_history_supplier_id_fkey";

alter table "public"."suppliers" add constraint "suppliers_category_id_fkey" FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL not valid;

alter table "public"."suppliers" validate constraint "suppliers_category_id_fkey";

alter table "public"."suppliers" add constraint "suppliers_owner_rating_check" CHECK (((owner_rating >= (0)::numeric) AND (owner_rating <= (5)::numeric))) not valid;

alter table "public"."suppliers" validate constraint "suppliers_owner_rating_check";

alter table "public"."suppliers" add constraint "suppliers_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."suppliers" validate constraint "suppliers_user_id_fkey";

alter table "public"."suppliers_clone" add constraint "suppliers_owner_rating_check" CHECK (((owner_rating >= (0)::numeric) AND (owner_rating <= (5)::numeric))) not valid;

alter table "public"."suppliers_clone" validate constraint "suppliers_owner_rating_check";

alter table "public"."tasks" add constraint "tasks_assigned_to_fkey" FOREIGN KEY (assigned_to) REFERENCES public.profiles(id) ON DELETE SET NULL not valid;

alter table "public"."tasks" validate constraint "tasks_assigned_to_fkey";

alter table "public"."tasks" add constraint "tasks_created_by_fkey" FOREIGN KEY (created_by) REFERENCES public.profiles(id) not valid;

alter table "public"."tasks" validate constraint "tasks_created_by_fkey";

alter table "public"."tasks" add constraint "tasks_deal_id_fkey" FOREIGN KEY (deal_id) REFERENCES public.deals(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_deal_id_fkey";

alter table "public"."tasks" add constraint "tasks_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_project_id_fkey";

alter table "public"."tasks" add constraint "tasks_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id) ON DELETE CASCADE not valid;

alter table "public"."tasks" validate constraint "tasks_supplier_id_fkey";

alter table "public"."user_favorites" add constraint "user_favorites_user_id_supplier_id_key" UNIQUE using index "user_favorites_user_id_supplier_id_key";

alter table "public"."user_pinned" add constraint "user_pinned_user_id_supplier_id_key" UNIQUE using index "user_pinned_user_id_supplier_id_key";

alter table "public"."user_preferences" add constraint "user_preferences_user_id_key" UNIQUE using index "user_preferences_user_id_key";

alter table "public"."user_roles" add constraint "user_roles_assigned_by_fkey" FOREIGN KEY (assigned_by) REFERENCES auth.users(id) not valid;

alter table "public"."user_roles" validate constraint "user_roles_assigned_by_fkey";

alter table "public"."user_roles" add constraint "user_roles_role_check" CHECK ((role = ANY (ARRAY['Admin'::text, 'Manager'::text, 'Viewer'::text, 'Procurement'::text]))) not valid;

alter table "public"."user_roles" validate constraint "user_roles_role_check";

alter table "public"."user_roles" add constraint "user_roles_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE not valid;

alter table "public"."user_roles" validate constraint "user_roles_user_id_fkey";

alter table "public"."user_roles" add constraint "user_roles_user_id_key" UNIQUE using index "user_roles_user_id_key";

alter table "public"."user_roles_clone" add constraint "user_roles_clone_user_id_key" UNIQUE using index "user_roles_clone_user_id_key";

alter table "public"."user_roles_clone" add constraint "user_roles_role_check" CHECK ((role = ANY (ARRAY['Admin'::text, 'Manager'::text, 'Viewer'::text, 'Procurement'::text]))) not valid;

alter table "public"."user_roles_clone" validate constraint "user_roles_role_check";

alter table "public"."quotations" add constraint "quotations_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."quotations" validate constraint "quotations_user_id_fkey";

alter table "public"."quote_leads" add constraint "quote_leads_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL not valid;

alter table "public"."quote_leads" validate constraint "quote_leads_user_id_fkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.cleanup_expired_access_rules()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM document_access_rules
  WHERE expires_at IS NOT NULL AND expires_at < NOW();
END;
$function$
;

CREATE OR REPLACE FUNCTION public.cleanup_old_usage_logs()
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
  DELETE FROM api_usage_logs
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_share_token()
 RETURNS text
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_endpoint_stats(p_endpoint text DEFAULT NULL::text, p_start_date timestamp with time zone DEFAULT (now() - '7 days'::interval), p_end_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(endpoint text, total_requests bigint, success_rate numeric, avg_response_time_ms numeric, total_cost numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    aul.endpoint,
    COUNT(*)::BIGINT as total_requests,
    (COUNT(*) FILTER (WHERE success = true)::DECIMAL / COUNT(*) * 100) as success_rate,
    COALESCE(AVG(aul.response_time_ms), 0) as avg_response_time_ms,
    COALESCE(SUM(aul.cost_estimate), 0) as total_cost
  FROM api_usage_logs aul
  WHERE aul.created_at BETWEEN p_start_date AND p_end_date
    AND (p_endpoint IS NULL OR aul.endpoint = p_endpoint)
  GROUP BY aul.endpoint
  ORDER BY total_requests DESC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_top_users_by_cost(p_limit integer DEFAULT 10, p_start_date timestamp with time zone DEFAULT (now() - '30 days'::interval), p_end_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(user_id uuid, total_cost numeric, total_requests bigint, total_tokens bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    aul.user_id,
    SUM(aul.cost_estimate) as total_cost,
    COUNT(*)::BIGINT as total_requests,
    SUM(aul.tokens_used)::BIGINT as total_tokens
  FROM api_usage_logs aul
  WHERE aul.created_at BETWEEN p_start_date AND p_end_date
    AND aul.user_id IS NOT NULL
  GROUP BY aul.user_id
  ORDER BY total_cost DESC
  LIMIT p_limit;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_accessible_projects(p_user_id uuid)
 RETURNS TABLE(project_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Admins can access all projects
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'Admin') THEN
    RETURN QUERY SELECT id FROM projects;
  ELSE
    -- Return projects user has explicit access to
    RETURN QUERY
    SELECT DISTINCT dar.project_id
    FROM document_access_rules dar
    WHERE dar.user_id = p_user_id
      AND dar.project_id IS NOT NULL
      AND (dar.expires_at IS NULL OR dar.expires_at > NOW());
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_accessible_suppliers(p_user_id uuid)
 RETURNS TABLE(supplier_id uuid)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Admins can access all suppliers
  IF EXISTS (SELECT 1 FROM user_roles WHERE user_id = p_user_id AND role = 'Admin') THEN
    RETURN QUERY SELECT id FROM suppliers;
  ELSE
    -- Return suppliers user has explicit access to
    RETURN QUERY
    SELECT DISTINCT dar.supplier_id
    FROM document_access_rules dar
    WHERE dar.user_id = p_user_id
      AND dar.supplier_id IS NOT NULL
      AND (dar.expires_at IS NULL OR dar.expires_at > NOW());
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_role(p_user_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT role FROM user_roles WHERE user_id = p_user_id;
$function$
;

CREATE OR REPLACE FUNCTION public.get_user_usage_stats(p_user_id uuid, p_start_date timestamp with time zone DEFAULT (now() - '30 days'::interval), p_end_date timestamp with time zone DEFAULT now())
 RETURNS TABLE(total_requests bigint, successful_requests bigint, failed_requests bigint, total_tokens bigint, total_cost numeric, avg_response_time_ms numeric, endpoints_used bigint)
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_requests,
    COUNT(*) FILTER (WHERE success = true)::BIGINT as successful_requests,
    COUNT(*) FILTER (WHERE success = false)::BIGINT as failed_requests,
    COALESCE(SUM(tokens_used), 0)::BIGINT as total_tokens,
    COALESCE(SUM(cost_estimate), 0) as total_cost,
    COALESCE(AVG(response_time_ms), 0) as avg_response_time_ms,
    COUNT(DISTINCT endpoint)::BIGINT as endpoints_used
  FROM api_usage_logs
  WHERE user_id = p_user_id
    AND created_at BETWEEN p_start_date AND p_end_date;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin(p_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = p_user_id AND role = 'Admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_or_manager()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$function$
;

CREATE OR REPLACE FUNCTION public.match_construction_rules(query_embedding extensions.vector, match_threshold double precision, match_count integer)
 RETURNS TABLE(id uuid, jurisdiction_name text, category text, content text, metadata jsonb, similarity double precision)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    material_standards.id,
    material_standards.jurisdiction_name,
    material_standards.category,
    material_standards.content,
    material_standards.metadata,
    1 - (material_standards.embedding <=> query_embedding) AS similarity
  FROM material_standards
  WHERE 1 - (material_standards.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_document_access_rules_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_supplier_access_rules_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_user_roles_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_can_access_resource(p_user_id uuid, p_project_id uuid DEFAULT NULL::uuid, p_supplier_id uuid DEFAULT NULL::uuid, p_deal_id uuid DEFAULT NULL::uuid, p_document_id uuid DEFAULT NULL::uuid, p_required_level text DEFAULT 'read'::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_role TEXT;
  v_has_access BOOLEAN;
  v_level_priority INT;
BEGIN
  -- Get user's role
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = p_user_id;

  -- Admins have full access to everything
  IF v_user_role = 'Admin' THEN
    RETURN TRUE;
  END IF;

  -- Convert access level to priority for comparison
  v_level_priority := CASE p_required_level
    WHEN 'read' THEN 1
    WHEN 'write' THEN 2
    WHEN 'admin' THEN 3
    ELSE 1
  END;

  -- Check if user has sufficient access
  SELECT EXISTS (
    SELECT 1
    FROM document_access_rules dar
    WHERE dar.user_id = p_user_id
      -- Check expiration
      AND (dar.expires_at IS NULL OR dar.expires_at > NOW())
      -- Check access level meets requirement
      AND (
        (dar.access_level = 'admin') OR
        (dar.access_level = 'write' AND v_level_priority <= 2) OR
        (dar.access_level = 'read' AND v_level_priority <= 1)
      )
      -- Check resource match
      AND (
        (p_project_id IS NOT NULL AND dar.project_id = p_project_id) OR
        (p_supplier_id IS NOT NULL AND dar.supplier_id = p_supplier_id) OR
        (p_deal_id IS NOT NULL AND dar.deal_id = p_deal_id) OR
        (p_document_id IS NOT NULL AND dar.document_id = p_document_id)
      )
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.user_can_view_supplier(p_user_id uuid, p_supplier_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_user_role TEXT;
  v_has_access BOOLEAN;
BEGIN
  SELECT role INTO v_user_role FROM user_roles WHERE user_id = p_user_id;

  IF v_user_role = 'Admin' THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM supplier_access_rules sar
    JOIN suppliers s ON s.id = p_supplier_id
    WHERE sar.user_id = p_user_id
      AND (sar.category_id IS NULL OR sar.category_id = s.category_id)
      AND (sar.region IS NULL OR sar.region = s.region)
  ) INTO v_has_access;

  RETURN v_has_access;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.generate_quote_number()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.quote_number IS NULL THEN
    NEW.quote_number := 'QT-' ||
                        TO_CHAR(NOW(), 'YYYY') || '-' ||
                        LPAD(NEXTVAL('quote_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$function$
;

grant delete on table "public"."activities" to "anon";

grant insert on table "public"."activities" to "anon";

grant references on table "public"."activities" to "anon";

grant select on table "public"."activities" to "anon";

grant trigger on table "public"."activities" to "anon";

grant truncate on table "public"."activities" to "anon";

grant update on table "public"."activities" to "anon";

grant delete on table "public"."activities" to "authenticated";

grant insert on table "public"."activities" to "authenticated";

grant references on table "public"."activities" to "authenticated";

grant select on table "public"."activities" to "authenticated";

grant trigger on table "public"."activities" to "authenticated";

grant truncate on table "public"."activities" to "authenticated";

grant update on table "public"."activities" to "authenticated";

grant delete on table "public"."activities" to "service_role";

grant insert on table "public"."activities" to "service_role";

grant references on table "public"."activities" to "service_role";

grant select on table "public"."activities" to "service_role";

grant trigger on table "public"."activities" to "service_role";

grant truncate on table "public"."activities" to "service_role";

grant update on table "public"."activities" to "service_role";

grant delete on table "public"."api_usage_logs" to "anon";

grant insert on table "public"."api_usage_logs" to "anon";

grant references on table "public"."api_usage_logs" to "anon";

grant select on table "public"."api_usage_logs" to "anon";

grant trigger on table "public"."api_usage_logs" to "anon";

grant truncate on table "public"."api_usage_logs" to "anon";

grant update on table "public"."api_usage_logs" to "anon";

grant delete on table "public"."api_usage_logs" to "authenticated";

grant insert on table "public"."api_usage_logs" to "authenticated";

grant references on table "public"."api_usage_logs" to "authenticated";

grant select on table "public"."api_usage_logs" to "authenticated";

grant trigger on table "public"."api_usage_logs" to "authenticated";

grant truncate on table "public"."api_usage_logs" to "authenticated";

grant update on table "public"."api_usage_logs" to "authenticated";

grant delete on table "public"."api_usage_logs" to "service_role";

grant insert on table "public"."api_usage_logs" to "service_role";

grant references on table "public"."api_usage_logs" to "service_role";

grant select on table "public"."api_usage_logs" to "service_role";

grant trigger on table "public"."api_usage_logs" to "service_role";

grant truncate on table "public"."api_usage_logs" to "service_role";

grant update on table "public"."api_usage_logs" to "service_role";

grant delete on table "public"."api_usage_logs_clone" to "anon";

grant insert on table "public"."api_usage_logs_clone" to "anon";

grant references on table "public"."api_usage_logs_clone" to "anon";

grant select on table "public"."api_usage_logs_clone" to "anon";

grant trigger on table "public"."api_usage_logs_clone" to "anon";

grant truncate on table "public"."api_usage_logs_clone" to "anon";

grant update on table "public"."api_usage_logs_clone" to "anon";

grant delete on table "public"."api_usage_logs_clone" to "authenticated";

grant insert on table "public"."api_usage_logs_clone" to "authenticated";

grant references on table "public"."api_usage_logs_clone" to "authenticated";

grant select on table "public"."api_usage_logs_clone" to "authenticated";

grant trigger on table "public"."api_usage_logs_clone" to "authenticated";

grant truncate on table "public"."api_usage_logs_clone" to "authenticated";

grant update on table "public"."api_usage_logs_clone" to "authenticated";

grant delete on table "public"."api_usage_logs_clone" to "service_role";

grant insert on table "public"."api_usage_logs_clone" to "service_role";

grant references on table "public"."api_usage_logs_clone" to "service_role";

grant select on table "public"."api_usage_logs_clone" to "service_role";

grant trigger on table "public"."api_usage_logs_clone" to "service_role";

grant truncate on table "public"."api_usage_logs_clone" to "service_role";

grant update on table "public"."api_usage_logs_clone" to "service_role";

grant delete on table "public"."barcode_scans" to "anon";

grant insert on table "public"."barcode_scans" to "anon";

grant references on table "public"."barcode_scans" to "anon";

grant select on table "public"."barcode_scans" to "anon";

grant trigger on table "public"."barcode_scans" to "anon";

grant truncate on table "public"."barcode_scans" to "anon";

grant update on table "public"."barcode_scans" to "anon";

grant delete on table "public"."barcode_scans" to "authenticated";

grant insert on table "public"."barcode_scans" to "authenticated";

grant references on table "public"."barcode_scans" to "authenticated";

grant select on table "public"."barcode_scans" to "authenticated";

grant trigger on table "public"."barcode_scans" to "authenticated";

grant truncate on table "public"."barcode_scans" to "authenticated";

grant update on table "public"."barcode_scans" to "authenticated";

grant delete on table "public"."barcode_scans" to "service_role";

grant insert on table "public"."barcode_scans" to "service_role";

grant references on table "public"."barcode_scans" to "service_role";

grant select on table "public"."barcode_scans" to "service_role";

grant trigger on table "public"."barcode_scans" to "service_role";

grant truncate on table "public"."barcode_scans" to "service_role";

grant update on table "public"."barcode_scans" to "service_role";

grant delete on table "public"."bom_alert_config" to "anon";

grant insert on table "public"."bom_alert_config" to "anon";

grant references on table "public"."bom_alert_config" to "anon";

grant select on table "public"."bom_alert_config" to "anon";

grant trigger on table "public"."bom_alert_config" to "anon";

grant truncate on table "public"."bom_alert_config" to "anon";

grant update on table "public"."bom_alert_config" to "anon";

grant delete on table "public"."bom_alert_config" to "authenticated";

grant insert on table "public"."bom_alert_config" to "authenticated";

grant references on table "public"."bom_alert_config" to "authenticated";

grant select on table "public"."bom_alert_config" to "authenticated";

grant trigger on table "public"."bom_alert_config" to "authenticated";

grant truncate on table "public"."bom_alert_config" to "authenticated";

grant update on table "public"."bom_alert_config" to "authenticated";

grant delete on table "public"."bom_alert_config" to "service_role";

grant insert on table "public"."bom_alert_config" to "service_role";

grant references on table "public"."bom_alert_config" to "service_role";

grant select on table "public"."bom_alert_config" to "service_role";

grant trigger on table "public"."bom_alert_config" to "service_role";

grant truncate on table "public"."bom_alert_config" to "service_role";

grant update on table "public"."bom_alert_config" to "service_role";

grant delete on table "public"."bom_alerts" to "anon";

grant insert on table "public"."bom_alerts" to "anon";

grant references on table "public"."bom_alerts" to "anon";

grant select on table "public"."bom_alerts" to "anon";

grant trigger on table "public"."bom_alerts" to "anon";

grant truncate on table "public"."bom_alerts" to "anon";

grant update on table "public"."bom_alerts" to "anon";

grant delete on table "public"."bom_alerts" to "authenticated";

grant insert on table "public"."bom_alerts" to "authenticated";

grant references on table "public"."bom_alerts" to "authenticated";

grant select on table "public"."bom_alerts" to "authenticated";

grant trigger on table "public"."bom_alerts" to "authenticated";

grant truncate on table "public"."bom_alerts" to "authenticated";

grant update on table "public"."bom_alerts" to "authenticated";

grant delete on table "public"."bom_alerts" to "service_role";

grant insert on table "public"."bom_alerts" to "service_role";

grant references on table "public"."bom_alerts" to "service_role";

grant select on table "public"."bom_alerts" to "service_role";

grant trigger on table "public"."bom_alerts" to "service_role";

grant truncate on table "public"."bom_alerts" to "service_role";

grant update on table "public"."bom_alerts" to "service_role";

grant delete on table "public"."categories" to "anon";

grant insert on table "public"."categories" to "anon";

grant references on table "public"."categories" to "anon";

grant select on table "public"."categories" to "anon";

grant trigger on table "public"."categories" to "anon";

grant truncate on table "public"."categories" to "anon";

grant update on table "public"."categories" to "anon";

grant delete on table "public"."categories" to "authenticated";

grant insert on table "public"."categories" to "authenticated";

grant references on table "public"."categories" to "authenticated";

grant select on table "public"."categories" to "authenticated";

grant trigger on table "public"."categories" to "authenticated";

grant truncate on table "public"."categories" to "authenticated";

grant update on table "public"."categories" to "authenticated";

grant delete on table "public"."categories" to "service_role";

grant insert on table "public"."categories" to "service_role";

grant references on table "public"."categories" to "service_role";

grant select on table "public"."categories" to "service_role";

grant trigger on table "public"."categories" to "service_role";

grant truncate on table "public"."categories" to "service_role";

grant update on table "public"."categories" to "service_role";

grant delete on table "public"."client_accounts" to "anon";

grant insert on table "public"."client_accounts" to "anon";

grant references on table "public"."client_accounts" to "anon";

grant select on table "public"."client_accounts" to "anon";

grant trigger on table "public"."client_accounts" to "anon";

grant truncate on table "public"."client_accounts" to "anon";

grant update on table "public"."client_accounts" to "anon";

grant delete on table "public"."client_accounts" to "authenticated";

grant insert on table "public"."client_accounts" to "authenticated";

grant references on table "public"."client_accounts" to "authenticated";

grant select on table "public"."client_accounts" to "authenticated";

grant trigger on table "public"."client_accounts" to "authenticated";

grant truncate on table "public"."client_accounts" to "authenticated";

grant update on table "public"."client_accounts" to "authenticated";

grant delete on table "public"."client_accounts" to "service_role";

grant insert on table "public"."client_accounts" to "service_role";

grant references on table "public"."client_accounts" to "service_role";

grant select on table "public"."client_accounts" to "service_role";

grant trigger on table "public"."client_accounts" to "service_role";

grant truncate on table "public"."client_accounts" to "service_role";

grant update on table "public"."client_accounts" to "service_role";

grant delete on table "public"."client_drive_folders" to "anon";

grant insert on table "public"."client_drive_folders" to "anon";

grant references on table "public"."client_drive_folders" to "anon";

grant select on table "public"."client_drive_folders" to "anon";

grant trigger on table "public"."client_drive_folders" to "anon";

grant truncate on table "public"."client_drive_folders" to "anon";

grant update on table "public"."client_drive_folders" to "anon";

grant delete on table "public"."client_drive_folders" to "authenticated";

grant insert on table "public"."client_drive_folders" to "authenticated";

grant references on table "public"."client_drive_folders" to "authenticated";

grant select on table "public"."client_drive_folders" to "authenticated";

grant trigger on table "public"."client_drive_folders" to "authenticated";

grant truncate on table "public"."client_drive_folders" to "authenticated";

grant update on table "public"."client_drive_folders" to "authenticated";

grant delete on table "public"."client_drive_folders" to "service_role";

grant insert on table "public"."client_drive_folders" to "service_role";

grant references on table "public"."client_drive_folders" to "service_role";

grant select on table "public"."client_drive_folders" to "service_role";

grant trigger on table "public"."client_drive_folders" to "service_role";

grant truncate on table "public"."client_drive_folders" to "service_role";

grant update on table "public"."client_drive_folders" to "service_role";

grant delete on table "public"."client_memberships" to "anon";

grant insert on table "public"."client_memberships" to "anon";

grant references on table "public"."client_memberships" to "anon";

grant select on table "public"."client_memberships" to "anon";

grant trigger on table "public"."client_memberships" to "anon";

grant truncate on table "public"."client_memberships" to "anon";

grant update on table "public"."client_memberships" to "anon";

grant delete on table "public"."client_memberships" to "authenticated";

grant insert on table "public"."client_memberships" to "authenticated";

grant references on table "public"."client_memberships" to "authenticated";

grant select on table "public"."client_memberships" to "authenticated";

grant trigger on table "public"."client_memberships" to "authenticated";

grant truncate on table "public"."client_memberships" to "authenticated";

grant update on table "public"."client_memberships" to "authenticated";

grant delete on table "public"."client_memberships" to "service_role";

grant insert on table "public"."client_memberships" to "service_role";

grant references on table "public"."client_memberships" to "service_role";

grant select on table "public"."client_memberships" to "service_role";

grant trigger on table "public"."client_memberships" to "service_role";

grant truncate on table "public"."client_memberships" to "service_role";

grant update on table "public"."client_memberships" to "service_role";

grant delete on table "public"."crm_section_access" to "anon";

grant insert on table "public"."crm_section_access" to "anon";

grant references on table "public"."crm_section_access" to "anon";

grant select on table "public"."crm_section_access" to "anon";

grant trigger on table "public"."crm_section_access" to "anon";

grant truncate on table "public"."crm_section_access" to "anon";

grant update on table "public"."crm_section_access" to "anon";

grant delete on table "public"."crm_section_access" to "authenticated";

grant insert on table "public"."crm_section_access" to "authenticated";

grant references on table "public"."crm_section_access" to "authenticated";

grant select on table "public"."crm_section_access" to "authenticated";

grant trigger on table "public"."crm_section_access" to "authenticated";

grant truncate on table "public"."crm_section_access" to "authenticated";

grant update on table "public"."crm_section_access" to "authenticated";

grant delete on table "public"."crm_section_access" to "service_role";

grant insert on table "public"."crm_section_access" to "service_role";

grant references on table "public"."crm_section_access" to "service_role";

grant select on table "public"."crm_section_access" to "service_role";

grant trigger on table "public"."crm_section_access" to "service_role";

grant truncate on table "public"."crm_section_access" to "service_role";

grant update on table "public"."crm_section_access" to "service_role";

grant delete on table "public"."deal_activities" to "anon";

grant insert on table "public"."deal_activities" to "anon";

grant references on table "public"."deal_activities" to "anon";

grant select on table "public"."deal_activities" to "anon";

grant trigger on table "public"."deal_activities" to "anon";

grant truncate on table "public"."deal_activities" to "anon";

grant update on table "public"."deal_activities" to "anon";

grant delete on table "public"."deal_activities" to "authenticated";

grant insert on table "public"."deal_activities" to "authenticated";

grant references on table "public"."deal_activities" to "authenticated";

grant select on table "public"."deal_activities" to "authenticated";

grant trigger on table "public"."deal_activities" to "authenticated";

grant truncate on table "public"."deal_activities" to "authenticated";

grant update on table "public"."deal_activities" to "authenticated";

grant delete on table "public"."deal_activities" to "service_role";

grant insert on table "public"."deal_activities" to "service_role";

grant references on table "public"."deal_activities" to "service_role";

grant select on table "public"."deal_activities" to "service_role";

grant trigger on table "public"."deal_activities" to "service_role";

grant truncate on table "public"."deal_activities" to "service_role";

grant update on table "public"."deal_activities" to "service_role";

grant delete on table "public"."deal_attachments" to "anon";

grant insert on table "public"."deal_attachments" to "anon";

grant references on table "public"."deal_attachments" to "anon";

grant select on table "public"."deal_attachments" to "anon";

grant trigger on table "public"."deal_attachments" to "anon";

grant truncate on table "public"."deal_attachments" to "anon";

grant update on table "public"."deal_attachments" to "anon";

grant delete on table "public"."deal_attachments" to "authenticated";

grant insert on table "public"."deal_attachments" to "authenticated";

grant references on table "public"."deal_attachments" to "authenticated";

grant select on table "public"."deal_attachments" to "authenticated";

grant trigger on table "public"."deal_attachments" to "authenticated";

grant truncate on table "public"."deal_attachments" to "authenticated";

grant update on table "public"."deal_attachments" to "authenticated";

grant delete on table "public"."deal_attachments" to "service_role";

grant insert on table "public"."deal_attachments" to "service_role";

grant references on table "public"."deal_attachments" to "service_role";

grant select on table "public"."deal_attachments" to "service_role";

grant trigger on table "public"."deal_attachments" to "service_role";

grant truncate on table "public"."deal_attachments" to "service_role";

grant update on table "public"."deal_attachments" to "service_role";

grant delete on table "public"."deal_templates" to "anon";

grant insert on table "public"."deal_templates" to "anon";

grant references on table "public"."deal_templates" to "anon";

grant select on table "public"."deal_templates" to "anon";

grant trigger on table "public"."deal_templates" to "anon";

grant truncate on table "public"."deal_templates" to "anon";

grant update on table "public"."deal_templates" to "anon";

grant delete on table "public"."deal_templates" to "authenticated";

grant insert on table "public"."deal_templates" to "authenticated";

grant references on table "public"."deal_templates" to "authenticated";

grant select on table "public"."deal_templates" to "authenticated";

grant trigger on table "public"."deal_templates" to "authenticated";

grant truncate on table "public"."deal_templates" to "authenticated";

grant update on table "public"."deal_templates" to "authenticated";

grant delete on table "public"."deal_templates" to "service_role";

grant insert on table "public"."deal_templates" to "service_role";

grant references on table "public"."deal_templates" to "service_role";

grant select on table "public"."deal_templates" to "service_role";

grant trigger on table "public"."deal_templates" to "service_role";

grant truncate on table "public"."deal_templates" to "service_role";

grant update on table "public"."deal_templates" to "service_role";

grant delete on table "public"."deals" to "anon";

grant insert on table "public"."deals" to "anon";

grant references on table "public"."deals" to "anon";

grant select on table "public"."deals" to "anon";

grant trigger on table "public"."deals" to "anon";

grant truncate on table "public"."deals" to "anon";

grant update on table "public"."deals" to "anon";

grant delete on table "public"."deals" to "authenticated";

grant insert on table "public"."deals" to "authenticated";

grant references on table "public"."deals" to "authenticated";

grant select on table "public"."deals" to "authenticated";

grant trigger on table "public"."deals" to "authenticated";

grant truncate on table "public"."deals" to "authenticated";

grant update on table "public"."deals" to "authenticated";

grant delete on table "public"."deals" to "service_role";

grant insert on table "public"."deals" to "service_role";

grant references on table "public"."deals" to "service_role";

grant select on table "public"."deals" to "service_role";

grant trigger on table "public"."deals" to "service_role";

grant truncate on table "public"."deals" to "service_role";

grant update on table "public"."deals" to "service_role";

grant delete on table "public"."deals_clone" to "anon";

grant insert on table "public"."deals_clone" to "anon";

grant references on table "public"."deals_clone" to "anon";

grant select on table "public"."deals_clone" to "anon";

grant trigger on table "public"."deals_clone" to "anon";

grant truncate on table "public"."deals_clone" to "anon";

grant update on table "public"."deals_clone" to "anon";

grant delete on table "public"."deals_clone" to "authenticated";

grant insert on table "public"."deals_clone" to "authenticated";

grant references on table "public"."deals_clone" to "authenticated";

grant select on table "public"."deals_clone" to "authenticated";

grant trigger on table "public"."deals_clone" to "authenticated";

grant truncate on table "public"."deals_clone" to "authenticated";

grant update on table "public"."deals_clone" to "authenticated";

grant delete on table "public"."deals_clone" to "service_role";

grant insert on table "public"."deals_clone" to "service_role";

grant references on table "public"."deals_clone" to "service_role";

grant select on table "public"."deals_clone" to "service_role";

grant trigger on table "public"."deals_clone" to "service_role";

grant truncate on table "public"."deals_clone" to "service_role";

grant update on table "public"."deals_clone" to "service_role";

grant delete on table "public"."document_access_rules" to "anon";

grant insert on table "public"."document_access_rules" to "anon";

grant references on table "public"."document_access_rules" to "anon";

grant select on table "public"."document_access_rules" to "anon";

grant trigger on table "public"."document_access_rules" to "anon";

grant truncate on table "public"."document_access_rules" to "anon";

grant update on table "public"."document_access_rules" to "anon";

grant delete on table "public"."document_access_rules" to "authenticated";

grant insert on table "public"."document_access_rules" to "authenticated";

grant references on table "public"."document_access_rules" to "authenticated";

grant select on table "public"."document_access_rules" to "authenticated";

grant trigger on table "public"."document_access_rules" to "authenticated";

grant truncate on table "public"."document_access_rules" to "authenticated";

grant update on table "public"."document_access_rules" to "authenticated";

grant delete on table "public"."document_access_rules" to "service_role";

grant insert on table "public"."document_access_rules" to "service_role";

grant references on table "public"."document_access_rules" to "service_role";

grant select on table "public"."document_access_rules" to "service_role";

grant trigger on table "public"."document_access_rules" to "service_role";

grant truncate on table "public"."document_access_rules" to "service_role";

grant update on table "public"."document_access_rules" to "service_role";

grant delete on table "public"."documents" to "anon";

grant insert on table "public"."documents" to "anon";

grant references on table "public"."documents" to "anon";

grant select on table "public"."documents" to "anon";

grant trigger on table "public"."documents" to "anon";

grant truncate on table "public"."documents" to "anon";

grant update on table "public"."documents" to "anon";

grant delete on table "public"."documents" to "authenticated";

grant insert on table "public"."documents" to "authenticated";

grant references on table "public"."documents" to "authenticated";

grant select on table "public"."documents" to "authenticated";

grant trigger on table "public"."documents" to "authenticated";

grant truncate on table "public"."documents" to "authenticated";

grant update on table "public"."documents" to "authenticated";

grant delete on table "public"."documents" to "service_role";

grant insert on table "public"."documents" to "service_role";

grant references on table "public"."documents" to "service_role";

grant select on table "public"."documents" to "service_role";

grant trigger on table "public"."documents" to "service_role";

grant truncate on table "public"."documents" to "service_role";

grant update on table "public"."documents" to "service_role";

grant delete on table "public"."documents_clone" to "anon";

grant insert on table "public"."documents_clone" to "anon";

grant references on table "public"."documents_clone" to "anon";

grant select on table "public"."documents_clone" to "anon";

grant trigger on table "public"."documents_clone" to "anon";

grant truncate on table "public"."documents_clone" to "anon";

grant update on table "public"."documents_clone" to "anon";

grant delete on table "public"."documents_clone" to "authenticated";

grant insert on table "public"."documents_clone" to "authenticated";

grant references on table "public"."documents_clone" to "authenticated";

grant select on table "public"."documents_clone" to "authenticated";

grant trigger on table "public"."documents_clone" to "authenticated";

grant truncate on table "public"."documents_clone" to "authenticated";

grant update on table "public"."documents_clone" to "authenticated";

grant delete on table "public"."documents_clone" to "service_role";

grant insert on table "public"."documents_clone" to "service_role";

grant references on table "public"."documents_clone" to "service_role";

grant select on table "public"."documents_clone" to "service_role";

grant trigger on table "public"."documents_clone" to "service_role";

grant truncate on table "public"."documents_clone" to "service_role";

grant update on table "public"."documents_clone" to "service_role";

grant delete on table "public"."email_templates" to "anon";

grant insert on table "public"."email_templates" to "anon";

grant references on table "public"."email_templates" to "anon";

grant select on table "public"."email_templates" to "anon";

grant trigger on table "public"."email_templates" to "anon";

grant truncate on table "public"."email_templates" to "anon";

grant update on table "public"."email_templates" to "anon";

grant delete on table "public"."email_templates" to "authenticated";

grant insert on table "public"."email_templates" to "authenticated";

grant references on table "public"."email_templates" to "authenticated";

grant select on table "public"."email_templates" to "authenticated";

grant trigger on table "public"."email_templates" to "authenticated";

grant truncate on table "public"."email_templates" to "authenticated";

grant update on table "public"."email_templates" to "authenticated";

grant delete on table "public"."email_templates" to "service_role";

grant insert on table "public"."email_templates" to "service_role";

grant references on table "public"."email_templates" to "service_role";

grant select on table "public"."email_templates" to "service_role";

grant trigger on table "public"."email_templates" to "service_role";

grant truncate on table "public"."email_templates" to "service_role";

grant update on table "public"."email_templates" to "service_role";

grant delete on table "public"."import_batches" to "anon";

grant insert on table "public"."import_batches" to "anon";

grant references on table "public"."import_batches" to "anon";

grant select on table "public"."import_batches" to "anon";

grant trigger on table "public"."import_batches" to "anon";

grant truncate on table "public"."import_batches" to "anon";

grant update on table "public"."import_batches" to "anon";

grant delete on table "public"."import_batches" to "authenticated";

grant insert on table "public"."import_batches" to "authenticated";

grant references on table "public"."import_batches" to "authenticated";

grant select on table "public"."import_batches" to "authenticated";

grant trigger on table "public"."import_batches" to "authenticated";

grant truncate on table "public"."import_batches" to "authenticated";

grant update on table "public"."import_batches" to "authenticated";

grant delete on table "public"."import_batches" to "service_role";

grant insert on table "public"."import_batches" to "service_role";

grant references on table "public"."import_batches" to "service_role";

grant select on table "public"."import_batches" to "service_role";

grant trigger on table "public"."import_batches" to "service_role";

grant truncate on table "public"."import_batches" to "service_role";

grant update on table "public"."import_batches" to "service_role";

grant delete on table "public"."inventory" to "anon";

grant insert on table "public"."inventory" to "anon";

grant references on table "public"."inventory" to "anon";

grant select on table "public"."inventory" to "anon";

grant trigger on table "public"."inventory" to "anon";

grant truncate on table "public"."inventory" to "anon";

grant update on table "public"."inventory" to "anon";

grant delete on table "public"."inventory" to "authenticated";

grant insert on table "public"."inventory" to "authenticated";

grant references on table "public"."inventory" to "authenticated";

grant select on table "public"."inventory" to "authenticated";

grant trigger on table "public"."inventory" to "authenticated";

grant truncate on table "public"."inventory" to "authenticated";

grant update on table "public"."inventory" to "authenticated";

grant delete on table "public"."inventory" to "service_role";

grant insert on table "public"."inventory" to "service_role";

grant references on table "public"."inventory" to "service_role";

grant select on table "public"."inventory" to "service_role";

grant trigger on table "public"."inventory" to "service_role";

grant truncate on table "public"."inventory" to "service_role";

grant update on table "public"."inventory" to "service_role";

grant delete on table "public"."material_standards" to "anon";

grant insert on table "public"."material_standards" to "anon";

grant references on table "public"."material_standards" to "anon";

grant select on table "public"."material_standards" to "anon";

grant trigger on table "public"."material_standards" to "anon";

grant truncate on table "public"."material_standards" to "anon";

grant update on table "public"."material_standards" to "anon";

grant delete on table "public"."material_standards" to "authenticated";

grant insert on table "public"."material_standards" to "authenticated";

grant references on table "public"."material_standards" to "authenticated";

grant select on table "public"."material_standards" to "authenticated";

grant trigger on table "public"."material_standards" to "authenticated";

grant truncate on table "public"."material_standards" to "authenticated";

grant update on table "public"."material_standards" to "authenticated";

grant delete on table "public"."material_standards" to "service_role";

grant insert on table "public"."material_standards" to "service_role";

grant references on table "public"."material_standards" to "service_role";

grant select on table "public"."material_standards" to "service_role";

grant trigger on table "public"."material_standards" to "service_role";

grant truncate on table "public"."material_standards" to "service_role";

grant update on table "public"."material_standards" to "service_role";

grant delete on table "public"."message_templates" to "anon";

grant insert on table "public"."message_templates" to "anon";

grant references on table "public"."message_templates" to "anon";

grant select on table "public"."message_templates" to "anon";

grant trigger on table "public"."message_templates" to "anon";

grant truncate on table "public"."message_templates" to "anon";

grant update on table "public"."message_templates" to "anon";

grant delete on table "public"."message_templates" to "authenticated";

grant insert on table "public"."message_templates" to "authenticated";

grant references on table "public"."message_templates" to "authenticated";

grant select on table "public"."message_templates" to "authenticated";

grant trigger on table "public"."message_templates" to "authenticated";

grant truncate on table "public"."message_templates" to "authenticated";

grant update on table "public"."message_templates" to "authenticated";

grant delete on table "public"."message_templates" to "service_role";

grant insert on table "public"."message_templates" to "service_role";

grant references on table "public"."message_templates" to "service_role";

grant select on table "public"."message_templates" to "service_role";

grant trigger on table "public"."message_templates" to "service_role";

grant truncate on table "public"."message_templates" to "service_role";

grant update on table "public"."message_templates" to "service_role";

grant delete on table "public"."notes" to "anon";

grant insert on table "public"."notes" to "anon";

grant references on table "public"."notes" to "anon";

grant select on table "public"."notes" to "anon";

grant trigger on table "public"."notes" to "anon";

grant truncate on table "public"."notes" to "anon";

grant update on table "public"."notes" to "anon";

grant delete on table "public"."notes" to "authenticated";

grant insert on table "public"."notes" to "authenticated";

grant references on table "public"."notes" to "authenticated";

grant select on table "public"."notes" to "authenticated";

grant trigger on table "public"."notes" to "authenticated";

grant truncate on table "public"."notes" to "authenticated";

grant update on table "public"."notes" to "authenticated";

grant delete on table "public"."notes" to "service_role";

grant insert on table "public"."notes" to "service_role";

grant references on table "public"."notes" to "service_role";

grant select on table "public"."notes" to "service_role";

grant trigger on table "public"."notes" to "service_role";

grant truncate on table "public"."notes" to "service_role";

grant update on table "public"."notes" to "service_role";

grant delete on table "public"."notifications" to "anon";

grant insert on table "public"."notifications" to "anon";

grant references on table "public"."notifications" to "anon";

grant select on table "public"."notifications" to "anon";

grant trigger on table "public"."notifications" to "anon";

grant truncate on table "public"."notifications" to "anon";

grant update on table "public"."notifications" to "anon";

grant delete on table "public"."notifications" to "authenticated";

grant insert on table "public"."notifications" to "authenticated";

grant references on table "public"."notifications" to "authenticated";

grant select on table "public"."notifications" to "authenticated";

grant trigger on table "public"."notifications" to "authenticated";

grant truncate on table "public"."notifications" to "authenticated";

grant update on table "public"."notifications" to "authenticated";

grant delete on table "public"."notifications" to "service_role";

grant insert on table "public"."notifications" to "service_role";

grant references on table "public"."notifications" to "service_role";

grant select on table "public"."notifications" to "service_role";

grant trigger on table "public"."notifications" to "service_role";

grant truncate on table "public"."notifications" to "service_role";

grant update on table "public"."notifications" to "service_role";

grant delete on table "public"."pages_clone" to "anon";

grant insert on table "public"."pages_clone" to "anon";

grant references on table "public"."pages_clone" to "anon";

grant select on table "public"."pages_clone" to "anon";

grant trigger on table "public"."pages_clone" to "anon";

grant truncate on table "public"."pages_clone" to "anon";

grant update on table "public"."pages_clone" to "anon";

grant delete on table "public"."pages_clone" to "authenticated";

grant insert on table "public"."pages_clone" to "authenticated";

grant references on table "public"."pages_clone" to "authenticated";

grant select on table "public"."pages_clone" to "authenticated";

grant trigger on table "public"."pages_clone" to "authenticated";

grant truncate on table "public"."pages_clone" to "authenticated";

grant update on table "public"."pages_clone" to "authenticated";

grant delete on table "public"."pages_clone" to "service_role";

grant insert on table "public"."pages_clone" to "service_role";

grant references on table "public"."pages_clone" to "service_role";

grant select on table "public"."pages_clone" to "service_role";

grant trigger on table "public"."pages_clone" to "service_role";

grant truncate on table "public"."pages_clone" to "service_role";

grant update on table "public"."pages_clone" to "service_role";

grant delete on table "public"."plan_analyses" to "anon";

grant insert on table "public"."plan_analyses" to "anon";

grant references on table "public"."plan_analyses" to "anon";

grant select on table "public"."plan_analyses" to "anon";

grant trigger on table "public"."plan_analyses" to "anon";

grant truncate on table "public"."plan_analyses" to "anon";

grant update on table "public"."plan_analyses" to "anon";

grant delete on table "public"."plan_analyses" to "authenticated";

grant insert on table "public"."plan_analyses" to "authenticated";

grant references on table "public"."plan_analyses" to "authenticated";

grant select on table "public"."plan_analyses" to "authenticated";

grant trigger on table "public"."plan_analyses" to "authenticated";

grant truncate on table "public"."plan_analyses" to "authenticated";

grant update on table "public"."plan_analyses" to "authenticated";

grant delete on table "public"."plan_analyses" to "service_role";

grant insert on table "public"."plan_analyses" to "service_role";

grant references on table "public"."plan_analyses" to "service_role";

grant select on table "public"."plan_analyses" to "service_role";

grant trigger on table "public"."plan_analyses" to "service_role";

grant truncate on table "public"."plan_analyses" to "service_role";

grant update on table "public"."plan_analyses" to "service_role";

grant delete on table "public"."plan_job_artifacts" to "anon";

grant insert on table "public"."plan_job_artifacts" to "anon";

grant references on table "public"."plan_job_artifacts" to "anon";

grant select on table "public"."plan_job_artifacts" to "anon";

grant trigger on table "public"."plan_job_artifacts" to "anon";

grant truncate on table "public"."plan_job_artifacts" to "anon";

grant update on table "public"."plan_job_artifacts" to "anon";

grant delete on table "public"."plan_job_artifacts" to "authenticated";

grant insert on table "public"."plan_job_artifacts" to "authenticated";

grant references on table "public"."plan_job_artifacts" to "authenticated";

grant select on table "public"."plan_job_artifacts" to "authenticated";

grant trigger on table "public"."plan_job_artifacts" to "authenticated";

grant truncate on table "public"."plan_job_artifacts" to "authenticated";

grant update on table "public"."plan_job_artifacts" to "authenticated";

grant delete on table "public"."plan_job_artifacts" to "service_role";

grant insert on table "public"."plan_job_artifacts" to "service_role";

grant references on table "public"."plan_job_artifacts" to "service_role";

grant select on table "public"."plan_job_artifacts" to "service_role";

grant trigger on table "public"."plan_job_artifacts" to "service_role";

grant truncate on table "public"."plan_job_artifacts" to "service_role";

grant update on table "public"."plan_job_artifacts" to "service_role";

grant delete on table "public"."price_books" to "anon";

grant insert on table "public"."price_books" to "anon";

grant references on table "public"."price_books" to "anon";

grant select on table "public"."price_books" to "anon";

grant trigger on table "public"."price_books" to "anon";

grant truncate on table "public"."price_books" to "anon";

grant update on table "public"."price_books" to "anon";

grant delete on table "public"."price_books" to "authenticated";

grant insert on table "public"."price_books" to "authenticated";

grant references on table "public"."price_books" to "authenticated";

grant select on table "public"."price_books" to "authenticated";

grant trigger on table "public"."price_books" to "authenticated";

grant truncate on table "public"."price_books" to "authenticated";

grant update on table "public"."price_books" to "authenticated";

grant delete on table "public"."price_books" to "service_role";

grant insert on table "public"."price_books" to "service_role";

grant references on table "public"."price_books" to "service_role";

grant select on table "public"."price_books" to "service_role";

grant trigger on table "public"."price_books" to "service_role";

grant truncate on table "public"."price_books" to "service_role";

grant update on table "public"."price_books" to "service_role";

grant delete on table "public"."price_history" to "anon";

grant insert on table "public"."price_history" to "anon";

grant references on table "public"."price_history" to "anon";

grant select on table "public"."price_history" to "anon";

grant trigger on table "public"."price_history" to "anon";

grant truncate on table "public"."price_history" to "anon";

grant update on table "public"."price_history" to "anon";

grant delete on table "public"."price_history" to "authenticated";

grant insert on table "public"."price_history" to "authenticated";

grant references on table "public"."price_history" to "authenticated";

grant select on table "public"."price_history" to "authenticated";

grant trigger on table "public"."price_history" to "authenticated";

grant truncate on table "public"."price_history" to "authenticated";

grant update on table "public"."price_history" to "authenticated";

grant delete on table "public"."price_history" to "service_role";

grant insert on table "public"."price_history" to "service_role";

grant references on table "public"."price_history" to "service_role";

grant select on table "public"."price_history" to "service_role";

grant trigger on table "public"."price_history" to "service_role";

grant truncate on table "public"."price_history" to "service_role";

grant update on table "public"."price_history" to "service_role";

grant delete on table "public"."price_items" to "anon";

grant insert on table "public"."price_items" to "anon";

grant references on table "public"."price_items" to "anon";

grant select on table "public"."price_items" to "anon";

grant trigger on table "public"."price_items" to "anon";

grant truncate on table "public"."price_items" to "anon";

grant update on table "public"."price_items" to "anon";

grant delete on table "public"."price_items" to "authenticated";

grant insert on table "public"."price_items" to "authenticated";

grant references on table "public"."price_items" to "authenticated";

grant select on table "public"."price_items" to "authenticated";

grant trigger on table "public"."price_items" to "authenticated";

grant truncate on table "public"."price_items" to "authenticated";

grant update on table "public"."price_items" to "authenticated";

grant delete on table "public"."price_items" to "service_role";

grant insert on table "public"."price_items" to "service_role";

grant references on table "public"."price_items" to "service_role";

grant select on table "public"."price_items" to "service_role";

grant trigger on table "public"."price_items" to "service_role";

grant truncate on table "public"."price_items" to "service_role";

grant update on table "public"."price_items" to "service_role";

grant delete on table "public"."product_assets" to "anon";

grant insert on table "public"."product_assets" to "anon";

grant references on table "public"."product_assets" to "anon";

grant select on table "public"."product_assets" to "anon";

grant trigger on table "public"."product_assets" to "anon";

grant truncate on table "public"."product_assets" to "anon";

grant update on table "public"."product_assets" to "anon";

grant delete on table "public"."product_assets" to "authenticated";

grant insert on table "public"."product_assets" to "authenticated";

grant references on table "public"."product_assets" to "authenticated";

grant select on table "public"."product_assets" to "authenticated";

grant trigger on table "public"."product_assets" to "authenticated";

grant truncate on table "public"."product_assets" to "authenticated";

grant update on table "public"."product_assets" to "authenticated";

grant delete on table "public"."product_assets" to "service_role";

grant insert on table "public"."product_assets" to "service_role";

grant references on table "public"."product_assets" to "service_role";

grant select on table "public"."product_assets" to "service_role";

grant trigger on table "public"."product_assets" to "service_role";

grant truncate on table "public"."product_assets" to "service_role";

grant update on table "public"."product_assets" to "service_role";

grant delete on table "public"."products" to "anon";

grant insert on table "public"."products" to "anon";

grant references on table "public"."products" to "anon";

grant select on table "public"."products" to "anon";

grant trigger on table "public"."products" to "anon";

grant truncate on table "public"."products" to "anon";

grant update on table "public"."products" to "anon";

grant delete on table "public"."products" to "authenticated";

grant insert on table "public"."products" to "authenticated";

grant references on table "public"."products" to "authenticated";

grant select on table "public"."products" to "authenticated";

grant trigger on table "public"."products" to "authenticated";

grant truncate on table "public"."products" to "authenticated";

grant update on table "public"."products" to "authenticated";

grant delete on table "public"."products" to "service_role";

grant insert on table "public"."products" to "service_role";

grant references on table "public"."products" to "service_role";

grant select on table "public"."products" to "service_role";

grant trigger on table "public"."products" to "service_role";

grant truncate on table "public"."products" to "service_role";

grant update on table "public"."products" to "service_role";

grant delete on table "public"."profiles" to "anon";

grant insert on table "public"."profiles" to "anon";

grant references on table "public"."profiles" to "anon";

grant select on table "public"."profiles" to "anon";

grant trigger on table "public"."profiles" to "anon";

grant truncate on table "public"."profiles" to "anon";

grant update on table "public"."profiles" to "anon";

grant delete on table "public"."profiles" to "authenticated";

grant insert on table "public"."profiles" to "authenticated";

grant references on table "public"."profiles" to "authenticated";

grant select on table "public"."profiles" to "authenticated";

grant trigger on table "public"."profiles" to "authenticated";

grant truncate on table "public"."profiles" to "authenticated";

grant update on table "public"."profiles" to "authenticated";

grant delete on table "public"."profiles" to "service_role";

grant insert on table "public"."profiles" to "service_role";

grant references on table "public"."profiles" to "service_role";

grant select on table "public"."profiles" to "service_role";

grant trigger on table "public"."profiles" to "service_role";

grant truncate on table "public"."profiles" to "service_role";

grant update on table "public"."profiles" to "service_role";

grant delete on table "public"."project_access" to "anon";

grant insert on table "public"."project_access" to "anon";

grant references on table "public"."project_access" to "anon";

grant select on table "public"."project_access" to "anon";

grant trigger on table "public"."project_access" to "anon";

grant truncate on table "public"."project_access" to "anon";

grant update on table "public"."project_access" to "anon";

grant delete on table "public"."project_access" to "authenticated";

grant insert on table "public"."project_access" to "authenticated";

grant references on table "public"."project_access" to "authenticated";

grant select on table "public"."project_access" to "authenticated";

grant trigger on table "public"."project_access" to "authenticated";

grant truncate on table "public"."project_access" to "authenticated";

grant update on table "public"."project_access" to "authenticated";

grant delete on table "public"."project_access" to "service_role";

grant insert on table "public"."project_access" to "service_role";

grant references on table "public"."project_access" to "service_role";

grant select on table "public"."project_access" to "service_role";

grant trigger on table "public"."project_access" to "service_role";

grant truncate on table "public"."project_access" to "service_role";

grant update on table "public"."project_access" to "service_role";

grant delete on table "public"."project_bom_items" to "anon";

grant insert on table "public"."project_bom_items" to "anon";

grant references on table "public"."project_bom_items" to "anon";

grant select on table "public"."project_bom_items" to "anon";

grant trigger on table "public"."project_bom_items" to "anon";

grant truncate on table "public"."project_bom_items" to "anon";

grant update on table "public"."project_bom_items" to "anon";

grant delete on table "public"."project_bom_items" to "authenticated";

grant insert on table "public"."project_bom_items" to "authenticated";

grant references on table "public"."project_bom_items" to "authenticated";

grant select on table "public"."project_bom_items" to "authenticated";

grant trigger on table "public"."project_bom_items" to "authenticated";

grant truncate on table "public"."project_bom_items" to "authenticated";

grant update on table "public"."project_bom_items" to "authenticated";

grant delete on table "public"."project_bom_items" to "service_role";

grant insert on table "public"."project_bom_items" to "service_role";

grant references on table "public"."project_bom_items" to "service_role";

grant select on table "public"."project_bom_items" to "service_role";

grant trigger on table "public"."project_bom_items" to "service_role";

grant truncate on table "public"."project_bom_items" to "service_role";

grant update on table "public"."project_bom_items" to "service_role";

grant delete on table "public"."project_files" to "anon";

grant insert on table "public"."project_files" to "anon";

grant references on table "public"."project_files" to "anon";

grant select on table "public"."project_files" to "anon";

grant trigger on table "public"."project_files" to "anon";

grant truncate on table "public"."project_files" to "anon";

grant update on table "public"."project_files" to "anon";

grant delete on table "public"."project_files" to "authenticated";

grant insert on table "public"."project_files" to "authenticated";

grant references on table "public"."project_files" to "authenticated";

grant select on table "public"."project_files" to "authenticated";

grant trigger on table "public"."project_files" to "authenticated";

grant truncate on table "public"."project_files" to "authenticated";

grant update on table "public"."project_files" to "authenticated";

grant delete on table "public"."project_files" to "service_role";

grant insert on table "public"."project_files" to "service_role";

grant references on table "public"."project_files" to "service_role";

grant select on table "public"."project_files" to "service_role";

grant trigger on table "public"."project_files" to "service_role";

grant truncate on table "public"."project_files" to "service_role";

grant update on table "public"."project_files" to "service_role";

grant delete on table "public"."project_milestones" to "anon";

grant insert on table "public"."project_milestones" to "anon";

grant references on table "public"."project_milestones" to "anon";

grant select on table "public"."project_milestones" to "anon";

grant trigger on table "public"."project_milestones" to "anon";

grant truncate on table "public"."project_milestones" to "anon";

grant update on table "public"."project_milestones" to "anon";

grant delete on table "public"."project_milestones" to "authenticated";

grant insert on table "public"."project_milestones" to "authenticated";

grant references on table "public"."project_milestones" to "authenticated";

grant select on table "public"."project_milestones" to "authenticated";

grant trigger on table "public"."project_milestones" to "authenticated";

grant truncate on table "public"."project_milestones" to "authenticated";

grant update on table "public"."project_milestones" to "authenticated";

grant delete on table "public"."project_milestones" to "service_role";

grant insert on table "public"."project_milestones" to "service_role";

grant references on table "public"."project_milestones" to "service_role";

grant select on table "public"."project_milestones" to "service_role";

grant trigger on table "public"."project_milestones" to "service_role";

grant truncate on table "public"."project_milestones" to "service_role";

grant update on table "public"."project_milestones" to "service_role";

grant delete on table "public"."project_photos" to "anon";

grant insert on table "public"."project_photos" to "anon";

grant references on table "public"."project_photos" to "anon";

grant select on table "public"."project_photos" to "anon";

grant trigger on table "public"."project_photos" to "anon";

grant truncate on table "public"."project_photos" to "anon";

grant update on table "public"."project_photos" to "anon";

grant delete on table "public"."project_photos" to "authenticated";

grant insert on table "public"."project_photos" to "authenticated";

grant references on table "public"."project_photos" to "authenticated";

grant select on table "public"."project_photos" to "authenticated";

grant trigger on table "public"."project_photos" to "authenticated";

grant truncate on table "public"."project_photos" to "authenticated";

grant update on table "public"."project_photos" to "authenticated";

grant delete on table "public"."project_photos" to "service_role";

grant insert on table "public"."project_photos" to "service_role";

grant references on table "public"."project_photos" to "service_role";

grant select on table "public"."project_photos" to "service_role";

grant trigger on table "public"."project_photos" to "service_role";

grant truncate on table "public"."project_photos" to "service_role";

grant update on table "public"."project_photos" to "service_role";

grant delete on table "public"."projects" to "anon";

grant insert on table "public"."projects" to "anon";

grant references on table "public"."projects" to "anon";

grant select on table "public"."projects" to "anon";

grant trigger on table "public"."projects" to "anon";

grant truncate on table "public"."projects" to "anon";

grant update on table "public"."projects" to "anon";

grant delete on table "public"."projects" to "authenticated";

grant insert on table "public"."projects" to "authenticated";

grant references on table "public"."projects" to "authenticated";

grant select on table "public"."projects" to "authenticated";

grant trigger on table "public"."projects" to "authenticated";

grant truncate on table "public"."projects" to "authenticated";

grant update on table "public"."projects" to "authenticated";

grant delete on table "public"."projects" to "service_role";

grant insert on table "public"."projects" to "service_role";

grant references on table "public"."projects" to "service_role";

grant select on table "public"."projects" to "service_role";

grant trigger on table "public"."projects" to "service_role";

grant truncate on table "public"."projects" to "service_role";

grant update on table "public"."projects" to "service_role";

grant delete on table "public"."projects_clone" to "anon";

grant insert on table "public"."projects_clone" to "anon";

grant references on table "public"."projects_clone" to "anon";

grant select on table "public"."projects_clone" to "anon";

grant trigger on table "public"."projects_clone" to "anon";

grant truncate on table "public"."projects_clone" to "anon";

grant update on table "public"."projects_clone" to "anon";

grant delete on table "public"."projects_clone" to "authenticated";

grant insert on table "public"."projects_clone" to "authenticated";

grant references on table "public"."projects_clone" to "authenticated";

grant select on table "public"."projects_clone" to "authenticated";

grant trigger on table "public"."projects_clone" to "authenticated";

grant truncate on table "public"."projects_clone" to "authenticated";

grant update on table "public"."projects_clone" to "authenticated";

grant delete on table "public"."projects_clone" to "service_role";

grant insert on table "public"."projects_clone" to "service_role";

grant references on table "public"."projects_clone" to "service_role";

grant select on table "public"."projects_clone" to "service_role";

grant trigger on table "public"."projects_clone" to "service_role";

grant truncate on table "public"."projects_clone" to "service_role";

grant update on table "public"."projects_clone" to "service_role";

grant delete on table "public"."push_tokens" to "anon";

grant insert on table "public"."push_tokens" to "anon";

grant references on table "public"."push_tokens" to "anon";

grant select on table "public"."push_tokens" to "anon";

grant trigger on table "public"."push_tokens" to "anon";

grant truncate on table "public"."push_tokens" to "anon";

grant update on table "public"."push_tokens" to "anon";

grant delete on table "public"."push_tokens" to "authenticated";

grant insert on table "public"."push_tokens" to "authenticated";

grant references on table "public"."push_tokens" to "authenticated";

grant select on table "public"."push_tokens" to "authenticated";

grant trigger on table "public"."push_tokens" to "authenticated";

grant truncate on table "public"."push_tokens" to "authenticated";

grant update on table "public"."push_tokens" to "authenticated";

grant delete on table "public"."push_tokens" to "service_role";

grant insert on table "public"."push_tokens" to "service_role";

grant references on table "public"."push_tokens" to "service_role";

grant select on table "public"."push_tokens" to "service_role";

grant trigger on table "public"."push_tokens" to "service_role";

grant truncate on table "public"."push_tokens" to "service_role";

grant update on table "public"."push_tokens" to "service_role";

grant delete on table "public"."quotes_clone" to "anon";

grant insert on table "public"."quotes_clone" to "anon";

grant references on table "public"."quotes_clone" to "anon";

grant select on table "public"."quotes_clone" to "anon";

grant trigger on table "public"."quotes_clone" to "anon";

grant truncate on table "public"."quotes_clone" to "anon";

grant update on table "public"."quotes_clone" to "anon";

grant delete on table "public"."quotes_clone" to "authenticated";

grant insert on table "public"."quotes_clone" to "authenticated";

grant references on table "public"."quotes_clone" to "authenticated";

grant select on table "public"."quotes_clone" to "authenticated";

grant trigger on table "public"."quotes_clone" to "authenticated";

grant truncate on table "public"."quotes_clone" to "authenticated";

grant update on table "public"."quotes_clone" to "authenticated";

grant delete on table "public"."quotes_clone" to "service_role";

grant insert on table "public"."quotes_clone" to "service_role";

grant references on table "public"."quotes_clone" to "service_role";

grant select on table "public"."quotes_clone" to "service_role";

grant trigger on table "public"."quotes_clone" to "service_role";

grant truncate on table "public"."quotes_clone" to "service_role";

grant update on table "public"."quotes_clone" to "service_role";

grant delete on table "public"."reminders" to "anon";

grant insert on table "public"."reminders" to "anon";

grant references on table "public"."reminders" to "anon";

grant select on table "public"."reminders" to "anon";

grant trigger on table "public"."reminders" to "anon";

grant truncate on table "public"."reminders" to "anon";

grant update on table "public"."reminders" to "anon";

grant delete on table "public"."reminders" to "authenticated";

grant insert on table "public"."reminders" to "authenticated";

grant references on table "public"."reminders" to "authenticated";

grant select on table "public"."reminders" to "authenticated";

grant trigger on table "public"."reminders" to "authenticated";

grant truncate on table "public"."reminders" to "authenticated";

grant update on table "public"."reminders" to "authenticated";

grant delete on table "public"."reminders" to "service_role";

grant insert on table "public"."reminders" to "service_role";

grant references on table "public"."reminders" to "service_role";

grant select on table "public"."reminders" to "service_role";

grant trigger on table "public"."reminders" to "service_role";

grant truncate on table "public"."reminders" to "service_role";

grant update on table "public"."reminders" to "service_role";

grant delete on table "public"."search_history" to "anon";

grant insert on table "public"."search_history" to "anon";

grant references on table "public"."search_history" to "anon";

grant select on table "public"."search_history" to "anon";

grant trigger on table "public"."search_history" to "anon";

grant truncate on table "public"."search_history" to "anon";

grant update on table "public"."search_history" to "anon";

grant delete on table "public"."search_history" to "authenticated";

grant insert on table "public"."search_history" to "authenticated";

grant references on table "public"."search_history" to "authenticated";

grant select on table "public"."search_history" to "authenticated";

grant trigger on table "public"."search_history" to "authenticated";

grant truncate on table "public"."search_history" to "authenticated";

grant update on table "public"."search_history" to "authenticated";

grant delete on table "public"."search_history" to "service_role";

grant insert on table "public"."search_history" to "service_role";

grant references on table "public"."search_history" to "service_role";

grant select on table "public"."search_history" to "service_role";

grant trigger on table "public"."search_history" to "service_role";

grant truncate on table "public"."search_history" to "service_role";

grant update on table "public"."search_history" to "service_role";

grant delete on table "public"."security_audit_logs" to "anon";

grant insert on table "public"."security_audit_logs" to "anon";

grant references on table "public"."security_audit_logs" to "anon";

grant select on table "public"."security_audit_logs" to "anon";

grant trigger on table "public"."security_audit_logs" to "anon";

grant truncate on table "public"."security_audit_logs" to "anon";

grant update on table "public"."security_audit_logs" to "anon";

grant delete on table "public"."security_audit_logs" to "authenticated";

grant insert on table "public"."security_audit_logs" to "authenticated";

grant references on table "public"."security_audit_logs" to "authenticated";

grant select on table "public"."security_audit_logs" to "authenticated";

grant trigger on table "public"."security_audit_logs" to "authenticated";

grant truncate on table "public"."security_audit_logs" to "authenticated";

grant update on table "public"."security_audit_logs" to "authenticated";

grant delete on table "public"."security_audit_logs" to "service_role";

grant insert on table "public"."security_audit_logs" to "service_role";

grant references on table "public"."security_audit_logs" to "service_role";

grant select on table "public"."security_audit_logs" to "service_role";

grant trigger on table "public"."security_audit_logs" to "service_role";

grant truncate on table "public"."security_audit_logs" to "service_role";

grant update on table "public"."security_audit_logs" to "service_role";

grant delete on table "public"."stock_movements" to "anon";

grant insert on table "public"."stock_movements" to "anon";

grant references on table "public"."stock_movements" to "anon";

grant select on table "public"."stock_movements" to "anon";

grant trigger on table "public"."stock_movements" to "anon";

grant truncate on table "public"."stock_movements" to "anon";

grant update on table "public"."stock_movements" to "anon";

grant delete on table "public"."stock_movements" to "authenticated";

grant insert on table "public"."stock_movements" to "authenticated";

grant references on table "public"."stock_movements" to "authenticated";

grant select on table "public"."stock_movements" to "authenticated";

grant trigger on table "public"."stock_movements" to "authenticated";

grant truncate on table "public"."stock_movements" to "authenticated";

grant update on table "public"."stock_movements" to "authenticated";

grant delete on table "public"."stock_movements" to "service_role";

grant insert on table "public"."stock_movements" to "service_role";

grant references on table "public"."stock_movements" to "service_role";

grant select on table "public"."stock_movements" to "service_role";

grant trigger on table "public"."stock_movements" to "service_role";

grant truncate on table "public"."stock_movements" to "service_role";

grant update on table "public"."stock_movements" to "service_role";

grant delete on table "public"."supplier_access_rules" to "anon";

grant insert on table "public"."supplier_access_rules" to "anon";

grant references on table "public"."supplier_access_rules" to "anon";

grant select on table "public"."supplier_access_rules" to "anon";

grant trigger on table "public"."supplier_access_rules" to "anon";

grant truncate on table "public"."supplier_access_rules" to "anon";

grant update on table "public"."supplier_access_rules" to "anon";

grant delete on table "public"."supplier_access_rules" to "authenticated";

grant insert on table "public"."supplier_access_rules" to "authenticated";

grant references on table "public"."supplier_access_rules" to "authenticated";

grant select on table "public"."supplier_access_rules" to "authenticated";

grant trigger on table "public"."supplier_access_rules" to "authenticated";

grant truncate on table "public"."supplier_access_rules" to "authenticated";

grant update on table "public"."supplier_access_rules" to "authenticated";

grant delete on table "public"."supplier_access_rules" to "service_role";

grant insert on table "public"."supplier_access_rules" to "service_role";

grant references on table "public"."supplier_access_rules" to "service_role";

grant select on table "public"."supplier_access_rules" to "service_role";

grant trigger on table "public"."supplier_access_rules" to "service_role";

grant truncate on table "public"."supplier_access_rules" to "service_role";

grant update on table "public"."supplier_access_rules" to "service_role";

grant delete on table "public"."supplier_access_rules_clone" to "anon";

grant insert on table "public"."supplier_access_rules_clone" to "anon";

grant references on table "public"."supplier_access_rules_clone" to "anon";

grant select on table "public"."supplier_access_rules_clone" to "anon";

grant trigger on table "public"."supplier_access_rules_clone" to "anon";

grant truncate on table "public"."supplier_access_rules_clone" to "anon";

grant update on table "public"."supplier_access_rules_clone" to "anon";

grant delete on table "public"."supplier_access_rules_clone" to "authenticated";

grant insert on table "public"."supplier_access_rules_clone" to "authenticated";

grant references on table "public"."supplier_access_rules_clone" to "authenticated";

grant select on table "public"."supplier_access_rules_clone" to "authenticated";

grant trigger on table "public"."supplier_access_rules_clone" to "authenticated";

grant truncate on table "public"."supplier_access_rules_clone" to "authenticated";

grant update on table "public"."supplier_access_rules_clone" to "authenticated";

grant delete on table "public"."supplier_access_rules_clone" to "service_role";

grant insert on table "public"."supplier_access_rules_clone" to "service_role";

grant references on table "public"."supplier_access_rules_clone" to "service_role";

grant select on table "public"."supplier_access_rules_clone" to "service_role";

grant trigger on table "public"."supplier_access_rules_clone" to "service_role";

grant truncate on table "public"."supplier_access_rules_clone" to "service_role";

grant update on table "public"."supplier_access_rules_clone" to "service_role";

grant delete on table "public"."supplier_interactions" to "anon";

grant insert on table "public"."supplier_interactions" to "anon";

grant references on table "public"."supplier_interactions" to "anon";

grant select on table "public"."supplier_interactions" to "anon";

grant trigger on table "public"."supplier_interactions" to "anon";

grant truncate on table "public"."supplier_interactions" to "anon";

grant update on table "public"."supplier_interactions" to "anon";

grant delete on table "public"."supplier_interactions" to "authenticated";

grant insert on table "public"."supplier_interactions" to "authenticated";

grant references on table "public"."supplier_interactions" to "authenticated";

grant select on table "public"."supplier_interactions" to "authenticated";

grant trigger on table "public"."supplier_interactions" to "authenticated";

grant truncate on table "public"."supplier_interactions" to "authenticated";

grant update on table "public"."supplier_interactions" to "authenticated";

grant delete on table "public"."supplier_interactions" to "service_role";

grant insert on table "public"."supplier_interactions" to "service_role";

grant references on table "public"."supplier_interactions" to "service_role";

grant select on table "public"."supplier_interactions" to "service_role";

grant trigger on table "public"."supplier_interactions" to "service_role";

grant truncate on table "public"."supplier_interactions" to "service_role";

grant update on table "public"."supplier_interactions" to "service_role";

grant delete on table "public"."supplier_rating_history" to "anon";

grant insert on table "public"."supplier_rating_history" to "anon";

grant references on table "public"."supplier_rating_history" to "anon";

grant select on table "public"."supplier_rating_history" to "anon";

grant trigger on table "public"."supplier_rating_history" to "anon";

grant truncate on table "public"."supplier_rating_history" to "anon";

grant update on table "public"."supplier_rating_history" to "anon";

grant delete on table "public"."supplier_rating_history" to "authenticated";

grant insert on table "public"."supplier_rating_history" to "authenticated";

grant references on table "public"."supplier_rating_history" to "authenticated";

grant select on table "public"."supplier_rating_history" to "authenticated";

grant trigger on table "public"."supplier_rating_history" to "authenticated";

grant truncate on table "public"."supplier_rating_history" to "authenticated";

grant update on table "public"."supplier_rating_history" to "authenticated";

grant delete on table "public"."supplier_rating_history" to "service_role";

grant insert on table "public"."supplier_rating_history" to "service_role";

grant references on table "public"."supplier_rating_history" to "service_role";

grant select on table "public"."supplier_rating_history" to "service_role";

grant trigger on table "public"."supplier_rating_history" to "service_role";

grant truncate on table "public"."supplier_rating_history" to "service_role";

grant update on table "public"."supplier_rating_history" to "service_role";

grant delete on table "public"."suppliers" to "anon";

grant insert on table "public"."suppliers" to "anon";

grant references on table "public"."suppliers" to "anon";

grant select on table "public"."suppliers" to "anon";

grant trigger on table "public"."suppliers" to "anon";

grant truncate on table "public"."suppliers" to "anon";

grant update on table "public"."suppliers" to "anon";

grant delete on table "public"."suppliers" to "authenticated";

grant insert on table "public"."suppliers" to "authenticated";

grant references on table "public"."suppliers" to "authenticated";

grant select on table "public"."suppliers" to "authenticated";

grant trigger on table "public"."suppliers" to "authenticated";

grant truncate on table "public"."suppliers" to "authenticated";

grant update on table "public"."suppliers" to "authenticated";

grant delete on table "public"."suppliers" to "service_role";

grant insert on table "public"."suppliers" to "service_role";

grant references on table "public"."suppliers" to "service_role";

grant select on table "public"."suppliers" to "service_role";

grant trigger on table "public"."suppliers" to "service_role";

grant truncate on table "public"."suppliers" to "service_role";

grant update on table "public"."suppliers" to "service_role";

grant delete on table "public"."suppliers_clone" to "anon";

grant insert on table "public"."suppliers_clone" to "anon";

grant references on table "public"."suppliers_clone" to "anon";

grant select on table "public"."suppliers_clone" to "anon";

grant trigger on table "public"."suppliers_clone" to "anon";

grant truncate on table "public"."suppliers_clone" to "anon";

grant update on table "public"."suppliers_clone" to "anon";

grant delete on table "public"."suppliers_clone" to "authenticated";

grant insert on table "public"."suppliers_clone" to "authenticated";

grant references on table "public"."suppliers_clone" to "authenticated";

grant select on table "public"."suppliers_clone" to "authenticated";

grant trigger on table "public"."suppliers_clone" to "authenticated";

grant truncate on table "public"."suppliers_clone" to "authenticated";

grant update on table "public"."suppliers_clone" to "authenticated";

grant delete on table "public"."suppliers_clone" to "service_role";

grant insert on table "public"."suppliers_clone" to "service_role";

grant references on table "public"."suppliers_clone" to "service_role";

grant select on table "public"."suppliers_clone" to "service_role";

grant trigger on table "public"."suppliers_clone" to "service_role";

grant truncate on table "public"."suppliers_clone" to "service_role";

grant update on table "public"."suppliers_clone" to "service_role";

grant delete on table "public"."tasks" to "anon";

grant insert on table "public"."tasks" to "anon";

grant references on table "public"."tasks" to "anon";

grant select on table "public"."tasks" to "anon";

grant trigger on table "public"."tasks" to "anon";

grant truncate on table "public"."tasks" to "anon";

grant update on table "public"."tasks" to "anon";

grant delete on table "public"."tasks" to "authenticated";

grant insert on table "public"."tasks" to "authenticated";

grant references on table "public"."tasks" to "authenticated";

grant select on table "public"."tasks" to "authenticated";

grant trigger on table "public"."tasks" to "authenticated";

grant truncate on table "public"."tasks" to "authenticated";

grant update on table "public"."tasks" to "authenticated";

grant delete on table "public"."tasks" to "service_role";

grant insert on table "public"."tasks" to "service_role";

grant references on table "public"."tasks" to "service_role";

grant select on table "public"."tasks" to "service_role";

grant trigger on table "public"."tasks" to "service_role";

grant truncate on table "public"."tasks" to "service_role";

grant update on table "public"."tasks" to "service_role";

grant delete on table "public"."team_invitations" to "anon";

grant insert on table "public"."team_invitations" to "anon";

grant references on table "public"."team_invitations" to "anon";

grant select on table "public"."team_invitations" to "anon";

grant trigger on table "public"."team_invitations" to "anon";

grant truncate on table "public"."team_invitations" to "anon";

grant update on table "public"."team_invitations" to "anon";

grant delete on table "public"."team_invitations" to "authenticated";

grant insert on table "public"."team_invitations" to "authenticated";

grant references on table "public"."team_invitations" to "authenticated";

grant select on table "public"."team_invitations" to "authenticated";

grant trigger on table "public"."team_invitations" to "authenticated";

grant truncate on table "public"."team_invitations" to "authenticated";

grant update on table "public"."team_invitations" to "authenticated";

grant delete on table "public"."team_invitations" to "service_role";

grant insert on table "public"."team_invitations" to "service_role";

grant references on table "public"."team_invitations" to "service_role";

grant select on table "public"."team_invitations" to "service_role";

grant trigger on table "public"."team_invitations" to "service_role";

grant truncate on table "public"."team_invitations" to "service_role";

grant update on table "public"."team_invitations" to "service_role";

grant delete on table "public"."user_favorites" to "anon";

grant insert on table "public"."user_favorites" to "anon";

grant references on table "public"."user_favorites" to "anon";

grant select on table "public"."user_favorites" to "anon";

grant trigger on table "public"."user_favorites" to "anon";

grant truncate on table "public"."user_favorites" to "anon";

grant update on table "public"."user_favorites" to "anon";

grant delete on table "public"."user_favorites" to "authenticated";

grant insert on table "public"."user_favorites" to "authenticated";

grant references on table "public"."user_favorites" to "authenticated";

grant select on table "public"."user_favorites" to "authenticated";

grant trigger on table "public"."user_favorites" to "authenticated";

grant truncate on table "public"."user_favorites" to "authenticated";

grant update on table "public"."user_favorites" to "authenticated";

grant delete on table "public"."user_favorites" to "service_role";

grant insert on table "public"."user_favorites" to "service_role";

grant references on table "public"."user_favorites" to "service_role";

grant select on table "public"."user_favorites" to "service_role";

grant trigger on table "public"."user_favorites" to "service_role";

grant truncate on table "public"."user_favorites" to "service_role";

grant update on table "public"."user_favorites" to "service_role";

grant delete on table "public"."user_pinned" to "anon";

grant insert on table "public"."user_pinned" to "anon";

grant references on table "public"."user_pinned" to "anon";

grant select on table "public"."user_pinned" to "anon";

grant trigger on table "public"."user_pinned" to "anon";

grant truncate on table "public"."user_pinned" to "anon";

grant update on table "public"."user_pinned" to "anon";

grant delete on table "public"."user_pinned" to "authenticated";

grant insert on table "public"."user_pinned" to "authenticated";

grant references on table "public"."user_pinned" to "authenticated";

grant select on table "public"."user_pinned" to "authenticated";

grant trigger on table "public"."user_pinned" to "authenticated";

grant truncate on table "public"."user_pinned" to "authenticated";

grant update on table "public"."user_pinned" to "authenticated";

grant delete on table "public"."user_pinned" to "service_role";

grant insert on table "public"."user_pinned" to "service_role";

grant references on table "public"."user_pinned" to "service_role";

grant select on table "public"."user_pinned" to "service_role";

grant trigger on table "public"."user_pinned" to "service_role";

grant truncate on table "public"."user_pinned" to "service_role";

grant update on table "public"."user_pinned" to "service_role";

grant delete on table "public"."user_preferences" to "anon";

grant insert on table "public"."user_preferences" to "anon";

grant references on table "public"."user_preferences" to "anon";

grant select on table "public"."user_preferences" to "anon";

grant trigger on table "public"."user_preferences" to "anon";

grant truncate on table "public"."user_preferences" to "anon";

grant update on table "public"."user_preferences" to "anon";

grant delete on table "public"."user_preferences" to "authenticated";

grant insert on table "public"."user_preferences" to "authenticated";

grant references on table "public"."user_preferences" to "authenticated";

grant select on table "public"."user_preferences" to "authenticated";

grant trigger on table "public"."user_preferences" to "authenticated";

grant truncate on table "public"."user_preferences" to "authenticated";

grant update on table "public"."user_preferences" to "authenticated";

grant delete on table "public"."user_preferences" to "service_role";

grant insert on table "public"."user_preferences" to "service_role";

grant references on table "public"."user_preferences" to "service_role";

grant select on table "public"."user_preferences" to "service_role";

grant trigger on table "public"."user_preferences" to "service_role";

grant truncate on table "public"."user_preferences" to "service_role";

grant update on table "public"."user_preferences" to "service_role";

grant delete on table "public"."user_roles_clone" to "anon";

grant insert on table "public"."user_roles_clone" to "anon";

grant references on table "public"."user_roles_clone" to "anon";

grant select on table "public"."user_roles_clone" to "anon";

grant trigger on table "public"."user_roles_clone" to "anon";

grant truncate on table "public"."user_roles_clone" to "anon";

grant update on table "public"."user_roles_clone" to "anon";

grant delete on table "public"."user_roles_clone" to "authenticated";

grant insert on table "public"."user_roles_clone" to "authenticated";

grant references on table "public"."user_roles_clone" to "authenticated";

grant select on table "public"."user_roles_clone" to "authenticated";

grant trigger on table "public"."user_roles_clone" to "authenticated";

grant truncate on table "public"."user_roles_clone" to "authenticated";

grant update on table "public"."user_roles_clone" to "authenticated";

grant delete on table "public"."user_roles_clone" to "service_role";

grant insert on table "public"."user_roles_clone" to "service_role";

grant references on table "public"."user_roles_clone" to "service_role";

grant select on table "public"."user_roles_clone" to "service_role";

grant trigger on table "public"."user_roles_clone" to "service_role";

grant truncate on table "public"."user_roles_clone" to "service_role";

grant update on table "public"."user_roles_clone" to "service_role";

grant delete on table "public"."voice_notes" to "anon";

grant insert on table "public"."voice_notes" to "anon";

grant references on table "public"."voice_notes" to "anon";

grant select on table "public"."voice_notes" to "anon";

grant trigger on table "public"."voice_notes" to "anon";

grant truncate on table "public"."voice_notes" to "anon";

grant update on table "public"."voice_notes" to "anon";

grant delete on table "public"."voice_notes" to "authenticated";

grant insert on table "public"."voice_notes" to "authenticated";

grant references on table "public"."voice_notes" to "authenticated";

grant select on table "public"."voice_notes" to "authenticated";

grant trigger on table "public"."voice_notes" to "authenticated";

grant truncate on table "public"."voice_notes" to "authenticated";

grant update on table "public"."voice_notes" to "authenticated";

grant delete on table "public"."voice_notes" to "service_role";

grant insert on table "public"."voice_notes" to "service_role";

grant references on table "public"."voice_notes" to "service_role";

grant select on table "public"."voice_notes" to "service_role";

grant trigger on table "public"."voice_notes" to "service_role";

grant truncate on table "public"."voice_notes" to "service_role";

grant update on table "public"."voice_notes" to "service_role";


  create policy "Public full access to activities"
  on "public"."activities"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all access to barcode_scans"
  on "public"."barcode_scans"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to bom_alert_config"
  on "public"."bom_alert_config"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to bom_alerts"
  on "public"."bom_alerts"
  as permissive
  for all
  to public
using (true);



  create policy "Public full access to categories"
  on "public"."categories"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Public read categories"
  on "public"."categories"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "client_accounts_manage"
  on "public"."client_accounts"
  as permissive
  for all
  to public
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());



  create policy "client_accounts_select"
  on "public"."client_accounts"
  as permissive
  for select
  to public
using ((public.is_admin_or_manager() OR (EXISTS ( SELECT 1
   FROM public.client_memberships
  WHERE ((client_memberships.client_id = client_accounts.id) AND (client_memberships.user_id = auth.uid()))))));



  create policy "client_drive_folders_manage"
  on "public"."client_drive_folders"
  as permissive
  for all
  to public
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());



  create policy "client_drive_folders_select"
  on "public"."client_drive_folders"
  as permissive
  for select
  to public
using ((public.is_admin_or_manager() OR (EXISTS ( SELECT 1
   FROM public.client_memberships
  WHERE ((client_memberships.client_id = client_drive_folders.client_id) AND (client_memberships.user_id = auth.uid()))))));



  create policy "client_memberships_manage"
  on "public"."client_memberships"
  as permissive
  for all
  to public
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());



  create policy "client_memberships_select"
  on "public"."client_memberships"
  as permissive
  for select
  to public
using ((public.is_admin_or_manager() OR (user_id = auth.uid())));



  create policy "crm_section_access_manage"
  on "public"."crm_section_access"
  as permissive
  for all
  to public
using (public.is_admin_or_manager())
with check (public.is_admin_or_manager());



  create policy "crm_section_access_select"
  on "public"."crm_section_access"
  as permissive
  for select
  to public
using ((public.is_admin_or_manager() OR (user_id = auth.uid())));



  create policy "Allow all access to deal_activities"
  on "public"."deal_activities"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to deal_attachments"
  on "public"."deal_attachments"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to deal_templates"
  on "public"."deal_templates"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to deals"
  on "public"."deals"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Public full access to deals"
  on "public"."deals"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all access to documents"
  on "public"."documents"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users can create email templates"
  on "public"."email_templates"
  as permissive
  for insert
  to public
with check ((auth.uid() = created_by));



  create policy "Users can delete their email templates"
  on "public"."email_templates"
  as permissive
  for delete
  to public
using ((auth.uid() = created_by));



  create policy "Users can update their email templates"
  on "public"."email_templates"
  as permissive
  for update
  to public
using ((auth.uid() = created_by));



  create policy "Users can view their email templates"
  on "public"."email_templates"
  as permissive
  for select
  to public
using ((auth.uid() = created_by));



  create policy "Users can create import batches"
  on "public"."import_batches"
  as permissive
  for insert
  to public
with check ((auth.uid() = imported_by));



  create policy "Users can view their import batches"
  on "public"."import_batches"
  as permissive
  for select
  to public
using ((auth.uid() = imported_by));



  create policy "inventory_all"
  on "public"."inventory"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all access to message_templates"
  on "public"."message_templates"
  as permissive
  for all
  to public
using (true);



  create policy "Public full access to notes"
  on "public"."notes"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users can delete own notifications"
  on "public"."notifications"
  as permissive
  for delete
  to public
using ((auth.uid() = user_id));



  create policy "Users can update own notifications"
  on "public"."notifications"
  as permissive
  for update
  to public
using ((auth.uid() = user_id));



  create policy "Users can view own notifications"
  on "public"."notifications"
  as permissive
  for select
  to public
using ((auth.uid() = user_id));



  create policy "Allow all access to price_history"
  on "public"."price_history"
  as permissive
  for all
  to public
using (true);



  create policy "Users can insert their own profile"
  on "public"."profiles"
  as permissive
  for insert
  to public
with check ((auth.uid() = id));



  create policy "Users can update their own profile"
  on "public"."profiles"
  as permissive
  for update
  to public
using ((auth.uid() = id));



  create policy "Users can view all profiles"
  on "public"."profiles"
  as permissive
  for select
  to public
using (true);



  create policy "Project owners can delete access"
  on "public"."project_access"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_access.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "Project owners can manage access"
  on "public"."project_access"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_access.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "Project owners can update access"
  on "public"."project_access"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_access.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "Project owners can view access"
  on "public"."project_access"
  as permissive
  for select
  to public
using (((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_access.project_id) AND (projects.owner_id = auth.uid())))) OR (auth.uid() = user_id)));



  create policy "Users can create BOM for their projects"
  on "public"."project_bom_items"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_bom_items.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "Users can delete BOM for their projects"
  on "public"."project_bom_items"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_bom_items.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "Users can update BOM for their projects"
  on "public"."project_bom_items"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_bom_items.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "Users can view BOM for their projects"
  on "public"."project_bom_items"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_bom_items.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "project_bom_items_all"
  on "public"."project_bom_items"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Users can delete files from their projects"
  on "public"."project_files"
  as permissive
  for delete
  to public
using ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_files.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "Users can update files in their projects"
  on "public"."project_files"
  as permissive
  for update
  to public
using ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_files.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "Users can upload files to their projects"
  on "public"."project_files"
  as permissive
  for insert
  to public
with check ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_files.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "Users can view files for their projects"
  on "public"."project_files"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.projects
  WHERE ((projects.id = project_files.project_id) AND (projects.owner_id = auth.uid())))));



  create policy "Allow all access to project_milestones"
  on "public"."project_milestones"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to project_photos"
  on "public"."project_photos"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to projects"
  on "public"."projects"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Public full access to projects"
  on "public"."projects"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all access to push_tokens"
  on "public"."push_tokens"
  as permissive
  for all
  to public
using (true);



  create policy "Audit log viewable by admins"
  on "public"."quotation_audit_log"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));



  create policy "Users can manage quotation lines for their quotations"
  on "public"."quotation_lines"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.quotations
  WHERE ((quotations.id = quotation_lines.quotation_id) AND ((quotations.user_id = auth.uid()) OR (EXISTS ( SELECT 1
           FROM public.user_roles
          WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'sales'::text]))))))))));



  create policy "Authenticated users can create quotations"
  on "public"."quotations"
  as permissive
  for insert
  to authenticated
with check (true);



  create policy "Users can update their own quotations"
  on "public"."quotations"
  as permissive
  for update
  to authenticated
using (((user_id = auth.uid()) OR (EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text, 'sales'::text])))))));



  create policy "Tiers are editable by admins"
  on "public"."quote_customer_tiers"
  as permissive
  for all
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.user_roles
  WHERE ((user_roles.user_id = auth.uid()) AND (user_roles.role = ANY (ARRAY['admin'::text, 'super_admin'::text]))))));



  create policy "Tiers are viewable by authenticated users"
  on "public"."quote_customer_tiers"
  as permissive
  for select
  to authenticated
using (true);



  create policy "Allow all access to reminders"
  on "public"."reminders"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to search_history"
  on "public"."search_history"
  as permissive
  for all
  to public
using (true);



  create policy "security_audit_logs_insert"
  on "public"."security_audit_logs"
  as permissive
  for insert
  to public
with check ((auth.role() = 'service_role'::text));



  create policy "security_audit_logs_select"
  on "public"."security_audit_logs"
  as permissive
  for select
  to public
using (public.is_admin_or_manager());



  create policy "stock_movements_all"
  on "public"."stock_movements"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Admins can manage supplier access rules"
  on "public"."supplier_access_rules"
  as permissive
  for all
  to public
using (public.is_admin(auth.uid()));



  create policy "Admins can view all supplier access rules"
  on "public"."supplier_access_rules"
  as permissive
  for select
  to public
using (public.is_admin(auth.uid()));



  create policy "Users can view own supplier access rules"
  on "public"."supplier_access_rules"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Allow all access to supplier_interactions"
  on "public"."supplier_interactions"
  as permissive
  for all
  to public
using (true);



  create policy "Users can create ratings"
  on "public"."supplier_rating_history"
  as permissive
  for insert
  to public
with check ((auth.uid() = rated_by));



  create policy "Users can delete their ratings"
  on "public"."supplier_rating_history"
  as permissive
  for delete
  to public
using ((auth.uid() = rated_by));



  create policy "Users can update their ratings"
  on "public"."supplier_rating_history"
  as permissive
  for update
  to public
using ((auth.uid() = rated_by));



  create policy "Users can view their ratings"
  on "public"."supplier_rating_history"
  as permissive
  for select
  to public
using ((auth.uid() = rated_by));



  create policy "Admins can view all suppliers"
  on "public"."suppliers"
  as permissive
  for select
  to public
using (public.is_admin(auth.uid()));



  create policy "Public full access to suppliers"
  on "public"."suppliers"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Public read access to suppliers"
  on "public"."suppliers"
  as permissive
  for select
  to public
using (true);



  create policy "Users can view suppliers based on access rules"
  on "public"."suppliers"
  as permissive
  for select
  to public
using ((EXISTS ( SELECT 1
   FROM public.supplier_access_rules sar
  WHERE ((sar.user_id = auth.uid()) AND ((sar.category_id IS NULL) OR (sar.category_id = suppliers.category_id)) AND ((sar.region IS NULL) OR (sar.region = suppliers.region))))));



  create policy "Allow all access to tasks"
  on "public"."tasks"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Public full access to tasks"
  on "public"."tasks"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "team_invitations_all"
  on "public"."team_invitations"
  as permissive
  for all
  to public
using (true)
with check (true);



  create policy "Allow all access to user_favorites"
  on "public"."user_favorites"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to user_pinned"
  on "public"."user_pinned"
  as permissive
  for all
  to public
using (true);



  create policy "Allow all access to user_preferences"
  on "public"."user_preferences"
  as permissive
  for all
  to public
using (true);



  create policy "Admins can delete user roles"
  on "public"."user_roles"
  as permissive
  for delete
  to public
using (public.is_admin(auth.uid()));



  create policy "Admins can insert user roles"
  on "public"."user_roles"
  as permissive
  for insert
  to public
with check (public.is_admin(auth.uid()));



  create policy "Admins can update user roles"
  on "public"."user_roles"
  as permissive
  for update
  to public
using (public.is_admin(auth.uid()));



  create policy "Admins can view all user roles"
  on "public"."user_roles"
  as permissive
  for select
  to public
using (public.is_admin(auth.uid()));



  create policy "Users can view own role"
  on "public"."user_roles"
  as permissive
  for select
  to public
using ((user_id = auth.uid()));



  create policy "Allow all access to voice_notes"
  on "public"."voice_notes"
  as permissive
  for all
  to public
using (true);


CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_document_access_rules_updated_at BEFORE UPDATE ON public.document_access_rules FOR EACH ROW EXECUTE FUNCTION public.update_document_access_rules_updated_at();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_plan_jobs_updated_at BEFORE UPDATE ON public.plan_jobs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_books_updated_at BEFORE UPDATE ON public.price_books FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_price_items_updated_at BEFORE UPDATE ON public.price_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_project_bom_items_updated_at BEFORE UPDATE ON public.project_bom_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_supplier_access_rules_updated_at BEFORE UPDATE ON public.supplier_access_rules FOR EACH ROW EXECUTE FUNCTION public.update_supplier_access_rules_updated_at();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trigger_user_roles_updated_at BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_user_roles_updated_at();

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

drop policy "Admins can delete product images" on "storage"."objects";

drop policy "Admins can update product images" on "storage"."objects";

drop policy "Admins can upload product images" on "storage"."objects";

drop policy "Public can view product images" on "storage"."objects";


  create policy "Allow authenticated uploads"
  on "storage"."objects"
  as permissive
  for all
  to authenticated
using ((bucket_id = 'plans'::text))
with check ((bucket_id = 'plans'::text));



  create policy "Users can upload to their own folder 1rjzoq_0"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'plans'::text) AND ((storage.foldername(name))[1] = (auth.uid())::text)));



