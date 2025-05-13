# OLD (broken)
# from langchain.memory import BaseMemory

# NEW (replace or remove based on what you're doing)
from langchain_core.memory import BaseMemory  # or appropriate class from new version

from typing import Dict, Any
from app.supabase_client import get_user_messages, save_user_message

class SupabaseMemory(BaseMemory):
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.chat_history = self._load_history()

    def _load_history(self):
        try:
            messages = get_user_messages(self.user_id)
            history = []
            for msg in messages:
                role = msg.get("role")
                content = msg.get("content")
                if role and content:
                    history.append(f"{role}: {content}")
            return "\n".join(history)
        except Exception as e:
            print(f"Error loading history from Supabase: {e}")
            return ""

    def load_memory_variables(self, inputs: Dict[str, Any]) -> Dict[str, str]:
        return {"history": self.chat_history}

    def save_context(self, inputs: Dict[str, Any], outputs: Dict[str, str]) -> None:
        try:
            user_message = inputs.get("input")
            ai_response = outputs.get("output")

            save_user_message(self.user_id, "user", user_message)
            save_user_message(self.user_id, "assistant", ai_response)

        except Exception as e:
            print(f"Error saving context to Supabase: {e}")

    def clear(self):
        pass  # Optional: clear memory per user if needed
