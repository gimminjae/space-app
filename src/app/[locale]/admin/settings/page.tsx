import SpaceSettings from '@/components/SpaceSettings';
import { studioSpace } from '@/lib/server/spaces';
export default async function Settings(){return <SpaceSettings initial={await studioSpace()}/>;}
