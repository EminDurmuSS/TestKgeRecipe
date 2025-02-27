import numpy as np
import networkx as nx
import pandas as pd
import pickle
import logging
from typing import Dict, Tuple, List, Any
from pathlib import Path

from .utils import UNKNOWN_PLACEHOLDER, map_health_attribute, split_and_clean

# Configure logging
logger = logging.getLogger(__name__)

def create_graph_and_triples(
    recipes: Dict[Any, Dict[str, Any]]
) -> Tuple[nx.DiGraph, np.ndarray]:
    """
    Build a directed knowledge graph (KG) and extract triples from recipe data.
    
    Returns:
        Knowledge graph and triples array
    """
    logger.info(f"Creating knowledge graph from {len(recipes)} recipes")
    G = nx.DiGraph()
    triples = []

    # Single–value attributes mapping
    attribute_mappings = {
        "Cooking_Method": ("usesCookingMethod", "cooking_method"),
        "CuisineRegion": ("hasCuisineRegion", "cuisine_region"),
    }

    # List–based attributes mapping
    list_attributes = {
        "Diet_Types": ("hasDietType", "diet_type", ","),
        "meal_type": ("isForMealType", "meal_type", ","),
    }

    # Ingredient relation configuration
    ingredient_relation = "containsIngredient"
    ingredient_node_type = "ingredient"
    ingredient_delimiter = ";"  # semicolon–delimited

    for recipe_id, details in recipes.items():
        recipe_node = ("recipe", recipe_id)
        G.add_node(recipe_node, type="recipe", RecipeId=recipe_id)
        
        # Process single–value attributes
        for col, (relation, node_type) in attribute_mappings.items():
            element = details.get(col, None)
            if element and element != UNKNOWN_PLACEHOLDER and str(element).strip() != "":
                element_clean = str(element).strip()
                node_id = (node_type, element_clean)
                if not G.has_node(node_id):
                    G.add_node(node_id, type=node_type, label=element_clean)
                G.add_edge(recipe_node, node_id, relation=relation)
                triples.append((str(recipe_node), relation, str(node_id)))

        # Process Healthy_Type attributes
        healthy = details.get("Healthy_Type", None)
        if healthy and healthy != UNKNOWN_PLACEHOLDER and str(healthy).strip() != "":
            healthy_elements = split_and_clean(str(healthy), ",")
            for element in healthy_elements:
                if element:
                    relation = map_health_attribute(element)
                    node_id = ("health_attribute", element)
                    if not G.has_node(node_id):
                        G.add_node(node_id, type="health_attribute", label=element)
                    G.add_edge(recipe_node, node_id, relation=relation)
                    triples.append((str(recipe_node), relation, str(node_id)))

        # Process list–based attributes
        for col, (relation, node_type, delimiter) in list_attributes.items():
            value = details.get(col, None)
            if value and value != UNKNOWN_PLACEHOLDER and str(value).strip() != "":
                elements = split_and_clean(str(value), delimiter)
                for element in elements:
                    if element:
                        node_id = (node_type, element)
                        if not G.has_node(node_id):
                            G.add_node(node_id, type=node_type, label=element)
                        G.add_edge(recipe_node, node_id, relation=relation)
                        triples.append((str(recipe_node), relation, str(node_id)))

        # Process ingredients
        best_usda = details.get("BestUsdaIngredientName", None)
        if best_usda and best_usda != UNKNOWN_PLACEHOLDER and str(best_usda).strip() != "":
            ingredients = split_and_clean(str(best_usda), ingredient_delimiter)
            for ingredient in ingredients:
                if ingredient:
                    node_id = ("ingredient", ingredient.lower())
                    if not G.has_node(node_id):
                        G.add_node(node_id, type=ingredient_node_type, label=ingredient)
                    G.add_edge(recipe_node, node_id, relation=ingredient_relation)
                    triples.append((str(recipe_node), ingredient_relation, str(node_id)))

    triples_array = np.array(triples, dtype=str)
    logger.info(f"Created graph with {len(G.nodes())} nodes, {len(G.edges())} edges")
    return G, triples_array

def save_triples(triples_array: np.ndarray, file_path: str) -> None:
    """Save triples to a CSV file."""
    try:
        logger.info(f"Saving {len(triples_array)} triples to {file_path}")
        df = pd.DataFrame(triples_array, columns=["Head", "Relation", "Tail"])
        df.to_csv(file_path, index=False)
        logger.info(f"Triples saved successfully")
    except Exception as e:
        logger.error(f"Error saving triples: {str(e)}")
        raise

def save_graph(G: nx.DiGraph, file_path: str) -> None:
    """Save graph to a pickle file."""
    try:
        logger.info(f"Saving graph with {len(G.nodes())} nodes to {file_path}")
        with open(file_path, "wb") as f:
            pickle.dump(G, f)
        logger.info(f"Graph saved successfully")
    except Exception as e:
        logger.error(f"Error saving graph: {str(e)}")
        raise