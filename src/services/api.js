// src/services/api.js

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';
const TOKEN_STORAGE_KEY = 'artura.sanctum.token.v2';

// Helper mengubah format response API Laravel ke format state React ARTURA
function formatArtworkFromApi(item) {
  const isDigital =
    item.categoryId === 1 ||
    String(item.category).toLowerCase() === 'digital' ||
    String(item.categoryName).toLowerCase().includes('digital');

  return {
    id: Number(item.id),
    title: item.title,
    slug: item.slug,
    image: item.image,
    category: isDigital ? 'digital' : 'traditional',
    categoryName: item.categoryName || (isDigital ? 'Digital Art' : 'Traditional Art'),
    medium: item.medium || (isDigital ? 'Digital Art' : 'Traditional Art'),
    collectionType: item.collectionType || 'portfolio',
    year: String(item.year || '2026'),
    technique: item.technique || '',
    description: item.description || '',
    price: item.price !== null && item.price !== undefined ? Number(item.price) : null,
    status: item.status || 'portfolio',
    rating: item.rating ?? null,
    reviews: Array.isArray(item.reviews) ? item.reviews : [],
    featured: Boolean(item.featured),
    createdAt: item.createdAt || new Date().toISOString(),
  };
}

/**
 * Otomatis mendapatkan Bearer Token Sanctum dengan akun ADMIN (artura123)
 */
async function getSanctumToken(forceRefresh = false) {
  if (!forceRefresh) {
    const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (savedToken) return savedToken;
  }

  const credentials = {
    name: 'ADMIN',
    email: 'admin@artura.com',
    password: 'artura123',
  };

  // Login ke API Laravel
  let response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: credentials.email,
      password: credentials.password,
    }),
  });

  // Jika akun belum ada di database (misal habis migrate:fresh), otomatis register lalu login
  if (!response.ok) {
    await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    });
  }

  if (!response.ok) {
    throw new Error('Gagal mendapatkan token autentikasi dari server Laravel');
  }

  const data = await response.json();
  if (data.token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, data.token);
    return data.token;
  }

  throw new Error('Token tidak ditemukan pada response login');
}

/**
 * Helper request terproteksi (otomatis minta token baru jika token lama di-logout)
 */
async function authorizedFetch(url, options = {}) {
  let token = await getSanctumToken(false);

  let response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 401) {
    token = await getSanctumToken(true);
    response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return response;
}

/**
 * 1. GET ALL: Mengambil seluruh daftar karya seni dari MySQL Laravel
 */
export async function fetchArtworksFromApi() {
  const response = await fetch(`${API_BASE_URL}/artworks`, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Gagal mengambil data artworks (Status: ${response.status})`);
  }

  const result = await response.json();
  const list = Array.isArray(result.data) ? result.data : [];
  return list.map(formatArtworkFromApi);
}

/**
 * 2. CREATE (POST): Menambah karya baru dari Admin React ke MySQL Laravel
 */
export async function createArtworkInApi(payload) {
  const response = await authorizedFetch(`${API_BASE_URL}/artworks`, {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      category_id: payload.category === 'digital' ? 1 : 2,
      collection_type: payload.collectionType || 'portfolio',
    }),
  });

  if (!response.ok) {
    throw new Error(`Gagal menyimpan karya ke database (Status: ${response.status})`);
  }

  const result = await response.json();
  return formatArtworkFromApi(result.data);
}

/**
 * 3. UPDATE (PUT): Mengubah data karya dari Admin React ke MySQL Laravel
 */
export async function updateArtworkInApi(idOrSlug, changes) {
  const payload = { ...changes };
  if (changes.category) {
    payload.category_id = changes.category === 'digital' ? 1 : 2;
  }
  if (changes.collectionType) {
    payload.collection_type = changes.collectionType;
  }

  const response = await authorizedFetch(`${API_BASE_URL}/artworks/${idOrSlug}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gagal memperbarui karya di database (Status: ${response.status})`);
  }

  const result = await response.json();
  return formatArtworkFromApi(result.data);
}

/**
 * 4. DELETE: Menghapus karya dari Admin React di MySQL Laravel
 */
export async function deleteArtworkInApi(idOrSlug) {
  const response = await authorizedFetch(`${API_BASE_URL}/artworks/${idOrSlug}`, {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 404) {
    throw new Error(`Gagal menghapus karya di database (Status: ${response.status})`);
  }

  return true;
}