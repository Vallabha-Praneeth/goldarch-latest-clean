const { ComplianceGate } = require('./compliance_gate');

async function run() {
  const gate = new ComplianceGate();

  const response = await gate.check({
    location: { state: 'CA', city: 'Los Angeles' },
    itemCategory: 'windows',
    attributes: { material: 'aluminum', tags: ['energy'] },
  });

  console.log(JSON.stringify(response, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
