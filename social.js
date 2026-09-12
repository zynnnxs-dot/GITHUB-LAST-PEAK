import { sql } from "./db.js";
import { requireAuth } from "./auth.js";
export default async function handler(req,res){
  try{
    if(req.method==="GET"){
      const {rows}=await sql`SELECT platform,url,enabled FROM social_links ORDER BY id`;
      return res.json(rows);
    }
    await requireAuth(req,["admin"]);
    if(req.method==="POST"){
      const {platform,url,enabled=true}=req.body||{};
      const {rows}=await sql`INSERT INTO social_links(platform,url,enabled) VALUES(${platform},${url||""},${!!enabled}) ON CONFLICT(platform) DO UPDATE SET url=EXCLUDED.url,enabled=EXCLUDED.enabled RETURNING *`;
      return res.json(rows[0]);
    }
    return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  }catch(e){return res.status(e.message==="FORBIDDEN"?403:e.message==="UNAUTHORIZED"?401:500).json({error:e.message==="FORBIDDEN"?"FORBIDDEN":e.message==="UNAUTHORIZED"?"UNAUTHORIZED":"SERVER_ERROR"});}
}
