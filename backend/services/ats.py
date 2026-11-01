import re

# Simple, rule-based checks for how easily an applicant tracking system (ATS) can read a resume.
# These are heuristics, not how any specific ATS actually scores.

EMAIL_PATTERN = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")
PHONE_CANDIDATE = re.compile(r"\+?\d[\d\s().-]{8,}\d")
LINK_PATTERN = re.compile(r"linkedin\.com|github\.com", re.IGNORECASE)
YEAR_PATTERN = re.compile(r"\b(?:19|20)\d{2}\b")
METRIC_PATTERN = re.compile(r"\d+(?:\.\d+)?\s?%|\$\s?\d|\b\d+\s?\+|\b\d+[kKmM]\b")

# These match the section names our parser can detect (see SECTION_HEADERS in services/parsing.py)
EXPERIENCE_HEADERS = {"experience", "work experience", "employment history", "work history", "professional experience"}
EDUCATION_HEADERS = {"education"}
SKILLS_HEADERS = {"skills", "technical skills", "core competencies"}

MIN_WORDS = 200
MAX_WORDS = 1000


def has_phone(text: str) -> bool:
    for match in PHONE_CANDIDATE.finditer(text):
        digits = re.sub(r"\D", "", match.group())
        if not 10 <= len(digits) <= 13:
            continue
        # A run made only of years (e.g. "2018 2019 2020") is a date range, not a phone number
        groups = re.findall(r"\d+", match.group())
        if all(re.fullmatch(r"(?:19|20)\d{2}", g) for g in groups):
            continue
        return True
    return False


def has_section(sections: dict, names: set) -> bool:
    return any(name in names and content.strip() for name, content in sections.items())


def _check(label: str, passed, ok_message: str, fail_message: str) -> dict:
    return {
        "label": label,
        "passed": bool(passed),
        "message": ok_message if passed else fail_message,
    }


def run_ats_checks(text: str, sections: dict, skills: list) -> dict:
    words = len(text.split())

    checks = [
        _check("Email address", EMAIL_PATTERN.search(text),
               "Email address found.",
               "No email address found. Add one near the top."),
        _check("Phone number", has_phone(text),
               "Phone number found.",
               "No phone number found. Add one near the top."),
        _check("Profile link", LINK_PATTERN.search(text),
               "LinkedIn or GitHub link found.",
               "No LinkedIn or GitHub link found. Recruiters often look for one."),
        _check("Experience section", has_section(sections, EXPERIENCE_HEADERS),
               "Experience section detected.",
               "No standard experience heading detected. Use a plain heading such as 'Experience' or 'Work Experience'."),
        _check("Education section", has_section(sections, EDUCATION_HEADERS),
               "Education section detected.",
               "No standard education heading detected. Use a plain heading such as 'Education'."),
        _check("Skills section", has_section(sections, SKILLS_HEADERS),
               "Skills section detected.",
               "No standard skills heading detected. Add a plain 'Skills' section listing your tools and technologies."),
        _check("Length", MIN_WORDS <= words <= MAX_WORDS,
               f"About {words} words, a good length.",
               f"About {words} words. Aim for roughly {MIN_WORDS}-{MAX_WORDS} words (one to two pages)."),
        _check("Dates", len(YEAR_PATTERN.findall(text)) >= 2,
               "Dates found for your experience or education.",
               "Few dates found. Add start and end dates to jobs, projects and education."),
        _check("Measurable results", len(METRIC_PATTERN.findall(text)) >= 3,
               "Several measurable results found.",
               "Few numbers found. Add measurable results such as percentages, amounts or team sizes."),
        _check("Recognised skills", len(skills) >= 5,
               f"{len(skills)} skills recognised.",
               f"Only {len(skills)} recognised skills. List your key tools and technologies explicitly."),
    ]

    passed = sum(c["passed"] for c in checks)
    return {
        "ats_score": round(100 * passed / len(checks), 2),
        "checks": checks,
    }
