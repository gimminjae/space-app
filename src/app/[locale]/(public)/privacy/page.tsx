import Link from '@/components/I18n';
import styles from '@/components/site.module.css';
import { adConfiguration } from '@/lib/advertising';
import { getI18n, localizedMetadata } from '@/lib/i18n/server';
import { site } from '@/lib/site';

export async function generateMetadata() {
  const { t, locale, absolute } = await getI18n();
  return localizedMetadata({
    title: t('개인정보처리방침'),
    description: locale === 'ko'
      ? 'Space의 콘텐츠 열람, 언어 쿠키, 광고와 개인정보 선택, 보관 중인 회원 정보 및 문의 처리 기준을 안내합니다.'
      : 'How Space handles reading preferences, cookies, advertising choices, retained account data and privacy inquiries.',
    alternates: { canonical: absolute('/privacy') },
  }, locale);
}

export default async function Privacy() {
  const { t, locale } = await getI18n();
  const ko = locale === 'ko';
  const adsActive = Boolean(adConfiguration(process.env));
  return <section className={styles.about}>
    <p className={styles.eyebrow}>PRIVACY</p>
    <h1>{t('개인정보처리방침')}</h1>
    <div className="prose">
      <p>{t('space는 회원가입 없이 공개 글을 읽을 수 있는 경제 블로그입니다.')}</p>
      <p>{ko ? '운영 및 개인정보 문의: ' : 'Publisher and privacy contact: '}<a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a> · <Link href="/about">{t('space 소개')}</Link></p>
      <h2>{t('수집 및 사용')}</h2>
      <p>{ko ? '현재 Space는 콘텐츠 제공 목적으로 운영하며 회원가입, 로그인, 개인 서비스 및 파일 업로드를 제공하지 않습니다. 기존 회원과 작성 자료는 기능을 숨겼다는 이유로 삭제하지 않으며, 이메일과 비공개 글은 공개하지 않습니다. 결제 정보는 수집하지 않습니다.' : 'Space currently operates as a content publication. Registration, sign-in, personal services and file uploads are unavailable. Existing accounts and authored materials are retained; hiding these features does not delete them. Email addresses and private posts are not published. We do not collect payment information.'}</p>
      <p>{ko ? '페이지 전달과 보안을 위해 호스팅 서비스 Netlify에서 IP 주소, 요청한 페이지, 접속 시각과 브라우저 정보 같은 접속 기록이 처리될 수 있습니다. 서비스 제공 과정에서 정보가 국외 서버에서 처리될 수 있습니다. ' : 'For page delivery and security, our hosting provider Netlify may process access records such as IP addresses, requested pages, request times and browser information. Service providers may process this information on servers outside your country. '}<a href="https://www.netlify.com/privacy/">{ko ? 'Netlify 개인정보 안내' : 'Netlify privacy information'}</a></p>
      <h2>{t('쿠키')}</h2>
      <p>{ko ? '열람 언어를 기억하는 space_locale 쿠키를 사용하며, 저장 기간은 설정 시점부터 1년입니다. 브라우저 설정에서 삭제하거나 차단할 수 있습니다. 공개 글을 읽는 데 계정은 필요하지 않습니다. 기존 인증 쿠키가 있더라도 중지된 개인 기능에 접근할 수 없습니다.' : 'The space_locale cookie remembers your reading language for one year from the time it is set. You can delete or block it in your browser. Public articles do not require an account, and older authentication cookies do not restore access to suspended personal services.'}</p>
      <h2>{t('광고 서비스')}</h2>
      <p>{adsActive
        ? (ko ? '현재 Space에서 Google AdSense 광고를 제공합니다. 아래는 광고와 관련한 정보 처리 및 선택 방법입니다.' : 'Space currently serves Google AdSense ads. The following explains advertising data use and your choices.')
        : (ko ? '현재 Space의 광고 게재 기능은 비활성화되어 있습니다. 아래 내용은 향후 Google AdSense 광고를 활성화할 때 적용되는 정보 처리와 선택 방법에 관한 안내입니다.' : 'Advertising is currently disabled on Space. The following describes data use and choices that apply if Google AdSense advertising is enabled in the future.')}</p>
      <p>{ko ? '광고가 활성화되면 Google을 포함한 제3자 광고 제공업체가 쿠키를 사용하여 사용자의 이 사이트 및 다른 사이트의 이전 방문 기록을 바탕으로 광고를 게재할 수 있습니다. Google과 광고 파트너는 이러한 정보를 광고 개인화, 제공 및 측정에 사용할 수 있습니다.' : 'When advertising is enabled, third-party vendors, including Google, may use cookies to serve ads based on a user’s previous visits to this and other websites. Google and its advertising partners may use this information to personalize, deliver and measure advertising.'}</p>
      <p>{ko ? 'Google 맞춤 광고 설정은 ' : 'You can manage Google personalized advertising in '}<a href="https://myadcenter.google.com/">Google My Ad Center</a>{ko ? '에서 관리할 수 있으며, 참여하는 다른 광고 제공업체의 맞춤 광고 선택은 ' : ', and choices for other participating advertising vendors through '}<a href="https://optout.aboutads.info/">YourAdChoices</a>{ko ? '에서 확인할 수 있습니다. 맞춤 광고를 해제해도 모든 광고가 사라지는 것은 아니며, 브라우저나 기기별로 설정이 다를 수 있습니다.' : '. Opting out of personalization does not remove all ads, and settings may differ between browsers and devices.'}</p>
      <p><a href="https://policies.google.com/technologies/ads">{ko ? 'Google 광고 기술 정책' : 'Google advertising technologies'}</a> · <a href="https://policies.google.com/technologies/partner-sites">{ko ? 'Google이 파트너 사이트의 정보를 사용하는 방법' : 'How Google uses information from partner sites'}</a></p>
      <p>{ko ? '광고 활성화 전에는 방문 지역에 적용되는 동의 및 개인정보 선택 절차를 별도로 준비합니다. 이 방침을 읽었다는 사실만으로 광고 쿠키에 동의한 것으로 처리하지 않습니다.' : 'Before enabling advertising, we will prepare the consent and privacy choices applicable to the visitor’s region. Reading this policy does not by itself give consent to advertising cookies.'}</p>
      <h2>{t('외부 링크와 파일')}</h2>
      <p>{ko ? '글꼴을 표시하기 위해 Google Fonts에 요청이 전송되며, 이 과정에서 IP 주소와 브라우저 요청 정보가 Google에 전달될 수 있습니다. 글에 연결된 외부 사이트를 방문하면 해당 사이트의 정책이 적용됩니다. 현재 제공하는 Markdown과 설명 그림은 공개 글을 읽고 내려받기 위한 파일입니다.' : 'To display fonts, the site sends requests to Google Fonts, which may transmit an IP address and browser request information to Google. External sites linked from articles have their own policies. The Markdown files and explanatory illustrations currently provided are public reading and download materials.'}</p>
      <p><a href="https://fonts.google.com/faq">{ko ? 'Google Fonts 안내' : 'Google Fonts information'}</a></p>
      <h2>{ko ? '문의와 보관 중인 정보' : 'Inquiries and retained information'}</h2>
      <p>{ko ? '이메일로 문의하면 회신 주소와 문의 내용을 답변 및 정정 처리에 사용합니다. 처리 목적이 끝나고 별도의 보관 의무가 없는 정보는 삭제합니다. 기존 계정 정보의 열람, 정정 또는 삭제를 원하면 아래 연락처로 요청할 수 있습니다. 본인 확인과 적용되는 보관 의무를 확인한 뒤 처리합니다.' : 'When you email us, we use your reply address and message to respond and handle corrections. Information is deleted when that purpose is complete and no separate retention obligation applies. You can contact us to request access, correction or deletion of retained account information. Requests are handled after checking identity and applicable retention requirements.'}</p>
      <p><a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></p>
      <p>{ko ? '시행일: 2026년 10월 22일' : 'Effective date: October 22, 2026'}</p>
    </div>
  </section>;
}
