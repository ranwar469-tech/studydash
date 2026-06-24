"""Generate quiz questions from document content using AI.

TODO: Implement quiz generation with DeepSeek.
"""


def generate_quiz(study_set_id: str, context_chunks: list[dict], num_questions: int = 5) -> list[dict]:
    """Call AI to produce multiple-choice questions from the provided context."""

    # TODO:
    # Build a prompt asking for MCQs with 4 options each
    # Parse structured JSON response
    # Save to DB
    # Return list of {question, options, correct_index, explanation}

    return []
