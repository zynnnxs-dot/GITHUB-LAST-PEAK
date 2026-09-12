import { sql } from "./db.js";
import { requireAuth } from "./auth.js";
export default async function handler(req,res){
  try{
    await requireAuth(req,["admin"]);
    if(req.method==="POST"){
      const {product_id,name,price,stock=true}=req.body||{};
      const {rows}=await sql`INSERT INTO product_tiers(product_id,name,price,stock) VALUES(${Number(product_id)},${name||""},${price||"0"},${!!stock}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
    if(req.method==="PUT"){
      const {id,name,price,stock}=req.body||{};
      const {rows}=await sql`UPDATE product_tiers SET name=${name||""},price=${price||"0"},stock=${!!stock} WHERE id=${Number(id)} RETURNING *`;
      return res.json(rows[0]);
    }
    if(req.method==="DELETE"){
      const {id}=req.body||{};
      await sql`DELETE FROM product_tiers WHERE id=${Number(id)}`;
      return res.json({ok:true});
    }
    return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  }catch(e){return res.status(e.message==="FORBIDDEN"?403:e.message==="UNAUTHORIZED"?401:500).json({error:e.message==="FORBIDDEN"?"FORBIDDEN":e.message==="UNAUTHORIZED"?"UNAUTHORIZED":"SERVER_ERROR"});}
}

