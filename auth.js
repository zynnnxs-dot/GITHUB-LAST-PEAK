import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET || "CHANGE_ME_IN_VERCEL");

export async function hashPassword(password){ return bcrypt.hash(password, 12); }
export async function verifyPassword(password, hash){ return bcrypt.compare(password, hash); }
export async function signUser(user){
  return new SignJWT({sub:String(user.id), username:user.username, role:user.role})
    .setProtectedHeader({alg:"HS256"}).setIssuedAt().setExpirationTime("7d").sign(secret);
}
export async function requireAuth(req, roles=[]){
  const h=req.headers.authorization||"";
  if(!h.startsWith("Bearer ")) throw new Error("UNAUTHORIZED");
  const {payload}=await jwtVerify(h.slice(7),secret);
  if(roles.length && !roles.includes(payload.role)) throw new Error("FORBIDDEN");
  return payload;
}