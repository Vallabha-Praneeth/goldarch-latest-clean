/**
 * Test Pinecone Connection
 */

require('dotenv').config();

async function testPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;
  const indexName = process.env.PINECONE_INDEX_NAME;

  console.log('Testing Pinecone Connection...');
  console.log(`Index: ${indexName}`);

  try {
    // Try to describe the index
    const url = `https://api.pinecone.io/indexes/${indexName}`;
    console.log(`Fetching: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    console.log(`Status: ${response.status}`);

    if (!response.ok) {
      const error = await response.text();
      console.error('Error:', error);
      return;
    }

    const data = await response.json();
    console.log('\n✅ Index found!');
    console.log(JSON.stringify(data, null, 2));

    // Try to get stats
    console.log('\n\nGetting index stats...');
    const statsUrl = `https://${data.host}/describe_index_stats`;
    console.log(`Fetching: ${statsUrl}`);

    const statsResponse = await fetch(statsUrl, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    console.log(`Stats status: ${statsResponse.status}`);

    if (statsResponse.ok) {
      const stats = await statsResponse.json();
      console.log('\n✅ Stats retrieved!');
      console.log(JSON.stringify(stats, null, 2));
    } else {
      const error = await statsResponse.text();
      console.error('Stats error:', error);
    }

  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    console.error(error);
  }
}

testPinecone();
