import {syncIndicators} from '../../server/economy/sync';
export default async()=>{console.log('economic_fred',await syncIndicators('fred'));};
export const config={schedule:'7 * * * *'};
