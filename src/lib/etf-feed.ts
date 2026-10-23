import {publicationFeed} from './server/publication-feed';
import type {Locale} from './i18n/routing';
export const etfFeed=(locale:Locale)=>publicationFeed(locale,'etf');
