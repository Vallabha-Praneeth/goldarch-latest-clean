#!/usr/bin/env python3
"""Drive smoke test with ADC/service account fallback.

Requires:
  - google-auth
  - google-api-python-client
"""

import argparse
import json
import os
import sys
import time
from typing import Any, Dict


def load_credentials(scopes):
    try:
        from google.auth import default
        from google.oauth2 import service_account
    except ImportError as exc:
        raise SystemExit(
            "Missing deps: install google-auth and google-api-python-client"
        ) from exc

    sa_json = os.getenv("GOOGLE_DRIVE_SERVICE_ACCOUNT_JSON")
    if sa_json:
        return service_account.Credentials.from_service_account_info(
            json.loads(sa_json),
            scopes=scopes,
        )

    creds, _ = default(scopes=scopes)
    return creds


def build_drive_service(creds):
    try:
        from googleapiclient.discovery import build
    except ImportError as exc:
        raise SystemExit(
            "Missing deps: install google-api-python-client"
        ) from exc
    return build("drive", "v3", credentials=creds)


def list_folder(service, folder_id: str) -> Dict[str, Any]:
    query = f"'{folder_id}' in parents and trashed=false"
    fields = "files(id,name,mimeType,parents,size,modifiedTime)"
    request = service.files().list(q=query, fields=fields)
    return request.execute()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--folder-id", default=os.getenv("GOOGLE_DRIVE_ROOT_FOLDER_ID"))
    args = parser.parse_args()

    if not args.folder_id:
        raise SystemExit("Missing --folder-id or GOOGLE_DRIVE_ROOT_FOLDER_ID")

    scopes = ["https://www.googleapis.com/auth/drive.readonly"]
    creds = load_credentials(scopes)
    service = build_drive_service(creds)

    print("Listing folder contents...")
    listing = list_folder(service, args.folder_id)
    files = listing.get("files", [])
    print(f"Found {len(files)} items")

    cache_key = f"{args.folder_id}:{int(time.time())}"
    print(f"Cache key simulated: {cache_key}")


if __name__ == "__main__":
    main()
