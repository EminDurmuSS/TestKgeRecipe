from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class WeightConfig(BaseModel):
    """Configuration for criteria importance weights"""
    cooking_method: float = Field(1.0, description="Weight for cooking method")
    cuisine_region: float = Field(1.0, description="Weight for cuisine region")
    diet_types: float = Field(1.0, description="Weight for diet types")
    meal_type: float = Field(1.0, description="Weight for meal type")
    ingredients: float = Field(1.0, description="Weight for ingredients")
    healthy_type: float = Field(1.0, description="Weight for health attributes")

class RecommendationRequest(BaseModel):
    """Request model for recipe recommendations"""
    cooking_method: Optional[str] = None
    diet_types: List[str] = []
    meal_type: List[str] = []
    health_types: List[str] = []
    cuisine_region: Optional[str] = None
    ingredients: List[str] = []
    weights: Dict[str, float] = {}
    top_k: int = Field(5, ge=1, le=50)
    flexible: bool = False

    # Updated config style for Pydantic V2
    model_config = {
        "json_schema_extra": {
            "example": {
                "cooking_method": "oven",
                "diet_types": ["Vegetarian"],
                "meal_type": ["dinner"],
                "health_types": ["Low Carb", "High Protein"],
                "cuisine_region": "Mediterranean Europe",
                "ingredients": ["tomato", "mozzarella"],
                "weights": {
                    "cooking_method": 1.0,
                    "cuisine_region": 2.0,
                    "diet_types": 3.0,
                    "ingredients": 1.5
                },
                "top_k": 5,
                "flexible": True
            }
        }
    }

class RecipeInfo(BaseModel):
    """Recipe information model"""
    RecipeId: int
    Name: Optional[str] = None
    Description: Optional[str] = None
    meal_type: Optional[str] = None
    Diet_Types: Optional[str] = None
    Healthy_Type: Optional[str] = None
    CuisineRegion: Optional[str] = None
    Cooking_Method: Optional[str] = None
    RecipeIngredientParts: Optional[str] = None
    BestUsdaIngredientName: Optional[str] = None
    ScrapedIngredients: Optional[str] = None
    RecipeInstructions: Optional[str] = None
    Calories: Optional[float] = None
    ProteinContent: Optional[float] = None
    CarbohydrateContent: Optional[float] = None
    FatContent: Optional[float] = None
    CholesterolContent: Optional[float] = None
    SodiumContent: Optional[float] = None
    SugarContent: Optional[float] = None
    FiberContent: Optional[float] = None