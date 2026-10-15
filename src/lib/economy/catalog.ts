import topicData from '../../../content/topics.json';
import termData from '../../../content/glossary.json';
import indicatorData from '../../../content/indicators.json';
import seriesData from '../../../content/series.json';
import type {Indicator,Series,Term,Topic} from './types';
export const topics=topicData as Topic[];
export const glossary=termData as Term[];
export const indicators=indicatorData as Indicator[];
export const series=seriesData as Series[];
