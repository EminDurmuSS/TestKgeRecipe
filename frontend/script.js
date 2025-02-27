const API_URL = "http://localhost:8000";

// DOMContentLoaded: Initialize event listeners and components
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOMContentLoaded: Starting...");
  setupEventListeners();
  loadIngredients();
  initializeWeightSliders();
  initializeTooltips();
});

// Set up event listeners for form submission and other input elements
function setupEventListeners() {
  console.log("Setting up event listeners.");
  // Form submission event
  const recipeForm = document.getElementById("recipe-form");
  recipeForm.addEventListener("submit", handleFormSubmit);

  // Results number slider
  const numResultsSlider = document.getElementById("num-results");
  const numResultsValue = document.getElementById("num-results-value");
  numResultsSlider.addEventListener("input", () => {
    numResultsValue.textContent = numResultsSlider.value;
    console.log("Results number slider updated:", numResultsSlider.value);
  });

  // Real-time validation for required select fields
  const requiredSelects = document.querySelectorAll("select[required]");
  requiredSelects.forEach((select) => {
    select.addEventListener("change", () => {
      validateSelect(select);
      console.log("Select changed:", select.id, select.value);
    });
  });

  // Monitor all select elements for changes to update criteria summary
  const allSelects = document.querySelectorAll("select");
  allSelects.forEach((select) => {
    select.addEventListener("change", updateCriteriaSummary);
  });

  // Modify criteria button
  const modifyCriteriaBtn = document.getElementById("modify-criteria");
  if (modifyCriteriaBtn) {
    modifyCriteriaBtn.addEventListener("click", () => {
      document
        .getElementById("search-form-card")
        .scrollIntoView({ behavior: "smooth" });
    });
  }

  // Clear criteria button
  const clearCriteriaBtn = document.getElementById("clear-criteria");
  if (clearCriteriaBtn) {
    clearCriteriaBtn.addEventListener("click", clearAllCriteria);
  }
}

// Initialize weight sliders
function initializeWeightSliders() {
  console.log("Initializing weight sliders.");
  const weightSliders = [
    { id: "weight-cooking", label: "cooking_method" },
    { id: "weight-cuisine", label: "cuisine_region" },
    { id: "weight-diet", label: "diet_types" },
    { id: "weight-ingredients", label: "ingredients" },
  ];

  weightSliders.forEach(({ id, label }) => {
    const slider = document.getElementById(id);
    const value = document.getElementById(`${id}-value`);
    if (slider && value) {
      slider.addEventListener("input", () => {
        value.textContent = parseFloat(slider.value).toFixed(1);
        console.log(`Slider ${id} updated:`, slider.value);
      });
    }
  });
}

// Initialize Bootstrap tooltips
function initializeTooltips() {
  console.log("Initializing tooltips.");
  const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
  tooltips.forEach((tooltip) => {
    new bootstrap.Tooltip(tooltip);
  });
}

// Load ingredients from the API and add them to the corresponding select element
async function loadIngredients() {
  console.log("Loading ingredients from API...");
  try {
    const response = await fetch(`${API_URL}/unique_ingredients`);
    if (!response.ok) {
      throw new Error("Ingredients could not be retrieved");
    }
    const ingredients = await response.json();
    console.log("Ingredients retrieved:", ingredients.length);

    const select = document.getElementById("ingredients");
    select.innerHTML = ""; // Clear existing options

    // Sort and format each ingredient option
    ingredients.forEach((ingredient) => {
      const option = document.createElement("option");
      option.value = ingredient;
      option.textContent = ingredient
        .toLowerCase()
        .split(",")
        .map((word) => word.trim())
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(", ");
      select.appendChild(option);
    });

    // Setup ingredient search once ingredients are loaded
    setupIngredientSearch();
  } catch (error) {
    console.error("Error while loading ingredients:", error);
    showToast(
      "Ingredients could not be loaded. Please try again later.",
      "error"
    );
  }
}

// Set up ingredient search functionality
function setupIngredientSearch() {
  console.log("Setting up ingredient search.");
  const searchInput = document.getElementById("ingredient-search");
  const ingredientSelect = document.getElementById("ingredients");

  if (searchInput && ingredientSelect) {
    searchInput.addEventListener("input", (e) => {
      const searchTerm = e.target.value.toLowerCase();
      const options = ingredientSelect.options;
      for (let option of options) {
        const text = option.text.toLowerCase();
        option.style.display = text.includes(searchTerm) ? "" : "none";
      }
      console.log("Search term:", searchTerm);
    });
  }
}

