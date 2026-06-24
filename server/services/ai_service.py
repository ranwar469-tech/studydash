"""Call DeepSeek API for chat completion and streaming.

TODO: Implement real DeepSeek API calls with the OpenAI-compatible client.
"""


def chat_completion(system_prompt: str, context: str, question: str) -> str:
    """Send a single-turn chat completion request to DeepSeek."""

    # TODO:
    # from openai import OpenAI
    # client = OpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    # response = client.chat.completions.create(
    #     model=DEEPSEEK_CHAT_MODEL,
    #     messages=[
    #         {"role": "system", "content": system_prompt},
    #         {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
    #     ],
    #     temperature=0.3,
    # )
    # return response.choices[0].message.content

    return ""


async def stream_chat(system_prompt: str, context: str, question: str):
    """Stream tokens from DeepSeek chat completion."""

    # TODO:
    # from openai import AsyncOpenAI
    # client = AsyncOpenAI(api_key=DEEPSEEK_API_KEY, base_url=DEEPSEEK_BASE_URL)
    # stream = await client.chat.completions.create(
    #     model=DEEPSEEK_CHAT_MODEL,
    #     messages=[
    #         {"role": "system", "content": system_prompt},
    #         {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}"}
    #     ],
    #     temperature=0.3,
    #     stream=True,
    # )
    # async for chunk in stream:
    #     if chunk.choices[0].delta.content:
    #         yield chunk.choices[0].delta.content

    yield ""
