import gc
import logging
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import recipe_info, recommend, unique_items

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Import for model preloading
from core.memory_utils import log_memory_usage
from core.model_manager import model_manager


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Load model and triples
    try:
        logger.info("Preloading model and triples during startup...")
        # Preload model and triples by accessing them once
        model_manager.get_model_and_triples()
        logger.info("Model and triples preloaded successfully")
        log_memory_usage("after_preload")
    except Exception as e:
        logger.error(f"Error preloading model: {str(e)}", exc_info=True)

    yield  # This is where FastAPI serves requests

    # Shutdown: Clean up resources
    logger.info("Shutting down, cleaning up resources...")
    # Clear memory
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()


app = FastAPI(
    title="Food Recommendation API",
    description="API for food recipe recommendations using knowledge graph embeddings",
    version="1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only – restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers WITHOUT the prefix to match the frontend's expectations
app.include_router(recommend.router, tags=["recommendations"])
app.include_router(unique_items.router, tags=["ingredients"])
app.include_router(recipe_info.router, tags=["recipes"])


@app.get("/", tags=["health"])
def root():
    """Health check endpoint"""
    return {"message": "Hello! This is the KG-based Food Recommendation API."}


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Food Recommendation API")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
