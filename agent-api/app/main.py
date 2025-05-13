from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from app.agent import run_agent
from dotenv import load_dotenv

# Load environment variables from .env
load_dotenv()

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "SocialMize Agent API is running ✅"}

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/chat-agent")
async def chat_agent(request: Request):
    data = await request.json()
    user_id = data.get("user_id")
    message = data.get("message")

    if not user_id or not message:
        return {"error": "Missing user_id or message"}

    reply = await run_agent(user_id=user_id, message=message)
    return {"reply": reply}
