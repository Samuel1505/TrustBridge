export interface NGO {
  id: string;
  name: string;
  mission: string;
  description: string;
  email: string;
  website?: string;
  logo: string;
  images: string[];
  country: string;
  countryCode: string;
  verified: boolean;
  verificationDate: string;
  founderAddress: string;
  totalDonations: number;
  donorCount: number;
  recentDonations: Donation[];
}

export interface Donation {
  id: string;
  donor: string;
  amount: number;
  message?: string;
  timestamp: string;
  txHash: string;
}

export const mockNGOs: NGO[] = [
  {
    id: '1',
    name: 'Clean Water Initiative Kenya',
    mission: 'Providing clean drinking water to rural communities across Kenya',
    description: 'We work with local communities to build sustainable water infrastructure including wells, filtration systems, and rainwater harvesting. Since 2020, we have provided clean water access to over 50,000 people in 25 villages.',
    email: 'contact@cleanwaterkenya.org',
    website: 'https://cleanwaterkenya.org',
    logo: 'https://picsum.photos/seed/ngo1/400/400',
    images: [
      'https://picsum.photos/seed/water1/800/600',
      'https://picsum.photos/seed/water2/800/600',
      'https://picsum.photos/seed/water3/800/600',
    ],
    country: 'Kenya',
    countryCode: 'KE',
    verified: true,
    verificationDate: '2024-01-15',
    founderAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    totalDonations: 12500,
    donorCount: 89,
    recentDonations: [
      {
        id: 'd1',
        donor: '0x1234...5678',
        amount: 50,
        message: 'Keep up the great work!',
        timestamp: '2024-12-06T10:30:00Z',
        txHash: '0xabc123...',
      },
      {
        id: 'd2',
        donor: '0x9876...4321',
        amount: 100,
        timestamp: '2024-12-05T15:20:00Z',
        txHash: '0xdef456...',
      },
    ],
  },
  {
    id: '2',
    name: 'Education for All Nigeria',
    mission: 'Building schools and providing educational resources in underserved areas',
    description: 'Our mission is to ensure every child has access to quality education. We build schools, train teachers, and provide learning materials to communities that lack educational infrastructure.',
    email: 'info@educationnigeria.org',
    website: 'https://educationnigeria.org',
    logo: 'https://picsum.photos/seed/ngo2/400/400',
    images: [
      'https://picsum.photos/seed/edu1/800/600',
      'https://picsum.photos/seed/edu2/800/600',
    ],
    country: 'Nigeria',
    countryCode: 'NG',
    verified: true,
    verificationDate: '2024-02-20',
    founderAddress: '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
    totalDonations: 8750,
    donorCount: 62,
    recentDonations: [
      {
        id: 'd3',
        donor: '0x5555...6666',
        amount: 75,
        message: 'Education is the key to progress',
        timestamp: '2024-12-04T09:15:00Z',
        txHash: '0xghi789...',
      },
    ],
  },
  {
    id: '3',
    name: 'Healthcare Access Ghana',
    mission: 'Bringing medical care to remote villages in Ghana',
    description: 'We operate mobile clinics and train community health workers to provide basic healthcare services to villages without access to medical facilities. Our focus is on preventive care and maternal health.',
    email: 'contact@healthghana.org',
    logo: 'https://picsum.photos/seed/ngo3/400/400',
    images: [
      'https://picsum.photos/seed/health1/800/600',
      'https://picsum.photos/seed/health2/800/600',
      'https://picsum.photos/seed/health3/800/600',
    ],
    country: 'Ghana',
    countryCode: 'GH',
    verified: true,
    verificationDate: '2024-03-10',
    founderAddress: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
    totalDonations: 15200,
    donorCount: 103,
    recentDonations: [
      {
        id: 'd4',
        donor: '0x7777...8888',
        amount: 200,
        timestamp: '2024-12-03T14:45:00Z',
        txHash: '0xjkl012...',
      },
    ],
  },
  {
    id: '4',
    name: 'Green Earth South Africa',
    mission: 'Environmental conservation and reforestation projects',
    description: 'We plant trees, clean rivers, and educate communities about environmental sustainability. Our goal is to restore degraded ecosystems and combat climate change through grassroots action.',
    email: 'info@greenearthsa.org',
    website: 'https://greenearthsa.org',
    logo: 'https://picsum.photos/seed/ngo4/400/400',
    images: [
      'https://picsum.photos/seed/green1/800/600',
    ],
    country: 'South Africa',
    countryCode: 'ZA',
    verified: true,
    verificationDate: '2024-04-05',
    founderAddress: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    totalDonations: 6800,
    donorCount: 45,
    recentDonations: [],
  },
  {
    id: '5',
    name: 'Food Security Uganda',
    mission: 'Fighting hunger through sustainable agriculture programs',
    description: 'We teach modern farming techniques, provide seeds and tools, and help communities establish food cooperatives. Our programs have helped over 10,000 families achieve food security.',
    email: 'contact@fooduganda.org',
    logo: 'https://picsum.photos/seed/ngo5/400/400',
    images: [
      'https://picsum.photos/seed/food1/800/600',
      'https://picsum.photos/seed/food2/800/600',
    ],
    country: 'Uganda',
    countryCode: 'UG',
    verified: true,
    verificationDate: '2024-05-12',
    founderAddress: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
    totalDonations: 9400,
    donorCount: 71,
    recentDonations: [
      {
        id: 'd5',
        donor: '0x9999...0000',
        amount: 150,
        message: 'Supporting sustainable agriculture',
        timestamp: '2024-12-02T11:30:00Z',
        txHash: '0xmno345...',
      },
    ],
  },
  {
    id: '6',
    name: 'Tech Skills Tanzania',
    mission: 'Teaching coding and digital skills to youth',
    description: 'We run coding bootcamps and provide computers to schools in Tanzania. Our graduates have gone on to secure jobs in tech companies and start their own digital businesses.',
    email: 'info@techskillstz.org',
    website: 'https://techskillstz.org',
    logo: 'https://picsum.photos/seed/ngo6/400/400',
    images: [
      'https://picsum.photos/seed/tech1/800/600',
      'https://picsum.photos/seed/tech2/800/600',
      'https://picsum.photos/seed/tech3/800/600',
    ],
    country: 'Tanzania',
    countryCode: 'TZ',
    verified: true,
    verificationDate: '2024-06-18',
    founderAddress: '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
    totalDonations: 11300,
    donorCount: 84,
    recentDonations: [
      {
        id: 'd6',
        donor: '0x1111...2222',
        amount: 300,
        timestamp: '2024-12-01T16:00:00Z',
        txHash: '0xpqr678...',
      },
    ],
  },
];