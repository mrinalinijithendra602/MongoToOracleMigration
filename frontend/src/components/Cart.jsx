import React, { useEffect, useState } from 'react';

export default function Cart({ isOpen, onClose }) {
  const [basket, setBasket] = useState(null);
  const [loading, setLoading] = useState(false);

  // Refresh cart from backend
  const refreshCart = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/cart', {
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to fetch cart');
      const data = await res.json();
      setBasket(data);
    } catch (err) {
      console.error('Error loading cart:', err);
      setBasket(null);
    }
    setLoading(false);
  };

  // Remove item by SKU
  const removeFromCart = async (sku) => {
    if (!window.confirm('Remove this item from your cart?')) return;
    try {
      const res = await fetch('http://localhost:3000/api/cart/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sku }),
      });
      if (!res.ok) throw new Error('Failed to remove item');
      const updatedBasket = await res.json();
      setBasket(updatedBasket);
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Could not remove item.');
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshCart();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalPrice = basket?.total_price ?? 0;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: 320,
        height: '100vh',
        backgroundColor: 'white',
        boxShadow: '-2px 0 8px rgba(0,0,0,0.3)',
        padding: 20,
        overflowY: 'auto',
        zIndex: 1000,
      }}
    >
      <button
        onClick={onClose}
        style={{
          marginBottom: 20,
          cursor: 'pointer',
          padding: '6px 12px',
          borderRadius: 4,
          border: '1px solid #ccc',
          backgroundColor: 'white',
        }}
        aria-label="Close cart"
      >
        Close
      </button>

      <h2>Your Cart</h2>

      {loading && <p>Loading cart...</p>}

      {!loading && (!basket || basket.products.length === 0) && <p>Cart is empty</p>}

      {!loading && basket && basket.products.length > 0 && (
        <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
          {basket.products.map(({ sku, quantity, price, full_product }) => {
            const title = full_product?.item_name?.[0]?.value || sku;
            const brand = full_product?.brand?.[0]?.value || '';
            const imageUrl = full_product?.main_image_id
              ? `https://m.media-amazon.com/images/I/${full_product.main_image_id}._SL1500_.jpg`
              : 'https://via.placeholder.com/100';

            return (
              <li
                key={sku}
                style={{
                  marginBottom: 15,
                  border: '1px solid #ddd',
                  padding: 10,
                  borderRadius: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <img
                  src={imageUrl}
                  alt={title}
                  style={{ width: 60, height: 60, objectFit: 'contain' }}
                />
                <div style={{ flexGrow: 1 }}>
                  <strong>{title}</strong>
                  <p style={{ margin: '4px 0' }}>{brand}</p>
                  <p>
                    Qty: {quantity} <br />
                    Price: ${(price * quantity).toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => removeFromCart(sku)}
                  style={{
                    backgroundColor: '#e74c3c',
                    color: 'white',
                    border: 'none',
                    borderRadius: 4,
                    padding: '6px 10px',
                    cursor: 'pointer',
                  }}
                  aria-label={`Remove ${title} from cart`}
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && (
        <p style={{ fontWeight: 'bold', marginTop: 20 }}>
          Total: ${totalPrice.toFixed(2)}
        </p>
      )}
    </div>
  );
}
