import {studioSpace} from '@/lib/server/spaces';
import SpaceSettings from '@/components/SpaceSettings';
export default async function Settings(){return <SpaceSettings initial={await studioSpace()}/>;}
