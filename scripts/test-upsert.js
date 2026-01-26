/**
 * Test Pinecone Upsert
 */

require('dotenv').config();

async function testUpsert() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  console.log('Getting index host...');

  // Get the host
  const indexResponse = await fetch(`https://api.pinecone.io/indexes/${indexName}`, {
    method: 'GET',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
  });

  const indexData = await indexResponse.json();
  const host = indexData.host;
  console.log(`Host: ${host}`);

  // Create a test vector
  const testVector = {
    id: 'test-1',
    values: new Array(1536).fill(0.1), // 1536 dimensions with value 0.1
    metadata: {
      text: 'test',
      projectId: 'test-123',
    },
  };

  console.log('\nUpserting test vector...');

  const url = `https://${host}/vectors/upsert`;
  console.log(`URL: ${url}`);

  const body = {
    vectors: [testVector],
    namespace: 'test',
  };

  console.log(`Body: vectors count = ${body.vectors.length}, namespace = ${body.namespace}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  console.log(`\nStatus: ${response.status}`);

  if (response.ok) {
    const result = await response.json();
    console.log('✅ Success!');
    console.log(JSON.stringify(result, null, 2));
  } else {
    const errorText = await response.text();
    console.log('❌ Error response:');
    console.log(errorText);

    try {
      const errorJson = JSON.parse(errorText);
      console.log('\nParsed error:');
      console.log(JSON.stringify(errorJson, null, 2));
    } catch (e) {
      // Not JSON
    }
  }
}

testUpsert().catch(console.error);
