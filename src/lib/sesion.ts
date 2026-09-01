// Firma y verifica la cookie de sesión del login — código de servidor
// exclusivamente (las rutas bajo src/app/api/**). La cookie guarda solo el
// id del usuario, firmado (nadie puede fabricar o editar una sin conocer
// SESSION_SECRET), y va marcada HttpOnly: el JavaScript del navegador no
// puede leerla ni modificarla (a diferencia del viejo esquema, que guardaba
// el id de sesión en localStorage — cualquiera podía abrir F12 → Application
// → Local Storage y cambiarlo a mano para "ser" otro usuario sin saber su
// contraseña).
import { SignJWT, jwtVerify } from "jose";

const secretoTexto = process.env.SESSION_SECRET;
if (!secretoTexto) {
  throw new Error("Falta SESSION_SECRET — revisa .env.local");
}
const secreto = new TextEncoder().encode(secretoTexto);

export const COOKIE_SESION = "crm_session";
const DURACION = "14d";
export const DURACION_SEGUNDOS = 60 * 60 * 24 * 14;

export async function firmarSesion(usuarioId: string): Promise<string> {
  return new SignJWT({ sub: usuarioId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(DURACION)
    .sign(secreto);
}

// Devuelve el id del usuario si el token es válido y no venció, o null si
// no (token ausente, alterado, firmado con otro secreto, o expirado).
export async function verificarSesion(token: string | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secreto);
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}
