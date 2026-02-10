import requests
import json
import sys

def debug_api():
    url = "http://127.0.0.1:8000/api/v1/chat"
    query = "Show me Ethereum chart"
    
    print(f"🚀 Sending query to API: '{query}'")
    
    try:
        response = requests.post(url, json={"query": query})
        response.raise_for_status()
        
        data = response.json()
        print("\n✅ API Response Status: 200 OK")
        print("\n🔍 Full Response JSON:")
        print(json.dumps(data, indent=2))
        
        if "asset" in data:
            print(f"\n✅ 'asset' field found: {data['asset']}")
            if data['asset'] == 'ethereum':
                print("✅ Asset correctly identified as 'ethereum'")
            else:
                print(f"⚠️ Asset identified as '{data['asset']}' (Expected 'ethereum')")
        else:
            print("\n❌ 'asset' field MISSING in response!")
            
    except Exception as e:
        print(f"\n❌ Request Failed: {e}")
        if 'response' in locals():
            print(f"Response Text: {response.text}")

if __name__ == "__main__":
    debug_api()
