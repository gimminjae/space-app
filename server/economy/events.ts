import type {EconomicEvent} from '../../src/lib/economy/types';
/** Stable editorial IDs survive date changes; automatic checks cannot replace editorial fields. */
export function mergeEvent(previous:EconomicEvent|undefined,incoming:EconomicEvent,editorial=false):EconomicEvent{
 if(!previous)return incoming;if(previous.manual_override&&!editorial)return previous;
 if(Date.parse(incoming.reviewed_at)<=Date.parse(previous.reviewed_at))return previous;
 const changed=previous.event_date!==incoming.event_date||previous.starts_at!==incoming.starts_at||previous.status!==incoming.status;
 return {...incoming,id:previous.id,history:changed?[...previous.history,{at:incoming.reviewed_at,date:previous.event_date,status:previous.status}]:previous.history};
}
export function periodForResult(event:EconomicEvent){return /^\d{4}-\d{2}$/.test(event.reference_period||'')?event.reference_period+'-01':null;}
