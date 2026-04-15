-- DELETE EXISTING CONTENT TO AVOID CONFLICTS
DELETE FROM news;
DELETE FROM magazines;

-- NATIONAL NEWS (5 articles)
INSERT INTO news 
(id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date, created_at)
VALUES
('news-nat-001', 'National Policy Reform Brings New Opportunities', 'National News', 'The government announced sweeping policy reforms that will affect millions of citizens across India.', 'The government announced sweeping policy reforms that will affect millions of citizens across India. These changes are expected to bring significant economic growth and social development.', 'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=800&h=500&fit=crop', 'Ananya Rao', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-nat-002', 'Infrastructure Development Plan Unveiled', 'National News', 'A massive infrastructure development plan worth crores has been unveiled by the central government.', 'A massive infrastructure development plan worth crores has been unveiled by the central government. The plan includes highways, railways and digital infrastructure.', 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=500&fit=crop', 'Rohit Sen', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-nat-003', 'Education Reforms to Transform Learning', 'National News', 'New education policy changes will revolutionize how students learn across the country.', 'New education policy changes will revolutionize how students learn across the country. Digital learning tools will be introduced in all government schools.', 'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=500&fit=crop', 'Meera Kapoor', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-nat-004', 'Healthcare Access Expands to Rural Areas', 'National News', 'Government launches initiative to bring quality healthcare to underserved rural communities.', 'Government launches initiative to bring quality healthcare to underserved rural communities. Mobile health clinics will serve remote villages.', 'https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&h=500&fit=crop', 'Priya Sharma', 'user-editor-001', 0, 1, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-nat-005', 'Agricultural Subsidies Boosted for Farmers', 'National News', 'Farmers across India will receive increased subsidies to support their livelihoods.', 'Farmers across India will receive increased subsidies to support their livelihoods. The subsidy amount has been doubled compared to last year.', 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=500&fit=crop', 'Vikram Nair', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now'));

-- SPORTS (5 articles)
INSERT INTO news
(id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date, created_at)
VALUES
('news-spt-001', 'India Wins Historic Cricket Series', 'Sports', 'The Indian cricket team clinched a historic series victory with outstanding performances.', 'The Indian cricket team clinched a historic series victory with outstanding performances from all departments.', 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?w=800&h=500&fit=crop', 'Arjun Menon', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-spt-002', 'Indian Athletes Shine at International Games', 'Sports', 'Multiple Indian athletes brought glory to the nation at the international sporting event.', 'Multiple Indian athletes brought glory to the nation at the international sporting event. India finished in the top ten overall standings.', 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&h=500&fit=crop', 'Sunita Patel', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-spt-003', 'New Football League Season Kicks Off', 'Sports', 'The new football season begins with exciting matchups and new talent across all teams.', 'The new football season begins with exciting matchups and new talent across all teams.', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&h=500&fit=crop', 'Karan Verma', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-spt-004', 'Badminton Star Advances to World Finals', 'Sports', 'Indian badminton champion advances to the world championship finals with stunning wins.', 'Indian badminton champion advances to the world championship finals with stunning wins. The player defeated the top seed in the semis.', 'https://images.unsplash.com/photo-1544919982-b61976f0ba43?w=800&h=500&fit=crop', 'Deepa Krishnan', 'user-editor-001', 0, 1, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-spt-005', 'Chess Grandmaster Wins National Title', 'Sports', 'Young chess prodigy becomes national champion at record young age defeating all competitors.', 'Young chess prodigy becomes national champion at record young age defeating all competitors.', 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=800&h=500&fit=crop', 'Rajan Iyer', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now'));

-- BUSINESS (5 articles)
INSERT INTO news
(id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date, created_at)
VALUES
('news-biz-001', 'Indian Stock Market Reaches New Heights', 'Business', 'Sensex and Nifty reach record highs as investor confidence surges across all sectors.', 'Sensex and Nifty reach record highs as investor confidence surges across all sectors.', 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=500&fit=crop', 'Suresh Gupta', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-biz-002', 'Startup Ecosystem Attracts Record Funding', 'Business', 'Indian startups raised record funding this quarter across fintech, healthtech and edtech sectors.', 'Indian startups raised record funding this quarter across fintech, healthtech and edtech sectors.', 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=500&fit=crop', 'Nisha Agarwal', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-biz-003', 'Manufacturing Sector Shows Strong Growth', 'Business', 'Make in India initiative drives manufacturing growth with exports hitting record numbers.', 'Make in India initiative drives manufacturing growth with exports hitting record numbers.', 'https://images.unsplash.com/photo-1565043666747-69f6646db940?w=800&h=500&fit=crop', 'Amit Singh', 'user-editor-001', 0, 1, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-biz-004', 'Rupee Strengthens Against Major Currencies', 'Business', 'Indian Rupee shows strength against dollar and euro as trade balance improves significantly.', 'Indian Rupee shows strength against dollar and euro as trade balance improves significantly.', 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=500&fit=crop', 'Priya Menon', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-biz-005', 'Green Energy Investment Doubles This Year', 'Business', 'Renewable energy investments double as India accelerates transition to clean energy sources.', 'Renewable energy investments double as India accelerates transition to clean energy sources.', 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&h=500&fit=crop', 'Rahul Kumar', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now'));

-- INTERNATIONAL (5 articles)
INSERT INTO news
(id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date, created_at)
VALUES
('news-int-001', 'India Strengthens Diplomatic Ties with Europe', 'International', 'Prime Minister holds successful meetings with European leaders.', 'Prime Minister holds successful meetings with European leaders strengthening bilateral relations.', 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop', 'Kavita Sharma', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-int-002', 'Global Climate Summit Reaches New Agreement', 'International', 'World leaders agree on ambitious climate targets.', 'World leaders agree on ambitious climate targets with India playing a key leadership role.', 'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=800&h=500&fit=crop', 'Ravi Desai', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-int-003', 'BRICS Nations Expand Economic Cooperation', 'International', 'BRICS summit produces landmark agreements.', 'BRICS summit produces landmark agreements on trade, finance and development cooperation.', 'https://images.unsplash.com/photo-1457131760772-7017c6180f05?w=800&h=500&fit=crop', 'Neha Joshi', 'user-editor-001', 0, 1, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-int-004', 'Indian Diaspora Contributes to Global Economy', 'International', 'Indian diaspora remittances reach record levels.', 'Indian diaspora remittances reach record levels making India top recipient globally.', 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=500&fit=crop', 'Sanjay Pillai', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-int-005', 'Technology Partnership with Japan Announced', 'International', 'India and Japan announce major technology partnership.', 'India and Japan announce major technology partnership in semiconductors and AI research.', 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop', 'Anita Krishnan', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now'));

-- TECHNOLOGY (5 articles)
INSERT INTO news
(id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date, created_at)
VALUES
('news-tec-001', 'India Launches Indigenous AI Platform', 'Technology', 'Government unveils made in India AI platform.', 'Government unveils made in India AI platform to compete with global technology giants.', 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&h=500&fit=crop', 'Tech Desk', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-tec-002', 'Digital Payments Surge to Record Numbers', 'Technology', 'UPI transactions reach all time high.', 'UPI transactions reach all time high showing massive adoption of digital payments in India.', 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=500&fit=crop', 'Rahul Tech', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-tec-003', '5G Rollout Reaches Tier Two Cities', 'Technology', 'India 5G network expansion reaches smaller cities.', 'India 5G network expansion reaches smaller cities bringing high speed connectivity to millions.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=500&fit=crop', 'Network Reporter', 'user-editor-001', 0, 1, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-tec-004', 'Space Technology Startup Achieves Orbit', 'Technology', 'Private Indian space startup successfully launches satellite.', 'Private Indian space startup successfully launches satellite achieving major milestone.', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=800&h=500&fit=crop', 'Space Desk', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-tec-005', 'Cybersecurity Investment Grows Rapidly', 'Technology', 'Indian companies invest heavily in cybersecurity.', 'Indian companies invest heavily in cybersecurity as digital threats increase across sectors.', 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&h=500&fit=crop', 'Security Reporter', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now'));

-- ENTERTAINMENT (5 articles)
INSERT INTO news
(id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date, created_at)
VALUES
('news-ent-001', 'Bollywood Blockbuster Breaks Box Office Records', 'Entertainment', 'Latest Bollywood release shatters all box office records.', 'Latest Bollywood release shatters all box office records in opening weekend worldwide.', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&h=500&fit=crop', 'Entertainment Desk', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-ent-002', 'Indian Music Artists Top Global Charts', 'Entertainment', 'Indian musicians achieve historic global chart positions.', 'Indian musicians achieve historic global chart positions as Indian music gains worldwide fame.', 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=500&fit=crop', 'Music Reporter', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-ent-003', 'OTT Platforms See Record Indian Subscriptions', 'Entertainment', 'Streaming platforms report massive growth in Indian subscribers.', 'Streaming platforms report massive growth in Indian subscribers driven by original content.', 'https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=800&h=500&fit=crop', 'OTT Desk', 'user-editor-001', 0, 1, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-ent-004', 'National Award Winners Announced', 'Entertainment', 'Government announces national film awards.', 'Government announces national film awards recognizing best performances across languages.', 'https://images.unsplash.com/photo-1510511459019-5dda7724fd87?w=800&h=500&fit=crop', 'Awards Desk', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-ent-005', 'Theatre Arts Revival Across Indian Cities', 'Entertainment', 'Traditional and modern theatre sees massive revival.', 'Traditional and modern theatre sees massive revival with packed audiences in major cities.', 'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&h=500&fit=crop', 'Arts Reporter', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now'));

-- STATE NEWS (5 articles)
INSERT INTO news
(id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date, created_at)
VALUES
('news-sta-001', 'Maharashtra Launches Smart City Initiative', 'State News', 'Maharashtra government announces smart city program.', 'Maharashtra government announces smart city development program for major urban centers.', 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&h=500&fit=crop', 'State Desk', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-sta-002', 'Delhi Air Quality Improves with New Measures', 'State News', 'Delhi government reports significant improvement in air quality.', 'Delhi government reports significant improvement in air quality following new pollution controls.', 'https://images.unsplash.com/photo-1567603532416-2a116fa9df8c?w=800&h=500&fit=crop', 'Environment Desk', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-sta-003', 'Kerala Tourism Breaks All Records', 'State News', 'Kerala welcomes record number of tourists.', 'Kerala welcomes record number of tourists in latest quarter with nature tourism leading.', 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800&h=500&fit=crop', 'Tourism Reporter', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-sta-004', 'Rajasthan Solar Project Powers Villages', 'State News', 'Rajasthan solar energy project brings electricity.', 'Rajasthan solar energy project brings electricity to hundreds of previously unelectrified villages.', 'https://images.unsplash.com/photo-1509391366360-2e959784a276?w=800&h=500&fit=crop', 'Energy Desk', 'user-editor-001', 0, 1, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-sta-005', 'Tamil Nadu IT Corridor Attracts Investment', 'State News', 'Tamil Nadu tech corridor attracts major global IT companies.', 'Tamil Nadu tech corridor attracts major global IT companies creating thousands of new jobs.', 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&h=500&fit=crop', 'Business Desk', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now'));

-- POLITICS (5 articles)
INSERT INTO news
(id, title, category, excerpt, content, image, author, author_id, featured, requires_subscription, status, published_at, date, created_at)
VALUES
('news-pol-001', 'Parliament Session Passes Historic Bills', 'Politics', 'Parliament concludes productive session.', 'Parliament concludes productive session passing several landmark bills on economy and welfare.', 'https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&h=500&fit=crop', 'Political Desk', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-pol-002', 'Coalition Government Shows Unity on Development', 'Politics', 'Coalition partners present united front.', 'Coalition partners present united front on major development agenda across the country.', 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&h=500&fit=crop', 'Politics Reporter', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-pol-003', 'Election Commission Announces New Guidelines', 'Politics', 'Election Commission releases updated guidelines.', 'Election Commission releases updated guidelines for fair and transparent electoral process.', 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800&h=500&fit=crop', 'Election Desk', 'user-editor-001', 0, 1, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-pol-004', 'Local Governance Reform Empowers Panchayats', 'Politics', 'New policy gives more power and resources to village panchayats.', 'New policy gives more power and resources to village panchayats for local development.', 'https://images.unsplash.com/photo-1573164713988-8665fc963095?w=800&h=500&fit=crop', 'Governance Desk', 'user-editor-001', 0, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now')),
('news-pol-005', 'Youth Politicians Changing the Landscape', 'Politics', 'New generation of young politicians bringing fresh ideas.', 'New generation of young politicians bringing fresh ideas and energy to Indian democracy.', 'https://images.unsplash.com/photo-1559523161-0fc0d8b814c4?w=800&h=500&fit=crop', 'Youth Desk', 'user-editor-001', 1, 0, 'PUBLISHED', datetime('now'), date('now'), datetime('now'));

-- SAMPLE MAGAZINES (3 issues)
INSERT INTO magazines
(id, title, issue_number, cover_image, pdf_url, pages, price_digital, price_physical, gated_page, is_free, blur_paywall, status, date, created_at)
VALUES
(
  'mag-001',
  'वर्तमान सरोकार — April 2026',
  'Vol. 1, Issue 4 — April 2026',
  'https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=400&h=600&fit=crop',
  'https://main.vartmaan-sarokar-pages.pages.dev/sample.pdf',
  json('["https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=800&h=1200&fit=crop","https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=1200&fit=crop","https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=1200&fit=crop","https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&h=1200&fit=crop","https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=1200&fit=crop"]'),
  99,
  299,
  3,
  0,
  1,
  'PUBLISHED',
  date('now'),
  datetime('now')
),
(
  'mag-002',
  'वर्तमान सरोकार — March 2026',
  'Vol. 1, Issue 3 — March 2026',
  'https://images.unsplash.com/photo-1495020689067-958852a7765e?w=400&h=600&fit=crop',
  'https://main.vartmaan-sarokar-pages.pages.dev/sample.pdf',
  json('["https://images.unsplash.com/photo-1495020689067-958852a7765e?w=800&h=1200&fit=crop","https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=800&h=1200&fit=crop","https://images.unsplash.com/photo-1568992687947-868a62a9f521?w=800&h=1200&fit=crop"]'),
  99,
  299,
  3,
  0,
  1,
  'PUBLISHED',
  date('now', '-1 month'),
  datetime('now')
),
(
  'mag-003',
  'Special Edition — Free Issue',
  'Special Edition 2026',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=400&h=600&fit=crop',
  'https://main.vartmaan-sarokar-pages.pages.dev/sample.pdf',
  json('["https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&h=1200&fit=crop","https://images.unsplash.com/photo-1504711434969-e33886168d8c?w=800&h=1200&fit=crop"]'),
  0,
  0,
  10,
  1,
  0,
  'PUBLISHED',
  date('now', '-2 months'),
  datetime('now')
);
