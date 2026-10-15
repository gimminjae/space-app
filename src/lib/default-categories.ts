import type {Category} from './types';
export const defaultCategories:Category[]=[
 ['경제 기초','basics','일상의 선택을 이해하는 경제의 기본 개념'],['거시경제','macro','숫자와 정책을 통해 읽는 더 큰 흐름'],['금융·금리','finance','돈의 흐름과 금융의 작동 원리'],['주식·기업','business','기업과 산업의 변화를 읽는 관점'],['부동산','real-estate','공간과 자산, 주거를 둘러싼 이야기'],['경제 이슈','issues','오늘의 경제 뉴스를 이해하는 맥락'],
].map(([name,slug,description],i)=>({id:`unconfigured-${slug}`,name,slug,description,sort_order:(i+1)*10}));
