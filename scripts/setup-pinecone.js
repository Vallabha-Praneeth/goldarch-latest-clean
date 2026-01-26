/**
 * Setup Script - Create Pinecone Index
 * Run with: node scripts/setup-pinecone.js
 */

require('dotenv').config();

async function setupPinecone() {
  const apiKey = process.env.PINECONE_API_KEY;
  const environment = process.env.PINECONE_ENVIRONMENT;
  const indexName = process.env.PINECONE_INDEX_NAME;

  if (!apiKey || !environment || !indexName) {
    console.error('❌ Error: Missing Pinecone configuration in .env');
    console.error('Required: PINECONE_API_KEY, PINECONE_ENVIRONMENT, PINECONE_INDEX_NAME');
    process.exit(1);
  }

  console.log('🔧 Pinecone Setup');
  console.log('================');
  console.log(`Environment: ${environment}`);
  console.log(`Index Name: ${indexName}`);
  console.log('');

  try {
    // Check if index exists
    console.log('1️⃣ Checking if index exists...');

    const listUrl = `https://api.pinecone.io/indexes`;
    const listResponse = await fetch(listUrl, {
      method: 'GET',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      const error = await listResponse.text();
      console.error('❌ Failed to list indexes:', error);
      console.log('\n💡 Make sure your Pinecone API key is valid');
      console.log('   Check at: https://app.pinecone.io/');
      process.exit(1);
    }

    const indexes = await listResponse.json();
    const indexExists = indexes.indexes?.some(idx => idx.name === indexName);

    if (indexExists) {
      console.log(`✅ Index "${indexName}" already exists!`);
      console.log('\n🎉 Pinecone is ready to use!');
      return;
    }

    // Create index
    console.log(`📝 Index "${indexName}" not found. Creating it...`);

    const createUrl = `https://api.pinecone.io/indexes`;
    const createResponse = await fetch(createUrl, {
      method: 'POST',
      headers: {
        'Api-Key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: indexName,
        dimension: 1536,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      }),
    });

    if (!createResponse.ok) {
      const error = await createResponse.text();
      console.error('❌ Failed to create index:', error);

      // Provide manual instructions
      console.log('\n📝 Please create the index manually:');
      console.log('');
      console.log('1. Go to: https://app.pinecone.io/');
      console.log('2. Click "Create Index"');
      console.log('3. Configure:');
      console.log(`   - Name: ${indexName}`);
      console.log('   - Dimensions: 1536');
      console.log('   - Metric: cosine');
      console.log(`   - Cloud: AWS`);
      console.log(`   - Region: us-east-1`);
      console.log('4. Click "Create Index"');
      console.log('');
      console.log('Then run this script again to verify.');
      process.exit(1);
    }

    console.log('✅ Index created successfully!');
    console.log('⏳ Waiting for index to be ready (this may take 1-2 minutes)...');

    // Wait for index to be ready
    let ready = false;
    let attempts = 0;
    const maxAttempts = 30; // 30 attempts = 2 minutes

    while (!ready && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 4000)); // Wait 4 seconds

      const describeUrl = `https://api.pinecone.io/indexes/${indexName}`;
      const describeResponse = await fetch(describeUrl, {
        method: 'GET',
        headers: {
          'Api-Key': apiKey,
        },
      });

      if (describeResponse.ok) {
        const indexInfo = await describeResponse.json();
        if (indexInfo.status?.ready) {
          ready = true;
        }
      }

      attempts++;
      if (attempts % 5 === 0) {
        console.log(`   Still waiting... (${attempts * 4}s elapsed)`);
      }
    }

    if (ready) {
      console.log('✅ Index is ready!');
      console.log('\n🎉 Pinecone setup complete!');
    } else {
      console.log('⚠️  Index created but not ready yet.');
      console.log('   Check status at: https://app.pinecone.io/');
      console.log('   It should be ready in a few minutes.');
    }

  } catch (error) {
    console.error('❌ Error during setup:', error.message);
    console.log('\n💡 Manual Setup Instructions:');
    console.log('');
    console.log('1. Go to: https://app.pinecone.io/');
    console.log('2. Click "Create Index"');
    console.log('3. Configure:');
    console.log(`   - Name: ${indexName}`);
    console.log('   - Dimensions: 1536');
    console.log('   - Metric: cosine');
    console.log('   - Cloud: AWS');
    console.log('   - Region: us-east-1');
    console.log('4. Click "Create Index"');
    process.exit(1);
  }
}

// Run setup
setupPinecone().catch(console.error);
