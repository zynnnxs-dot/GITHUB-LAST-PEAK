import { sql } from "./db.js";
import { hashPassword } from "./auth.js";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST_ONLY"});
  if(req.headers["x-seed-key"] !== process.env.SEED_KEY) return res.status(403).json({error:"FORBIDDEN"});
  const adminUser=process.env.ADMIN_USERNAME||"admin";
  const adminPass=process.env.ADMIN_PASSWORD||"NDREX2026";
  if(!adminPass) return res.status(400).json({error:"Set ADMIN_PASSWORD first"});
  const hash=await hashPassword(adminPass);
  await sql`INSERT INTO users(username,password_hash,role) VALUES(${adminUser},${hash},'admin') ON CONFLICT(username) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='admin'`;
  for(const p of [["Instagram",""],["TikTok",""],["WhatsApp",""],["Telegram",""]]){
    await sql`INSERT INTO social_links(platform,url,enabled) VALUES(${p[0]},${p[1]},false) ON CONFLICT(platform) DO NOTHING`;
  }
  return res.json({ok:true});
}
