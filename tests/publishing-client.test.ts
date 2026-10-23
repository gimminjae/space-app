import test from 'node:test';
import assert from 'node:assert/strict';
import {publishingClientIp} from '../src/lib/publishing-client';

test('publishing rate limits use the hosting platform IP and ignore spoofed foreign headers',()=>{
 const headers=new Headers({'x-forwarded-for':'203.0.113.10','x-nf-client-connection-ip':'198.51.100.20'});
 assert.equal(publishingClientIp(headers,{VERCEL:'1'}),'203.0.113.10');
 assert.equal(publishingClientIp(new Headers({'x-nf-client-connection-ip':'forged'}),{VERCEL:'1'}),'shared');
 assert.equal(publishingClientIp(headers,{NETLIFY:'true'}),'198.51.100.20');
 assert.equal(publishingClientIp(headers,{}),'shared');
 assert.equal(publishingClientIp(new Headers(),{VERCEL:'1'}),'shared');
});
