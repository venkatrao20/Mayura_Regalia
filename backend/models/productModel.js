const { getPool } = require('../config/db');

const selectFields = `
  id, name, category, price, original_price AS originalPrice,
  discount, rating, material, color, colors, in_stock AS inStock,
  description, image, images, sku, stock_quantity AS stockQuantity, low_stock_threshold AS lowStockThreshold,
  created_at AS createdAt, updated_at AS updatedAt
`;

// Some category labels in the nav are "umbrella" headings that aggregate
// several real product categories together (e.g. clicking "Fashion
// Jewellery" or "Silver Jewellery" shows everything underneath it, not a
// literal category called that).
const CATEGORY_GROUPS = {
  'fashion jewels': ['necklaces', 'earrings', 'bangles', 'rings', 'bridal jewellery', 'bracelets'],
  'silver jewellery': ['silver', 'german silver'],
};

async function findAll({ category, material, search } = {}) {
  let sql = `SELECT ${selectFields} FROM products`;
  const params = [];
  const conditions = [];

  if (category && category !== 'all') {
    const group = CATEGORY_GROUPS[category.toLowerCase().trim()];
    if (group) {
      conditions.push(`LOWER(category) IN (${group.map(() => '?').join(', ')})`);
      params.push(...group);
    } else {
      conditions.push('LOWER(category) = LOWER(?)');
      params.push(category);
    }
  }

  if (material) {
    conditions.push('LOWER(material) = LOWER(?)');
    params.push(material);
  }

  if (search) {
    conditions.push('(name LIKE ? OR category LIKE ? OR description LIKE ? OR material LIKE ?)');
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }

  if (conditions.length) sql += ` WHERE ${conditions.join(' AND ')}`;
  sql += ' ORDER BY id ASC';

  const [rows] = await getPool().query(sql, params);
  return rows.map(normalizeProduct);
}

async function findById(id) {
  const [rows] = await getPool().query(
    `SELECT ${selectFields} FROM products WHERE id = ? LIMIT 1`,
    [id]
  );
  return rows[0] ? normalizeProduct(rows[0]) : null;
}

async function create(product) {
  const [result] = await getPool().query(
    `INSERT INTO products
      (name, category, price, original_price, discount, rating, material, color, colors, in_stock, description, image, images,
       sku, stock_quantity, low_stock_threshold)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    values(product)
  );
  return findById(result.insertId);
}

async function update(id, product) {
  const [result] = await getPool().query(
    `UPDATE products SET
      name=?, category=?, price=?, original_price=?, discount=?, rating=?, material=?, color=?, colors=?,
      in_stock=?, description=?, image=?, images=?, sku=?, stock_quantity=?, low_stock_threshold=?
     WHERE id=?`,
    [...values(product), id]
  );
  return result.affectedRows ? findById(id) : null;
}

async function remove(id) {
  const [result] = await getPool().query('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function adjustStock(id, stockQuantity, lowStockThreshold) {
  const sets = ['stock_quantity = ?'];
  const params = [Number(stockQuantity || 0)];
  if (lowStockThreshold != null) { sets.push('low_stock_threshold = ?'); params.push(Number(lowStockThreshold)); }
  sets.push('in_stock = ?'); params.push(Number(stockQuantity) > 0 ? 1 : 0);
  params.push(id);
  const [result] = await getPool().query(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`, params);
  return result.affectedRows ? findById(id) : null;
}

function values(product) {
  // `colors` is the full list of available colours the admin picked; `color`
  // stays as a single primary colour (first of the list) so older parts of
  // the app that only know about one colour keep working.
  const colorList = Array.isArray(product.colors)
    ? product.colors.filter(Boolean)
    : (product.color ? [product.color] : []);

  // Support multiple images per product.
  // Normalize into an array of non-empty strings.
  let imageList = [];
  if (Array.isArray(product.images)) {
    imageList = product.images.filter(Boolean);
  } else if (typeof product.images === 'string' && product.images.trim()) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed)) imageList = parsed.filter(Boolean);
      else imageList = [product.images.trim()];
    } catch {
      imageList = [product.images.trim()];
    }
  }
  if (!imageList.length && product.image) {
    imageList = [product.image];
  }
  const primaryImage = imageList[0] || product.image || null;

  return [
    product.name,
    product.category,
    Number(product.price),
    product.originalPrice === '' || product.originalPrice == null ? null : Number(product.originalPrice),
    Number(product.discount || 0),
    Number(product.rating || 0),
    product.material || null,
    colorList[0] || product.color || null,
    colorList.length ? JSON.stringify(colorList) : null,
    product.inStock ? 1 : 0,
    product.description || null,
    primaryImage,
    imageList.length ? JSON.stringify(imageList) : null,
    product.sku || null,
    Number(product.stockQuantity || 0),
    Number(product.lowStockThreshold || 5),
  ];
}

function normalizeProduct(row) {
  let colors = row.colors;
  if (typeof colors === 'string') {
    try { colors = JSON.parse(colors); } catch { colors = colors ? [colors] : []; }
  }
  if (!Array.isArray(colors)) colors = colors ? [colors] : (row.color ? [row.color] : []);

  let images = row.images;
  if (typeof images === 'string') {
    try { images = JSON.parse(images); } catch { images = images ? [images] : []; }
  }
  if (!Array.isArray(images) || images.length === 0) {
    images = row.image ? [row.image] : [];
  }
  const primaryImage = images[0] || row.image || null;

  return {
    ...row,
    id: Number(row.id),
    price: Number(row.price),
    originalPrice: row.originalPrice == null ? null : Number(row.originalPrice),
    discount: Number(row.discount),
    rating: Number(row.rating),
    inStock: Boolean(row.inStock),
    colors,
    image: primaryImage,
    images,
  };
}

module.exports = { findAll, findById, create, update, remove, adjustStock };
