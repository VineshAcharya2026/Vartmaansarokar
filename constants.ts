
import { NewsPost, MagazineIssue, Ad, UserRole } from './types';

export const COLORS = {
  primary: '#800000', // Maroon Red
  secondary: '#001f3f', // Dark Blue
};

export const INITIAL_NEWS: NewsPost[] = [
  {
    id: '1',
    title: 'Government Announces New Infrastructure Policy',
    category: 'National News',
    excerpt: 'The central government has unveiled a trillion-dollar plan to modernize railways and highways.',
    content: 'Full content about infrastructure growth...',
    image: 'https://picsum.photos/800/500?random=1',
    author: 'John Doe',
    date: 'Oct 24, 2023',
    featured: true
  },
  {
    id: '2',
    title: 'Global Tech Giants Pivot to Sustainable AI',
    category: 'Technology',
    excerpt: 'Major technology companies are now investing heavily in energy-efficient data centers.',
    content: 'Artificial Intelligence continues to evolve...',
    image: 'https://picsum.photos/800/500?random=2',
    author: 'Jane Smith',
    date: 'Oct 23, 2023',
    featured: true
  },
  {
    id: '3',
    title: 'New Health Breakthrough in Gene Therapy',
    category: 'Health',
    excerpt: 'Researchers have discovered a more efficient way to treat hereditary blood disorders.',
    content: 'Science advances every day...',
    image: 'https://picsum.photos/800/500?random=3',
    author: 'Dr. Mike Ross',
    date: 'Oct 22, 2023'
  },
  {
    id: '4',
    title: 'Stock Market Hits All-Time High Amid Recovery',
    category: 'Business',
    excerpt: 'Investors show confidence as quarterly earnings exceed expectations across multiple sectors.',
    content: 'Financial markets saw a massive rally...',
    image: 'https://picsum.photos/800/500?random=4',
    author: 'Sarah Lee',
    date: 'Oct 21, 2023'
  },
  {
    id: '5',
    title: 'Local Team Wins Championship Thriller',
    category: 'Sports',
    excerpt: 'A last-minute goal secured the trophy for the underdogs in yesterday’s grand finale.',
    content: 'Sports fans are celebrating nationwide...',
    image: 'https://picsum.photos/800/500?random=5',
    author: 'Tom Brown',
    date: 'Oct 20, 2023'
  }
];

export const INITIAL_MAGAZINES: MagazineIssue[] = [
  {
    id: 'm1',
    title: 'The Future of Urban Living',
    issueNumber: 'October 2023',
    coverImage: 'https://picsum.photos/400/600?random=10',
    pages: [
      'https://picsum.photos/800/1200?random=20',
      'https://picsum.photos/800/1200?random=21',
      'https://picsum.photos/800/1200?random=22',
      'https://picsum.photos/800/1200?random=23',
      'https://picsum.photos/800/1200?random=24',
      'https://picsum.photos/800/1200?random=25',
    ],
    date: '2023-10-01',
    priceDigital: 399,
    pricePhysical: 499,
    isFree: true,
    gatedPage: 3
  },
  {
    id: 'm2',
    title: 'Digital Nomads & Remote Work',
    issueNumber: 'September 2023',
    coverImage: 'https://picsum.photos/400/600?random=11',
    pages: [
      'https://picsum.photos/800/1200?random=30',
      'https://picsum.photos/800/1200?random=31',
      'https://picsum.photos/800/1200?random=32',
      'https://picsum.photos/800/1200?random=33',
    ],
    date: '2023-09-01',
    priceDigital: 399,
    pricePhysical: 499,
    gatedPage: 2
  }
];

export const INITIAL_ADS: Ad[] = [
  {
    id: 'a1',
    title: 'Premium Watches',
    imageUrl: 'https://picsum.photos/300/600?random=101',
    link: 'https://example.com/watches',
    position: 'SIDEBAR_TOP'
  },
  {
    id: 'a2',
    title: 'Luxury Real Estate',
    imageUrl: 'https://picsum.photos/300/250?random=102',
    link: 'https://example.com/homes',
    position: 'SIDEBAR_MID'
  },
  {
    id: 'a3',
    title: 'Cloud Computing Services',
    imageUrl: 'https://picsum.photos/300/400?random=103',
    link: 'https://example.com/cloud',
    position: 'SIDEBAR_BOTTOM'
  }
];

export const NEWS_CATEGORIES = [
  'National News', 'International News', 'Politics', 'Business', 'Economy', 
  'Sports', 'Entertainment', 'Technology', 'Health', 'Environment', 'Education'
];
