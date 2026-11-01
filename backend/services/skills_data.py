# canonical name -> aliases (all matched case-insensitively)
SKILLS = {
    # Languages
    "kotlin": [], "flutter": ["dart"],
    "python": [], "java": [], "javascript": ["js", "ecmascript"],
    "typescript": [], "c++": ["cpp"], "c#": ["csharp"], "golang": [],
    "bash": ["shell scripting"], "sql": [], "nosql": [],
    "html": ["html5"], "css": ["css3"],
    # Web / backend
    "react": ["react.js", "reactjs"], "node.js": ["nodejs"],
    "express": ["express.js", "expressjs"], "fastapi": [], "django": [],
    "flask": [], "spring boot": ["springboot"],
    "rest api": ["restful", "rest apis", "restful api", "restful apis"],
    "grpc": [], "graphql": [], "kafka": ["apache kafka"],
    # Data / ML
    "pandas": [], "numpy": [], "scikit-learn": ["sklearn", "scikit learn"],
    "tensorflow": [], "pytorch": [], "keras": [], "matplotlib": [], "seaborn": [],
    "machine learning": ["ml"], "deep learning": [],
    "nlp": ["natural language processing"], "computer vision": [],
    "data analysis": ["data analytics"], "statistics": [], "spacy": [],
    "hugging face": ["huggingface"], "llm": ["large language models"], "rag": [],
    # Databases
    "mysql": [], "postgresql": ["postgres"], "mongodb": ["mongo"], "redis": [],
    "sqlite": [], "dynamodb": ["amazon dynamodb"], "elasticsearch": [],
    # Cloud / DevOps / tools
    "docker": [], "kubernetes": ["k8s"], "aws": ["amazon web services"],
    "azure": [], "gcp": ["google cloud"], "git": [], "github": [],
    "github actions": [], "ci/cd": ["cicd", "continuous integration"],
    "linux": [], "jenkins": [], "terraform": [],
    # Testing
    "pytest": [], "junit": [], "unit testing": ["unit tests"], "jest": [],
    # Practices / soft skills
    "agile": [], "scrum": [], "code review": ["code reviews"], "debugging": [],
    "communication": [], "leadership": [], "teamwork": ["team work"],
    "project management": [], "problem solving": [],
}

# Aliases that are ordinary words in other casings: match this exact casing only
CASE_SENSITIVE_ALIASES = {
    "rest api": ["REST"],
}