import React, { useState, useEffect } from 'react';
import Login from './components/Login';
import ProductCard from './components/ProductCard';

function Cart({ isOpen, onClose, refreshTrigger }) {
  const [basket, setBasket] = useState(null);
  const [detailedProducts, setDetailedProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const getProductName = (product) => {
    if (!product) return 'Unnamed product';
    const itemNameArr = product.item_name;
    if (Array.isArray(itemNameArr) && itemNameArr.length > 0) {
      const entry = itemNameArr.find(n => n?.value?.trim());
      if (entry) return entry.value;
    }
    if (product.name) return product.name;
    return product.sku || 'Unnamed product';
  };

  useEffect(() => {
    if (!isOpen) return;

    setLoading(true);

    fetch('http://localhost:3000/api/products/cart/current', {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(async (basketData) => {
        const skus = basketData.products?.map(p => p.sku).filter(Boolean) || [];
        setBasket(basketData || { products: [] });

        if (skus.length === 0) {
          setDetailedProducts([]);
          setLoading(false);
          return;
        }

        const skuParam = skus.join(',');
        const prodRes = await fetch(`http://localhost:3000/api/products/cart?skus=${skuParam}`, {
          credentials: 'include',
        });

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          const detailed = skus.map(sku => {
            const prod = prodData.products.find(p => p.sku === sku);
            return prod || { sku, missing: true };
          });
          setDetailedProducts(detailed);
        } else {
          setDetailedProducts([]);
        }

        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        setBasket(null);
        setDetailedProducts([]);
      });
  }, [isOpen, refreshTrigger]);

  if (!isOpen) return null;

  const totalPrice = detailedProducts.reduce(
    (sum, p) => sum + (p.missing ? 0 : p.price || 0),
    0
  );

  const handleRemove = async (sku) => {
    const confirmed = window.confirm('Remove this item from your cart?');
    if (!confirmed) return;

    try {
      const res = await fetch('http://localhost:3000/api/products/cart/remove', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku }),
      });

      if (!res.ok) {
        alert('Failed to remove item');
        return;
      }

      onClose(); // Triggers cart refresh from parent
    } catch (err) {
      console.error('Error removing product:', err);
      alert('Something went wrong.');
    }
  };

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
          {detailedProducts.map((product, i) => (
            <li
              key={i}
              style={{
                marginBottom: 15,
                border: '1px solid #ddd',
                padding: 10,
                borderRadius: 6,
              }}
            >
              <p>
                <strong>
                  {product.missing
                    ? `Product SKU ${product.sku} no longer available`
                    : getProductName(product)}
                </strong>
              </p>
              {!product.missing && (
                <>
                  <p>Price: ${product.price?.toFixed(2)}</p>
                  <button
                    onClick={() => handleRemove(product.sku)}
                    style={{
                      marginTop: 8,
                      padding: '4px 8px',
                      backgroundColor: '#e74c3c',
                      color: 'white',
                      border: 'none',
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    Remove
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!loading && <hr />}
      {!loading && (
        <p>
          <strong>Total: ${totalPrice.toFixed(2)}</strong>
        </p>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartRefreshTrigger, setCartRefreshTrigger] = useState(0);

  // For search:
  const [searchInput, setSearchInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetch('http://localhost:3000/api/auth/me', {
      credentials: 'include',
    })
      .then(res => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then(data => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    fetch(
      `http://localhost:3000/api/products?q=${encodeURIComponent(searchQuery)}&page=${page}&limit=20`,
      {
        credentials: 'include',
      }
    )
      .then(res => res.json())
      .then(data => {
        setProducts(data.products);
        setTotalPages(data.totalPages);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, user, searchQuery]);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    setPage(1);
  };

  const handleAddToCart = async (product) => {
    try {
      const res = await fetch('http://localhost:3000/api/products/cart/add', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku: product.sku, quantity: 1 }),
      });
      if (!res.ok) throw new Error('Failed to add to cart');
      alert(`Added "${product.item_name?.[0]?.value || 'product'}" to cart`);
      setCartRefreshTrigger(t => t + 1); // Trigger cart refresh
      setCartOpen(true);
    } catch (err) {
      console.error(err);
      alert('Error adding to cart');
    }
  };

  const handleSearchInputChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      setPage(1);
      setSearchQuery(searchInput.trim());
    }
  };

  if (!user) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          padding: 20,
          boxSizing: 'border-box',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Login onLoginSuccess={handleLoginSuccess} />
      </div>
    );
  }

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: 50 }}>Loading products...</p>;
  }

  return (
    <div
      style={{
        maxWidth: 960,
        margin: '40px auto',
        padding: 20,
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <p>
          Welcome, <strong>{user.name}</strong>
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setCartOpen(true)}
            style={{
              fontSize: 20,
              padding: '6px 12px',
              cursor: 'pointer',
              borderRadius: 4,
              border: '1px solid #ccc',
              backgroundColor: 'white',
            }}
            aria-label="Open cart"
            title="Open cart"
          >
            🛒
          </button>
          <button
            onClick={() => {
              fetch('http://localhost:3000/api/auth/logout', {
                method: 'POST',
                credentials: 'include',
              }).then(() => setUser(null));
            }}
            style={{
              backgroundColor: '#a3a3a3',
              color: 'white',
              border: 'none',
              padding: '10px 12px',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            Logout
          </button>
        </div>
      </div>

      {/* Search input */}
      <div style={{ marginBottom: 20, textAlign: 'center' }}>
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={handleSearchInputChange}
          onKeyDown={handleSearchKeyDown}
          style={{
            padding: '8px 12px',
            fontSize: 16,
            width: '100%',
            maxWidth: 400,
            borderRadius: 6,
            border: '1px solid #ccc',
            boxSizing: 'border-box',
          }}
          aria-label="Search products"
        />
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 15,
          justifyContent: 'center',
          marginTop: 20,
        }}
      >
        {products.map(product => (
          <ProductCard
            key={product._id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>

      <div style={{ marginTop: 30, textAlign: 'center' }}>
        <button
          onClick={() => setPage(p => Math.max(p - 1, 1))}
          disabled={page === 1}
          style={{
            marginRight: 10,
            padding: '6px 12px',
            cursor: page === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage(p => Math.min(p + 1, totalPages))}
          disabled={page === totalPages}
          style={{
            marginLeft: 10,
            padding: '6px 12px',
            cursor: page === totalPages ? 'not-allowed' : 'pointer',
          }}
        >
          Next
        </button>
      </div>

      <Cart
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        refreshTrigger={cartRefreshTrigger}
      />
    </div>
  );
}
