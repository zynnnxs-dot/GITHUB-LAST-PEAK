import { sql } from "./db.js";
import { verifyPassword, signUser } from "./auth.js";
export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  try{
    const {username,password}=req.body||{};
    if(!username||!password) return res.status(400).json({error:"USERNAME_PASSWORD_REQUIRED"});
    const {rows}=await sql`SELECT * FROM users WHERE username=${username} AND status='active' LIMIT 1`;
    if(!rows[0] || !(await verifyPassword(password,rows[0].password_hash))) return res.status(401).json({error:"INVALID_CREDENTIALS"});
    const token=await signUser(rows[0]);
    return res.json({token,user:{id:rows[0].id,username:rows[0].username,role:rows[0].role}});
  }catch(e){return res.status(500).json({error:"SERVER_ERROR"});}
}
