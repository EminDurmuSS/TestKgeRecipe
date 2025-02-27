from fastapi import APIRouter, HTTPException
from typing import List
import logging

from models.schemas import RecommendationRequest
from core.recommender import map_user_input_to_criteria, get_matching_recipes
from core.memory_utils import log_memory_usage, clean_memory

# Configure logging
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/recommend",
    tags=["recommendations"]
)

@router.post("", response_model=List[str])
async def recommend_recipes(request: RecommendationRequest):
    """
    Get recipe recommendations based on user preferences.
    
    Returns a list of recipe IDs matching the criteria.
    """
    try:
        logger.info(f"Received recommendation request with {len(request.diet_types)} diet types, "
                   f"{len(request.meal_type)} meal types, {len(request.ingredients)} ingredients")
        
        # Log memory usage at start of request
        log_memory_usage("before_recommendation")
        
        # Validate that at least one criterion is provided
        if not any([
            request.cooking_method,
            request.diet_types,
            request.meal_type,
            request.health_types,
            request.cuisine_region,
            request.ingredients
        ]):
            raise HTTPException(
                status_code=400,
                detail="At least one search criterion must be provided"
            )
        
        # Map user input to criteria
        criteria = map_user_input_to_criteria(
            cooking_method=request.cooking_method,
            diet_types=request.diet_types,
            meal_type=request.meal_type,
            health_types=request.health_types,
            cuisine_region=request.cuisine_region,
            ingredients=request.ingredients,
            weights=request.weights,
        )
        
        # Get matching recipes
        recipe_ids = get_matching_recipes(
            criteria=criteria, 
            top_k=request.top_k, 
            flexible=request.flexible
        )
        
        logger.info(f"Returning {len(recipe_ids)} recommendations")
        
        # Log memory usage at end of request
        log_memory_usage("after_recommendation")
        
        # Clean memory after the operation
        clean_memory()
        
        return recipe_ids
    
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    
    except Exception as e:
        logger.error(f"Error in recommendation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error generating recommendations: {str(e)}"
        )