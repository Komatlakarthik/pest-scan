const { User, Field, Product, Report, ExpertCase, Message, Order, Alert } = require('../models');
const logger = require('../utils/logger');

/**
 * Seed Database with Sample Data
 */
async function seedDatabase() {
  try {
    logger.info('Starting database seeding...');

    // Create sample users
    const users = await User.bulkCreate([
      {
        name: 'Rajesh Kumar',
        phone: '+919876543210',
        email: 'rajesh@example.com',
        language: 'hi',
        role: 'farmer',
        verified: true,
        active: true
      },
      {
        name: 'Priya Sharma',
        phone: '+919876543211',
        email: 'priya@example.com',
        language: 'en',
        role: 'farmer',
        verified: true,
        active: true
      },
      {
        name: 'Dr. Suresh Reddy',
        phone: '+919876543212',
        email: 'suresh@example.com',
        language: 'te',
        role: 'expert',
        verified: true,
        active: true
      },
      {
        name: 'Admin User',
        phone: '+919876543213',
        email: 'admin@example.com',
        language: 'en',
        role: 'admin',
        verified: true,
        active: true
      }
    ]);

    logger.info(`✅ Created ${users.length} users`);

    // Create sample fields
    const fields = await Field.bulkCreate([
      {
        userId: users[0].id,
        name: 'North Field',
        cropType: 'Tomato',
        size: 2.5,
        locationLat: 28.7041,
        locationLon: 77.1025,
        region: 'Delhi',
        sowDate: new Date('2024-09-15'),
        active: true
      },
      {
        userId: users[0].id,
        name: 'South Field',
        cropType: 'Potato',
        size: 3.0,
        locationLat: 28.6800,
        locationLon: 77.0900,
        region: 'Delhi',
        sowDate: new Date('2024-10-01'),
        active: true
      },
      {
        userId: users[1].id,
        name: 'Main Farm',
        cropType: 'Rice',
        size: 5.0,
        locationLat: 17.3850,
        locationLon: 78.4867,
        region: 'Hyderabad',
        sowDate: new Date('2024-08-20'),
        active: true
      }
    ]);

    logger.info(`✅ Created ${fields.length} fields`);

    // Create sample products
    const products = await Product.bulkCreate([
      {
        name: 'Mancozeb 75% WP Fungicide',
        brand: 'Dhanuka',
        category: 'fungicide',
        description: 'Broad-spectrum fungicide for control of various fungal diseases',
        priceCents: 42000,
        gstPercent: 18,
        stockQty: 150,
        unit: 'kg',
        imageUrl: 'https://via.placeholder.com/300x300?text=Mancozeb',
        rating: 4.5,
        reviewCount: 234,
        active: true,
        featured: true
      },
      {
        name: 'Neem Oil Organic Pesticide',
        brand: 'Neemrich',
        category: 'organic',
        description: 'Natural neem oil for organic pest control',
        priceCents: 28000,
        gstPercent: 18,
        stockQty: 200,
        unit: 'liter',
        imageUrl: 'https://via.placeholder.com/300x300?text=Neem+Oil',
        rating: 4.7,
        reviewCount: 456,
        active: true,
        featured: true
      },
      {
        name: 'NPK 19-19-19 Fertilizer',
        brand: 'IFFCO',
        category: 'fertilizer',
        description: 'Balanced NPK fertilizer for all crops',
        priceCents: 85000,
        gstPercent: 18,
        stockQty: 300,
        unit: 'kg',
        imageUrl: 'https://via.placeholder.com/300x300?text=NPK',
        rating: 4.3,
        reviewCount: 189,
        active: true,
        featured: false
      },
      {
        name: 'Chlorpyrifos 20% EC Insecticide',
        brand: 'Bayer',
        category: 'insecticide',
        description: 'Effective insecticide for sucking and chewing pests',
        priceCents: 65000,
        gstPercent: 18,
        stockQty: 100,
        unit: 'liter',
        imageUrl: 'https://via.placeholder.com/300x300?text=Chlorpyrifos',
        rating: 4.4,
        reviewCount: 321,
        active: true,
        featured: false
      },
      {
        name: 'Glyphosate 41% SL Herbicide',
        brand: 'Syngenta',
        category: 'herbicide',
        description: 'Non-selective herbicide for weed control',
        priceCents: 55000,
        gstPercent: 18,
        stockQty: 80,
        unit: 'liter',
        imageUrl: 'https://via.placeholder.com/300x300?text=Glyphosate',
        rating: 4.2,
        reviewCount: 145,
        active: true,
        featured: false
      },
      {
        name: 'Hand Sprayer 2L',
        brand: 'Venus',
        category: 'equipment',
        description: 'Manual hand sprayer for pesticide application',
        priceCents: 12000,
        gstPercent: 18,
        stockQty: 50,
        unit: 'piece',
        imageUrl: 'https://via.placeholder.com/300x300?text=Sprayer',
        rating: 4.0,
        reviewCount: 89,
        active: true,
        featured: false
      },
      {
        name: 'Copper Oxychloride 50% WP',
        brand: 'Rallis',
        category: 'fungicide',
        description: 'Protective fungicide for fruits and vegetables',
        priceCents: 38000,
        gstPercent: 18,
        stockQty: 120,
        unit: 'kg',
        imageUrl: 'https://via.placeholder.com/300x300?text=Copper',
        rating: 4.6,
        reviewCount: 267,
        active: true,
        featured: true
      },
      {
        name: 'Bio NPK Organic Fertilizer',
        brand: 'OrganicGrow',
        category: 'organic',
        description: 'Organic NPK fertilizer with beneficial microbes',
        priceCents: 95000,
        gstPercent: 18,
        stockQty: 75,
        unit: 'kg',
        imageUrl: 'https://via.placeholder.com/300x300?text=Bio+NPK',
        rating: 4.8,
        reviewCount: 412,
        active: true,
        featured: true
      },
      {
        name: 'Imidacloprid 17.8% SL',
        brand: 'Tata Rallis',
        category: 'insecticide',
        description: 'Systemic insecticide for aphids and whiteflies',
        priceCents: 72000,
        gstPercent: 18,
        stockQty: 90,
        unit: 'liter',
        imageUrl: 'https://via.placeholder.com/300x300?text=Imidacloprid',
        rating: 4.5,
        reviewCount: 198,
        active: true,
        featured: false
      },
      {
        name: 'Vermicompost Organic Manure',
        brand: 'EarthCare',
        category: 'organic',
        description: 'Premium quality vermicompost for soil enrichment',
        priceCents: 45000,
        gstPercent: 18,
        stockQty: 200,
        unit: 'kg',
        imageUrl: 'https://via.placeholder.com/300x300?text=Vermicompost',
        rating: 4.9,
        reviewCount: 534,
        active: true,
        featured: true
      }
    ]);

    logger.info(`✅ Created ${products.length} products`);

    // Create sample reports
    const reports = await Report.bulkCreate([
      {
        userId: users[0].id,
        fieldId: fields[0].id,
        imageUrl: 'https://via.placeholder.com/800x600?text=Late+Blight',
        diseaseName: 'Late Blight',
        confidence: 94.5,
        severity: 'high',
        cropType: 'Tomato',
        treatmentSummary: 'Apply Mancozeb fungicide, remove infected leaves',
        recoveryScore: 65
      },
      {
        userId: users[0].id,
        fieldId: fields[1].id,
        imageUrl: 'https://via.placeholder.com/800x600?text=Early+Blight',
        diseaseName: 'Early Blight',
        confidence: 89.2,
        severity: 'moderate',
        cropType: 'Potato',
        treatmentSummary: 'Apply copper-based fungicide',
        recoveryScore: 75
      },
      {
        userId: users[1].id,
        fieldId: fields[2].id,
        imageUrl: 'https://via.placeholder.com/800x600?text=Blast+Disease',
        diseaseName: 'Rice Blast',
        confidence: 92.8,
        severity: 'high',
        cropType: 'Rice',
        treatmentSummary: 'Apply tricyclazole fungicide',
        recoveryScore: 50
      }
    ]);

    logger.info(`✅ Created ${reports.length} reports`);

    // Create sample expert case
    const expertCase = await ExpertCase.create({
      reportId: reports[0].id,
      userId: users[0].id,
      assignedExpertId: users[2].id,
      status: 'in_progress',
      priority: 'high',
      description: 'Need urgent help with tomato late blight control'
    });

    logger.info('✅ Created expert case');

    // Create sample messages
    await Message.bulkCreate([
      {
        caseId: expertCase.id,
        senderId: users[0].id,
        messageType: 'text',
        messageText: 'My tomato crop is severely affected. What should I do?',
        read: true,
        readAt: new Date()
      },
      {
        caseId: expertCase.id,
        senderId: users[2].id,
        messageType: 'text',
        messageText: 'I recommend immediate application of Mancozeb fungicide. Also, improve drainage and remove affected leaves.',
        read: true,
        readAt: new Date()
      }
    ]);

    logger.info('✅ Created sample messages');

    // Create sample alert
    await Alert.create({
      region: 'Delhi',
      pestName: 'Late Blight Outbreak',
      cropTypes: ['Tomato', 'Potato'],
      riskLevel: 'high',
      riskScore: 85,
      reason: 'High humidity (80%) and optimal temperature (22°C) detected',
      recommendations: 'Monitor crops daily; Apply preventive fungicides; Improve field drainage',
      active: true,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    logger.info('✅ Created sample alert');

    logger.info('🎉 Database seeding completed successfully!');
    logger.info('');
    logger.info('Sample credentials:');
    logger.info('  Farmer: +919876543210 (OTP: 123456 in dev mode)');
    logger.info('  Expert: +919876543212 (OTP: 123456 in dev mode)');
    logger.info('  Admin:  +919876543213 (OTP: 123456 in dev mode)');

    process.exit(0);
  } catch (error) {
    logger.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
}

// Run seeder
seedDatabase();
