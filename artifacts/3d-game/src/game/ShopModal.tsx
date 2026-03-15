import { useGameStore } from "./store";

const SHOP_ITEMS = [
  { id: "skin_red", category: "Character", name: "Red Warrior", price: 200, color: "#ff4444", preview: "🔴" },
  { id: "skin_gold", category: "Character", name: "Gold Elite", price: 500, color: "#ffd700", preview: "🟡" },
  { id: "skin_camo", category: "Character", name: "Camo Hunter", price: 300, color: "#4a7a4a", preview: "🟢" },
  { id: "skin_black", category: "Character", name: "Shadow Ops", price: 400, color: "#222", preview: "⚫" },
  { id: "gun_chrome", category: "Gun Skin", name: "Chrome AK", price: 250, color: "#c0c0c0", preview: "🔫" },
  { id: "gun_gold", category: "Gun Skin", name: "Gold SMG", price: 600, color: "#ffd700", preview: "✨" },
  { id: "gun_dragon", category: "Gun Skin", name: "Dragon Sniper", price: 800, color: "#ff6600", preview: "🐉" },
  { id: "boost_2x", category: "Boosts", name: "2x XP (1 match)", price: 100, color: "#4a9eff", preview: "⚡" },
  { id: "boost_coin", category: "Boosts", name: "Coin Rush (1 match)", price: 150, color: "#ffd93d", preview: "💰" },
];

interface Props {
  onClose: () => void;
}

export default function ShopModal({ onClose }: Props) {
  const coins = useGameStore((s) => s.coins);
  const ownedItems = useGameStore((s) => s.ownedItems);
  const buyItem = useGameStore((s) => s.buyItem);

  const categories = [...new Set(SHOP_ITEMS.map((i) => i.category))];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9000,
        backdropFilter: "blur(8px)",
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: "90%",
          maxWidth: 600,
          maxHeight: "85vh",
          background: "linear-gradient(135deg, #0d1b3e 0%, #050510 100%)",
          borderRadius: 20,
          border: "1px solid rgba(255,217,61,0.2)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          fontFamily: "'Segoe UI', sans-serif",
          color: "#fff",
        }}
      >
        <div
          style={{
            padding: "20px 24px",
            background: "rgba(255,217,61,0.06)",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: 2 }}>🛒 SHOP</div>
            <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
              Buy skins and boosts with coins
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                background: "rgba(255,217,61,0.12)",
                border: "1px solid rgba(255,217,61,0.3)",
                borderRadius: 20,
                padding: "6px 16px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span style={{ fontSize: 16 }}>🪙</span>
              <span style={{ color: "#ffd93d", fontWeight: "bold", fontSize: 16 }}>{coins}</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 8,
                padding: "6px 14px",
                color: "#888",
                cursor: "pointer",
                fontSize: 14,
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div style={{ overflowY: "auto", padding: 20 }}>
          {categories.map((cat) => (
            <div key={cat} style={{ marginBottom: 24 }}>
              <div
                style={{
                  fontSize: 11,
                  color: "#666",
                  letterSpacing: 2,
                  marginBottom: 12,
                  textTransform: "uppercase",
                }}
              >
                {cat}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                {SHOP_ITEMS.filter((i) => i.category === cat).map((item) => {
                  const owned = ownedItems.includes(item.id);
                  const canAfford = coins >= item.price;
                  return (
                    <div
                      key={item.id}
                      style={{
                        background: owned
                          ? "rgba(107,203,119,0.08)"
                          : "rgba(255,255,255,0.04)",
                        border: "1px solid",
                        borderColor: owned
                          ? "rgba(107,203,119,0.3)"
                          : "rgba(255,255,255,0.07)",
                        borderRadius: 12,
                        padding: 14,
                        textAlign: "center",
                        position: "relative",
                      }}
                    >
                      <div style={{ fontSize: 28, marginBottom: 6 }}>{item.preview}</div>
                      <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 4 }}>
                        {item.name}
                      </div>
                      {owned ? (
                        <div
                          style={{
                            fontSize: 11,
                            color: "#6bcb77",
                            fontWeight: "bold",
                            marginTop: 6,
                          }}
                        >
                          ✓ OWNED
                        </div>
                      ) : (
                        <button
                          onClick={() => buyItem(item.id, item.price)}
                          disabled={!canAfford}
                          style={{
                            marginTop: 6,
                            width: "100%",
                            padding: "6px 0",
                            background: canAfford
                              ? "rgba(255,217,61,0.15)"
                              : "rgba(255,255,255,0.03)",
                            border: "1px solid",
                            borderColor: canAfford
                              ? "rgba(255,217,61,0.4)"
                              : "rgba(255,255,255,0.06)",
                            borderRadius: 8,
                            color: canAfford ? "#ffd93d" : "#444",
                            cursor: canAfford ? "pointer" : "not-allowed",
                            fontSize: 12,
                            fontWeight: "bold",
                          }}
                        >
                          🪙 {item.price}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            padding: "12px 20px",
            background: "rgba(0,0,0,0.3)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            fontSize: 11,
            color: "#444",
            textAlign: "center",
          }}
        >
          Earn coins by playing matches • +10 per kill • +20 per match
        </div>
      </div>
    </div>
  );
}
