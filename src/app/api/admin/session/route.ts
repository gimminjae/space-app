import { assertOrigin, verifyPassword, startSession, endSession, errorResponse, readJson } from '@/lib/server/auth';
export async function POST(request:Request) { try { assertOrigin(request); const body=await readJson(request); await verifyPassword(request,body.password); await startSession(); return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}}); } catch(error) { return errorResponse(error); } }
export async function DELETE(request:Request) { try { assertOrigin(request); await endSession(); return Response.json({ok:true}); } catch(error) { return errorResponse(error); } }
