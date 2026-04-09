
import type { MealItem } from "../types";

// FIX: macro validation note — for each meal item, the following should hold approximately:
//   calories ≈ carbs*4 + protein*4 + fat*9  (±10%)
// Discrepancies may exist due to rounding, fiber calories, or alcohol content.
// A runtime validation function can be added if data quality becomes an issue:
//   const validateMacros = (m: MealItem) => Math.abs(m.calories - (m.carbs*4 + m.protein*4 + m.fat*9)) < m.calories * 0.1;

export const DIET_LIBRARY: MealItem[] = [
  // ── EARLY MORNING ──────────────────────────────
  {
    id:"D000", name:"Methi water", cuisine:"Pan-Indian", slot:"early_morning",
    dietTypes:["low_carb","anti_inflammatory","frozen_carb","keto","calorie_deficit","maintenance"],
    isVeg:true, isEgg:false, calories:5, carbs:1, protein:0.3, fat:0, fibre:0.5, gi:"low",
    ingredients:[
      { name:"Fenugreek seeds (soaked overnight)", grams:5, measure:"1 tsp" },
      { name:"Water", grams:200, measure:"1 glass" },
    ],
    prepNote:"Soak 1 tsp methi seeds in water overnight. Drink first thing on waking, before any food.",
    portability:"high",
  },
  {
    id:"D001", name:"Jeera water", cuisine:"Pan-Indian", slot:"early_morning",
    dietTypes:["low_carb","anti_inflammatory","keto","calorie_deficit","maintenance","high_probiotic"],
    isVeg:true, isEgg:false, calories:5, carbs:1, protein:0.2, fat:0, fibre:0, gi:"low",
    ingredients:[
      { name:"Cumin seeds", grams:4, measure:"1 tsp" },
      { name:"Water (boiled)", grams:200, measure:"1 glass" },
    ],
    prepNote:"Boil cumin seeds in water for 5 min. Cool slightly, drink warm.",
    portability:"high",
  },
  // ── BREAKFAST ──────────────────────────────────
  {
    id:"D010", name:"Moong dal chilla", cuisine:"North Indian", slot:"breakfast",
    dietTypes:["low_carb","high_protein","anti_inflammatory","calorie_deficit"],
    isVeg:true, isEgg:false, calories:245, carbs:18, protein:24, fat:8, fibre:4, gi:"low",
    ingredients:[
      { name:"Moong dal (soaked 4hr, ground to batter)", grams:80, measure:"⅓ cup dry" },
      { name:"Paneer (grated, inside filling)", grams:30, measure:"2 tbsp" },
      { name:"Onion (chopped)", grams:20, measure:"2 tbsp" },
      { name:"Green chilli + ginger paste", grams:5, measure:"½ tsp" },
      { name:"Turmeric + cumin powder", grams:2, measure:"¼ tsp each" },
      { name:"Oil (for cooking)", grams:5, measure:"1 tsp" },
      { name:"Green chutney (side)", grams:30, measure:"2 tbsp" },
    ],
    prepNote:"Spread batter thin for crispy texture. Add paneer filling before folding.",
    portability:"medium",
  },
  {
    id:"D011", name:"Besan chilla", cuisine:"North Indian", slot:"breakfast",
    dietTypes:["low_carb","high_protein","keto","calorie_deficit"],
    isVeg:true, isEgg:false, calories:165, carbs:16, protein:10, fat:6, fibre:4, gi:"low",
    ingredients:[
      { name:"Besan (gram flour)", grams:60, measure:"¼ cup" },
      { name:"Water (to make batter)", grams:80, measure:"⅓ cup" },
      { name:"Onion, tomato, capsicum (chopped)", grams:40, measure:"¼ cup mixed" },
      { name:"Ajwain + cumin", grams:2, measure:"¼ tsp each" },
      { name:"Oil", grams:5, measure:"1 tsp" },
    ],
    prepNote:"Add ajwain for digestion. Spread thin. Pair with green chutney.",
    portability:"medium",
  },
  {
    id:"D012", name:"Paneer bhurji (low oil)", cuisine:"North Indian", slot:"breakfast",
    dietTypes:["keto","low_carb","high_protein"],
    isVeg:true, isEgg:false, calories:210, carbs:4, protein:18, fat:14, fibre:1, gi:"low",
    ingredients:[
      { name:"Paneer (low-fat, crumbled)", grams:100, measure:"½ cup crumbled" },
      { name:"Onion (chopped fine)", grams:30, measure:"3 tbsp" },
      { name:"Tomato (chopped)", grams:40, measure:"¼ cup" },
      { name:"Capsicum (chopped)", grams:30, measure:"¼ cup" },
      { name:"Oil or ghee", grams:5, measure:"1 tsp" },
      { name:"Turmeric + chilli + cumin", grams:3, measure:"¼ tsp each" },
    ],
    prepNote:"High heat, quick cook. Don't overcook or paneer becomes rubbery.",
    portability:"medium",
  },
  {
    id:"D013", name:"Egg white omelette", cuisine:"Pan-Indian", slot:"breakfast",
    dietTypes:["keto","low_carb","high_protein","calorie_deficit"],
    isVeg:false, isEgg:true, calories:120, carbs:2, protein:18, fat:5, fibre:0, gi:"low",
    ingredients:[
      { name:"Egg whites", grams:150, measure:"3–4 whites" },
      { name:"Whole egg", grams:55, measure:"1 egg" },
      { name:"Spinach (chopped)", grams:30, measure:"¼ cup" },
      { name:"Onion + tomato", grams:40, measure:"3 tbsp each" },
      { name:"Ghee or coconut oil", grams:5, measure:"1 tsp" },
      { name:"Turmeric + black pepper", grams:1, measure:"pinch each" },
    ],
    prepNote:"Use ghee/coconut oil — not vegetable oil. Black pepper increases curcumin absorption.",
    portability:"high",
  },
  {
    id:"D014", name:"Masala scrambled eggs", cuisine:"Pan-Indian", slot:"breakfast",
    dietTypes:["keto","low_carb","high_protein"],
    isVeg:false, isEgg:true, calories:175, carbs:3, protein:14, fat:12, fibre:0, gi:"low",
    ingredients:[
      { name:"Whole eggs", grams:110, measure:"2 eggs" },
      { name:"Onion (fine dice)", grams:30, measure:"3 tbsp" },
      { name:"Tomato (deseeded)", grams:30, measure:"2 tbsp" },
      { name:"Green chilli + coriander", grams:5, measure:"1 tbsp" },
      { name:"Ghee", grams:5, measure:"1 tsp" },
    ],
    prepNote:"Low-medium heat. Fold gently — don't overmix. High satiety.",
    portability:"high",
  },
  {
    id:"D015", name:"Oats upma", cuisine:"South Indian", slot:"breakfast",
    dietTypes:["high_protein","anti_inflammatory","calorie_deficit"],
    isVeg:true, isEgg:false, calories:195, carbs:28, protein:8, fat:6, fibre:5, gi:"medium",
    ingredients:[
      { name:"Rolled oats (not instant)", grams:60, measure:"½ cup dry" },
      { name:"Mixed vegetables (carrot, peas, beans)", grams:80, measure:"½ cup chopped" },
      { name:"Onion + mustard seeds + curry leaves", grams:20, measure:"2 tbsp" },
      { name:"Oil", grams:5, measure:"1 tsp" },
      { name:"Lemon juice", grams:10, measure:"2 tsp" },
    ],
    prepNote:"Use rolled oats only — instant oats are high GI. Add plenty of vegetables.",
    portability:"medium",
  },
  {
    id:"D016", name:"Greek yogurt with seeds", cuisine:"Pan-Indian", slot:"breakfast",
    dietTypes:["high_protein","high_probiotic","low_carb"],
    isVeg:true, isEgg:false, calories:145, carbs:10, protein:15, fat:5, fibre:2, gi:"low",
    ingredients:[
      { name:"Greek yogurt (full-fat or low-fat)", grams:150, measure:"¾ cup" },
      { name:"Chia seeds", grams:10, measure:"1 tbsp" },
      { name:"Flaxseeds (ground)", grams:10, measure:"1 tbsp" },
      { name:"Cinnamon powder", grams:1, measure:"pinch" },
    ],
    prepNote:"No sugar — add cinnamon for natural sweetness. Chia + flax boost omega-3 and fibre.",
    portability:"high",
  },
  // ── MID-MORNING ────────────────────────────────
  {
    id:"D020", name:"Mixed nuts", cuisine:"Pan-Indian", slot:"mid_morning",
    dietTypes:["keto","low_carb","anti_inflammatory","maintenance"],
    isVeg:true, isEgg:false, calories:155, carbs:5, protein:4, fat:14, fibre:2, gi:"low",
    ingredients:[
      { name:"Almonds (raw, unsalted)", grams:10, measure:"7–8 pieces" },
      { name:"Walnuts", grams:10, measure:"2 halves" },
      { name:"Pumpkin seeds", grams:5, measure:"1 tsp" },
    ],
    prepNote:"No salted or roasted nuts. No peanuts for weight loss phase (high calorie density).",
    portability:"high",
  },
  {
    id:"D021", name:"Plain curd", cuisine:"Pan-Indian", slot:"mid_morning",
    dietTypes:["high_probiotic","low_carb","calorie_deficit","maintenance"],
    isVeg:true, isEgg:false, calories:95, carbs:7, protein:6, fat:4, fibre:0, gi:"low",
    ingredients:[
      { name:"Curd (homemade or plain, no sugar)", grams:150, measure:"¾ cup / 1 small katori" },
    ],
    prepNote:"Full-fat or low-fat depending on protocol. Daily probiotic — non-negotiable.",
    portability:"low",
  },
  {
    id:"D022", name:"Moong sprout bowl", cuisine:"Pan-Indian", slot:"mid_morning",
    dietTypes:["high_protein","anti_inflammatory","low_carb","calorie_deficit"],
    isVeg:true, isEgg:false, calories:120, carbs:14, protein:9, fat:1, fibre:5, gi:"low",
    ingredients:[
      { name:"Moong sprouts", grams:100, measure:"½ cup" },
      { name:"Cucumber (diced)", grams:50, measure:"⅓ cup" },
      { name:"Tomato (diced)", grams:30, measure:"¼ cup" },
      { name:"Lemon juice", grams:10, measure:"2 tsp" },
      { name:"Chaat masala + rock salt", grams:2, measure:"¼ tsp" },
    ],
    prepNote:"Raw or lightly sautéed. Best eaten at room temperature.",
    portability:"medium",
  },
  {
    id:"D023", name:"Buttermilk (chaas)", cuisine:"Pan-Indian", slot:"mid_morning",
    dietTypes:["high_probiotic","anti_inflammatory","calorie_deficit","maintenance"],
    isVeg:true, isEgg:false, calories:35, carbs:5, protein:2, fat:0.5, fibre:0, gi:"low",
    ingredients:[
      { name:"Curd (plain)", grams:60, measure:"¼ cup" },
      { name:"Water (cold)", grams:150, measure:"¾ cup" },
      { name:"Roasted cumin powder", grams:1, measure:"¼ tsp" },
      { name:"Mint leaves + black salt", grams:3, measure:"3–4 leaves, pinch" },
    ],
    prepNote:"Whisk curd with water. Add cumin, mint, rock salt. Excellent gut health drink.",
    portability:"low",
  },
  // ── LUNCH ──────────────────────────────────────
  {
    id:"D030", name:"Dal + roti + sabzi", cuisine:"North Indian", slot:"lunch",
    dietTypes:["low_carb","calorie_deficit","maintenance"],
    isVeg:true, isEgg:false, calories:420, carbs:52, protein:22, fat:10, fibre:8, gi:"medium",
    ingredients:[
      { name:"Moong or masoor dal (cooked)", grams:150, measure:"¾ cup cooked" },
      { name:"Whole wheat roti", grams:40, measure:"1 medium" },
      { name:"Sabzi (palak/methi/mixed veg)", grams:120, measure:"1 medium katori" },
      { name:"Ghee (for dal tadka)", grams:5, measure:"1 tsp" },
    ],
    prepNote:"Moong or masoor dal preferred — lower GI than chana. 1 roti only for low-carb days.",
    portability:"low",
  },
  {
    id:"D031", name:"Palak paneer + roti", cuisine:"North Indian", slot:"lunch",
    dietTypes:["low_carb","high_protein","anti_inflammatory"],
    isVeg:true, isEgg:false, calories:395, carbs:24, protein:32, fat:20, fibre:6, gi:"low",
    ingredients:[
      { name:"Palak (cooked, pureed)", grams:100, measure:"½ cup" },
      { name:"Paneer (low-fat, cubed)", grams:80, measure:"8–10 cubes" },
      { name:"Onion + garlic + ginger (base)", grams:40, measure:"3 tbsp" },
      { name:"Tomato (pureed)", grams:40, measure:"3 tbsp" },
      { name:"Ghee", grams:5, measure:"1 tsp" },
      { name:"Whole wheat roti", grams:40, measure:"1 medium" },
      { name:"Cucumber salad (side)", grams:100, measure:"1 small katori" },
    ],
    prepNote:"Use low-fat paneer. Minimal cream. Packed with iron from palak.",
    portability:"low",
  },
  {
    id:"D032", name:"Grilled chicken + salad", cuisine:"Pan-Indian", slot:"lunch",
    dietTypes:["keto","low_carb","high_protein","calorie_deficit"],
    isVeg:false, isEgg:false, calories:285, carbs:8, protein:38, fat:12, fibre:4, gi:"low",
    ingredients:[
      { name:"Chicken breast (marinated, grilled)", grams:150, measure:"1 medium piece" },
      { name:"Mixed salad greens", grams:60, measure:"1 large bowl" },
      { name:"Cucumber + tomato + capsicum", grams:100, measure:"½ cup each" },
      { name:"Olive oil + lemon dressing", grams:10, measure:"2 tsp" },
      { name:"Marinade: turmeric, ginger, garlic, yogurt", grams:20, measure:"2 tbsp" },
    ],
    prepNote:"No breading. Marinate minimum 30 min. Load salad generously.",
    portability:"medium",
  },
  {
    id:"D033", name:"Rajma + brown rice", cuisine:"North Indian", slot:"lunch",
    dietTypes:["high_protein","high_carb","carb_cycling","maintenance"],
    isVeg:true, isEgg:false, calories:385, carbs:55, protein:15, fat:8, fibre:10, gi:"medium",
    ingredients:[
      { name:"Rajma (cooked)", grams:120, measure:"½ cup cooked" },
      { name:"Brown rice (refrigerated overnight = frozen carb)", grams:100, measure:"⅓ cup dry / ½ cup cooked" },
      { name:"Onion + tomato + spices (gravy)", grams:80, measure:"⅓ cup" },
      { name:"Ghee or oil", grams:5, measure:"1 tsp" },
    ],
    prepNote:"Brown rice only. Use refrigerated rice for lower GI. Not daily for diabetes.",
    portability:"low",
  },
  {
    id:"D034", name:"Fish curry + 1 roti", cuisine:"South Indian / Bengali", slot:"lunch",
    dietTypes:["keto","low_carb","high_protein","anti_inflammatory"],
    isVeg:false, isEgg:false, calories:310, carbs:20, protein:35, fat:10, fibre:2, gi:"low",
    ingredients:[
      { name:"Surmai or Rawas (fish fillet)", grams:150, measure:"1 medium piece" },
      { name:"Coconut milk (light)", grams:40, measure:"3 tbsp" },
      { name:"Onion + tomato + spices (curry base)", grams:80, measure:"⅓ cup" },
      { name:"Mustard seeds + curry leaves + turmeric", grams:5, measure:"¼ tsp each" },
      { name:"Whole wheat roti", grams:40, measure:"1 medium" },
    ],
    prepNote:"Prefer rohu, surmai, rawas. Rich in omega-3. Coconut-based for South Indian version.",
    portability:"low",
  },
  {
    id:"D035", name:"Quinoa khichdi", cuisine:"Modern Indian", slot:"lunch",
    dietTypes:["high_protein","anti_inflammatory","calorie_deficit"],
    isVeg:true, isEgg:false, calories:220, carbs:32, protein:10, fat:6, fibre:5, gi:"medium",
    ingredients:[
      { name:"Quinoa (dry)", grams:50, measure:"¼ cup dry" },
      { name:"Moong dal (dry)", grams:30, measure:"2 tbsp dry" },
      { name:"Mixed vegetables (carrot, peas, beans)", grams:100, measure:"½ cup" },
      { name:"Ghee", grams:5, measure:"1 tsp" },
      { name:"Cumin + turmeric + asafoetida", grams:3, measure:"¼ tsp each" },
      { name:"Water", grams:300, measure:"1.5 cups" },
    ],
    prepNote:"Higher protein than rice khichdi. One-pot meal. Easy digestion.",
    portability:"low",
  },
  // ── DINNER ─────────────────────────────────────
  {
    id:"D040", name:"Methi dal soup", cuisine:"Pan-Indian", slot:"dinner",
    dietTypes:["low_carb","anti_inflammatory","high_protein","calorie_deficit"],
    isVeg:true, isEgg:false, calories:145, carbs:16, protein:10, fat:2, fibre:5, gi:"low",
    ingredients:[
      { name:"Moong dal (cooked)", grams:120, measure:"½ cup cooked" },
      { name:"Fresh methi leaves", grams:30, measure:"1 small handful" },
      { name:"Water (soup consistency)", grams:150, measure:"¾ cup" },
      { name:"Ghee (tadka)", grams:5, measure:"1 tsp" },
      { name:"Garlic + ginger + cumin", grams:8, measure:"1 tsp each" },
      { name:"Turmeric + black pepper", grams:2, measure:"¼ tsp each" },
    ],
    prepNote:"Keep soup consistency — do not thicken. Methi has proven blood sugar lowering effect.",
    portability:"low",
  },
  {
    id:"D041", name:"Palak + sabzi (no roti)", cuisine:"North Indian", slot:"dinner",
    dietTypes:["keto","low_carb","anti_inflammatory","calorie_deficit"],
    isVeg:true, isEgg:false, calories:110, carbs:10, protein:6, fat:6, fibre:6, gi:"low",
    ingredients:[
      { name:"Spinach / palak (cooked)", grams:150, measure:"1 medium katori" },
      { name:"Garlic + mustard seeds", grams:8, measure:"2 cloves, ½ tsp" },
      { name:"Oil or ghee", grams:5, measure:"1 tsp" },
      { name:"Lemon juice", grams:10, measure:"2 tsp" },
    ],
    prepNote:"High iron. Squeeze lemon at end (vitamin C boosts iron absorption).",
    portability:"low",
  },
  {
    id:"D042", name:"Chicken stir fry (no rice)", cuisine:"Pan-Indian", slot:"dinner",
    dietTypes:["keto","low_carb","high_protein"],
    isVeg:false, isEgg:false, calories:240, carbs:6, protein:34, fat:9, fibre:3, gi:"low",
    ingredients:[
      { name:"Chicken breast (thin strips)", grams:150, measure:"1 medium breast" },
      { name:"Mixed peppers + broccoli + mushroom", grams:150, measure:"1 large katori" },
      { name:"Soy sauce (low sodium)", grams:10, measure:"2 tsp" },
      { name:"Ginger + garlic paste", grams:10, measure:"1 tsp each" },
      { name:"Oil (coconut or sesame)", grams:5, measure:"1 tsp" },
      { name:"Chilli flakes + black pepper", grams:2, measure:"¼ tsp each" },
    ],
    prepNote:"High heat, quick cook — 5–7 min total. No cornflour thickening.",
    portability:"medium",
  },
  {
    id:"D043", name:"Egg white scramble + salad", cuisine:"Pan-Indian", slot:"dinner",
    dietTypes:["keto","low_carb","high_protein","calorie_deficit"],
    isVeg:false, isEgg:true, calories:140, carbs:6, protein:18, fat:4, fibre:4, gi:"low",
    ingredients:[
      { name:"Egg whites", grams:180, measure:"3–4 whites" },
      { name:"Mixed salad (cucumber, tomato, capsicum)", grams:150, measure:"1 large bowl" },
      { name:"Olive oil (for dressing)", grams:5, measure:"1 tsp" },
      { name:"Ghee (cooking)", grams:3, measure:"½ tsp" },
      { name:"Salt + pepper + herbs", grams:2, measure:"to taste" },
    ],
    prepNote:"No yolk at dinner for strict low-calorie days. Very low calorie, high protein.",
    portability:"medium",
  },
  {
    id:"D044", name:"Chicken tikka (no roti)", cuisine:"North Indian", slot:"dinner",
    dietTypes:["keto","low_carb","high_protein"],
    isVeg:false, isEgg:false, calories:195, carbs:2, protein:36, fat:5, fibre:0, gi:"low",
    ingredients:[
      { name:"Chicken (boneless, bite-size)", grams:150, measure:"8–10 pieces" },
      { name:"Marinade: curd + spices", grams:30, measure:"2 tbsp" },
      { name:"Lemon juice", grams:10, measure:"2 tsp" },
      { name:"Onion rings + mint chutney (side)", grams:40, measure:"½ small onion, 2 tbsp" },
    ],
    prepNote:"Protein-only dinner. Best for blood sugar management. Restaurant-compatible.",
    portability:"medium",
  },
  {
    id:"D045", name:"Moong dal soup", cuisine:"Pan-Indian", slot:"dinner",
    dietTypes:["anti_inflammatory","low_carb","high_probiotic","calorie_deficit"],
    isVeg:true, isEgg:false, calories:120, carbs:15, protein:8, fat:2, fibre:4, gi:"low",
    ingredients:[
      { name:"Yellow moong dal (cooked thin)", grams:100, measure:"⅓ cup dry" },
      { name:"Water", grams:200, measure:"1 cup" },
      { name:"Ginger + turmeric + cumin", grams:5, measure:"¼ tsp each" },
      { name:"Ghee (tadka)", grams:3, measure:"½ tsp" },
    ],
    prepNote:"Best on low energy or upset stomach days. Thin consistency only.",
    portability:"low",
  },
  // ── FUNCTIONAL / SPECIAL ───────────────────────
  {
    id:"D050", name:"Turmeric milk (haldi doodh)", cuisine:"Pan-Indian", slot:"bedtime",
    dietTypes:["anti_inflammatory","high_probiotic","maintenance"],
    isVeg:true, isEgg:false, calories:115, carbs:12, protein:7, fat:3, fibre:0, gi:"low",
    ingredients:[
      { name:"Low-fat milk (or almond milk)", grams:200, measure:"1 glass" },
      { name:"Turmeric powder", grams:1, measure:"¼ tsp" },
      { name:"Black pepper (activates curcumin)", grams:0.5, measure:"pinch" },
      { name:"Cinnamon", grams:0.5, measure:"pinch" },
    ],
    prepNote:"Black pepper increases turmeric absorption 2000%. No sugar.",
    portability:"low",
  },
];

export function filterByDietType(items: MealItem[], dietType: string): MealItem[] {
  return items.filter(i => i.dietTypes.includes(dietType as any));
}

export function filterBySlot(items: MealItem[], slot: string): MealItem[] {
  return items.filter(i => i.slot === slot);
}

export function filterVeg(items: MealItem[], vegOnly: boolean): MealItem[] {
  if (!vegOnly) return items;
  return items.filter(i => i.isVeg);
}

export function getMealItem(id: string): MealItem | undefined {
  return DIET_LIBRARY.find(i => i.id === id);
}
