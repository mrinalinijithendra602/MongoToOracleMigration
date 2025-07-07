import React, { useState } from 'react';

export default function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20, textAlign: 'center' }}>
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={e => setQuery(e.target.value)}
        style={{ padding: '8px 12px', width: 300, maxWidth: '90%', fontSize: 16 }}
      />
      <button type="submit" style={{ padding: '8px 12px', marginLeft: 8, fontSize: 16 }}>
        Search
      </button>
    </form>
  );
}
