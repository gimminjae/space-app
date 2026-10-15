import Link from '@/components/I18n';
import { getI18n } from '@/lib/i18n/server';
import { getCategories,listPosts } from '@/lib/server/posts';
import { Pagination,PostList } from './PostList';
import styles from './site.module.css';
export async function Archive({title,description,category,tag,page=1}:{title:string;description?:string;category?:string;tag?:string;page?:number}) {const {t,category:localizedCategory}=await getI18n();
  const [result,categories]=await Promise.all([listPosts({category,tag,page}),getCategories()]);
  const path=category?`/category/${category}`:`/tag/${tag}`;
  return <section className={styles.archive}><p className={styles.eyebrow}>{tag?'TOPIC':'COLLECTION'}</p><h1>{title}</h1><p className={styles.description}>{description||t("관심 있는 주제의 이야기를 모았습니다.")}</p><nav className={styles.categoryNav} aria-label={t("카테고리")}><Link href="/">{t("전체")}</Link>{categories.map(c=><Link href={`/category/${c.slug}`} className={c.slug===category?styles.active:''} key={c.id}>{localizedCategory(c).name}</Link>)}</nav><PostList posts={result.posts}/><Pagination page={page} total={result.total} path={path}/></section>;
}
