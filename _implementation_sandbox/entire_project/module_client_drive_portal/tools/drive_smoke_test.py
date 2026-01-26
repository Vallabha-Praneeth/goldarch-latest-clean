#!/usr/bin/env python3
"""Deterministic Drive smoke test (no external deps)."""

import argparse
import base64
import hashlib
import json
import os
import subprocess
import tempfile
import time
import urllib.parse
import urllib.request

GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_DRIVE_SCOPE = "https://www.googleapis.com/auth/drive.readonly"


def base64url(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def build_jwt(service_account: dict) -> str:
    header = {"alg": "RS256", "typ": "JWT"}
    now = int(time.time())
    payload = {
        "iss": service_account["client_email"],
        "scope": GOOGLE_DRIVE_SCOPE,
        "aud": service_account.get("token_uri", GOOGLE_TOKEN_URL),
        "iat": now,
        "exp": now + 3600,
    }

    encoded_header = base64url(json.dumps(header).encode("utf-8"))
    encoded_payload = base64url(json.dumps(payload).encode("utf-8"))
    signing_input = f"{encoded_header}.{encoded_payload}".encode("utf-8")

    private_key = service_account["private_key"].encode("utf-8")
    with tempfile.NamedTemporaryFile() as key_file, tempfile.NamedTemporaryFile() as data_file:
        key_file.write(private_key)
        key_file.flush()
        data_file.write(signing_input)
        data_file.flush()

        result = subprocess.run(
            [
                "openssl",
                "dgst",
                "-sha256",
                "-sign",
                key_file.name,
                data_file.name,
            ],
            check=True,
            capture_output=True,
        )
        signature = result.stdout

    encoded_signature = base64url(signature)

    return f"{encoded_header}.{encoded_payload}.{encoded_signature}"


def fetch_access_token(service_account: dict) -> str:
    assertion = build_jwt(service_account)
    payload = urllib.parse.urlencode({
        "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
        "assertion": assertion,
    }).encode("utf-8")

    request = urllib.request.Request(
        GOOGLE_TOKEN_URL,
        data=payload,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST",
    )

    with urllib.request.urlopen(request) as response:
        data = json.loads(response.read().decode("utf-8"))
        return data["access_token"]


def list_folder(token: str, folder_id: str) -> dict:
    query = f"'{folder_id}' in parents and trashed=false"
    fields = "files(id,name,mimeType,parents,size,modifiedTime)"
    url = (
        "https://www.googleapis.com/drive/v3/files?"
        + urllib.parse.urlencode({"q": query, "fields": fields})
    )

    request = urllib.request.Request(
        url,
        headers={"Authorization": f"Bearer {token}"},
        method="GET",
    )

    with urllib.request.urlopen(request) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder-id", default=os.getenv("GOOGLE_DRIVE_ROOT_FOLDER_ID"))
    args = parser.parse_args()

    if not args.folder_id:
        raise SystemExit("Missing --folder-id or GOOGLE_DRIVE_ROOT_FOLDER_ID")

    raw = os.getenv("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON")
    if not raw:
        raise SystemExit("Missing GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON")

    service_account = json.loads(raw)

    print("Fetching access token...")
    token = fetch_access_token(service_account)

    print("Listing folder contents...")
    listing = list_folder(token, args.folder_id)
    files = listing.get("files", [])
    print(f"Found {len(files)} items")

    # Simple deterministic cache simulation
    cache_key = hashlib.sha256(args.folder_id.encode("utf-8")).hexdigest()
    cache = {cache_key: {"count": len(files), "ts": int(time.time())}}
    print(f"Cache key {cache_key} -> {cache[cache_key]}")

    # Simple rate limit simulation
    max_requests = 5
    window_seconds = 60
    now = int(time.time())
    requests = [now - 10, now - 5, now - 1]
    recent = [t for t in requests if now - t < window_seconds]
    allowed = len(recent) < max_requests
    print(f"Rate limit check: {len(recent)}/{max_requests} allowed={allowed}")


if __name__ == "__main__":
    main()
