import os
import ast
import torch
import pandas as pd
import numpy as np
import logging
from pathlib import Path
from typing import List, Tuple, Optional

from pykeen.models import Model
from pykeen.triples import TriplesFactory

# Configure logging
logger = logging.getLogger(__name__)

# Constants
UNKNOWN_PLACEHOLDER = "unknown"

# Path configuration
# Güncelleme: Artık dosya backend klasörünün altındadır.
# __file__ 'in bulunduğu dizinden bir üst (backend) dizine çıkıyoruz.
BASE_DIR = Path(__file__).resolve().parent  
MODEL_PATH = BASE_DIR / "embedding" / "trained_model.pkl"
TRIPLES_PATH = BASE_DIR / "data" / "triples_new_without_ct_ss.csv"

def tuple_to_canonical(s: str) -> str:
    """
    Converts a string tuple representation into canonical format.
    Example: "('meal_type', 'dinner')" -> "meal_type_dinner"
    """
    try:
        t = ast.literal_eval(s)
        if not isinstance(t, tuple) or len(t) != 2:
            logger.warning(f"Expected tuple of length 2, got: {s}")
            return s
        return f"{t[0]}_{t[1]}"
    except Exception as e:
        logger.error(f"Error converting tuple '{s}': {str(e)}")
        return s

def load_kge_model() -> Model:
    """Load the knowledge graph embedding model from disk."""
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")

    try:
        logger.info(f"Loading KGE model from {MODEL_PATH}")
        return torch.load(
            MODEL_PATH,
            map_location=torch.device("cpu"),
            weights_only=False,
        )
    except Exception as e:
        logger.error(f"Failed to load model: {str(e)}")
        raise

def get_triples_factory() -> TriplesFactory:
    """Create a TriplesFactory from the triples CSV file."""
    if not TRIPLES_PATH.exists():
        raise FileNotFoundError(f"Triples file not found: {TRIPLES_PATH}")
    
    try:
        logger.info(f"Loading triples from {TRIPLES_PATH}")
        df = pd.read_csv(TRIPLES_PATH)
        
        # Convert each Head, Relation, Tail string into a standardized format
        triples = []
        for h, r, t in df[["Head", "Relation", "Tail"]].values:
            ch = tuple_to_canonical(h)
            cr = r.strip()
            ct = tuple_to_canonical(t)
            triples.append((ch, cr, ct))
        
        logger.info(f"Loaded {len(triples)} triples")
        return TriplesFactory.from_labeled_triples(
            triples=np.array(triples, dtype=str), 
            create_inverse_triples=False
        )
    except Exception as e:
        logger.error(f"Failed to create triples factory: {str(e)}")
        raise

def map_health_attribute(element: str) -> str:
    """Map health attribute string to a relation name."""
    e = element.lower()
    if "protein" in e:
        return "HasProteinLevel"
    elif "carb" in e:
        return "HasCarbLevel"
    elif "fat" in e and "saturated" not in e:
        return "HasFatLevel"
    elif "saturated_fat" in e:
        return "HasSaturatedFatLevel"
    elif "calorie" in e:
        return "HasCalorieLevel"
    elif "sodium" in e:
        return "HasSodiumLevel"
    elif "sugar" in e:
        return "HasSugarLevel"
    elif "fiber" in e:
        return "HasFiberLevel"
    elif "cholesterol" in e:
        return "HasCholesterolLevel"
    else:
        return "HasHealthAttribute"

def split_and_clean(value: str, delimiter: str) -> List[str]:
    """Split string by delimiter and return non-empty trimmed values."""
    return [v.strip() for v in value.split(delimiter) if v.strip()]

# Lazy loading of model and triples factory
_model = None
_triples_factory = None

def get_model():
    """Get KGE model with lazy loading."""
    global _model
    if _model is None:
        _model = load_kge_model().eval()
    return _model

def get_triples():
    """Get triples factory with lazy loading."""
    global _triples_factory
    if _triples_factory is None:
        _triples_factory = get_triples_factory()
    return _triples_factory
