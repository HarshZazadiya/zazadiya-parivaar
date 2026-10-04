import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routers import auth, family, admin, villages
from seed_data import seed_database
from logs.logging import logger

# Initialize FastAPI App
app = FastAPI(
    title="Zazadiya Parivaar Portal & Family Tree System",
    description="Official Portal for Zazadiya Parivaar Community (22 Villages & 1500+ Family Members)",
    version="1.0.0"
)

# Configure CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(family.router)
app.include_router(admin.router)
app.include_router(villages.router)


@app.on_event("startup")
def startup_db_init():
    try:
        logger.info("Initializing Zazadiya Parivaar database tables and seed data...")
        Base.metadata.create_all(bind=engine)
        seed_database()
        logger.info("Database initialization complete.")
    except Exception as e:
        logger.error(f"Error during startup db initialization: {e}")


@app.get("/")
async def root():
    return {
        "message": "Welcome to Zazadiya Parivaar Portal API",
        "blessing": "|| Shree Hanumanji Prasanna ||",
        "community": "Zazadiya Family Community (22 Villages)",
        "docs": "/docs"
    }


if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)