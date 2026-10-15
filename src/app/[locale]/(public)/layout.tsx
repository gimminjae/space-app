import { Footer,Header } from '@/components/Shell';
export const dynamic='force-dynamic';
export default async function PublicLayout({children}:{children:React.ReactNode}) {return <><Header/><main id="main">{children}</main><Footer/></>;}
