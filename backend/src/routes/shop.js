const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { checkoutLimiter } = require('../middleware/rateLimiter');
const { Product, Order } = require('../models');
const { Op } = require('sequelize');
const productSearchService = require('../services/productSearchService');

/**
 * POST /api/shop/recommendations
 * Get medicine recommendations based on disease and crop
 */
router.post('/recommendations', async (req, res) => {
  try {
    const { disease, crop, severity, treatment } = req.body;
    
    console.log('🔍 Fetching medicine recommendations for:', { disease, crop, severity });

    // Base medicine database - you can expand this or fetch from a real database
    const medicineDatabase = {
      fungicide: [
        {
          id: 'm1',
          name: 'Mancozeb 75% WP',
          brand: 'Dhanuka M-45',
          category: 'fungicide',
          price: 450,
          rating: 4.5,
          reviews: 234,
          dosage: '2-2.5 gm/liter',
          description: 'Broad spectrum contact fungicide for leaf spot, early blight, late blight diseases',
          shopLink: `https://www.amazon.in/s?k=mancozeb+fungicide+for+${encodeURIComponent(crop)}`,
          image: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=400&h=400&fit=crop',
          diseases: ['blight', 'leaf spot', 'fungal', 'rot']
        },
        {
          id: 'm4',
          name: 'Copper Oxychloride 50% WP',
          brand: 'Crystal Blitox',
          category: 'fungicide',
          price: 320,
          rating: 4.2,
          reviews: 167,
          dosage: '3 gm/liter',
          description: 'Protective fungicide for bacterial and fungal diseases',
          shopLink: `https://www.amazon.in/s?k=copper+oxychloride+fungicide`,
          image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=400&fit=crop',
          diseases: ['bacterial', 'fungal', 'blight', 'canker']
        },
        {
          id: 'm7',
          name: 'Carbendazim 50% WP',
          brand: 'Bavistin',
          category: 'fungicide',
          price: 380,
          rating: 4.6,
          reviews: 445,
          dosage: '1 gm/liter',
          description: 'Systemic fungicide for powdery mildew, leaf spot, and anthracnose',
          shopLink: `https://www.amazon.in/s?k=carbendazim+50+wp`,
          image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&h=400&fit=crop',
          diseases: ['mildew', 'powdery', 'leaf spot', 'anthracnose']
        }
      ],
      insecticide: [
        {
          id: 'm2',
          name: 'Chlorpyrifos 20% EC',
          brand: 'Tata Rallis',
          category: 'insecticide',
          price: 380,
          rating: 4.3,
          reviews: 189,
          dosage: '2.5 ml/liter',
          description: 'Effective against caterpillars, aphids, borers, and stem borers',
          shopLink: `https://www.amazon.in/s?k=chlorpyrifos+20+ec+insecticide`,
          image: 'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=400&h=400&fit=crop',
          diseases: ['caterpillar', 'borer', 'aphid', 'pest', 'insect']
        },
        {
          id: 'm3',
          name: 'Imidacloprid 17.8% SL',
          brand: 'Bayer Confidor',
          category: 'insecticide',
          price: 650,
          rating: 4.7,
          reviews: 456,
          dosage: '0.5 ml/liter',
          description: 'Systemic insecticide for sucking pests like aphids, whiteflies, jassids',
          shopLink: `https://www.amazon.in/s?k=imidacloprid+confidor`,
          image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=400&fit=crop',
          diseases: ['aphid', 'whitefly', 'jassid', 'thrips', 'pest']
        },
        {
          id: 'm8',
          name: 'Lambda Cyhalothrin 5% EC',
          brand: 'Karate',
          category: 'insecticide',
          price: 420,
          rating: 4.4,
          reviews: 298,
          dosage: '1 ml/liter',
          description: 'Fast-acting insecticide for lepidopteran pests and bollworms',
          shopLink: `https://www.amazon.in/s?k=lambda+cyhalothrin+insecticide`,
          image: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=400&h=400&fit=crop',
          diseases: ['bollworm', 'caterpillar', 'borer', 'pest']
        }
      ],
      fertilizer: [
        {
          id: 'm5',
          name: 'NPK 19:19:19',
          brand: 'Iffco NPK Fertilizer',
          category: 'fertilizer',
          price: 550,
          rating: 4.6,
          reviews: 892,
          dosage: '5 gm/liter',
          description: 'Balanced fertilizer for overall plant health, recovery, and stress management',
          shopLink: `https://www.amazon.in/s?k=npk+19+19+19+fertilizer`,
          image: 'https://images.unsplash.com/photo-1617196034796-73dfa7b1fd56?w=400&h=400&fit=crop',
          diseases: ['stress', 'deficiency', 'weakness']
        },
        {
          id: 'm9',
          name: 'Micronutrient Mix',
          brand: 'Multiplex',
          category: 'fertilizer',
          price: 280,
          rating: 4.3,
          reviews: 156,
          dosage: '2 gm/liter',
          description: 'Essential micronutrients for plant vigor and disease resistance',
          shopLink: `https://www.amazon.in/s?k=micronutrient+mix+plants`,
          image: 'https://images.unsplash.com/photo-1585159812596-fac104f2f069?w=400&h=400&fit=crop',
          diseases: ['stress', 'deficiency', 'yellowing']
        }
      ],
      organic: [
        {
          id: 'm6',
          name: 'Neem Oil 1500 PPM',
          brand: 'Organo Neem Oil',
          category: 'organic',
          price: 280,
          rating: 4.4,
          reviews: 321,
          dosage: '5 ml/liter',
          description: 'Organic solution for pests and fungal diseases. Safe for environment',
          shopLink: `https://www.amazon.in/s?k=neem+oil+1500+ppm`,
          image: 'https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=400&h=400&fit=crop',
          diseases: ['pest', 'fungal', 'aphid', 'mite', 'organic']
        },
        {
          id: 'm10',
          name: 'Bacillus Thuringiensis',
          brand: 'BT Pro',
          category: 'organic',
          price: 350,
          rating: 4.5,
          reviews: 234,
          dosage: '1-2 gm/liter',
          description: 'Biological insecticide for caterpillars and larvae. Eco-friendly',
          shopLink: `https://www.amazon.in/s?k=bacillus+thuringiensis+bt`,
          image: 'https://images.unsplash.com/photo-1466692476868-aef1dfb1e735?w=400&h=400&fit=crop',
          diseases: ['caterpillar', 'larvae', 'organic', 'borer']
        }
      ]
    };

    // Determine which categories to recommend based on disease name
    const diseaseLower = disease.toLowerCase();
    let recommendedMedicines = [];

    // Add fungicides if disease is fungal/bacterial
    if (diseaseLower.includes('blight') || diseaseLower.includes('spot') || 
        diseaseLower.includes('fungal') || diseaseLower.includes('rot') ||
        diseaseLower.includes('mildew') || diseaseLower.includes('rust') ||
        diseaseLower.includes('bacterial')) {
      let matchedFungicides = medicineDatabase.fungicide.filter(med =>
        med.diseases.some(d => diseaseLower.includes(d))
      );
      // Shuffle to get variety
      matchedFungicides = matchedFungicides.sort(() => Math.random() - 0.5);
      recommendedMedicines.push(...matchedFungicides.slice(0, 2));
    }

    // Add insecticides if disease is pest-related
    if (diseaseLower.includes('pest') || diseaseLower.includes('insect') ||
        diseaseLower.includes('worm') || diseaseLower.includes('aphid') ||
        diseaseLower.includes('borer') || diseaseLower.includes('caterpillar')) {
      let matchedInsecticides = medicineDatabase.insecticide.filter(med =>
        med.diseases.some(d => diseaseLower.includes(d))
      );
      // Shuffle to get variety
      matchedInsecticides = matchedInsecticides.sort(() => Math.random() - 0.5);
      recommendedMedicines.push(...matchedInsecticides.slice(0, 1));
    }

    // Add fertilizer/organic for stress and recovery
    if (diseaseLower.includes('stress') || diseaseLower.includes('deficiency') ||
        severity === 'high' || severity === 'severe') {
      recommendedMedicines.push(medicineDatabase.fertilizer[0]);
      recommendedMedicines.push(medicineDatabase.organic[0]);
    }

    // If no specific match, provide general recommendations with variety
    if (recommendedMedicines.length === 0) {
      // Shuffle each category to get different recommendations each time
      const shuffledFungicides = [...medicineDatabase.fungicide].sort(() => Math.random() - 0.5);
      const shuffledInsecticides = [...medicineDatabase.insecticide].sort(() => Math.random() - 0.5);
      
      recommendedMedicines = [
        ...shuffledFungicides.slice(0, 2),
        ...shuffledInsecticides.slice(0, 1)
      ];
    }

    // Remove duplicates and limit to 3 best medicines only
    recommendedMedicines = [...new Map(recommendedMedicines.map(m => [m.id, m])).values()].slice(0, 3);

    // Enrich with real product search using Google API (async)
    const enrichedMedicines = await Promise.all(
      recommendedMedicines.map(med => productSearchService.enrichMedicineData(med))
    );

    console.log(`✅ Returning top ${enrichedMedicines.length} best medicine recommendations with real product links`);

    res.json({
      success: true,
      medicines: enrichedMedicines,
      disease,
      crop
    });

  } catch (error) {
    console.error('Error fetching medicine recommendations:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to fetch medicine recommendations'
    });
  }
});

