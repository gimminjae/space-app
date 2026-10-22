import { readFile, writeFile } from 'node:fs/promises';
import { incomeScenario, capitalForIncome } from './lib/etf-income.mjs';

const directory = new URL('../content/etf/', import.meta.url);
const data = JSON.parse(await readFile(new URL('income-scenarios.json', directory), 'utf8'));
const manifestFile = new URL('manifest.json', directory);
const manifest = JSON.parse(await readFile(manifestFile, 'utf8'));
const funds = new Map(data.funds.map(fund => [fund.slug, fund]));
const start = '<!-- income-example:start -->';
const end = '<!-- income-example:end -->';
const number = value => Math.round(value).toLocaleString('en-US');
const wonBudget = value => {
  const units = Math.ceil(value / 10000), hundredMillions = Math.floor(units / 10000), remainder = units % 10000;
  return hundredMillions ? `${number(hundredMillions)}억${remainder ? ` ${number(remainder)}만` : ''} 원` : `${number(units)}만 원`;
};
const money = (value, locale, currency) => locale === 'ko' ? `${number(value)}원` : currency === 'KRW' ? `₩${number(value)}` : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const capital = (value, locale, currency) => locale === 'ko' ? `약 ${wonBudget(value)}` : currency === 'KRW' ? `about ₩${number(Math.ceil(value / 10000) * 10000)}` : `about $${number(Math.ceil(value / 100) * 100)}`;
const percent = fund => (fund.annualBps / 100).toFixed(2);
const basis = {
  ko: { ttm: '최근 12개월 분배율', annualized: '최근 분배금을 연간으로 환산한 분배율', rolling: '12개월 누적 분배율', 'monthly-notice': '9월 예상 월분배율' },
  en: { ttm: 'trailing 12-month distribution yield', annualized: 'annualized recent distribution rate', rolling: '12-month rolling dividend yield', 'monthly-notice': 'announced expected September monthly distribution rate' },
};
const intros = {
  schd: ['SCHD에 1천만 원을 넣으면 배당으로 얼마나 받을 수 있을까. 배당이 자란다는 설명도 좋지만, 먼저 지금의 현금 규모를 알아야 내 생활과 연결된다. 분기마다 들어오는 돈을 월평균으로 나눠 본 뒤, 그 배당을 만드는 기업들을 살펴보자.', 'How much income could $10,000 in SCHD represent? Dividend growth becomes easier to grasp when it starts with a cash amount. First translate its quarterly distributions into a monthly average, then look at the companies behind those payments.'],
  qdiv: ['매달 들어오는 배당금이 커피값 정도일지, 공과금에 보탬이 될 정도일지 궁금하다. QDIV는 배당수익률과 기업의 재무 상태를 함께 살피는 월분배 ETF다. 투자금별 현금 규모를 먼저 계산하고, 이름에 들어 있는 ‘퀄리티’가 어떤 기준인지 읽어보자.', 'Would a monthly QDIV payment cover a coffee habit or contribute to a utility bill? Put a cash figure beside the investment first. Then examine how this monthly distribution ETF combines dividend yield with a screen for financial quality.'],
  'plus-high-dividend': ['익숙한 한국 기업에 투자하고 원화로 매달 돈을 받는다면, 천만 원으로 어느 정도의 현금흐름을 만들 수 있을까. PLUS 고배당주는 주당 분배금과 주가를 알면 직접 계산해 볼 수 있다. 실제로 살 수 있는 주식 수부터 세어 보자.', 'How much monthly cash might a ₩10 million investment in Korean dividend stocks provide? With PLUS High Dividend, a quoted price and a payment per share make the calculation tangible. Start by counting the whole shares the budget could buy.'],
  'ace-global-income-top10': ['ETF 열 개를 한 번에 담으면서 매달 분배금을 받는다면 통장에는 얼마나 들어올까. ACE 글로벌인컴TOP10을 이해하는 첫걸음은 거창한 자산배분표보다 이 작은 계산일 수 있다. 운용사의 분배 안내를 원화 금액으로 바꿔 본 뒤, 안에 담긴 ETF들을 열어보자.', 'What could a basket of ten income ETFs put into an account each month? For ACE Global Income TOP10, that simple question offers a useful starting point. Translate the issuer’s distribution notice into won, then open the wrapper and examine the underlying funds.'],
  divo: ['배당을 받으면서 주가가 오를 여지도 남겨두고 싶다. DIVO에 관심을 갖게 되는 이유다. 그렇다면 1천만 원, 5천만 원을 투자했을 때 월분배금은 어느 정도일까. 현금 규모를 먼저 가늠한 뒤, 배당주에 옵션을 선택적으로 얹는 방식을 살펴보자.', 'DIVO appeals to investors who want cash distributions while retaining some room for stock-price growth. What might that mean for a $10,000 or $50,000 investment? Begin with the cash arithmetic, then consider how selective option writing supplements company dividends.'],
  qdvo: ['성장주를 오래 갖고 싶지만 매달 쓸 돈도 있으면 좋겠다. QDVO는 그 두 가지 바람이 만나는 상품이다. 월 50만 원이라는 목표를 놓고 얼마가 필요한지 계산해 보면, 높은 분배율도 막연한 숫자에서 구체적인 투자 규모로 바뀐다.', 'Holding growth stocks and receiving monthly cash are both appealing. QDVO brings those aims into one portfolio. Working backward from a $500 monthly target turns a large-looking distribution rate into a concrete capital requirement.'],
  idvo: ['미국 밖 기업에 투자하면서 달러 분배금을 받는다면 현금흐름은 얼마나 달라질까. IDVO의 투자 지역을 살펴보기 전에, 같은 천만 원이 어느 정도의 월분배금으로 환산되는지부터 보자. 익숙하지 않은 상품도 내 돈을 기준으로 계산하면 한결 가까워진다.', 'How much income could a fund investing beyond the United States provide? Before exploring IDVO’s geographic mix, translate its distribution rate into a familiar investment amount. Dollar trading and international company exposure are separate features of this fund.'],
  jepi: ['JEPI를 찾아보는 사람이 가장 먼저 떠올리는 질문은 단순하다. ‘천만 원을 넣으면 매달 얼마를 받을까?’ 월분배금을 생활비에 보태고 싶다면, 운용 방식에 앞서 현금 규모부터 그려 보는 것이 자연스럽다. 공식 자료의 분배율로 계산한 다음, 그 돈이 어디에서 나오는지 따라가 보자.', 'A natural first question about JEPI is simple: how much monthly cash could $10,000 represent? If distributions might help with household bills, start with the amount. Then follow the money back to the stocks and contracts that produce it.'],
  jepq: ['좋아하는 기술기업은 많은데 배당금은 적다. JEPQ의 월분배에 눈길이 가는 이유다. 천만 원으로 받을 수 있는 돈과 월 50만 원에 필요한 돈을 나란히 놓으면, 성장주를 담은 인컴 ETF가 내 계획에서 어느 정도 크기를 차지할지 보인다.', 'Many familiar technology companies pay little in dividends. That helps explain the appeal of JEPQ’s monthly distributions. Put the cash from $10,000 beside the capital required for $500 a month, then examine the equity exposure that remains.'],
  gpix: ['S&P 500에 연결된 주식을 보유하면서 매달 생활비를 조금씩 받을 수 있을까. GPIX를 볼 때 먼저 해볼 계산이다. 천만 원과 1억 원의 월 현금 규모를 비교하고 나면, 옵션을 얼마나 매도하는지가 왜 중요한지도 더 쉽게 이해할 수 있다.', 'Could an investment in US large-cap stocks help fund monthly spending? GPIX approaches that question with an option overlay. Start with cash illustrations for different investment amounts; the choice of how much option exposure to sell then becomes more concrete.'],
  gpiq: ['나스닥에 투자하면서 매달 돈을 받는다고 할 때, ‘매달’만큼 궁금한 말은 ‘얼마’다. GPIQ의 공식 분배율을 원화 투자금에 대입해 보자. 계좌에 들어올 현금의 규모를 짚고 나면, 그 현금을 만들기 위해 어떤 선택을 하는지 읽을 차례다.', 'When a Nasdaq income ETF promises a monthly schedule, the next question is how much. Apply GPIQ’s reported distribution measure to several investment sizes. Once the cash scale is clear, examine the choices the fund makes to generate it.'],
  spyi: ['연 12% 안팎이라는 분배율을 보면 천만 원으로 매달 10만 원쯤 받을 수 있을지 계산하게 된다. SPYI에 관심을 갖는 자연스러운 출발점이다. 공식 수치를 실제 금액으로 바꿔 보고, 그 현금과 계좌 전체의 수익이 어떻게 다른지 차례로 살펴보자.', 'A distribution rate around 12% invites a quick calculation: might $10,000 translate into roughly $100 a month? That is a useful starting point for SPYI. Work through the reported number, then distinguish cash received from the return on the whole investment.'],
  qqqi: ['QQQI의 14%대 분배율을 보면 가장 먼저 궁금한 것은 월 수령액이다. 1천만 원이면 얼마인지, 월 100만 원을 바라보려면 얼마나 필요한지. 이 질문부터 계산해 보자. 숫자의 크기를 손에 잡히게 만든 뒤, 그 분배금을 만드는 나스닥 주식과 옵션을 살펴보면 된다.', 'QQQI’s distribution rate in the 14% range naturally raises a cash question. What does it mean for $10,000, and how much capital would a $1,000 monthly target require? Begin there, then examine the Nasdaq stocks and options behind the payments.'],
  'rise-200-weekly-covered-call': ['국내 주식에 투자하고 매달 원화로 분배금을 받는다면, 천만 원으로 얼마를 받을 수 있을까. RISE 200위클리커버드콜은 최근 주당 지급액을 살 수 있는 주식 수에 곱하면 금방 계산된다. 그 금액을 먼저 확인하고, 주식과 위클리 옵션의 관계를 읽어보자.', 'What monthly won payment could ₩10 million in RISE 200 Weekly Covered Call represent? Multiply a recent per-share payment by the whole shares the budget could buy. After doing that calculation, examine the relationship between the stocks and weekly options.'],
  'plus-fixed-covered-call': ['PLUS 고배당주위클리고정커버드콜에 천만 원을 넣으면 한 달에 얼마를 받을까. 긴 상품 이름보다 이 질문이 먼저 와닿는다. 최근 지급액으로 계산을 해본 뒤, 이름의 ‘고정’이 분배금이 아니라 옵션 매도 구조를 가리킨다는 점을 살펴보자.', 'How much monthly cash might ₩10 million in PLUS High Dividend Weekly Fixed Covered Call provide? That question is easier to approach than the long name. Calculate with the recent payment, then examine why “fixed” describes the option structure rather than a promised distribution.'],
  'spyi-jepi-divo-gpix': ['같은 천만 원을 SPYI, JEPI, DIVO, GPIX에 각각 넣으면 월분배금은 얼마나 다를까. 네 상품을 비교할 때 가장 먼저 펼쳐 보고 싶은 표다. 현금 규모부터 나란히 놓고, 그 차이를 만드는 주식 선택과 옵션 구조를 이어서 읽어보자.', 'If the same $10,000 went into SPYI, JEPI, DIVO or GPIX, how would the illustrated monthly cash differ? Start with that comparison. Then examine the stock selection and option structures that help explain the gap.'],
  'jepq-gpiq-qqqi': ['나스닥 월분배 ETF 세 개 중 같은 돈으로 어느 정도의 현금흐름을 만들 수 있을까. JEPQ, GPIQ, QQQI의 공식 분배 지표를 투자금으로 바꿔 보면 차이가 선명해진다. 월분배금과 목표 현금에 필요한 원금을 먼저 비교하고, 각 상품이 감수하는 대가를 살펴보자.', 'How much monthly cash might the same investment represent in JEPQ, GPIQ or QQQI? Translating the reported distribution measures into money makes the differences tangible. Compare income and required capital first, then examine the trade-offs in each approach.'],
};

