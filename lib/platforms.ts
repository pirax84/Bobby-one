// Plateformes où n'importe qui peut publier un site gratuitement : l'âge ou la réputation du nom de domaine ne disent rien sur le site lui-même.
const P = ["vercel.app", "netlify.app", "github.io", "gitlab.io", "pages.dev", "workers.dev", "web.app", "firebaseapp.com", "herokuapp.com", "onrender.com", "blogspot.com", "wordpress.com", "wixsite.com", "weebly.com", "glitch.me", "repl.co", "replit.app", "ngrok.io", "ngrok-free.app", "azurewebsites.net", "notion.site", "framer.app", "framer.website", "carrd.co", "webflow.io", "squarespace.com", "myshopify.com", "bubbleapps.io", "streamlit.app", "fly.dev", "railway.app", "surge.sh", "000webhostapp.com", "infinityfreeapp.com", "weeblysite.com", "godaddysites.com", "my.canva.site", "typedream.app", "super.site", "lovable.app", "bolt.host"];
export function platformOf(host: string): string | null {
  const h = host.toLowerCase().replace(/\.$/, ""); return P.find((p) => h === p || h.endsWith("." + p)) || null;
}
