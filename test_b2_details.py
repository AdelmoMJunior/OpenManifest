import requests, base64, os

access_key = os.environ.get("B2_ACCESS_KEY_ID")
secret_key = os.environ.get("B2_SECRET_ACCESS_KEY")
bucket_name = os.environ.get("B2_BUCKET_NAME")

auth_url = "https://api.backblazeb2.com/b2api/v2/b2_authorize_account"
auth_header = base64.b64encode(f"{access_key}:{secret_key}".encode()).decode()

r = requests.get(auth_url, headers={"Authorization": f"Basic {auth_header}"})
data = r.json()

print(f"Status: {r.status_code}")
print(f"AccountId: {data.get('accountId')}")
print(f"Allowed: {data.get('allowed')}")
print(f"DownloadURL: {data.get('downloadUrl')}")

if r.status_code == 200:
    api_url = data['apiUrl']
    auth_token = data['authorizationToken']
    
    # List buckets to get ID
    list_buckets_url = f"{api_url}/b2api/v2/b2_list_buckets"
    r_buckets = requests.post(list_buckets_url, 
                            json={"accountId": data['accountId'], "bucketName": bucket_name},
                            headers={"Authorization": auth_token})
    buckets_data = r_buckets.json()
    print(f"Buckets Data: {buckets_data}")
