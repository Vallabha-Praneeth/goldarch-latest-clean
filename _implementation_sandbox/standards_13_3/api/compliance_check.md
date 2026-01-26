# POST /compliance/check (Draft)

## Request
```
{
  "location": {
    "address": "string | null",
    "zip": "string | null",
    "city": "string | null",
    "state": "string | null",
    "country": "string | null"
  },
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

## Response (200)
```
{
  "jurisdiction": {
    "state": "string",
    "city": "string | null",
    "county": "string | null",
    "jurisdictionId": "string",
    "confidence": 0.0
  },
  "result": {
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
    "citations": [{"title": "string", "pointer": "string"}],
    "disclaimer": "string"
  },
  "informational": true
}
```
