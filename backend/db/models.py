from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from db.database import Base

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    raw_text = Column(Text)
    sections_json = Column(Text)     # we'll store the sections dict as a JSON string
    skills_json = Column(Text)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())