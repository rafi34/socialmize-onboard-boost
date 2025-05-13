import os
from langchain_community.chat_models import ChatOpenAI
from langchain.agents import initialize_agent, AgentType
from langchain.tools import Tool
from app.tools.reminder_tool import create_reminder
# from app.memory import SupabaseMemory  # Uncomment if memory is async-compatible

# Define the reminder tool
tools = [
    Tool(
        name="ReminderTool",
        func=create_reminder,
        description="Use this tool to set a reminder for content creation. Input should be a time or time description."
    )
]

# Define the main async agent runner
async def run_agent(user_id: str, message: str) -> str:
    # Optional: Memory if your SupabaseMemory is async-compatible
    # memory = SupabaseMemory(user_id=user_id)

    llm = ChatOpenAI(
        model="gpt-4",
        temperature=0.5,
        openai_api_key=os.getenv("OPENAI_API_KEY")
    )

    agent = initialize_agent(
        tools=tools,
        llm=llm,
        agent=AgentType.CHAT_ZERO_SHOT_REACT_DESCRIPTION,
        verbose=True,
        # memory=memory  # Uncomment if ready
    )

    # Must use `arun` in async context
    return await agent.arun(message)
