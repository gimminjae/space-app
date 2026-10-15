import {syncIndicators} from '../../server/economy/sync';
export default async()=>{console.log('economic_ecos',await syncIndicators('ecos'));};
export const config={schedule:'17 * * * *'};
