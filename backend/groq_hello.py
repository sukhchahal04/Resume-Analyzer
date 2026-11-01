import os
from dotenv import load_dotenv
from groq import Groq

load_dotenv()

client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
MODEL = os.environ.get("GROQ_MODEL", "openai/gpt-oss-20b")   # second value is the fallback

response = client.chat.completions.create(
    model=MODEL,
    messages=[
        {"role": "system", "content": "You are a concise career coach."},
        {"role": "user", "content": "Give me one tip to improve a software engineer resume."},
    ],
)

print(response.choices[0].message.content)