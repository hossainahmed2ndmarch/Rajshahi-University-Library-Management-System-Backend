import { PrismaClient, UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/**
 * Super Admin Seeding Configuration
 * Reads credentials from environment variables with safe fallbacks.
 */
const SUPER_ADMIN_CONFIG = {
  name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
  email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@library.com',
  phone: process.env.SUPER_ADMIN_PHONE || '01700000000',
  password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123!',
  identifier: process.env.SUPER_ADMIN_IDENTIFIER || 'SA-00001',
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
};

async function seedSuperAdmin(): Promise<void> {
  console.log('🚀 [SEED] Initializing Super Admin seeding sequence...');

  // Warn if sensitive credentials are defaulting
  if (!process.env.SUPER_ADMIN_EMAIL || !process.env.SUPER_ADMIN_PASSWORD) {
    console.warn(
      '⚠️  [SECURITY WARNING] SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not detected in environment. Using standard default fallbacks.'
    );
  }

  // 1. Hash administrative password securely
  const hashedPassword = await bcrypt.hash(
    SUPER_ADMIN_CONFIG.password,
    SUPER_ADMIN_CONFIG.saltRounds
  );

  // 2. Idempotent Upsert (Creates account if missing, updates details if already present)
  const superAdmin = await prisma.user.upsert({
    where: {
      email: SUPER_ADMIN_CONFIG.email,
    },
    update: {
      name: SUPER_ADMIN_CONFIG.name,
      phone: SUPER_ADMIN_CONFIG.phone,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      isPaid: true,
    },
    create: {
      name: SUPER_ADMIN_CONFIG.name,
      email: SUPER_ADMIN_CONFIG.email,
      phone: SUPER_ADMIN_CONFIG.phone,
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      studentOrVoterId: SUPER_ADMIN_CONFIG.identifier,
      isPaid: true,
      membershipStartedAt: new Date(),
    },
  });

  console.log('--------------------------------------------------');
  console.log('✅ [SEED SUCCESS] Super Admin account synchronized:');
  console.log(`   ID    : ${superAdmin.id}`);
  console.log(`   Name  : ${superAdmin.name}`);
  console.log(`   Email : ${superAdmin.email}`);
  console.log(`   Role  : ${superAdmin.role}`);
  console.log('--------------------------------------------------');
}

const SAMPLE_USERS = [
  {
    name: 'Dr. Abdur Rahman (Admin)',
    email: 'admin.rahman@ru.ac.bd',
    phone: '01710000002',
    password: 'Admin@123456',
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    studentOrVoterId: 'ADM-00002',
    department: 'Islamic Studies',
    institution: 'University of Rajshahi',
    isPaid: true,
  },
  {
    name: 'Hasan Mahmud (Duty Shifter)',
    email: 'shifter.hasan@ru.ac.bd',
    phone: '01710000003',
    password: 'Shifter@123456',
    role: UserRole.SHIFTER,
    status: UserStatus.ACTIVE,
    studentOrVoterId: 'SHF-00003',
    department: 'Arabic Literature',
    institution: 'University of Rajshahi',
    isPaid: true,
  },
  {
    name: 'Nusrat Jahan (Registered Member)',
    email: 'nusrat.student@ru.ac.bd',
    phone: '01710000004',
    password: 'Member@123456',
    role: UserRole.MEMBER,
    status: UserStatus.ACTIVE,
    studentOrVoterId: 'RU-2024-8891',
    department: 'Islamic History',
    institution: 'University of Rajshahi',
    isPaid: true,
  },
];

async function seedSampleUsers(): Promise<void> {
  console.log('👥 [SEED] Seeding Admin, Shifter, and Member accounts...');
  const salt = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;

  for (const u of SAMPLE_USERS) {
    const hashedPassword = await bcrypt.hash(u.password, salt);
    const startDate = new Date();
    const expireDate = new Date(startDate.getTime());
    expireDate.setFullYear(expireDate.getFullYear() + 1);

    await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        phone: u.phone,
        role: u.role,
        status: u.status,
        isPaid: u.isPaid,
        department: u.department,
        institution: u.institution,
      },
      create: {
        name: u.name,
        email: u.email,
        phone: u.phone,
        password: hashedPassword,
        role: u.role,
        status: u.status,
        studentOrVoterId: u.studentOrVoterId,
        department: u.department,
        institution: u.institution,
        isPaid: u.isPaid,
        membershipStartedAt: startDate,
        membershipExpiresAt: expireDate,
      },
    });
  }
  console.log('✅ [SEED SUCCESS] Sample users created/updated.');
}

