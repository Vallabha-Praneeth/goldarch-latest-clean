import React from 'react';

type ComplianceResult = {
  allowed: boolean;
  allowedOptions: string[];
  rationale: string;
  disclaimer: string;
  trace: {
    sourceType: 'admin_rule' | 'doc_stub';
    ruleId?: string | null;
    ruleVersion?: string | null;
    updatedAt?: string | null;
    updatedBy?: string | null;
  };
  citations: { title: string; pointer: string }[];
};

type Props = {
  itemCategory: string;
  result: ComplianceResult;
};

export function ComplianceGateStub({ itemCategory, result }: Props) {
  return (
    <section style={{ border: '1px solid #ddd', padding: 16, borderRadius: 8 }}>
      <h3 style={{ margin: 0 }}>Compliance Check: {itemCategory}</h3>
      <p style={{ margin: '8px 0' }}>
        Status: {result.allowed ? 'Allowed' : 'Restricted due to local standards'}
      </p>
      {result.allowedOptions.length > 0 && (
        <div>
          <strong>Allowed options:</strong>
          <ul>
            {result.allowedOptions.map((opt) => (
              <li key={opt}>{opt}</li>
            ))}
          </ul>
        </div>
      )}
      <p style={{ margin: '8px 0' }}>{result.rationale}</p>
      <p style={{ fontSize: 12, color: '#555' }}>{result.disclaimer}</p>
      <details>
        <summary>Traceability</summary>
        <pre>{JSON.stringify(result.trace, null, 2)}</pre>
      </details>
      {result.citations.length > 0 && (
        <details>
          <summary>Citations</summary>
          <ul>
            {result.citations.map((c) => (
              <li key={c.pointer}>
                {c.title} ({c.pointer})
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