// Update the criteria summary based on selected options
function updateCriteriaSummary() {
  console.log("Updating criteria summary.");
  const criteriaSelected = getFormData();

  // Check if any criteria are selected
  const hasCriteria =
    criteriaSelected.cooking_method ||
    criteriaSelected.cuisine_region ||
    criteriaSelected.diet_types.length > 0 ||
    criteriaSelected.meal_type.length > 0 ||
    criteriaSelected.health_types.length > 0 ||
    criteriaSelected.ingredients.length > 0;

  // Show or hide criteria summary based on selection
  const criteriaSummary = document.getElementById("criteria-summary");
  criteriaSummary.style.display = hasCriteria ? "block" : "none";

  if (!hasCriteria) return;

  // Update cooking method tags
  updateCriteriaTags(
    "cooking-method-tags",
    [criteriaSelected.cooking_method].filter(Boolean),
    "cooking-method"
  );

  // Update cuisine region tags
  updateCriteriaTags(
    "cuisine-region-tags",
    [criteriaSelected.cuisine_region].filter(Boolean),
    "cuisine-region"
  );

  // Update diet type tags
  updateCriteriaTags(
    "diet-types-tags",
    criteriaSelected.diet_types,
    "diet-types"
  );

  // Update meal type tags
  updateCriteriaTags(
    "meal-types-tags",
    criteriaSelected.meal_type,
    "meal-types"
  );

  // Update ingredient tags
  updateCriteriaTags(
    "ingredients-tags",
    criteriaSelected.ingredients,
    "ingredients"
  );

  // Update nutrition tags
  updateCriteriaTags(
    "nutrition-tags",
    criteriaSelected.health_types,
    "nutrition"
  );
}

// Update tags for a specific criteria group
function updateCriteriaTags(containerId, values, criteria) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  if (values.length === 0) {
    container.innerHTML = '<span class="text-muted">None selected</span>';
    return;
  }

  values.forEach((value) => {
    const tag = document.createElement("div");
    tag.className = "criteria-tag";
    tag.innerHTML = `
      ${value}
      <i class="fas fa-times-circle remove-criteria" data-criteria="${criteria}" data-value="${value}"></i>
    `;

    // Add event listener to remove tag
    const removeIcon = tag.querySelector(".remove-criteria");
    removeIcon.addEventListener("click", function () {
      removeCriteria(this.dataset.criteria, this.dataset.value);
    });

    container.appendChild(tag);
  });
}

// Remove a specific criteria value
function removeCriteria(criteria, value) {
  console.log(`Removing criteria: ${criteria}, value: ${value}`);

  // Handle different select elements
  let selectId;

  switch (criteria) {
    case "cooking-method":
      selectId = "cooking-method";
      break;
    case "cuisine-region":
      selectId = "cuisine-region";
      break;
    case "diet-types":
      selectId = "diet-types";
      break;
    case "meal-types":
      selectId = "meal-types";
      break;
    case "ingredients":
      selectId = "ingredients";
      break;
    case "nutrition":
      // For nutrition, we need to identify which specific select to update
      if (value.includes("Protein")) {
        selectId = "protein-level";
      } else if (value.includes("Carb")) {
        selectId = "carb-level";
      } else if (value.includes("Fat") && !value.includes("Saturated")) {
        selectId = "fat-level";
      } else if (value.includes("Calorie")) {
        selectId = "calorie-level";
      } else if (value.includes("Cholesterol")) {
        selectId = "cholesterol-level";
      } else if (value.includes("Sugar")) {
        selectId = "sugar-level";
      }
      break;
  }

  if (selectId) {
    const select = document.getElementById(selectId);
    if (select) {
      // Deselect the option
      for (let option of select.options) {
        if (option.value === value) {
          option.selected = false;
          break;
        }
      }
      // Trigger change event to update the summary
      select.dispatchEvent(new Event("change"));
    }
  }
}

