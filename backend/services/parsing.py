import re
from services.skills_data import SKILLS, CASE_SENSITIVE_ALIASES


SECTION_HEADERS = [
    "education", "experience", "work experience", "employment history",
    "work history", "professional experience", "projects",
    "skills", "technical skills", "core competencies",
    "certifications", "achievements", "accomplishments",
    "summary", "objective", "profile", "extracurricular", "hobbies", "languages"
]

def _compile(names, ignore_case=True):
    alternatives = "|".join(re.escape(n) for n in sorted(names, key=len, reverse=True))
    flags = re.IGNORECASE if ignore_case else 0
    return re.compile(r"(?<![A-Za-z0-9])(?:" + alternatives + r")(?![A-Za-z0-9])", flags)

# Built once at import time, not on every request
SKILL_PATTERNS = {}
for canonical, aliases in SKILLS.items():
    SKILL_PATTERNS[canonical] = [_compile([canonical] + aliases)]
    exact = CASE_SENSITIVE_ALIASES.get(canonical)
    if exact:
        SKILL_PATTERNS[canonical].append(_compile(exact, ignore_case=False))

def extract_skills(text: str) -> list:
    return [
        skill for skill, patterns in SKILL_PATTERNS.items()
        if any(p.search(text) for p in patterns)
    ]

def split_into_sections(text: str) -> dict:
    lines = text.split("\n")
    sections = {}
    current_section = "header"
    sections[current_section] = []

    for line in lines:
        clean_line = line.strip().lower()
        clean_line_normalized = re.sub(r"[^a-z\s]", "", clean_line)

        # Check if any known header is CONTAINED in this line,
        # instead of requiring an exact full-line match
        matched_header = None
        for header in SECTION_HEADERS:
            if header in clean_line_normalized and len(clean_line_normalized) < 40:
                matched_header = header
                break

        if matched_header:
            current_section = matched_header
            sections[current_section] = []
        else:
            sections[current_section].append(line)

    return {section: "\n".join(content).strip() for section, content in sections.items()}