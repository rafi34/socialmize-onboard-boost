import os
import requests
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def get_user_messages(user_id: str):
    """Fetch last 10 messages for user from Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/ai_messages"
    params = {
        "user_id": f"eq.{user_id}",
        "order": "created_at.asc",
        "limit": 10
    }
    response = requests.get(url, headers=HEADERS, params=params)
    return response.json() if response.ok else []

def save_user_message(user_id: str, role: str, content: str):
    """Save a single message to Supabase"""
    url = f"{SUPABASE_URL}/rest/v1/ai_messages"
    payload = [{
        "user_id": user_id,
        "role": role,
        "content": content
    }]
    response = requests.post(url, headers=HEADERS, json=payload)
    return response.status_code == 201
