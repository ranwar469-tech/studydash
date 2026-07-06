"""Call DeepSeek API for chat completion, streaming, and structured generation."""

from openai import OpenAI
from config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL, DEEPSEEK_CHAT_MODEL


# ── System Prompts ───────────────────────────────────────────────

SYSTEM_PROMPT = (
    "You are a helpful AI study tutor assistant named StudyDash. "
    "Ground your answers primarily in the provided context chunks — each is labeled "
    "with an ID like [Chunk 1], [Chunk 2], etc. When you use information from a chunk, "
    "cite it with its chunk number in brackets, e.g. [1] [3]. "
    "If the context is thin on a topic, you may supplement with your own knowledge "
    "to provide helpful examples, analogies, or clarifications — but make it clear "
    "when you're adding context beyond the uploaded material. "
    "Be concise and educational.\n\n"
    "IMPORTANT — Voice and framing rules:\n"
    "- Speak as a tutor DESCRIBING the material, not as the material itself.\n"
    "- NEVER say 'You learned…', 'You were introduced to…', 'In this chapter you will…', "
    "or any phrase that assumes what the student has or hasn't done.\n"
    "- Rephrase textbook narration like 'You will explore CSS properties' into "
    "'The material covers CSS properties' or 'Key topics include CSS properties.'\n"
    "- Use your own voice: 'The document explains…', 'The text introduces…', 'Key concepts include…'"
)

# Study mode overrides — injected after SYSTEM_PROMPT
MODE_PROMPTS: dict[str, str] = {
    "elif": (
        "Explain like I'm five years old. Use simple everyday analogies (animals, food, toys, daily life). "
        "Avoid ALL technical jargon. If a concept is complex, break it down into a tiny story or metaphor. "
        "Feel free to invent playful examples from your own knowledge to make ideas stick."
    ),
    "deep": (
        "Provide thorough, graduate-level technical explanations. Go deep into mechanisms, "
        "edge cases, tradeoffs, historical context, and connections to related concepts. "
        "Use examples from your own knowledge where the context is light. Challenge assumptions."
    ),
    "default": (
        "Be conversational, educational, and clear. Use the context as your primary source, "
        "but add examples or analogies from your own knowledge when they help understanding. "
        "Balance depth with clarity."
    ),
}


# ── Client Helpers ───────────────────────────────────────────────

def _client() -> OpenAI:
    if not DEEPSEEK_API_KEY:
        raise ValueError(
            "DEEPSEEK_API_KEY is not set. Create a server/.env file with:\n"
            "DEEPSEEK_API_KEY=sk-your-key-here"
        )
    return OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)


def _build_system_prompt(mode: str | None = None) -> str:
    """Assemble the full system prompt with optional mode injection."""
    base = SYSTEM_PROMPT
    mode_key = (mode or "default").lower()
    mode_instruction = MODE_PROMPTS.get(mode_key, MODE_PROMPTS["default"])
    return f"{base}\n\nMode: {mode_instruction}"


# ── Chat Completion (sync) ───────────────────────────────────────

def chat_completion(
    context: str,
    question: str,
    mode: str | None = None,
    history: list[dict] | None = None,
) -> str:
    """Send a chat completion request to DeepSeek with optional mode and history.

    Args:
        context: Assembled context string with chunk citations.
        question: The user's current question.
        mode: Optional study mode ('beginner', 'exam', 'deep', 'quick').
        history: Optional list of previous messages as [{"role":..., "content":...}].

    Returns:
        The AI's response string.
    """
    system_prompt = _build_system_prompt(mode)

    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history[-6:])  # last 3 exchanges
    messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nQuestion: {question}",
    })

    response = _client().chat.completions.create(
        model=DEEPSEEK_CHAT_MODEL,
        messages=messages,
        temperature=0.3,
    )
    return response.choices[0].message.content or ""


# ── Chat Streaming (async generator) ─────────────────────────────

async def stream_chat(
    context: str,
    question: str,
    mode: str | None = None,
    history: list[dict] | None = None,
):
    """Stream tokens from DeepSeek chat completion (async generator).

    Args:
        context: Assembled context string with chunk citations.
        question: The user's current question.
        mode: Optional study mode ('beginner', 'exam', 'deep', 'quick').
        history: Optional list of previous messages as [{"role":..., "content":...}].

    Yields:
        Token strings as they arrive from the API.
    """
    import openai

    system_prompt = _build_system_prompt(mode)

    messages: list[dict] = [{"role": "system", "content": system_prompt}]
    if history:
        messages.extend(history[-6:])
    messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nQuestion: {question}",
    })

    client = openai.AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    stream = await client.chat.completions.create(
        model=DEEPSEEK_CHAT_MODEL,
        messages=messages,
        temperature=0.3,
        stream=True,
    )
    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content


# ── Structured JSON Generation ───────────────────────────────────

def structured_completion(
    system_instruction: str,
    user_prompt: str,
    temperature: float = 0.3,
) -> str:
    """Get a completion with a strong system instruction for JSON output.

    Uses DeepSeek's chat API with a system message that instructs
    the model to return ONLY valid JSON. The caller is responsible
    for parsing the returned string with json.loads().

    Args:
        system_instruction: The system-level instructions (e.g. "You are a JSON generator...")
        user_prompt: The user message containing data and formatting requirements.
        temperature: Creativity level (lower = more deterministic).

    Returns:
        The raw response string (expected to be valid JSON).
    """
    response = _client().chat.completions.create(
        model=DEEPSEEK_CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
    )
    content = response.choices[0].message.content or ""
    # Strip markdown code fences if present
    content = content.strip()
    for fence in ("```json", "```"):
        if content.startswith(fence):
            content = content[len(fence):].strip()
        if content.endswith("```"):
            content = content[:-3].strip()
    return content


async def stream_structured_completion(
    system_instruction: str,
    user_prompt: str,
    temperature: float = 0.3,
):
    """Stream a structured (JSON) completion token by token.

    Args:
        system_instruction: The system-level instructions.
        user_prompt: The user message containing data and formatting requirements.
        temperature: Creativity level.

    Yields:
        Token strings as they arrive.
    """
    import openai

    client = openai.AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    stream = await client.chat.completions.create(
        model=DEEPSEEK_CHAT_MODEL,
        messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_prompt},
        ],
        temperature=temperature,
        stream=True,
    )
    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content

