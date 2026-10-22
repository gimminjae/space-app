export function adConfiguration(environment: Record<string,string|undefined>) {
 const client=environment.ADSENSE_CLIENT_ID,slot=environment.ADSENSE_ARTICLE_SLOT;
 // Activate only after approval, certified consent setup and Auto ads being off.
 if(environment.ADSENSE_ENABLED!=='true'||environment.ADSENSE_CONSENT_READY!=='true'
   ||!client||!/^ca-pub-\d{16}$/.test(client)||!slot||!/^\d{10}$/.test(slot))return null;
 return {client,slot};
}
