from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import resume
from db.database import engine, Base
from db import models   # ensures the Resume model is registered before create_all runs

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(resume.router)
Base.metadata.create_all(bind=engine)
@app.get("/")
def health_check():
    return {"status": "backend is alive"}

@app.get("/ping")
def ping():
    return {"message": "pong"}