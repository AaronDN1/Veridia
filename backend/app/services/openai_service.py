from fastapi import HTTPException
from openai import OpenAI
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.generated_output import GeneratedOutput, OutputType
from app.models.prompt_thread import PromptConversationMessage
from app.models.uploaded_file import UploadedFile
from app.models.user import User
from app.schemas.workspace import LabHelperRequest, PromptRequest
from app.services.files import extract_file_context


client = OpenAI(api_key=settings.openai_api_key)

DEFAULT_SYSTEM_PROMPT = """
You are Sigma Solve, a patient STEM professor and tutor.
Teach clearly and rigorously.
Explain ideas in plain English before or alongside symbolic work.
Prefer logical step-by-step explanations when that helps learning.
Keep the response polished, concise where appropriate, and student-friendly.
When math is needed, format inline math with single dollar signs and block equations with double dollar signs.
Never leave equations as raw plain text if they would read better as formatted math.
For example, write `$a^2 + b^2 = c^2$` instead of `a^2 + b^2 = c^2`.
For multi-step derivations or emphasized equations, use display math with double dollar signs.
For piecewise expressions, aligned derivations, or grouped multiline work, use KaTeX-friendly environments such as `cases`, `aligned`, or `matrix` inside display math.
Do not leave commands like `\\theta`, `\\quad`, `\\begin{cases}`, or `\\end{cases}` outside math delimiters.
Avoid raw unreadable LaTeX dumps, excessive notation, or long symbolic derivations without explanation.
If giving equations, present them cleanly and explain what each symbol means when useful.
Use short headings or bullets when they improve readability.
Write like a calm professor helping a student understand the solution, not like a symbolic parser.
Prioritize teaching, clarity, and academic honesty over shortcut answers.
""".strip()

SEO_SYSTEM_PROMPT = """
Explain the following STEM problem clearly and step-by-step like a professor.
Ensure the explanation is beginner-friendly but technically correct.
Format all math cleanly and avoid raw LaTeX output where possible.
When math is needed, format inline math with single dollar signs and block equations with double dollar signs.
Use semantic Markdown sections that can be rendered on an SEO content page.
Keep the response focused on the problem statement, the solution, and the key idea.
""".strip()


def _build_file_input(upload: UploadedFile) -> dict[str, str | dict]:
    context = extract_file_context(upload)
    if context["type"] == "image":
        return {"type": "image_url", "image_url": {"url": context["data_url"]}}
    return {"type": "text", "text": f"File context from {upload.original_name}:\n{context['text']}"}


def build_prompt_user_message(subject: str, prompt: str, uploads: list[UploadedFile]) -> str:
    sections = [f"Subject: {subject}", "", prompt.strip()]

    text_contexts: list[str] = []
    for upload in uploads:
        context = extract_file_context(upload)
        if context["type"] == "text" and context["text"].strip():
            text_contexts.append(f"File context from {upload.original_name}:\n{context['text']}")

    if text_contexts:
        sections.extend(["", "Relevant file context:", "", "\n\n".join(text_contexts)])

    return "\n".join(sections).strip()


def _create_chat_completion(prompt_text: str, system_prompt: str = DEFAULT_SYSTEM_PROMPT) -> str:
    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": prompt_text},
        ],
    )
    text = response.choices[0].message.content or ""
    return text.strip()


def generate_seo_content(topic: str, category: str, problem_statement: str) -> str:
    prompt_text = f"""
Category: {category}
Topic: {topic}

Problem statement:
{problem_statement}

Return a clear, original explanation with:
- a brief restatement of the problem
- step-by-step solution
- a concise final answer or takeaway
""".strip()

    try:
        return _create_chat_completion(prompt_text, SEO_SYSTEM_PROMPT)
    except Exception as e:
        raise HTTPException(status_code=502, detail="SEO content generation failed. Please try again.") from e


def create_thread_completion(
    subject: str,
    prompt: str,
    uploads: list[UploadedFile],
    history: list[PromptConversationMessage] | None = None,
    history_limit: int = 12,
) -> str:
    conversation_messages = [{"role": "system", "content": DEFAULT_SYSTEM_PROMPT}]

    if history:
        for message in history[-history_limit:]:
            conversation_messages.append({"role": message.role.value, "content": message.content})

    conversation_messages.append({"role": "user", "content": build_prompt_user_message(subject, prompt, uploads)})

    response = client.chat.completions.create(
        model=settings.openai_model,
        messages=conversation_messages,
    )
    text = response.choices[0].message.content or ""
    return text.strip()


def generate_prompt_response(db: Session, user: User, request: PromptRequest, uploads: list[UploadedFile]) -> str:
    prompt_text = build_prompt_user_message(request.subject, request.prompt, uploads)
    try:
        text = _create_chat_completion(prompt_text)
    except Exception as e:
        raise HTTPException(status_code=502, detail="AI request failed. Please try again.") from e
    db.add(GeneratedOutput(user_id=user.id, output_type=OutputType.AI_PROMPT, title=request.subject, content=text))
    db.commit()
    return text


def generate_lab_report(db: Session, user: User, request: LabHelperRequest, uploads: list[UploadedFile]) -> str:
    prompt = f"""
Create a strong, professor-ready lab report draft for the following STEM lab.

Subject: {request.subject}
Lab title: {request.lab_title}
Description: {request.description}
Observations: {request.observations}
Methods: {request.methods}
Results: {request.results}
Additional notes: {request.notes}

Use this structure:
1. Title
2. Abstract
3. Objective / Purpose
4. Materials / Methods
5. Data / Results
6. Analysis / Discussion
7. Sources of Error
8. Conclusion

Be formal, specific, and make use of the supplied details and file context.
""".strip()

    text_file_context = []
    for upload in uploads:
        context = extract_file_context(upload)
        if context["type"] == "text":
            text_file_context.append(f"File context from {upload.original_name}:\n{context['text']}")

    full_prompt = prompt
    if text_file_context:
        full_prompt = f"{prompt}\n\n" + "\n\n".join(text_file_context)

    try:
        text = _create_chat_completion(full_prompt)
    except Exception as e:
        raise HTTPException(status_code=502, detail="AI request failed. Please try again.") from e
    db.add(
        GeneratedOutput(
            user_id=user.id,
            output_type=OutputType.LAB_HELPER,
            title=request.lab_title,
            content=text,
        )
    )
    db.commit()
    return text