const INITIAL_BOOKS = [
  {
    title: 'Tafsir Ibn Kathir (10 Volumes)',
    author: 'Ibn Kathir',
    isbn: '978-6035000147',
    locationCell: 'Rack-A1-01',
    category: 'Tafsir',
    publisher: 'Darussalam Publications',
    pages: 5600,
    type: 'HYBRID' as const,
    sellPrice: 3200,
    borrowStock: 12,
    sellStock: 8,
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000',
    description: 'The monumental classical Quranic commentary with authentic Hadith references.',
  },
  {
    title: 'Sahih al-Bukhari (Complete 6 Volumes)',
    author: 'Imam Muhammad al-Bukhari',
    isbn: '978-9960717319',
    locationCell: 'Rack-B2-04',
    category: 'Hadith',
    publisher: 'Darussalam',
    pages: 4200,
    type: 'BORROW_ONLY' as const,
    sellPrice: null,
    borrowStock: 15,
    sellStock: 0,
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=1000',
    description: 'The most authentic collection of Hadith, covering all aspects of Islamic life and theology.',
  },
  {
    title: 'Ar-Raheeq Al-Makhtum (The Sealed Nectar)',
    author: 'Safiur Rahman Mubarakpuri',
    isbn: '978-1591440710',
    locationCell: 'Rack-C1-12',
    category: 'Seerah',
    publisher: 'Darussalam',
    pages: 588,
    type: 'SELL_ONLY' as const,
    sellPrice: 480,
    borrowStock: 0,
    sellStock: 25,
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=1000',
    description: 'Award-winning biography of the Prophet Muhammad (peace be upon him).',
  },
  {
    title: 'Fiqh us-Sunnah (5 Volumes Edition)',
    author: 'Sayyid Sabiq',
    isbn: '978-0892590209',
    locationCell: 'Rack-D3-09',
    category: 'Fiqh',
    publisher: 'American Trust Publications',
    pages: 1400,
    type: 'HYBRID' as const,
    sellPrice: 1200,
    borrowStock: 10,
    sellStock: 5,
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1000',
    description: 'Comprehensive guide to Islamic jurisprudence and daily worship rituals according to authentic Sunnah.',
  },
  {
    title: 'Al-Bidayah wan-Nihayah (The Beginning & End)',
    author: 'Ibn Kathir',
    isbn: '978-9960897547',
    locationCell: 'Rack-A2-08',
    category: 'History',
    publisher: 'Dar-us-Salam',
    pages: 2800,
    type: 'BORROW_ONLY' as const,
    sellPrice: null,
    borrowStock: 8,
    sellStock: 0,
    coverImage: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&q=80&w=1000',
    description: 'Historic chronicle covering creation, the prophets, early Islamic history, and the caliphates.',
  },
  {
    title: 'Riyad us-Saliheen (Gardens of the Righteous)',
    author: 'Imam An-Nawawi',
    isbn: '978-2987456123',
    locationCell: 'Rack-B1-05',
    category: 'Spirituality',
    publisher: 'Darussalam',
    pages: 960,
    type: 'HYBRID' as const,
    sellPrice: 650,
    borrowStock: 20,
    sellStock: 15,
    coverImage: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&q=80&w=1000',
    description: 'Essential compilation of verses and hadiths for moral character and spiritual devotion.',
  },
  {
    title: 'Stories of the Prophets (Qasas al-Anbiya)',
    author: 'Ibn Kathir',
    isbn: '978-1591440000',
    locationCell: 'Rack-C2-01',
    category: 'History',
    publisher: 'Darussalam',
    pages: 620,
    type: 'SELL_ONLY' as const,
    sellPrice: 350,
    borrowStock: 0,
    sellStock: 30,
    coverImage: 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?auto=format&fit=crop&q=80&w=1000',
    description: 'Chronicles and biographies of all the prophets mentioned in the Holy Quran.',
  },
  {
    title: 'Fortress of the Muslim (Hisn al-Muslim)',
    author: "Sa'id bin Ali bin Wahf Al-Qahtani",
    isbn: '978-9960897295',
    locationCell: 'Rack-E1-01',
    category: 'Spirituality',
    publisher: 'Darussalam',
    pages: 240,
    type: 'SELL_ONLY' as const,
    sellPrice: 120,
    borrowStock: 0,
    sellStock: 50,
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&q=80&w=1000',
    description: 'Pocket-sized authentic collection of daily prayers, invocations, and supplications.',
  },
  {
    title: "Tafsir al-Qurtubi (Al-Jami' li Ahkam al-Qur'an)",
    author: 'Imam Al-Qurtubi',
    isbn: '978-1906949006',
    locationCell: 'Rack-A3-02',
    category: 'Tafsir',
    publisher: 'Dar al-Taqwa',
    pages: 3600,
    type: 'BORROW_ONLY' as const,
    sellPrice: null,
    borrowStock: 6,
    sellStock: 0,
    coverImage: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?auto=format&fit=crop&q=80&w=1000',
    description: 'Comprehensive legal commentary on the Quran focusing on Islamic legal rulings.',
  },
  {
    title: 'Principles of Islamic Jurisprudence (Usul al-Fiqh)',
    author: 'Mohammad Hashim Kamali',
    isbn: '978-0946621248',
    locationCell: 'Rack-D1-07',
    category: 'Fiqh',
    publisher: 'Islamic Texts Society',
    pages: 512,
    type: 'HYBRID' as const,
    sellPrice: 750,
    borrowStock: 14,
    sellStock: 10,
    coverImage: 'https://images.unsplash.com/photo-1463320726281-696a485928c7?auto=format&fit=crop&q=80&w=1000',
    description: 'Scholarly textbook on the methodologies, sources, and deductions of Islamic law.',
  },
];

async function seedBooks(adminId: number): Promise<void> {
  console.log('📚 [SEED] Synchronizing Islamic Library books catalog...');

  for (const book of INITIAL_BOOKS) {
    await prisma.book.upsert({
      where: { isbn: book.isbn },
      update: {
        title: book.title,
        author: book.author,
        locationCell: book.locationCell,
        category: book.category,
        publisher: book.publisher,
        pages: book.pages,
        type: book.type,
        sellPrice: book.sellPrice,
        borrowStock: book.borrowStock,
        sellStock: book.sellStock,
        coverImage: book.coverImage,
        description: book.description,
        isArchived: false,
      },
      create: {
        ...book,
        addedById: adminId,
      },
    });
  }

  console.log(`✅ [SEED SUCCESS] Successfully seeded ${INITIAL_BOOKS.length} books into the catalog.`);
}

async function main() {
  try {
    await seedSuperAdmin();
    await seedSampleUsers();
    // Fetch super admin ID
    const admin = await prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
    });
    if (admin) {
      await seedBooks(admin.id);
    }
  } catch (error) {
    console.error('❌ [SEED ERROR] Critical failure during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();