/**
 * GET /api/products
 * Get list of products
 */
router.get('/products', async (req, res) => {
  const { 
    category, 
    search, 
    page = 1, 
    limit = 20,
    featured 
  } = req.query;

  const whereClause = { active: true };

  if (category) {
    whereClause.category = category;
  }

  if (featured === 'true') {
    whereClause.featured = true;
  }

  if (search) {
    whereClause[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { description: { [Op.like]: `%${search}%` } },
      { brand: { [Op.like]: `%${search}%` } }
    ];
  }

  const products = await Product.findAndCountAll({
    where: whereClause,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit),
    order: [['featured', 'DESC'], ['createdAt', 'DESC']]
  });

  res.json({
    products: products.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: products.count,
      pages: Math.ceil(products.count / parseInt(limit))
    }
  });
});

/**
 * GET /api/products/:id
 * Get single product details
 */
router.get('/products/:id', async (req, res) => {
  const product = await Product.findByPk(req.params.id);

  if (!product || !product.active) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Product not found'
    });
  }

  res.json(product);
});

/**
 * POST /api/orders
 * Create a new order
 */
router.post('/orders', authenticate, checkoutLimiter, async (req, res) => {
  const { items, shippingAddress, paymentMethod = 'razorpay' } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Items array is required'
    });
  }

  if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Complete shipping address is required'
    });
  }

  // Validate products and calculate total
  let totalCents = 0;
  const orderItems = [];

  for (const item of items) {
    const product = await Product.findByPk(item.productId);

    if (!product || !product.active) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Product ${item.productId} not found or unavailable`
      });
    }

    if (product.stockQty < item.quantity) {
      return res.status(400).json({
        error: 'Validation Error',
        message: `Insufficient stock for ${product.name}`
      });
    }

    const itemTotal = product.priceCents * item.quantity;
    totalCents += itemTotal;

    orderItems.push({
      productId: product.id,
      name: product.name,
      quantity: item.quantity,
      priceCents: product.priceCents,
      total: itemTotal
    });
  }

  // Generate order number
  const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

  // Create order
  const order = await Order.create({
    userId: req.user.id,
    orderNumber,
    items: JSON.stringify(orderItems),
    totalCents,
    status: 'pending',
    paymentMethod,
    paymentStatus: 'pending',
    shippingAddress: JSON.stringify(shippingAddress)
  });

  res.json({
    orderId: order.id,
    orderNumber: order.orderNumber,
    total: (totalCents / 100).toFixed(2),
    status: order.status
  });
});

/**
 * GET /api/orders/:orderNumber
 * Get order details
 */
router.get('/orders/:orderNumber', authenticate, async (req, res) => {
  const order = await Order.findOne({
    where: { 
      orderNumber: req.params.orderNumber,
      userId: req.user.id
    }
  });

  if (!order) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Order not found'
    });
  }

  res.json({
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    items: JSON.parse(order.items),
    total: (order.totalCents / 100).toFixed(2),
    trackingNumber: order.trackingNumber,
    estimatedDelivery: order.estimatedDelivery,
    createdAt: order.createdAt
  });
});

/**
 * GET /api/orders/user/history
 * Get user's order history
 */
router.get('/orders/user/history', authenticate, async (req, res) => {
  const orders = await Order.findAll({
    where: { userId: req.user.id },
    order: [['createdAt', 'DESC']],
    limit: 50
  });

  const ordersWithParsedData = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: (order.totalCents / 100).toFixed(2),
    itemCount: JSON.parse(order.items).length,
    createdAt: order.createdAt
  }));

  res.json({ orders: ordersWithParsedData });
});

module.exports = router;
