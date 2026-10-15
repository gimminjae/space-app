import 'server-only';
import {cache} from 'react';
import {redirect} from 'next/navigation';
import {db,dbError,databaseConfigured} from './db';
import {currentUser,userDb} from './session';
import type {Space} from '@/lib/types';
export const getSpace=cache(async(slug:string):Promise<Space|null>=>{if(!databaseConfigured())return null;const {data,error}=await db().from('space_spaces').select('id,slug,name,description,accent,created_at,updated_at').eq('slug',slug).maybeSingle();dbError(error);return data;});
export const mySpace=cache(async():Promise<Space|null>=>{const user=await currentUser();if(!user)return null;const {data,error}=await (await userDb()).from('space_spaces').select('*').eq('owner_id',user.id).maybeSingle();dbError(error);return data;});
export async function studioSpace(){if(!await currentUser())redirect('/login');const space=await mySpace();if(!space)redirect('/onboarding');return space;}
export async function publicSpaces():Promise<Space[]>{if(!databaseConfigured())return [];const {data,error}=await db().from('space_spaces').select('id,slug,name,description,accent,created_at,updated_at').order('created_at',{ascending:false}).limit(100);dbError(error);return data||[];}
