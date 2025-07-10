import React, { useState } from 'react';

export default function ProductCard({ product, onAddToCart }) {
  const title = product.item_name?.[0]?.value || 'No title';
  const brand = product.brand?.[0]?.value || 'Unknown brand';
  const price = product.price ? product.price.toFixed(2) : 'N/A';
  const imgUrl = product.main_image_id
    ? `https://m.media-amazon.com/images/I/${product.main_image_id}._SL1500_.jpg`
    : 'https://via.placeholder.com/150';

  const [adding, setAdding] = useState(false);

  const handleAddClick = async () => {
    setAdding(true);
    try {
      await onAddToCart(product);
    } catch (err) {
      alert('Failed to add to cart');
    }
    setAdding(false);
  };

  return (
    <div
      style={{
        border: '1px solid #ccc',
        borderRadius: 6,
        padding: 10,
        width: 220,
        height: 480,
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Content grows to fill vertical space */}
      <div style={{ flexGrow: 1 }}>
        <img
          src={imgUrl}
          alt={title}
          style={{
            width: '100%',
            height: 180,
            objectFit: 'contain',
            marginBottom: 10,
          }}
        />
        <h3 style={{ fontSize: 16, margin: '0 0 6px' }}>{title}</h3>
        <p style={{ margin: '0 0 4px' }}>{brand}</p>
        <p style={{ fontWeight: 'bold', margin: 0 }}>${price}</p>
      </div>

      {/* Button stays at bottom with marginTop: auto */}
      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={handleAddClick}
          disabled={adding}
          style={{
            padding: '10px 12px',
            cursor: adding ? 'not-allowed' : 'pointer',
            backgroundColor: '#2e63cc',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            width: '100%',
            fontWeight: 'bold',
          }}
        >
          {adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