function rateBasis(fund, locale) {
  if (fund.basis === 'monthly-notice') return locale === 'ko'
    ? `[운용사의 ${fund.asOf} 공지](${fund.source})에 나온 9월 **예상 월분배율 0.62%를** 적용했다. 공지의 예상 주당 분배금은 65원이다. 여기서는 매수가격을 추정하지 않고 월 0.62%라는 비율만 사용했다. 연 7.44%는 이를 12배 한 계산값이며, 현재 시세 기준 분배율이나 확정 지급액이 아니다.`
    : `The [issuer’s ${fund.asOf} notice](${fund.source}) announced an **expected September monthly distribution rate of 0.62%** and an expected payment of ₩65 per share. This illustration uses the announced percentage without inventing a purchase price. The annualized 7.44% is simply 0.62% times twelve, not a current-market yield or a confirmed payment.`;
  const line = locale === 'ko'
    ? `계산 기준은 [운용사 공식 자료](${fund.source})의 ${fund.asOf} 기준 ${basis.ko[fund.basis]} ${percent(fund)}%다.`
    : `The input is the issuer’s **${percent(fund)}% ${basis.en[fund.basis]}, dated ${fund.asOf}** ([official source](${fund.source})).`;
  if (fund.basis === 'rolling') return line + (locale === 'ko' ? ' 이 수치는 각 지급 시점의 순자산가치(NAV)로 계산한 분배율을 12개월간 더한 값이다. 현재 매수가격에 대한 확정 현금수익률이 아니라, 아래 계산에 대입한 가정으로 읽으면 된다.' : ' The issuer adds twelve distribution yields measured against NAV at their respective ex-dividend dates. Treat that measure as an input assumption here, rather than a locked-in cash yield at today’s purchase price.');
  return line + (locale === 'ko' ? ' 이 비율을 아래 투자금에 그대로 적용해 현금 규모를 환산했다.' : ' The table applies that percentage directly to each investment amount to illustrate the scale of cash income.');
}

