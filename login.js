import { sql } from "./db.js";
import { verifyPassword, hashPassword, signUser } from "./auth.js";

export default async function handler(req,res){
  if(req.method!=="POST") return res.status(405).json({error:"METHOD_NOT_ALLOWED"});
  try{
    const {username,password}=req.body||{};
    if(!username||!password) return res.status(400).json({error:"USERNAME_PASSWORD_REQUIRED"});

    // Admin credentials are controlled by Vercel Environment Variables.
    // If they are not set, these are the first-login defaults.
    const configuredUser=process.env.ADMIN_USERNAME || "admin";
    const configuredPass=process.env.ADMIN_PASSWORD || "NDREX2026";

    // If the configured admin credentials are used, make sure the database
    // account is synchronized with them. This fixes an old seeded password.
    if(username===configuredUser && password===configuredPass){
      const {rows}=await sql`SELECT * FROM users WHERE username=${configuredUser} LIMIT 1`;
      const hash=await hashPassword(configuredPass);
      let user=rows[0];
      if(user){
        const updated=await sql`UPDATE users SET password_hash=${hash}, role='admin', status='active' WHERE id=${user.id} RETURNING *`;
        user=updated.rows[0];
      }else{
        const created=await sql`INSERT INTO users(username,password_hash,role,status) VALUES(${configuredUser},${hash},'admin','active') RETURNING *`;
        user=created.rows[0];
      }
      const token=await signUser(user);
      return res.json({token,user:{id:user.id,username:user.username,role:user.role}});
    }

    const {rows}=await sql`SELECT * FROM users WHERE username=${username} AND status='active' LIMIT 1`;
    if(!rows[0] || !(await verifyPassword(password,rows[0].password_hash))) return res.status(401).json({error:"INVALID_CREDENTIALS"});
    const token=await signUser(rows[0]);
    return res.json({token,user:{id:rows[0].id,username:rows[0].username,role:rows[0].role}});
  }catch(e){
    console.error("LOGIN_ERROR",e);
    return res.status(500).json({error:"SERVER_ERROR"});
  }
}
