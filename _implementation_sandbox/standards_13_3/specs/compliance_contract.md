# Compliance Contract (V0/V1)

## Purpose
Define request/response shapes for compliance gating. V0 uses admin-managed rules. V1 is a doc-backed provider stub.

## Core Types

### LocationInput
```
{
  "address": "string | null",
  "zip": "string | null",
  "city": "string | null",
  "state": "string | null",
  "country": "string | null"
}
```

### JurisdictionResult
```
{
  "state": "string",
  "city": "string | null",
  "county": "string | null",
  "jurisdictionId": "string",
  "confidence": 0.0
}
```

### ComplianceCheckRequest
```
{
  "location": LocationInput,
  "itemCategory": "string",
  "attributes": {
    "material": "string | null",
    "finish": "string | null",
    "rating": "string | null",
    "tags": ["string"],
    "custom": {"any": "json"}
  }
}
```

### ComplianceCheckResponse
```
{
  "allowed": true,
  "allowedOptions": ["string"],
  "rationale": "string",
  "trace": {
    "sourceType": "admin_rule" | "doc_stub",
    "ruleId": "string | null",
    "ruleVersion": "string | null",
    "updatedAt": "string | null",
    "updatedBy": "string | null"
  },
  "citations": [
    {"title": "string", "pointer": "string"}
  ],
  "disclaimer": "string"
}
```

## API Contract (Draft)

### POST /compliance/check
Request:
```
{
  "location": LocationInput,
  "itemCategory": "string",
  "attributes": { ... }
}
```

Response:
```
{
  "jurisdiction": JurisdictionResult,
  "result": ComplianceCheckResponse,
  "informational": true
}
```

## Notes
- All responses are informational/approximate only; no legal certainty.
- V0 uses admin rules as the source of truth.
- V1 uses stub provider with no real ingestion or copyrighted content storage.
