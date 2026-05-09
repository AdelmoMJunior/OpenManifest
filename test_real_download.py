import requests, base64, os

access_key = os.environ.get("B2_ACCESS_KEY_ID")
secret_key = os.environ.get("B2_SECRET_ACCESS_KEY")
bucket_id = "24ad5ccbb372da579add0519" # ID real que acabamos de descobrir
bucket_name = "goacbr"
file_name = "14774544000115/202605/nfe/29260219439746000124550010000012321995347041.xml"

# 1. Autorizar
auth_url = "https://api.backblazeb2.com/b2api/v2/b2_authorize_account"
auth_header = base64.b64encode(f"{access_key}:{secret_key}".encode()).decode()
r = requests.get(auth_url, headers={"Authorization": f"Basic {auth_header}"})
data = r.json()

api_url = data['apiUrl']
auth_token = data['authorizationToken']
download_url = data['downloadUrl']

# 2. Get Download Auth
get_auth_url = f"{api_url}/b2api/v2/b2_get_download_authorization"
payload = {
    "bucketId": bucket_id,
    "fileNamePrefix": file_name,
    "validDurationInSeconds": 3600
}
r_token = requests.post(get_auth_url, json=payload, headers={"Authorization": auth_token})
token_data = r_token.json()
download_token = token_data['authorizationToken']

# 3. TESTAR DOWNLOAD
# Conforme a doc, se passarmos o token no header ou na URL deve funcionar
final_url = f"{download_url}/file/{bucket_name}/{file_name}?Authorization={download_token}"
print(f"Testando URL: {final_url}")

r_dl = requests.get(final_url)
print(f"Status Download: {r_dl.status_code}")
if r_dl.status_code != 200:
    print(f"Erro Download: {r_dl.text}")
else:
    print("Sucesso! O arquivo foi lido corretamente com este token.")
