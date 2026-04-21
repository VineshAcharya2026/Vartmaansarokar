import { NewsPost, MagazineIssue, Ad } from './types.js';

export const COLORS = {
  primary: '#800000',
  secondary: '#001f3f',
};

export const NEWS_CATEGORIES = [
  'National News', 'International News', 'Politics', 'Business', 'Economy',
  'Sports', 'Entertainment', 'Technology', 'Health', 'Environment', 'Education'
];

const ARTICLE_VARIANTS = [
  {
    title: 'Policy Shift Signals New Momentum',
    excerpt: 'A major update is reshaping the conversation with clear public impact and new opportunities for institutions.',
    content: 'A detailed development is gaining momentum across the country. Analysts say the decision reflects a deeper shift in priorities and could influence governance, investment, and public sentiment over the next few quarters.',
    author: 'Ananya Rao'
  },
  {
    title: 'Stakeholders Push for Faster Action',
    excerpt: 'Industry leaders and civic voices are calling for implementation that is both transparent and measurable.',
    content: 'The latest round of discussions has brought sharper focus to timelines, delivery, and accountability. Experts believe that the strongest outcomes will come from coordination between public agencies, private operators, and citizens.',
    author: 'Rohit Sen'
  },
  {
    title: 'Ground Reports Reveal Changing Priorities',
    excerpt: 'Field-level updates show how the issue is affecting communities, institutions, and the pace of decision-making.',
    content: 'On-the-ground reporting highlights how the latest developments are being felt beyond official statements. Local responses suggest both optimism and caution as implementation begins to take shape in real conditions.',
    author: 'Meera Kapoor'
  },
  {
    title: 'Experts Map the Long-Term Impact',
    excerpt: 'Specialists say the next phase will depend on execution quality, public trust, and sustained investment.',
    content: 'Researchers and policy observers argue that the long-term story will be written not by headlines alone but by continuity, clarity, and institutional discipline. Several indicators will be worth tracking in the months ahead.',
    author: 'Vikram Sethi'
  },
  {
    title: 'Public Response Adds Fresh Pressure',
    excerpt: 'Readers, consumers, and local groups are amplifying demands for better delivery and stronger safeguards.',
    content: 'The broader response has introduced a new layer of urgency. Public feedback suggests rising expectations around credibility, delivery standards, and communication from leadership at every level.',
    author: 'Nisha Verma'
  }
];

const NEWS_IMAGE_SOURCES = [
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1461896836934-bd45ba7b5e4a?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=500&fit=crop',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=500&fit=crop'
];

const MAGAZINE_COVERS = [
  'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=600&fit=crop',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=600&fit=crop'
];

const MAGAZINE_PAGES = [
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1523995462485-3d171b5c8fa9?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1461896836934-bd45ba7b5e4a?w=800&h=1200&fit=crop',
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&h=1200&fit=crop'
];

/** Three demo articles per category (aligned with production seed script). */
export const INITIAL_NEWS: NewsPost[] = NEWS_CATEGORIES.flatMap((category, categoryIndex) =>
  ARTICLE_VARIANTS.slice(0, 3).map((variant, articleIndex) => {
    const imageIndex = (categoryIndex * ARTICLE_VARIANTS.length + articleIndex) % NEWS_IMAGE_SOURCES.length;
    return {
      id: `${categoryIndex + 1}-${articleIndex + 1}`,
      title: `${category}: ${variant.title}`,
      category,
      excerpt: variant.excerpt,
      content: `${variant.content} This ${category.toLowerCase()} story continues to evolve with new perspectives from readers, editors, and subject-matter experts.`,
      image: NEWS_IMAGE_SOURCES[imageIndex],
      author: variant.author,
      date: new Date(2026, 2, 28 - (categoryIndex + articleIndex)).toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }),
      featured: categoryIndex < 2 && articleIndex === 0,
      requiresSubscription: articleIndex === 2
    };
  })
);

export const INITIAL_MAGAZINES: MagazineIssue[] = [
  {
    id: 'm1',
    title: 'The Future of Urban Living',
    issueNumber: 'October 2023',
    coverImage: MAGAZINE_COVERS[0],
    pages: MAGAZINE_PAGES.slice(0, 6),
    date: '2023-10-01',
    priceDigital: 0,
    pricePhysical: 499,
    isFree: true,
    gatedPage: 3
  },
  {
    id: 'm2',
    title: 'Digital Nomads & Remote Work',
    issueNumber: 'September 2023',
    coverImage: MAGAZINE_COVERS[1],
    pages: MAGAZINE_PAGES.slice(6, 10),
    date: '2023-09-01',
    priceDigital: 0,
    pricePhysical: 499,
    gatedPage: 2
  }
];

export const INITIAL_ADS: Ad[] = [
  {
    id: 'a1',
    title: 'Premium Watches',
    imageUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=800&h=400&fit=crop',
    link: 'https://example.com/watches',
    position: 'SIDEBAR_TOP'
  },
  {
    id: 'a2',
    title: 'Luxury Real Estate',
    imageUrl: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&h=400&fit=crop',
    link: 'https://example.com/homes',
    position: 'SIDEBAR_MID'
  },
  {
    id: 'a3',
    title: 'Cloud Computing Services',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&h=400&fit=crop',
    link: 'https://example.com/cloud',
    position: 'SIDEBAR_BOTTOM'
  }
];