// Clear all selected criteria
function clearAllCriteria() {
  console.log("Clearing all criteria.");

  const selects = [
    "cooking-method",
    "cuisine-region",
    "diet-types",
    "meal-types",
    "ingredients",
    "protein-level",
    "carb-level",
    "fat-level",
    "calorie-level",
    "cholesterol-level",
    "sugar-level",
  ];

  selects.forEach((id) => {
    const select = document.getElementById(id);
    if (select) {
      for (let option of select.options) {
        option.selected = false;
      }
      select.dispatchEvent(new Event("change"));
    }
  });

  // Hide criteria summary
  document.getElementById("criteria-summary").style.display = "none";

  // Reset weights to default
  const weightSliders = [
    "weight-cooking",
    "weight-cuisine",
    "weight-diet",
    "weight-ingredients",
  ];

  weightSliders.forEach((id) => {
    const slider = document.getElementById(id);
    if (slider) {
      slider.value = 1;
      const valueDisplay = document.getElementById(`${id}-value`);
      if (valueDisplay) {
        valueDisplay.textContent = "1.0";
      }
    }
  });

  // Reset number of results
  const numResults = document.getElementById("num-results");
  if (numResults) {
    numResults.value = 5;
    const valueDisplay = document.getElementById("num-results-value");
    if (valueDisplay) {
      valueDisplay.textContent = "5";
    }
  }

  // Reset flexible matching
  const flexibleMatching = document.getElementById("flexible-matching");
  if (flexibleMatching) {
    flexibleMatching.checked = false;
  }

  // Hide results section if visible
  const resultsSection = document.getElementById("results-section");
  if (resultsSection) {
    resultsSection.style.display = "none";
  }

  showToast("All criteria have been cleared", "info");
}

// When the form is submitted
async function handleFormSubmit(event) {
  event.preventDefault();
  console.log("Form submitted. Collecting form data...");

  // Show loading state on the submit button
  const submitButton = event.target.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  submitButton.innerHTML = '<span class="loading"></span> Finding Recipes...';
  submitButton.disabled = true;

  try {
    const formData = getFormData();
    console.log("Form data:", formData);

    // Check if at least one search criterion is provided
    if (!validateFormData(formData)) {
      throw new Error("Please fill in at least one search criterion");
    }

    const recipes = await getRecommendations(formData);
    console.log("Retrieved recipe IDs:", recipes);
    displayResults(recipes);

    // Scroll to the results section
    document
      .getElementById("results-section")
      .scrollIntoView({ behavior: "smooth" });
  } catch (error) {
    console.error("Error while retrieving recommendations:", error);
    showToast(error.message, "error");
  } finally {
    // Restore the submit button to its original state
    submitButton.innerHTML = originalButtonText;
    submitButton.disabled = false;
  }
}

// Check if the form data is valid
function validateFormData(formData) {
  const valid =
    formData.cooking_method ||
    formData.diet_types.length > 0 ||
    formData.meal_type.length > 0 ||
    formData.health_types.length > 0 ||
    formData.cuisine_region ||
    formData.ingredients.length > 0;
  console.log("Are the form data valid?:", valid);
  return valid;
}

// Collect form data
function getFormData() {
  return {
    cooking_method: getSelectedValues("cooking-method")[0] || "",
    diet_types: getSelectedValues("diet-types"),
    meal_type: getSelectedValues("meal-types"),
    health_types: [
      ...getSelectedValues("protein-level"),
      ...getSelectedValues("carb-level"),
      ...getSelectedValues("fat-level"),
      ...getSelectedValues("calorie-level"),
      ...getSelectedValues("cholesterol-level"),
      ...getSelectedValues("sugar-level"),
    ],
    cuisine_region: getSelectedValues("cuisine-region")[0] || "",
    ingredients: getSelectedValues("ingredients"),
    weights: {
      cooking_method: parseFloat(
        document.getElementById("weight-cooking").value
      ),
      cuisine_region: parseFloat(
        document.getElementById("weight-cuisine").value
      ),
      diet_types: parseFloat(document.getElementById("weight-diet").value),
      ingredients: parseFloat(
        document.getElementById("weight-ingredients").value
      ),
    },
    top_k: parseInt(document.getElementById("num-results").value),
    flexible: document.getElementById("flexible-matching").checked,
  };
}

// Get the selected values from a given select element
function getSelectedValues(elementId) {
  const element = document.getElementById(elementId);
  return element
    ? Array.from(element.selectedOptions).map((option) => option.value)
    : [];
}

// Request recommended recipes based on form data
async function getRecommendations(formData) {
  console.log("Requesting recommendations. Form data:", formData);
  const response = await fetch(`${API_URL}/recommend`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error("Recommendation API error response:", errorData);
    throw new Error(
      errorData.detail || "Recommendations could not be retrieved"
    );
  }

  const data = await response.json();
  console.log("Recommendation data received:", data);
  return data;
}

