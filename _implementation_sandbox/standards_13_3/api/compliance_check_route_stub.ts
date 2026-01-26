import { ComplianceGate } from '../modules/compliance_gate/compliance_gate';

const gate = new ComplianceGate();

function isEnabled() {
  return process.env.ENABLE_COMPLIANCE_GATE === 'true';
}

export async function POST(req: Request) {
  if (!isEnabled()) {
    return new Response(
      JSON.stringify({
        error: 'Compliance gate disabled',
        informational: true,
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  const body = await req.json();
  const result = await gate.check(body);

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
