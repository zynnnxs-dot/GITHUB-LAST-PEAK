import { sql } from "./db.js";
import { hashPassword } from "./auth.js";

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"POST_ONLY"});
  if(req.headers["x-seed-key"] !== process.env.SEED_KEY) return res.status(403).json({error:"FORBIDDEN"});

  const adminUser=process.env.ADMIN_USERNAME || "admin";
  const adminPass=process.env.ADMIN_PASSWORD || "NDREX2026";
  const hash=await hashPassword(adminPass);

  await sql`INSERT INTO users(username,password_hash,role,status)
    VALUES(${adminUser},${hash},'admin','active')
    ON CONFLICT(username) DO UPDATE SET password_hash=${hash}, role='admin', status='active'`;

  for(const p of [["Instagram",""],["TikTok",""],["WhatsApp",""],["Telegram",""]]){
    await sql`INSERT INTO social_links(platform,url,enabled) VALUES(${p[0]},${p[1]},false) ON CONFLICT(platform) DO NOTHING`;
  }
  return res.json({ok:true,username:adminUser});
}