// Display recipe results
function displayResults(recipeIds) {
  console.log("Displaying recipe results:", recipeIds);
  const resultsSection = document.getElementById("results-section");
  const recipeList = document.getElementById("recipe-list");

  recipeList.innerHTML = ""; // Clear previous results

  if (recipeIds.length === 0) {
    recipeList.innerHTML = `
      <div class="alert alert-info">
        <i class="fas fa-info-circle me-2"></i>
        No recipes match your criteria. Please adjust your filters.
      </div>
    `;
    resultsSection.style.display = "block";
    return;
  }

  recipeIds.forEach((id, index) => {
    // Create recipe card
    const recipeCard = document.createElement("div");
    recipeCard.className = "recipe-item";
    recipeCard.innerHTML = `
      <div class="recipe-number">${index + 1}</div>
      <div class="recipe-name">Recipe #${id}</div>
      <div class="recipe-tags">
        <span class="recipe-tag"><i class="fas fa-utensils me-1"></i> Click for details</span>
      </div>
    `;

    recipeCard.addEventListener("click", () => {
      console.log("Recipe clicked. ID:", id);
      showRecipeDetails(id);
    });

    recipeList.appendChild(recipeCard);
  });

  resultsSection.style.display = "block";
}

// Fetch details for the specified recipe ID and display in a modal
async function showRecipeDetails(recipeId) {
  console.log("Fetching details. Recipe ID:", recipeId);
  try {
    const response = await fetch(`${API_URL}/recipe/${recipeId}`);
    if (!response.ok) {
      throw new Error("Recipe details could not be retrieved");
    }
    const recipe = await response.json();
    console.log("Recipe details retrieved:", recipe);
    displayRecipeModal(recipe);
  } catch (error) {
    console.error("Error while fetching recipe details:", error);
    showToast("Recipe details could not be loaded. Please try again.", "error");
  }
}

// Render the ingredient list (supports string or array format)
function renderIngredientList(ingredientData, delimiter = ",") {
  if (!ingredientData) {
    return '<li><i class="fas fa-exclamation-circle text-muted"></i> No ingredients listed</li>';
  }

  let ingredients = [];
  if (Array.isArray(ingredientData)) {
    ingredients = ingredientData;
  } else {
    ingredients = ingredientData.split(delimiter);
  }

  return ingredients
    .map((ing) => ing.trim())
    .filter((ing) => ing.length > 0)
    .map((ing) => `<li><i class="fas fa-check"></i> ${ing}</li>`)
    .join("");
}