function fundSection(fund, locale) {
  const ko = locale === 'ko', quarterly = fund.frequency === 'quarterly', shares = fund.method === 'shares';
  const currency = ko ? 'KRW' : fund.currency;
  const budgets = currency === 'KRW' ? [10000000, 30000000, 50000000, 100000000] : [1000, 10000, 50000, 100000];
  const exampleBudget = currency === 'KRW' ? 10000000 : 10000;
  const example = incomeScenario(fund, exampleBudget);
  const fmt = value => money(value, locale, currency);
  const targets = currency === 'KRW' ? [500000, 1000000] : [500, 1000];
  const lines = [ko ? (quarterly ? '## 1천만 원의 분기 배당, 월평균으로는 얼마일까' : '## 1천만 원을 넣으면 한 달에 얼마일까') : (quarterly ? '## What would $10,000 mean in quarterly cash?' : `## What could ${currency === 'KRW' ? '₩10 million' : '$10,000'} pay each month?`)];
  lines.push(ko
    ? `아래 기준으로 계산하면 **1천만 원의 ${quarterly ? '월평균 환산액은' : '월분배금 예시는'} 세전 ${fmt(example.monthly)}**이다.${quarterly ? ` 분기평균으로는 ${fmt(example.quarterly)}이다. SCHD는 분기 지급 상품이므로 월평균 금액이 매달 입금되는 것은 아니다.` : ' 월급을 전부 대신할 돈인지, 생활비 한 항목을 보탤 돈인지 먼저 감을 잡아보자.'}`
    : `On the assumptions below, **${fmt(exampleBudget)} represents ${fmt(example.monthly)} per month before tax${quarterly ? ', as a monthly average' : ''}**.${quarterly ? ` That is ${fmt(example.quarterly)} per quarter on average. SCHD pays quarterly; the monthly figure is not a payment scheduled every month.` : ' This gives the percentage a practical scale: a contribution toward a bill, or a larger part of a spending budget.'}`);
  lines.push(shares ? (ko
    ? `[공식 가격·분배 내역](${fund.source})에서 확인한 **${fund.priceDate} 종가 ${fmt(fund.price)}**과 **${fund.paymentDate} 지급한 주당 ${fmt(fund.payment)}**을 사용했다(분배 기준일 ${fund.recordDate}). 1천만 원으로 ${number(example.shares)}주를 살 수 있다고 가정하면, ${number(example.shares)}주 × ${fmt(fund.payment)} = ${fmt(example.monthly)}이다. 남는 ${fmt(example.remainder)}은 투자하지 않은 현금으로 뺐다.`
    : `Use the **${fund.priceDate} closing market price of ${fmt(fund.price)}** and the **${fmt(fund.payment)} per share paid on ${fund.paymentDate}**, with a record date of ${fund.recordDate} ([official price and payment history](${fund.source})). A ₩10 million budget buys ${number(example.shares)} whole shares in this illustration: ${number(example.shares)} × ${fmt(fund.payment)} = ${fmt(example.monthly)}. The remaining ${fmt(example.remainder)} stays uninvested.`) : rateBasis(fund, locale));
  lines.push(ko ? '| 투자금 | 세전 월평균 환산액 | 세전 연간 환산액 |\n|---|---:|---:|' : '| Investment budget | Gross monthly equivalent | Gross annual equivalent |\n|---|---:|---:|');
  for (const budget of budgets) {
    const result = incomeScenario(fund, budget);
    lines[lines.length - 1] += `\n| ${ko ? wonBudget(budget) : fmt(budget)} | ${fmt(result.monthly)} | ${fmt(result.annual)} |`;
  }
  lines.push(ko
    ? `모두 **세전 계산 예시**다. ${shares ? '주식은 정수 단위로 매수하며, 같은 주당 분배금이 매월 반복된다고 가정했다. 연간 금액은 월 계산액의 12배다. 지금 매수해 이미 지난 지급일의 돈을 받을 수 있다는 뜻은 아니다.' : fund.basis === 'monthly-notice' ? '공지의 예상 월분배율이 매월 유지되고 투자금 전액을 운용한다고 가정했다. 실제로 받을 금액은 매수한 주식 수와 이후 확정된 주당 분배금으로 다시 계산해야 한다.' : `투자금 전액에 위 비율을 적용하며, ${quarterly ? '연간 금액을 12로 나눈 월평균' : '매월 일정한 수준으로 환산한 금액'}이다. 소수점 주식 매수가 가능하다고 단순화했고 실제 지급액은 보유 수량에 따라 달라진다.`}${fund.currency === 'USD' ? ' 미국 ETF는 달러로 분배하므로, 원화 표는 매수 때와 수령 때 환율이 같다는 가정이다.' : ''} 세금·거래 수수료${fund.currency === 'USD' ? '·환전 비용' : ''} 모두 제외했고 분배금을 재투자하지 않았다. 이미 반영된 펀드 보수를 이 금액에서 다시 빼지는 않는다.`
    : `These are **before-tax illustrations**. ${shares ? 'Shares are rounded down to whole units. The recent payment is assumed to repeat monthly, and the annual figure is twelve times that amount. Buying now does not create an entitlement to a payment whose record date has passed.' : fund.basis === 'monthly-notice' ? 'They assume the announced expected monthly rate repeats and the full budget is invested. Actual cash must be recalculated from the shares purchased and the subsequently confirmed payment per share.' : `The full budget is assumed invested, allowing fractional shares. Annual cash is divided by twelve to produce ${quarterly ? 'a monthly average, although payments are quarterly' : 'a monthly equivalent; actual monthly payments vary'}.`} Investor taxes and trading costs are excluded, and distributions are not reinvested. Fund expenses already reflected in the reported cash measure are not deducted a second time.`);
  lines.push(ko ? '### 월 50만 원·100만 원을 받으려면' : `### Working backward from ${currency === 'KRW' ? '₩500,000 or ₩1 million' : '$500 or $1,000'} a month`);
  lines.push(ko ? '| 세전 월 현금 목표 | 같은 조건에서 필요한 투자금 |\n|---|---:|' : '| Gross monthly cash target | Capital at the same assumptions |\n|---|---:|');
  for (const target of targets) lines[lines.length - 1] += `\n| ${fmt(target)}${quarterly ? (ko ? ' (월평균)' : ' (monthly average)') : ''} | ${capital(capitalForIncome(fund, target), locale, currency)} |`;
  lines.push(ko
    ? `${shares ? '목표액을 주당 분배금으로 나눈 뒤 주식 수를 올림하고, 위 종가를 곱했다.' : '계산식은 ‘월 목표액 × 12 ÷ 연 분배율’이다.'} 표의 필요 투자금은 1만 원 단위로 올림했다.${quarterly ? ' SCHD에서 월 50만 원이라는 목표는 연 600만 원을 네 차례에 걸쳐 받는 규모를 월평균으로 표현한 것이다. 분기별 실제 금액은 서로 다를 수 있다.' : ''} 같은 투자에서 분배금이 20% 줄어들면 월 50만 원도 40만 원으로 줄어든다. 지금의 숫자는 생활비 계획을 시작하는 기준이지, 앞으로 매달 받을 돈의 약속은 아니다.`
    : `${shares ? 'Divide the income target by the payment per share, round the share count up, and multiply by the quoted price.' : 'The formula is monthly target × 12 ÷ annual distribution rate.'} Required capital is rounded up to ${currency === 'KRW' ? 'the next ₩10,000' : 'the next $100'}.${quarterly ? ' A $500 monthly SCHD target means $6,000 a year paid across four quarters; individual quarterly payments can differ.' : ''} A 20% payment cut turns a ${fmt(targets[0])} monthly target into ${fmt(targets[0] * 0.8)} at the same holding size. Use these numbers to size a cash-flow plan, not as a promise of future payments.`);
  if (fund.slug === 'rise-200-weekly-covered-call') lines.push(ko ? 'RISE의 이 예시는 낮아진 10월 주가에 9월 주당 지급액 240원을 대입했기 때문에 특히 큰 금액이 나온다. 두 관측 시점이 다르며, 같은 금액이 이어질지는 별도 문제다. 높은 현금 지급과 주가 하락이 함께 일어날 수 있으므로 이후 주당 분배금과 순자산 변화도 함께 확인하자.' : 'This RISE example produces an especially large figure because it applies September’s ₩240 payment to a lower October share price. Those are two different observation dates, and repetition is uncertain. Large cash payments can coexist with a falling share price; follow subsequent payments and changes in net asset value together.');
  lines.push(ko ? `분배금 계산 자료 추가 확인: ${data.checkedOn}.` : `Income inputs additionally reviewed: ${data.checkedOn}.`);
  return lines.join('\n\n');
}

