from fastapi import APIRouter, HTTPException
from typing import List
import logging

from core.data_loading import get_unique_ingredients
from core.memory_utils import clean_memory

# Configure logging
logger = logging.getLogger(__name__)

# Remove the prefix
router = APIRouter(
    tags=["ingredients"]
)

# Change the endpoint path
@router.get("/unique_ingredients", response_model=List[str])
async def get_ingredients():
    """
    Get a list of all unique ingredients sorted by frequency.
    
    Returns a list of ingredient names sorted by frequency (descending).
    If frequencies are equal, sorts alphabetically.
    """
    try:
        logger.info("Processing request for unique ingredients")
        ingredients = get_unique_ingredients()
        logger.info(f"Returning {len(ingredients)} unique ingredients")
        
        # Clean memory after the operation
        clean_memory()
        
        return ingredients
    
    except Exception as e:
        logger.error(f"Error getting unique ingredients: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving ingredients: {str(e)}"
        )