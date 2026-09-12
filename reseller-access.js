import { sql } from "./db.js";
import { requireAuth } from "./auth.js";
export default async function handler(req,res){
  try{
    const u=await requireAuth(req,["admin","reseller"]);
    if(req.method==="GET"){
      if(u.role==="reseller"){
        const {rows}=await sql`SELECT ra.id,p.name AS product,ra.link,ra.status FROM reseller_access ra JOIN products p ON p.id=ra.product_id WHERE ra.reseller_id=${Number(u.sub)} AND ra.status='active' ORDER BY ra.id`;
        return res.json(rows);
      }
      const {rows}=await sql`SELECT ra.id,ra.reseller_id,u.username,p.name AS product,ra.link,ra.status FROM reseller_access ra JOIN users u ON u.id=ra.reseller_id JOIN products p ON p.id=ra.product_id ORDER BY ra.id`;
      return res.json(rows);
    }
    if(req.method==="POST" && u.role==="admin"){
      const {reseller_id,product_id,link,status="active"}=req.body||{};
      const {rows}=await sql`INSERT INTO reseller_access(reseller_id,product_id,link,status) VALUES(${Number(reseller_id)},${Number(product_id)},${link||""},${status}) ON CONFLICT(reseller_id,product_id) DO UPDATE SET link=EXCLUDED.link,status=EXCLUDED.status RETURNING *`;
      return res.status(201).json(rows[0]);
    }
    return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  }catch(e){return res.status(e.message==="FORBIDDEN"?403:e.message==="UNAUTHORIZED"?401:500).json({error:e.message==="FORBIDDEN"?"FORBIDDEN":e.message==="UNAUTHORIZED"?"UNAUTHORIZED":"SERVER_ERROR"});}
}
