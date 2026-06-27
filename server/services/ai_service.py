"""Call DeepSeek API for chat completion and streaming."""

from openai import OpenAI
from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_CHAT_MODEL


SYSTEM_PROMPT = (
    "You are a helpful AI study tutor assistant named StudyDash. "
    "Answer questions using ONLY the provided context. "
    "If the context doesn't contain the answer, say so. "
    "Always cite sources by referencing the document filename and page number when available. "
    "Be concise and educational."
)


def _client() -> OpenAI:
    if not DEEPSEEK_API_KEY:
        raise ValueError(
            "DEEPSEEK_API_KEY is not set. Create a server/.env file with:\n"
            "DEEPSEEK_API_KEY=sk-your-key-here"
        )
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def chat_completion(context: str, question: str) -> str:
    """Send a single-turn chat completion request to DeepSeek."""

    response = _client().chat.completions.create(
        model=DEEPSEEK_CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
        ],
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


async def stream_chat(context: str, question: str):
    """Stream tokens from DeepSeek chat completion (async generator)."""

    import openai

    client = openai.AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    stream = await client.chat.completions.create(
        model=DEEPSEEK_CHAT_MODEL,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"},
        ],
        temperature=0.3,
        stream=True,
    )
    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content
