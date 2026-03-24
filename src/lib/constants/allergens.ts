// Common allergens for autocomplete in intake forms
// Organized alphabetically — covers medications, foods, and environmental triggers

export const COMMON_ALLERGENS = [
  // Medications
  "ACE inhibitors",
  "Amoxicillin",
  "Aspirin",
  "Cephalosporins",
  "Codeine",
  "Contrast dye",
  "Ibuprofen",
  "Latex",
  "Morphine",
  "NSAIDs",
  "Penicillin",
  "Statins",
  "Sulfa drugs",
  "Tetracycline",

  // Foods
  "Corn",
  "Dairy / Milk",
  "Eggs",
  "Fish",
  "Gluten / Wheat",
  "Nightshades",
  "Peanuts",
  "Sesame",
  "Shellfish",
  "Soy",
  "Tree nuts",

  // Environmental
  "Bee / Wasp venom",
  "Cockroach",
  "Dust mites",
  "Fragrance / Perfume",
  "Mold",
  "Nickel",
  "Pet dander (cat)",
  "Pet dander (dog)",
  "Pollen (grass)",
  "Pollen (ragweed)",
  "Pollen (tree)",
] as const;

export type CommonAllergen = (typeof COMMON_ALLERGENS)[number];
