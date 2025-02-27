from fastapi import APIRouter, HTTPException, Path
from typing import Dict, Any
import logging

from core.recommender import fetch_recipe_info
from core.memory_utils import clean_memory

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    tags=["recipes"]
)

@router.get("/recipe/{recipe_id}", response_model=Dict[str, Any])
async def get_recipe_by_id(
    recipe_id: str = Path(..., description="Recipe identifier")
):
    """
    Get detailed information about a specific recipe.
    """
    try:
        logger.info(f"Fetching recipe info for ID: {recipe_id}")
        info = fetch_recipe_info(recipe_id)
        
        if not info:
            logger.warning(f"Recipe not found: {recipe_id}")
            raise HTTPException(
                status_code=404, 
                detail=f"Recipe with ID {recipe_id} not found"
            )
        
        logger.info(f"Returning recipe info: {info.get('Name', recipe_id)}")
        
        # Clean memory after the operation
        clean_memory()
        
        return info
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        logger.error(f"Error fetching recipe {recipe_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error retrieving recipe: {str(e)}"
        )