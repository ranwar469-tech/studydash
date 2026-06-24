"""Generate document summaries using AI.

TODO: Implement summarization with DeepSeek.
"""


def generate_summary(study_set_id: str, context_chunks: list[dict]) -> dict:
    """Call AI to produce a structured summary from document chunks."""

    # TODO:
    # Build a prompt asking for:
    #   - Brief overview paragraph
    #   - Key takeaways (bullet points)
    #   - Section breakdown
    # Parse structured JSON response
    # Return {content, sections, takeaways}

    return {"content": "", "sections": [], "takeaways": []}
