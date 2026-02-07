# Contracts Module Integration

Module A - Contract Management with Approval Workflows and E-signatures

## Overview

The Contracts module provides comprehensive contract lifecycle management including:
- Contract creation and management
- Multi-step approval workflows with checkpoints
- Electronic signature integration
- Full audit trail

## Files Created

### Validation Schema
- `lib/validation/contracts.ts` - Zod schemas for contract validation

### API Routes
- `app/api/contracts/route.ts` - List and create contracts
- `app/api/contracts/[id]/route.ts` - Get, update, and delete specific contracts
- `app/api/contracts/[id]/checkpoints/route.ts` - Manage approval checkpoints
- `app/api/contracts/[id]/checkpoints/[cpId]/approve/route.ts` - Approve/reject checkpoints
- `app/api/contracts/[id]/esign/route.ts` - E-signature requests

### UI
- `app/app-dashboard/contracts/page.tsx` - Contracts dashboard page

## API Endpoints

### Contracts

#### `GET /api/contracts`
List all contracts (filtered by RLS)

Query Parameters:
- `status` - Filter by contract status
- `project_id` - Filter by project ID

#### `POST /api/contracts`
Create a new contract

Request Body:
```json
{
  "title": "Contract Title",
  "description": "Optional description",
  "total_value": 100000,
  "currency": "USD",
  "quote_id": "uuid",
  "project_id": "uuid",
  "terms_and_conditions": "Contract terms...",
  "effective_date": "2026-01-01T00:00:00Z",
  "expiration_date": "2027-01-01T00:00:00Z"
}
```

#### `GET /api/contracts/[id]`
Get contract details including checkpoints and e-sign requests

#### `PATCH /api/contracts/[id]`
Update a contract

#### `DELETE /api/contracts/[id]`
Delete a contract (admin/owner only)

### Checkpoints

#### `GET /api/contracts/[id]/checkpoints`
List approval checkpoints for a contract

#### `POST /api/contracts/[id]/checkpoints`
Create a new approval checkpoint

Request Body:
```json
{
  "checkpoint_name": "Legal Review",
  "checkpoint_order": 1,
  "required_role": "admin",
  "notes": "Optional notes"
}
```

#### `POST /api/contracts/[id]/checkpoints/[cpId]/approve`
Approve or reject a checkpoint

Request Body:
```json
{
  "decision": "approve",
  "notes": "Optional notes",
  "rejected_reason": "Required if decision is 'reject'"
}
```

### E-signatures

#### `GET /api/contracts/[id]/esign`
List e-signature requests for a contract

#### `POST /api/contracts/[id]/esign`
Create an e-signature request

Request Body:
```json
{
  "signers": [
    {
      "email": "signer@example.com",
      "name": "John Doe",
      "role": "client"
    }
  ],
  "provider": "docusign",
  "message": "Please sign this contract"
}
```

## Database Tables

The module uses the following Supabase tables (created via migrations):
- `sandbox_contracts` - Main contracts table
- `sandbox_approval_checkpoints` - Approval workflow checkpoints
- `sandbox_esign_requests` - E-signature request tracking
- `sandbox_audit_trail` - Audit log for all contract actions

## Features

### Contract Lifecycle
1. **Draft** - Initial creation
2. **Pending Approval** - Submitted for review
3. **Approved** - All checkpoints approved
4. **Pending Signature** - E-sign request sent
5. **Signed** - All parties signed
6. **Active** - Contract in effect
7. **Completed** - Contract fulfilled
8. **Cancelled** - Contract terminated

### Approval Workflows
- Multi-step checkpoint-based approvals
- Role-based permissions per checkpoint
- Rejection with reason tracking
- Automatic contract status updates

### E-signatures
- Integration-ready for DocuSign, HelloSign, Adobe Sign
- Multi-signer support with roles
- Status tracking per signer
- Automatic contract status updates

### Audit Trail
All contract actions are logged to `sandbox_audit_trail` including:
- Contract creation, updates, deletion
- Checkpoint approvals/rejections
- E-signature requests

## Authentication

All endpoints require authentication via Supabase Auth. Users must be logged in to access any contract endpoints.

## Authorization

- Contract access is controlled via Row Level Security (RLS) policies
- Checkpoint approval requires matching role or admin/owner privileges
- Contract deletion requires admin/owner role

## Next Steps

1. Configure e-signature provider credentials (DocuSign, HelloSign, etc.)
2. Implement actual e-signature provider API integration
3. Add custom UI components for contract creation and management
4. Set up email notifications for approvals and signatures
5. Configure RLS policies for multi-tenant access control
