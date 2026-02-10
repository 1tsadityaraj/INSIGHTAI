import requests
import json
import time

def debug_chat_endpoint():
    url = "http://127.0.0.1:8000/api/v1/chat"
    query = "Analyze Bitcoin"
    
    print(f"🚀 Sending request to {url} with query: '{query}'")
    start_time = time.time()
    
    try:
        response = requests.post(url, json={"query": query}, timeout=30)
        elapsed = time.time() - start_time
        
        print(f"✅ Response received in {elapsed:.2f}s")
        print(f"Status Code: {response.status_code}")
        try:
            print(json.dumps(response.json(), indent=2))
        except:
            print(f"Response Text: {response.text}")
            
    except requests.exceptions.Timeout:
        print("❌ Request Timed Out (Back-end hanging?)")
    except Exception as e:
        print(f"❌ Connection Error: {e}")

if __name__ == "__main__":
    debug_chat_endpoint()