function comparisonSection(slug, locale) {
  const ko = locale === 'ko', selected = data.comparisons[slug].map(name => funds.get(name));
  const budget = ko ? 10000000 : 10000, target = ko ? 500000 : 500;
  const lines = [ko ? '## 같은 1천만 원, 월분배금은 얼마나 다를까' : '## The same $10,000: how much monthly cash?', ko ? '공식 분배 지표를 같은 투자금에 대입하면 아래와 같다. 모두 세전 월평균 환산액이며, 오른쪽 열은 월 50만 원을 목표로 거꾸로 계산한 투자금이다.' : 'Apply each reported distribution measure to the same investment. These are gross monthly equivalents; the last column works backward from a $500 monthly target.'];
  lines.push(ko ? '| ETF | 1천만 원의 월 환산액 | 월 50만 원에 필요한 투자금 |\n|---|---:|---:|' : '| ETF | Monthly equivalent from $10,000 | Capital for $500/month |\n|---|---:|---:|');
  for (const fund of selected) lines[lines.length - 1] += `\n| ${fund.name} | ${money(incomeScenario(fund, budget).monthly, locale, 'USD')} | ${capital(capitalForIncome(fund, target), locale, 'USD')} |`;
  lines.push(ko ? '계산에 사용한 자료는 모두 2026-09-30 기준이지만, 분배율을 만드는 방식은 서로 다르다.' : 'All inputs below are dated 2026-09-30, but their definitions differ.');
  lines.push(selected.map(fund => `- [${fund.name}](${fund.source}): ${percent(fund)}%, ${basis[locale][fund.basis]}`).join('\n'));
  lines.push(ko ? '최근 한 번의 지급액을 연간으로 늘린 값, 지난 12개월 지급 내역을 반영한 값, 각 지급 시점의 NAV로 계산한 분배율을 더한 값이 섞여 있다. 따라서 이 표는 현금 규모를 가늠하는 예시이며 동일한 잣대의 성과 순위가 아니다. 분배율 차이의 일부는 투자 방식뿐 아니라 계산 방식에서도 생긴다.' : 'The inputs mix annualizations of a recent payment, trailing distribution measures, and a sum of yields based on NAV at each ex-dividend date. This illustrates cash scale; it is not a like-for-like performance ranking. Part of the gap reflects measurement as well as investment strategy.');
  lines.push(ko ? '월 환산액 = 투자금 × 연 분배율 ÷ 12, 필요 투자금 = 월 목표액 × 12 ÷ 연 분배율이다. 투자금 전액을 운용하고 소수점 주식 매수가 가능하며 매수·수령 시 환율이 같다고 가정했다. 필요 투자금은 1만 원 단위로 올림했다. 세금·거래·환전 비용과 재투자는 제외했다. 실제 달러 지급액은 보유 주식 수와 월별 주당 분배금에 따라 달라진다.' : 'Monthly equivalent = investment × annual rate ÷ 12. Required capital = monthly target × 12 ÷ annual rate, rounded up to the next $100. The full budget is assumed invested with fractional shares; taxes, trading costs and reinvestment are excluded. Actual payments depend on shares owned and the distribution per share in each month.');
  lines.push(ko ? '분배금이 20% 줄어드는 경우도 옆에 적어 보자. 같은 투자금에서 월 50만 원은 40만 원이 된다. 큰 분배금을 받는 동안 보유 자산의 가격이 내려갈 수도 있다. 이제 현금의 크기를 확인했으니, 아래에서 그 차이가 생기는 구조를 비교할 차례다.' : 'Keep a reduced-payment case beside the table: a 20% cut turns $500 into $400 at the same investment size. Asset prices can fall while cash is being distributed. With the cash scale established, the next step is to compare the structures behind it.');
  lines.push(ko ? `분배금 계산 자료 추가 확인: ${data.checkedOn}.` : `Income inputs additionally reviewed: ${data.checkedOn}.`);
  return lines.join('\n\n');
}

