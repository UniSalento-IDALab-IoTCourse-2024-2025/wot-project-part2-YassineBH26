import { getFoodEmoji } from "../data/foods";

function parseFoodItems(foodText) {
  if (!foodText) return [];

  return foodText.split(",").map((item) => {
    const trimmed = item.trim();
    const match = trimmed.match(/^(.+?)\s*\((.+?)\)$/);

    if (!match) {
      return {
        name: trimmed,
        quantity: ""
      };
    }

    return {
      name: match[1].trim(),
      quantity: match[2].trim()
    };
  });
}

function FoodItems({ foodText, compact = false }) {
  const items = parseFoodItems(foodText);

  if (items.length === 0) {
    return <span>-</span>;
  }

  return (
    <div style={styles.foodItems}>
      {items.map((item, index) => (
        <div
          key={`${item.name}-${index}`}
          style={{
            ...styles.foodPill,
            ...(compact ? styles.foodPillCompact : {})
          }}
        >
          <span style={styles.foodName}>
            <span style={styles.foodEmoji}>{getFoodEmoji(item.name)}</span>
            {item.name}
          </span>

          {item.quantity && (
            <span style={styles.foodQuantity}>{item.quantity}</span>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  foodItems: {
    display: "flex",
    flexWrap: "wrap",
    gap: "6px",
    maxWidth: "560px"
  },

  foodPill: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "#f8fafc",
    border: "1px solid #e5e7eb",
    borderRadius: "999px",
    padding: "5px 9px",
    fontSize: "13px",
    lineHeight: 1.2
  },

  foodPillCompact: {
    padding: "4px 8px",
    fontSize: "12px"
  },

  foodName: {
    color: "#111827",
    fontWeight: "800",
    display: "inline-flex",
    alignItems: "center"
  },

  foodEmoji: {
    marginRight: "5px"
  },

  foodQuantity: {
    color: "#166534",
    background: "#dcfce7",
    borderRadius: "999px",
    padding: "2px 7px",
    fontWeight: "800"
  }
};

export default FoodItems;