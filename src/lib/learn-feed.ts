import {publicationFeed} from './server/publication-feed';
import type {Locale} from './i18n/routing';
export const courseFeed=(locale:Locale)=>publicationFeed(locale,'lesson');
