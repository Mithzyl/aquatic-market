import type { Promotion } from '../types';

export const promotions: Promotion[] = [
  {
    id: 'promo-1',
    productId: '1',
    type: 'discount',
    discount: 8.8,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    title: '限时88折',
    description: '新鲜海虾限时优惠'
  },
  {
    id: 'promo-2',
    productId: '2',
    type: 'special',
    promotionPrice: 99.0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    title: '特价',
    description: '大闸蟹限时特价'
  },
  {
    id: 'promo-3',
    productId: '3',
    type: 'discount',
    discount: 9.5,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    title: '95折',
    description: '基围虾专属优惠'
  },
  {
    id: 'promo-4',
    productId: '4',
    type: 'special',
    promotionPrice: 358.0,
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    title: '直降40元',
    description: '帝王蟹限时特惠'
  }
];

export const getPromotionByProductId = (productId: string): Promotion | undefined => {
  const now = new Date();
  return promotions.find(promo => {
    const startDate = new Date(promo.startDate);
    const endDate = new Date(promo.endDate);
    return promo.productId === productId && now >= startDate && now <= endDate;
  });
};

export const calculatePromotionPrice = (originalPrice: number, promotion: Promotion): number => {
  if (promotion.type === 'special' && promotion.promotionPrice) {
    return promotion.promotionPrice;
  } else if (promotion.type === 'discount' && promotion.discount) {
    return Math.round(originalPrice * promotion.discount / 10 * 100) / 100;
  }
  return originalPrice;
};