// Display recipe details in a modal
function displayRecipeModal(recipe) {
  console.log("Recipe details for modal:", recipe);
  const detailsContainer = document.getElementById("recipe-details");

  // Construct meal type information
  let mealTypes = "Not specified";
  if (recipe.meal_type) {
    if (Array.isArray(recipe.meal_type)) {
      mealTypes = recipe.meal_type
        .map(
          (type) =>
            `<span class="badge bg-success me-1 mb-1">${type.trim()}</span>`
        )
        .join(" ");
    } else if (typeof recipe.meal_type === "string") {
      mealTypes = recipe.meal_type
        .split(",")
        .map(
          (type) =>
            `<span class="badge bg-success me-1 mb-1">${type.trim()}</span>`
        )
        .join(" ");
    }
  }
  console.log("Meal types to display:", mealTypes);

  // Get healthy types from "health_type" or "Healthy_Type"
  const healthyTypes = recipe.health_type || recipe.Healthy_Type || "";
  const healthyTypesContent = healthyTypes
    ? healthyTypes
        .split(",")
        .map(
          (ht) => `<span class="badge bg-info me-1 mb-1">${ht.trim()}</span>`
        )
        .join(" ")
    : "Not specified";

  // Build the content
  const content = `
    <div class="recipe-details">
      <h3>${recipe.Name || `Recipe #${recipe.RecipeId}`}</h3>
      ${
        recipe.Description
          ? `<div class="alert alert-light">${recipe.Description}</div>`
          : ""
      }
      
      <!-- Recipe Information Cards -->
      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card recipe-info-card">
            <div class="card-body">
              <h4><i class="fas fa-fire"></i> Cooking Information</h4>
              <ul>
                <li>
                  <i class="fas fa-fire-burner"></i>
                  <strong>Cooking Method:</strong> ${
                    recipe.Cooking_Method || "Not specified"
                  }
                </li>
                <li>
                  <i class="fas fa-globe-americas"></i>
                  <strong>Cuisine Region:</strong> ${
                    recipe.CuisineRegion || "Not specified"
                  }
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        <div class="col-md-6">
          <div class="card recipe-info-card">
            <div class="card-body">
              <h4><i class="fas fa-utensils"></i> Diet Information</h4>
              <ul>
                <li>
                  <i class="fas fa-clock"></i>
                  <strong>Meal Types:</strong>
                  <div class="mt-1">${mealTypes}</div>
                </li>
                <li>
                  <i class="fas fa-carrot"></i>
                  <strong>Diet Types:</strong> 
                  <div class="mt-1">
                  ${
                    recipe.Diet_Types
                      ? recipe.Diet_Types.split(",")
                          .map(
                            (type) =>
                              `<span class="badge bg-primary me-1 mb-1">${type.trim()}</span>`
                          )
                          .join(" ")
                      : "Not specified"
                  }
                  </div>
                </li>
                <li>
                  <i class="fas fa-heartbeat"></i>
                  <strong>Healthy Types:</strong>
                  <div class="mt-1">
                    ${healthyTypesContent}
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Nutrition Facts -->
      <h4><i class="fas fa-chart-pie"></i> Nutrition Facts</h4>
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card">
            <div class="card-body text-center">
              <h5 class="card-title">Calories</h5>
              <div class="display-6 text-primary">${
                recipe.Calories || "N/A"
              }</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body text-center">
              <h5 class="card-title">Protein</h5>
              <div class="display-6 text-primary">${
                recipe.ProteinContent || "N/A"
              }g</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body text-center">
              <h5 class="card-title">Carbs</h5>
              <div class="display-6 text-primary">${
                recipe.CarbohydrateContent || "N/A"
              }g</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body text-center">
              <h5 class="card-title">Fat</h5>
              <div class="display-6 text-primary">${
                recipe.FatContent || "N/A"
              }g</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body text-center">
              <h5 class="card-title">Cholesterol</h5>
              <div class="display-6 text-primary">${
                recipe.CholesterolContent || "N/A"
              }mg</div>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card">
            <div class="card-body text-center">
              <h5 class="card-title">Sugar</h5>
              <div class="display-6 text-primary">${
                recipe.SugarContent || "N/A"
              }g</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Ingredients Sections -->
      <h4><i class="fas fa-shopping-basket"></i> Ingredients</h4>
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="card-title mb-0"><i class="fas fa-list me-2"></i> Recipe Ingredients</h5>
            </div>
            <div class="card-body">
              <ul>
                ${renderIngredientList(recipe.RecipeIngredientParts, ",")}
              </ul>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="card-title mb-0"><i class="fas fa-database me-2"></i> USDA Ingredients</h5>
            </div>
            <div class="card-body">
              <ul>
                ${renderIngredientList(recipe.BestUsdaIngredientName, ";")}
              </ul>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card h-100">
            <div class="card-header">
              <h5 class="card-title mb-0"><i class="fas fa-scroll me-2"></i> Scraped Ingredients</h5>
            </div>
            <div class="card-body">
              <ul>
                ${renderIngredientList(recipe.ScrapedIngredients, ",")}
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Instructions -->
      <h4><i class="fas fa-clipboard-list"></i> Instructions</h4>
      <div class="instructions">
        ${
          recipe.RecipeInstructions
            ? recipe.RecipeInstructions.split("\n")
                .map(
                  (step, index) => `
                  <div class="instruction-step">
                    <div class="step-number">${index + 1}</div>
                    <div>${step.trim()}</div>
                  </div>
                `
                )
                .join("")
            : '<div class="alert alert-light"><i class="fas fa-exclamation-circle me-2"></i> No instructions available</div>'
        }
      </div>
    </div>
  `;

  detailsContainer.innerHTML = content;
  console.log("Recipe modal content set up. Displaying modal...");

  // Display the modal using Bootstrap
  const modal = new bootstrap.Modal(document.getElementById("recipe-modal"));
  modal.show();
}

// Show toast notification
function showToast(message, type = "info") {
  console.log(`Showing toast notification: ${message}`);
  const toastContainer =
    document.querySelector(".toast-container") || createToastContainer();

  const toast = document.createElement("div");
  toast.className = `toast align-items-center text-white bg-${
    type === "error" ? "danger" : type === "success" ? "success" : "primary"
  } border-0`;
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");

  const icon =
    type === "error"
      ? "exclamation-circle"
      : type === "success"
      ? "check-circle"
      : "info-circle";

  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="fas fa-${icon} me-2"></i> ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}

// Create toast container
function createToastContainer() {
  const container = document.createElement("div");
  container.className = "toast-container position-fixed top-0 end-0 p-3";
  document.body.appendChild(container);
  return container;
}

// Validate the select element's value
function validateSelect(select) {
  const isValid = select.value !== "";
  select.classList.toggle("is-invalid", !isValid);
  select.classList.toggle("is-valid", isValid);
}

// Initialize tooltips when the window loads
window.addEventListener("load", () => {
  if (typeof bootstrap !== "undefined") {
    const tooltipTriggerList = [].slice.call(
      document.querySelectorAll('[data-bs-toggle="tooltip"]')
    );
    tooltipTriggerList.map(function (tooltipTriggerEl) {
      return new bootstrap.Tooltip(tooltipTriggerEl);
    });
  }
});
