import os
import re
import pandas as pd
import logging
from pathlib import Path
from typing import Counter, List, Dict, Any, Optional
from functools import lru_cache

# Configure logging
logger = logging.getLogger(__name__)

# Path configuration
BASE_DIR = Path(__file__).resolve().parent  
CSV_PATH = BASE_DIR / "data" / "dataFullLargerRegionAndCountryWithServingsBin.csv"

@lru_cache(maxsize=1)
def load_recipes_df() -> pd.DataFrame:
    """
    Load recipes DataFrame from CSV file (cached for performance).
    """
    if not CSV_PATH.exists():
        raise FileNotFoundError(f"CSV not found at {CSV_PATH}")
    
    try:
        logger.info(f"Loading recipes from {CSV_PATH}")
        df = pd.read_csv(CSV_PATH)
        logger.info(f"Loaded {len(df)} recipes with {len(df.columns)} attributes")
        return df
    except Exception as e:
        logger.error(f"Failed to load recipes: {str(e)}")
        raise

# Initialize recipes_df at module level
try:
    recipes_df = load_recipes_df()
except Exception as e:
    logger.error(f"Error initializing recipes_df: {str(e)}")
    recipes_df = pd.DataFrame()  # Fallback empty DataFrame

def get_unique_ingredients() -> List[str]:
    """
    Extract ingredients from the 'BestUsdaIngredientName' column.
    Preserves ingredient names separated by semicolons.
    
    Ingredients are sorted first by frequency (descending) then alphabetically.
    """
    if "BestUsdaIngredientName" not in recipes_df.columns:
        logger.warning("'BestUsdaIngredientName' column not found in DataFrame.")
        return []
    
    logger.info("Retrieving ingredients along with their frequency.")
    
    # Use list comprehension to get all ingredient names at once
    ingredients = [
        part.strip()
        for ing_str in recipes_df["BestUsdaIngredientName"].dropna()
        for part in str(ing_str).split(';')
        if part.strip() and part.strip().lower() not in {"unknown", "nan"}
    ]
    
    # Count ingredient frequencies
    counter = Counter(ingredients)
    
    logger.info(f"{len(counter)} unique ingredients found.")
    
    # Sort by frequency (descending) and then alphabetically
    return sorted(counter.keys(), key=lambda ing: (-counter[ing], ing))

def load_recipes_from_dataframe(df: pd.DataFrame) -> Dict[Any, Dict[str, Any]]:
    """
    Extract relevant columns from DataFrame into a dictionary keyed by RecipeId.
    """
    columns_to_keep = [
        "RecipeId",
        "Cooking_Method",
        "Diet_Types",
        "meal_type",
        "Healthy_Type",
        "CuisineRegion",
        "BestUsdaIngredientName",
    ]
    missing = set(columns_to_keep) - set(df.columns)
    if missing:
        raise ValueError(f"Missing required columns in DataFrame: {missing}")

    recipes = {}
    for _, row in df.iterrows():
        recipe_id = row["RecipeId"]
        recipe_data = {col: row[col] for col in columns_to_keep}
        recipes[recipe_id] = recipe_data
    
    return recipes