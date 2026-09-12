import { sql } from "./db.js";
import { requireAuth } from "./auth.js";
export default async function handler(req,res){
  try{
    if(req.method==="GET"){
      const {rows}=await sql`SELECT p.*,
        COALESCE(json_agg(json_build_object('id',t.id,'name',t.name,'price',t.price,'stock',t.stock)) FILTER (WHERE t.id IS NOT NULL),'[]') tiers
        FROM products p LEFT JOIN product_tiers t ON t.product_id=p.id
        WHERE p.status='active' GROUP BY p.id ORDER BY p.id`;
      return res.json(rows);
    }
    await requireAuth(req,["admin"]);
    if(req.method==="POST"){
      const {name,description,image,category,status="active"}=req.body||{};
      const {rows}=await sql`INSERT INTO products(name,description,image,category,status) VALUES(${name||""},${description||""},${image||""},${category||"PRODUK"},${status}) RETURNING *`;
      return res.status(201).json(rows[0]);
    }
    if(req.method==="PUT"){
      const {id,name,description,image,category,status}=req.body||{};
      const {rows}=await sql`UPDATE products SET name=${name||""},description=${description||""},image=${image||""},category=${category||"PRODUK"},status=${status||"active"} WHERE id=${Number(id)} RETURNING *`;
      return res.json(rows[0]);
    }
    if(req.method==="DELETE"){
      const {id}=req.body||{};
      await sql`DELETE FROM products WHERE id=${Number(id)}`;
      return res.json({ok:true});
    }
    return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  }catch(e){return res.status(e.message==="FORBIDDEN"?403:e.message==="UNAUTHORIZED"?401:500).json({error:e.message==="FORBIDDEN"?"FORBIDDEN":e.message==="UNAUTHORIZED"?"UNAUTHORIZED":"SERVER_ERROR"});}
  }
