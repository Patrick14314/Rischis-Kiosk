import getUserAndProduct from '../utils/getUserAndProduct.js';
import purchaseProduct from '../utils/purchaseProduct.js';

export async function buyProduct(userId, productId, quantity) {
  const { user, product } = await getUserAndProduct(userId, productId);

  if (!product || product.stock < quantity) {
    return { error: 'Nicht genug Bestand' };
  }

  const result = await purchaseProduct(user, product, quantity);
  return result;
}
