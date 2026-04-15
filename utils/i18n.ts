import { TFunction } from 'i18next';
import { UserRole } from '../types';

const CATEGORY_KEY_MAP: Record<string, string> = {
  'National News': 'categories.nationalNews',
  'International News': 'categories.internationalNews',
  Politics: 'categories.politics',
  Business: 'categories.business',
  Economy: 'categories.economy',
  Sports: 'categories.sports',
  Entertainment: 'categories.entertainment',
  Technology: 'categories.technology',
  Health: 'categories.health',
  Environment: 'categories.environment',
  Education: 'categories.education'
};

const AD_TITLE_KEY_MAP: Record<string, string> = {
  'Premium Watches': 'ads.premiumWatches.title',
  'Luxury Real Estate': 'ads.luxuryRealEstate.title',
  'Cloud Computing Services': 'ads.cloudServices.title'
};

const AD_DESCRIPTION_KEY_MAP: Record<string, string> = {
  'Premium Watches': 'ads.premiumWatches.description',
  'Luxury Real Estate': 'ads.luxuryRealEstate.description',
  'Cloud Computing Services': 'ads.cloudServices.description'
};

const ROLE_KEY_MAP: Record<UserRole, string> = {
  [UserRole.SUBSCRIBER]: 'roles.general',
  [UserRole.EDITOR]: 'roles.magazine',
  [UserRole.ADMIN]: 'roles.admin',
  [UserRole.SUPER_ADMIN]: 'roles.superAdmin'
};

export const translateCategory = (t: TFunction, category: string) =>
  t(CATEGORY_KEY_MAP[category] || category, { defaultValue: category });

export const translateAdTitle = (t: TFunction, title: string) =>
  t(AD_TITLE_KEY_MAP[title] || title, { defaultValue: title });

export const translateAdDescription = (t: TFunction, title: string, fallbackText: string) =>
  t(AD_DESCRIPTION_KEY_MAP[title] || fallbackText, { defaultValue: fallbackText });

export const translateRole = (t: TFunction, role: UserRole) =>
  t(ROLE_KEY_MAP[role], { defaultValue: role });
