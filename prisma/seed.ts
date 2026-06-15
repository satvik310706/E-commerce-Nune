const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding database...');

  // 1. Create Site Settings (singleton)
  await prisma.siteSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: {
      id: 'singleton',
      codEnabled: true,
      freeShippingAbove: 500,
      shippingFee: 40,
      gstRate: 5,
      contactPhone: '+91 99999 99999',
      whatsappNumber: '+91 99999 99999',
      businessName: 'నూనె & పూజా బజార్ / Nune & Pooja Bazaar',
      businessEmail: 'support@nunebazaar.com',
    },
  });
  console.log('Site settings created/verified.');

  // 2. Create Default Users (Admin and Customer)
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const customerPasswordHash = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@nunebazaar.com' },
    update: {},
    create: {
      name: 'Nune Admin',
      email: 'admin@nunebazaar.com',
      password: adminPasswordHash,
      phone: '9876543210',
      role: 'ADMIN',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'satvish@gmail.com' },
    update: {},
    create: {
      name: 'Satvi Nune',
      email: 'satvish@gmail.com',
      password: customerPasswordHash,
      phone: '9999988888',
      role: 'CUSTOMER',
    },
  });

  // Create default address for customer
  const existingAddress = await prisma.address.findFirst({
    where: { userId: customer.id }
  });

  if (!existingAddress) {
    await prisma.address.create({
      data: {
        userId: customer.id,
        name: 'Satvi Nune',
        phone: '9999988888',
        line1: 'Flat 402, Golden Heritage Apartments',
        line2: 'Madhapur, Hitech City Road',
        city: 'Hyderabad',
        state: 'Telangana',
        pincode: '500081',
        isDefault: true,
      }
    });
  }
  console.log('Default users and address created/verified.');

  // 3. Create Categories
  const categoryOils = await prisma.category.upsert({
    where: { slug: 'oils' },
    update: {},
    create: {
      name: 'వంట & పూజా నూనెలు (Premium Oils)',
      nameTe: 'వంట & పూజా నూనెలు',
      slug: 'oils',
      image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?q=80&w=800&auto=format&fit=crop',
      description: 'సాంప్రదాయ పద్ధతిలో తయారుచేసిన గానుగ నూనెలు మరియు దీపారాధన నూనెలు',
      sortOrder: 1,
      isActive: true,
    },
  });

  const categoryPooja = await prisma.category.upsert({
    where: { slug: 'pooja-items' },
    update: {},
    create: {
      name: 'పూజా ద్రవ్యాలు (Sacred Pooja Items)',
      nameTe: 'పూజా ద్రవ్యాలు',
      slug: 'pooja-items',
      image: 'https://images.unsplash.com/photo-1609137144813-7d722d56e9c4?q=80&w=800&auto=format&fit=crop',
      description: 'భగవంతుని పూజ కొరకు నాణ్యమైన కర్పూరం, అగర్బత్తీలు మరియు ఇతర పూజా సామాగ్రి',
      sortOrder: 2,
      isActive: true,
    },
  });
  console.log('Categories created/verified.');

  // 4. Create Coupons
  const coupons = [
    {
      code: 'DEEPAM10',
      type: 'PERCENT',
      value: 10,
      minOrderValue: 200,
      maxDiscount: 100,
      isActive: true,
    },
    {
      code: 'FESTIVE50',
      type: 'FIXED',
      value: 50,
      minOrderValue: 500,
      isActive: true,
    },
    {
      code: 'PUREGOLD',
      type: 'PERCENT',
      value: 15,
      minOrderValue: 800,
      maxDiscount: 200,
      isActive: true,
    },
  ];

  for (const c of coupons) {
    await prisma.coupon.upsert({
      where: { code: c.code },
      update: {
        type: c.type,
        value: c.value,
        minOrderValue: c.minOrderValue,
        maxDiscount: c.maxDiscount,
        isActive: c.isActive,
      },
      create: c,
    });
  }
  console.log('Coupons created/verified.');

  // 5. Create Products
  const products = [
    {
      name: 'Cold Pressed Groundnut Oil (వేరుశనగ నూనె)',
      nameTe: 'వేరుశనగ నూనె (గానుగ)',
      slug: 'cold-pressed-groundnut-oil',
      description: 'సాంప్రదాయ చెక్క గానుగ ద్వారా స్వచ్ఛమైన పల్లీల నుండి తీయబడిన వేరుశనగ నూనె. ఎటువంటి రసాయనాలు లేదా ప్రిజర్వేటివ్స్ లేని సహజ సిద్ధమైన నూనె, వంటలకు రుచి మరియు ఆరోగ్యాన్ని అందిస్తుంది.',
      images: JSON.stringify(['/images/products/cold_pressed_groundnut_oil.png']),
      price: 280,
      mrp: 320,
      sku: 'OIL-GND-1L',
      stock: 50,
      unit: 'Litre',
      weight: 1.0,
      categoryId: categoryOils.id,
      benefits: JSON.stringify([
        '100% Cold Pressed / గానుగ నూనె',
        'Rich in Vitamin E / విటమిన్ E సమృద్ధిగా ఉంటుంది',
        'Zero Chemicals or Preservatives / ఎటువంటి రసాయనాలు లేవు',
        'Heart Healthy Cooking / గుండె ఆరోగ్యానికి మంచిది'
      ]),
      ingredients: JSON.stringify(['100% Pure Groundnut Seeds (వేరుశనగ గింజలు)']),
      usage: JSON.stringify(['రోజూ వంటలకు, ఫ్రైస్ మరియు పోపు వేయడానికి అనుకూలం.']),
      isActive: true,
    },
    {
      name: 'Pure Sesame Oil / Nuvvula Nune (నువ్వుల నూనె)',
      nameTe: 'స్వచ్ఛమైన నువ్వుల నూనె',
      slug: 'pure-sesame-oil',
      description: 'సాంప్రదాయ పద్ధతిలో తయారుచేసిన నల్ల నువ్వుల నూనె. పూజా గదిలో దీపారాధనకు శ్రేష్ఠమైనది మరియు ఒంటికి చలువ చేసే వంటలకు అనుకూలమైనది.',
      images: JSON.stringify(['/images/products/pure_sesame_oil.png']),
      price: 340,
      mrp: 380,
      sku: 'OIL-SES-1L',
      stock: 40,
      unit: 'Litre',
      weight: 1.0,
      categoryId: categoryOils.id,
      benefits: JSON.stringify([
        'Cold Pressed / గానుగ పద్ధతిలో తీసినది',
        'Auspicious for Diya & Pooja / దీపారాధనకు అత్యంత శ్రేష్ఠమైనది',
        'Rich in antioxidants / యాంటీఆక్సిడెంట్లు కలవు',
        'Traditional aroma / అద్భుతమైన సాంప్రదాయ సువాసన'
      ]),
      ingredients: JSON.stringify(['100% Pure Sesame Seeds (నల్ల నువ్వులు)']),
      usage: JSON.stringify(['దీపారాధనకు, నువ్వుల చట్నీలకు మరియు ఆయుర్వేద మసాజ్ లకు ఉపయోగిస్తారు.']),
      isActive: true,
    },
    {
      name: 'Cold Pressed Coconut Oil (కొబ్బరి నూనె)',
      nameTe: 'గానుగ కొబ్బరి నూనె',
      slug: 'cold-pressed-coconut-oil',
      description: 'ఎండబెట్టిన కొబ్బరి చిప్పల నుండి గానుగ ద్వారా తీసిన స్వచ్ఛమైన కొబ్బరి నూనె. జుట్టు సంరక్షణకు, శరీర మర్దనకు మరియు వంటలకు కూడా ఉపయోగించే బహుళ ప్రయోజన నూనె.',
      images: JSON.stringify(['/images/products/cold_pressed_coconut_oil.png']),
      price: 290,
      mrp: 330,
      sku: 'OIL-COC-1L',
      stock: 35,
      unit: 'Litre',
      weight: 1.0,
      categoryId: categoryOils.id,
      benefits: JSON.stringify([
        '100% Pure & Natural / స్వచ్ఛమైన కొబ్బరి నూనె',
        'Cold Pressed / గానుగ నూనె',
        'Great for hair & skin / జుట్టు మరియు చర్మ సంరక్షణకు',
        'Edible grade / వంటకు ఉపయోగించవచ్చు'
      ]),
      ingredients: JSON.stringify(['100% Pure Copra (స్వచ్ఛమైన కొబ్బరి ఎండు ముక్కలు)']),
      usage: JSON.stringify(['జుట్టుకు రాయడానికి, చర్మానికి మసాజ్ చేయడానికి, దీపారాధనకు మరియు దక్షిణ భారత వంటలకు ఉపయోగించవచ్చు.']),
      isActive: true,
    },
    {
      name: 'Pancha Deepam Pooja Oil (పంచ దీప నూనె)',
      nameTe: 'పంచ దీపారాధన నూనె',
      slug: 'pancha-deepam-pooja-oil',
      description: 'ఆరాధనకు అత్యంత పవిత్రమైన 5 నూనెల ప్రత్యేక కలయిక. దైవిక సువాసనలను అందించే సుగంధ ద్రవ్యాలు జోడించబడినవి.',
      images: JSON.stringify(['/images/products/pancha_deepam_pooja_oil.png']),
      price: 180,
      mrp: 210,
      sku: 'OIL-DEEP-1L',
      stock: 100,
      unit: 'Litre',
      weight: 1.0,
      categoryId: categoryOils.id,
      benefits: JSON.stringify([
        'Sacred 5-Oil Blend / పంచ దీప నూనె',
        'Divine Aroma / దైవిక సువాసన',
        'Soot-free long flame / మసి లేని నిలకడైన జ్వాల',
        'Attracts positive energy / ఇంట్లో లక్ష్మీ కటాక్షాన్ని కలిగిస్తుంది'
      ]),
      ingredients: JSON.stringify(['Sesame Oil (నువ్వుల నూనె)', 'Castor Oil (ఆముదము నూనె)', 'Coconut Oil (కొబ్బరి నూనె)', 'Neem Oil (వేప నూనె)', 'Mahua Oil (ఇప్ప నూనె)', 'Natural Sugandhi Perfume']),
      usage: JSON.stringify(['దీపాలు వెలిగించడానికి మాత్రమే. ఆహారంగా తీసుకోకూడదు.']),
      isActive: true,
    },
    {
      name: 'Premium Bhimseni Camphor (పచ్చ కర్పూరం)',
      nameTe: 'అసలైన భీమసేని పచ్చ కర్పూరం',
      slug: 'premium-bhimseni-camphor',
      description: 'నైవేద్యాలకు మరియు హారతికి ఉపయోగించే అత్యుత్తమ నాణ్యమైన పచ్చ కర్పూరం. ఇది గదిలో వెలిగిస్తే ఎటువంటి మసి రాదు, చుట్టుపక్కల వాతావరణం పవిత్రమైన సువాసనతో నిండిపోతుంది.',
      images: JSON.stringify(['/images/products/premium_bhimseni_camphor.png']),
      price: 150,
      mrp: 180,
      sku: 'PJ-KAR-100G',
      stock: 80,
      unit: 'Gram',
      weight: 100,
      categoryId: categoryPooja.id,
      benefits: JSON.stringify([
        '100% Organic & Pure / స్వచ్ఛమైన పచ్చ కర్పూరం',
        'Leaves zero residue / ఎటువంటి మసి వదలదు',
        'Relieves stress & purifies air / ప్రశాంతతను ఇస్తుంది',
        'Authentic Bhimseni / అసలైన భీమసేని రకం'
      ]),
      ingredients: JSON.stringify(['100% Pure Camphor flakes (స్వచ్ఛమైన కర్పూర బిళ్ళలు)']),
      usage: JSON.stringify(['పూజ హారతి ఇవ్వడానికి, నైవేద్యంలో చిటికెడు వేయడానికి, లేదా గదిలో సువాసన కొరకు ఉపయోగించవచ్చు.']),
      isActive: true,
    },
    {
      name: 'Premium Sugandha Agarbatti (సుగంధ అగర్బత్తీలు)',
      nameTe: 'ప్రీమియం సుగంధ అగర్బత్తీలు',
      slug: 'premium-sugandha-agarbatti',
      description: 'కృత్రిమ రసాయనాలు లేకుండా, సహజ మూలికలు మరియు పూల రసాలతో చేతితో తయారుచేసిన అగర్బత్తీలు. ప్రశాంతమైన మరియు ఆహ్లాదకరమైన పూజా వాతావరణాన్ని కలిగిస్తాయి.',
      images: JSON.stringify(['/images/products/premium_sugandha_agarbatti.png']),
      price: 60,
      mrp: 80,
      sku: 'PJ-AGB-150G',
      stock: 120,
      unit: 'Pack',
      weight: 150,
      categoryId: categoryPooja.id,
      benefits: JSON.stringify([
        'Charcoal free & Non-toxic / బొగ్గు లేని సురక్షితమైనది',
        'Long lasting aroma / గంటకు పైగా సువాసన నిలుస్తుంది',
        'Temple-like atmosphere / దేవాలయ అనుభూతి',
        'Natural essential oils / సహజ సుగంధ నూనెలు'
      ]),
      ingredients: JSON.stringify(['Natural Herbs (సహజ మూలికలు)', 'Floral Extracts (పూల రసాలు)', 'Bamboo Sticks']),
      usage: JSON.stringify(['అగర్బత్తీ అంచున నిప్పు అంటించి, కాసేపటికి జ్వాల ఆర్పి పూజా స్టాండ్ లో ఉంచాలి.']),
      isActive: true,
    },
    {
      name: 'Pure Desi Cow Ghee (ఆవు నెయ్యి)',
      nameTe: 'స్వచ్ఛమైన ఆవు నెయ్యి (పూజ & వంటకు)',
      slug: 'pure-desi-cow-ghee',
      description: 'దేశీయ ఆవు పాల నుండి సాంప్రదాయ బిలోనా పద్ధతిలో తయారుచేసిన స్వచ్ఛమైన నెయ్యి. పూజల్లో నెయ్యి దీపాలు వెలిగించడానికి మరియు దేవునికి నైవేద్యం సమర్పించడానికి అత్యంత ఉత్తమమైనది.',
      images: JSON.stringify(['/images/products/pure_desi_cow_ghee.png']),
      price: 420,
      mrp: 480,
      sku: 'PJ-GHEE-500G',
      stock: 30,
      unit: 'Gram',
      weight: 500,
      categoryId: categoryPooja.id,
      benefits: JSON.stringify([
        '100% Pure Desi Cow Ghee / స్వచ్ఛమైన ఆవు నెయ్యి',
        'Bilona Churned Curd Method / ద్విముఖ మజ్జిగ పద్ధతి',
        'Auspicious for Ghee Diya / నెయ్యి దీపానికి అత్యుత్తమం',
        'Rich aroma & taste / కమ్మని వాసన మరియు రుచి'
      ]),
      ingredients: JSON.stringify(['Cow Ghee (ఆవు పాలు మరియు వెన్న)']),
      usage: JSON.stringify(['పూజ దీపాలకు, నైవేద్యం మరియు నిత్య ఆహారంలో ఉపయోగించవచ్చు.']),
      isActive: true,
    },
    {
      name: 'Traditional Brass Diya (పంచలోహ దీపం)',
      nameTe: 'సాంప్రదాయ ఇత్తడి ప్రమిద / దీపం',
      slug: 'traditional-brass-diya',
      description: 'మన్నికైన మరియు సుందరమైన నమూనాతో చేయబడిన ఇత్తడి ప్రమిద. పూజా మందిరంలో దీపారాధనకు శోభను చేకూరుస్తుంది. పీతాంబరి లేదా చింతపండుతో సులభంగా శుభ్రపరచవచ్చు.',
      images: JSON.stringify(['/images/products/traditional_brass_diya.png']),
      price: 250,
      mrp: 300,
      sku: 'PJ-LAMP-BRS',
      stock: 25,
      unit: 'Piece',
      weight: 1.0,
      categoryId: categoryPooja.id,
      benefits: JSON.stringify([
        '100% Premium Brass / నాణ్యమైన ఇత్తడి',
        'Elegant traditional design / సాంప్రదాయ డిజైన్',
        'Easy to clean / సులభంగా శుభ్రం చేయవచ్చు',
        'Durable & long lasting / ఎక్కువ కాలం మన్నుతుంది'
      ]),
      ingredients: JSON.stringify(['Brass Alloy (ఇత్తడి లోహం)']),
      usage: JSON.stringify(['నూనె పోసి, దూది వత్తి వేసి దీపం వెలిగించాలి.']),
      isActive: true,
    },
    {
      name: 'Traditional Copper Kalasam (రాగి కలశం)',
      nameTe: 'సాంప్రదాయ రాగి కలశం',
      slug: 'traditional-copper-kalasam',
      description: 'వరలక్ష్మీ వ్రతం, గృహప్రవేశం మరియు పూజలలో పీఠంపై ఉంచే రాగి కలశం. రాగి పాత్రలు దైవిక తరంగాలను గ్రహించి నీటి శక్తిని పెంపొందిస్తాయి.',
      images: JSON.stringify(['/images/products/traditional_copper_kalasam.png']),
      price: 350,
      mrp: 400,
      sku: 'PJ-KLS-COP',
      stock: 15,
      unit: 'Piece',
      weight: 1.0,
      categoryId: categoryPooja.id,
      benefits: JSON.stringify([
        '99.9% Pure Copper / స్వచ్ఛమైన రాగి',
        'Auspicious for Kalasa Pooja / కలశ పూజకు శ్రేష్ఠమైనది',
        'Purifies water charges / నీటిని పవిత్రం చేస్తుంది',
        'Traditional design / సాంప్రదాయ డిజైన్'
      ]),
      ingredients: JSON.stringify(['Pure Copper Metal (స్వచ్ఛమైన రాగి లోహం)']),
      usage: JSON.stringify(['కలశంలో నీరు పోసి, పసుపు, కుంకుమ, నాణేలు వేసి, పైన కొబ్బరి బొండం మామిడి ఆకులతో పూజా అలంకరణ చేయాలి.']),
      isActive: true,
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        price: p.price,
        mrp: p.mrp,
        stock: p.stock,
        benefits: p.benefits,
        description: p.description,
        images: p.images,
        isActive: p.isActive,
      },
      create: p,
    });
  }
  console.log('Products created/verified.');

  // 6. Create home banners
  const banners = [
    {
      image: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?q=80&w=1200&auto=format&fit=crop',
      title: 'స్వచ్ఛమైన గానుగ నూనెలు',
      subtitle: 'Cold Pressed Oils for Healthy Living - 100% Pure & Natural',
      ctaLink: '/products?category=oils',
      sortOrder: 1,
      isActive: true,
    },
    {
      image: 'https://images.unsplash.com/photo-1561347136-27ad29add811?q=80&w=1200&auto=format&fit=crop',
      title: 'పవిత్రమైన పూజా ద్రవ్యాలు',
      subtitle: 'Divine Pooja Essentials for Your Daily Prayers & Vratams',
      ctaLink: '/products?category=pooja-items',
      sortOrder: 2,
      isActive: true,
    }
  ];

  for (let i = 0; i < banners.length; i++) {
    const b = banners[i];
    const existing = await prisma.banner.findFirst({
      where: { title: b.title }
    });
    if (!existing) {
      await prisma.banner.create({ data: b });
    }
  }
  console.log('Banners created/verified.');

  console.log('Database seeding successfully completed! 🎉');
}

main()
  .catch((e) => {
    console.error('Error during seeding database: ', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
