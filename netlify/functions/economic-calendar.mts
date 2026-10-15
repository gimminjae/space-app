import {checkCalendar} from '../../server/economy/sync';
export default async()=>{console.log('economic_calendar',await checkCalendar());};
export const config={schedule:'27 */6 * * *'};
