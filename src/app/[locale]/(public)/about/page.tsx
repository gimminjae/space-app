import Link from '@/components/I18n';
import styles from '@/components/site.module.css';
import { getI18n, localizedMetadata } from '@/lib/i18n/server';
import { site } from '@/lib/site';

export async function generateMetadata() {
  const { t, locale, absolute } = await getI18n();
  return localizedMetadata({
    title: t('space 소개'),
    description: locale === 'ko'
      ? '경제와 ETF를 처음 공부하는 독자를 위한 Space. 운영자, 자료 확인과 글의 수정 기준, 문의 방법을 소개합니다.'
      : 'Meet Space, a Korean and English publication for new economics and ETF readers. Our sources, editorial standards and contact details.',
    alternates: { canonical: absolute('/about') },
  }, locale);
}

export default async function About() {
  const { t, locale, absolute } = await getI18n();
  const ko = locale === 'ko';
  const author = !ko && site.author === 'space 에디터' ? 'Space editor' : site.author;
  const structuredData = {
    '@context': 'https://schema.org', '@type': 'AboutPage',
    url: absolute('/about'), name: t('space 소개'), inLanguage: locale,
    mainEntity: {
      '@type': 'Organization', name: 'space', url: absolute('/'), email: site.contactEmail,
      contactPoint: { '@type': 'ContactPoint', email: site.contactEmail, contactType: 'Editorial inquiries and corrections' },
    },
  };
  return <section className={styles.about}>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }} />
    <p className={styles.eyebrow}>ABOUT SPACE</p>
    <h1>{t('생각이 머물고,')}<br />{t('시야가 넓어지는 공간.')}</h1>
    <div className="prose">
      <p>{t('매일 새로운 숫자와 뉴스가 쏟아집니다. space는 그 사이에서 잠시 속도를 늦추고, 경제가 우리의 삶과 어떻게 연결되는지 살펴보는 블로그입니다.')}</p>
      <p>{ko ? '재테크와 경제를 처음 공부하는 독자를 위해 한국어와 영어로 글을 발행합니다. 모든 공개 글은 가입이나 결제 없이 읽을 수 있습니다.' : 'We publish in Korean and English for readers beginning to learn about money and economics. Every public article is available without an account or payment.'}</p>
      <h2>{t('우리가 다루는 이야기')}</h2>
      <p>{ko ? '경제 입문 강의 10편은 돈의 흐름, 금리, 분산투자와 주식을 차례로 다룹니다. ETF 연재 17편에서는 개별 상품과 비교 주제를 통해 지수, 비용, 분배금, 위험을 읽는 법을 살펴봅니다.' : 'Our ten introductory lessons explore money, interest rates, diversification and stocks. The seventeen-part ETF series uses fund profiles and comparisons to explain indexes, costs, distributions and risk.'}</p>
      <p><Link href="/learn">{ko ? '경제 입문 강의 읽기' : 'Read the introductory course'}</Link> · <Link href="/category/etf">{ko ? 'ETF 연재 읽기' : 'Read the ETF series'}</Link></p>
      <h2>{t('글을 쓰는 기준')}</h2>
      <p>{ko ? '상품을 설명할 때에는 운용사의 상품 페이지, 투자설명서와 공시를 먼저 확인합니다. 숫자에는 자료의 기준일을 함께 적고, 독자가 원문을 찾아볼 수 있도록 출처를 연결합니다. 글을 검토한 날짜와 통계가 집계된 날짜가 다를 때에는 구분해서 설명합니다.' : 'For fund details, we start with issuer pages, prospectuses and disclosures. We date the figures and link to source material so readers can check it. An article’s review date and the date of the underlying data are identified separately when they differ.'}</p>
      <p>{ko ? '설명을 위해 만든 표와 그림, 가상의 계산 예시는 실제 성과와 구분합니다. 분배율과 총수익률, 세전 금액과 실제로 받는 금액도 같은 뜻으로 쓰지 않습니다. 사실에 근거한 설명과 편집자의 해석을 나누고, 특정 상품의 수익이나 손실 회복을 약속하지 않습니다.' : 'Illustrations, tables and hypothetical calculations are distinguished from actual performance. Distribution rates are not treated as total returns, nor gross amounts as take-home income. We separate factual explanation from interpretation and do not promise returns or recovery from losses.'}</p>
      <h2>{ko ? 'ETF 글의 출발과 개정' : 'Where the ETF series began'}</h2>
      <p>{ko ? 'ETF 연재는 운영자가 티스토리에 썼던 글을 바탕으로, 상품 정보와 설명을 다시 확인해 Space용으로 개정한 글입니다. 각 글에는 원문과 확인에 사용한 공식 자료를 연결했습니다. 과거 글의 수치나 상품 설명을 현재에도 그대로 적용하지 않도록 기준일과 달라진 내용을 살펴봅니다.' : 'The ETF series revisits articles originally published by the operator on Tistory. Fund details and explanations were checked and revised for Space. Each article links to its original and the official material used for the revision, with dates and changes that help readers distinguish earlier information from the current discussion.'}</p>
      <p><a href="https://money-study-with-ai.tistory.com/category/ETF">{ko ? '티스토리 ETF 원문 모음' : 'The original ETF articles on Tistory'}</a></p>
      <h2 id="contact">{ko ? '운영자와 정정 문의' : 'Publisher and corrections'}</h2>
      <p>{author} · <a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p>
      <p>{ko ? '잘못된 수치나 오래된 설명을 발견하면 글 주소, 해당 문장, 확인할 수 있는 자료를 보내 주세요. 내용을 확인해 필요한 부분을 고치고 글의 수정일을 갱신합니다. 문의에는 계좌번호, 비밀번호 같은 민감한 정보를 보내지 않아도 됩니다.' : 'If you find an incorrect figure or an outdated explanation, send the article URL, the passage and a source we can check. We review corrections and update the article’s modification date when it changes. Please do not include account numbers, passwords or other sensitive information.'}</p>
      <p>{t('space의 글은 경제를 이해하기 위한 일반 정보입니다. 특정 상품의 매수·매도를 권유하거나 개인별 투자 자문을 제공하지 않습니다.')}</p>
      <p><Link href="/privacy">{t('개인정보처리방침')}</Link></p>
    </div>
  </section>;
}