let changed = false;
for (const article of manifest.articles) {
  const fund = funds.get(article.slug);
  for (const [index, locale] of ['ko', 'en'].entries()) {
    const file = new URL(`${locale}/${article.slug}.md`, directory);
    const raw = await readFile(file, 'utf8');
    const intro = intros[article.slug][index];
    const section = fund ? fundSection(fund, locale) : comparisonSection(article.slug, locale);
    // Keep the original essay after the inserted cash-flow section on reruns.
    const rest = raw.includes(end) ? raw.slice(raw.indexOf(end) + end.length).trimStart() : raw.slice(raw.indexOf('\n## ') + 1);
    const next = `# ${article[locale].title}\n\n${intro}\n\n${start}\n\n${section}\n\n${end}\n\n${rest}`;
    if (next !== raw) { await writeFile(file, next); changed = true; }
    article[locale].seoTitle = `${article[locale].title} | ${locale === 'ko' ? (fund?.frequency === 'quarterly' ? '투자금별 배당금 계산' : '투자금별 월분배금') : 'Income by Investment Amount'}`;
    const summaryPrefix = locale === 'ko' ? (fund ? '1천만·3천만·5천만·1억 원의 분배금과 월 50만·100만 원에 필요한 투자금을 계산합니다. ' : '같은 1천만 원의 월분배금과 월 50만 원에 필요한 투자금을 ETF별로 비교합니다. ') : (fund ? 'Calculate cash income at different investment sizes and the capital needed for a monthly income target. ' : 'Compare monthly cash from $10,000 and the capital needed for $500 a month across these ETFs. ');
    if (!article[locale].summary.startsWith(summaryPrefix)) article[locale].summary = summaryPrefix + article[locale].summary;
  }
  const sourceFunds = fund ? [fund] : data.comparisons[article.slug].map(slug => funds.get(slug));
  for (const sourceFund of sourceFunds) if (!article.sources.includes(sourceFund.source)) article.sources.push(sourceFund.source);
}
if (changed) manifest.updatedAt = new Date().toISOString();
manifest.checkedOn = data.checkedOn;
await writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Updated ${manifest.articles.length * 2} bilingual articles with sourced income scenarios.`);
