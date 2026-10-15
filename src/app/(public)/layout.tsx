import {Header,Footer} from '@/components/Shell';
export const dynamic='force-dynamic';
export default function PublicLayout({children}:{children:React.ReactNode}) {return <><Header/><main id="main">{children}</main><Footer/></>;}
