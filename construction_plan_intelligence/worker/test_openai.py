"""
Quick test to verify OpenAI API key works
"""
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
print(f"API Key loaded: {api_key[:20]}..." if api_key else "API Key not found!")

client = OpenAI(api_key=api_key)

try:
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "user", "content": "Say 'test successful' if you can read this."}
        ],
        max_tokens=50
    )

    result = response.choices[0].message.content
    print(f"\nOpenAI Response: {result}")
    print(f"Tokens used: {response.usage.total_tokens}")
    print("\n✅ OpenAI API is working correctly!")

except Exception as e:
    print(f"\n❌ OpenAI API Error: {e}")
    print(f"Error type: {type(e).__name__}")
