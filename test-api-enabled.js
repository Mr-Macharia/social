// Quick test to verify Generative Language API is enabled
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

async function testAPI() {
  const apiKey = process.env.GEMINI_API_KEY;
  
  console.log('🔍 Testing if Generative Language API is enabled...\n');
  
  try {
    // Test 1: List models
    const modelsUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    const modelsResponse = await fetch(modelsUrl);
    const modelsData = await modelsResponse.json();
    
    if (modelsResponse.ok) {
      console.log('✅ API is enabled and accessible!');
      console.log(`\nFound ${modelsData.models?.length || 0} models:`);
      
      // List all models
      modelsData.models?.forEach(model => {
        console.log(`  - ${model.name} (${model.displayName})`);
      });
      
      // Check for Veo models
      const veoModels = modelsData.models?.filter(m => m.name.includes('veo')) || [];
      if (veoModels.length > 0) {
        console.log('\n✨ Veo models available:');
        veoModels.forEach(model => {
          console.log(`  - ${model.name}`);
        });
      } else {
        console.log('\n⚠️  No Veo models found. This might require additional access.');
      }
      
    } else {
      console.error('❌ API request failed:', modelsResponse.status);
      console.error('Error:', modelsData);
      
      if (modelsData.error?.code === 403) {
        console.log('\n👉 Please enable the API at:');
        console.log(modelsData.error.details?.[0]?.metadata?.activationUrl);
      }
    }
    
    // Test 2: Try a simple text generation
    console.log('\n\n🧪 Testing text generation...');
    const textResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Say hello!' }]
          }]
        })
      }
    );
    
    if (textResponse.ok) {
      const textData = await textResponse.json();
      console.log('✅ Text generation works!');
      console.log('Response:', textData.candidates?.[0]?.content?.parts?.[0]?.text);
    } else {
      const errorData = await textResponse.json();
      console.error('❌ Text generation failed:', errorData);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testAPI();
