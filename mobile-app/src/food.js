// Icons, colors and food illustrations (emoji) for the menu.

export const CATEGORIES = [
  { key: "starter", title: "Starters", icon: "leaf", color: "#2e8b57", emoji: "🥗" },
  { key: "main", title: "Mains", icon: "restaurant", color: "#e4572e", emoji: "🍽️" },
  { key: "dessert", title: "Desserts", icon: "ice-cream", color: "#d65db1", emoji: "🍰" },
  { key: "drink", title: "Drinks", icon: "wine", color: "#3d7dd8", emoji: "🥤" },
];

export function categoryOf(item) {
  return CATEGORIES.find((category) => category.key === item.category) ?? CATEGORIES[1];
}

// A picture for a dish, based on words in its name. Falls back to the category's picture.
const EMOJI_BY_WORD = [
  ["soup", "🍲"],
  ["bread", "🥖"],
  ["salad", "🥗"],
  ["pizza", "🍕"],
  ["burger", "🍔"],
  ["spaghetti", "🍝"],
  ["pasta", "🍝"],
  ["tiramisu", "🍮"],
  ["chocolate", "🍫"],
  ["cake", "🍰"],
  ["cola", "🥤"],
  ["water", "💧"],
  ["coffee", "☕"],
  ["espresso", "☕"],
  ["lemonade", "🍋"],
];

export function emojiFor(item) {
  const name = item.name.toLowerCase();
  const match = EMOJI_BY_WORD.find(([word]) => name.includes(word));
  return match ? match[1] : categoryOf(item).emoji;
}
