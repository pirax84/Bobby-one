import type { State, User } from "./store";
import type { Post, ID } from "./engine";
import { uid } from "./engine";

const U = (id: string, name: string, hue: number, status: string, discover: "public" | "limited" | "hidden"): User => ({ avatar: "./demo/av-" + ["celine", "thomas", "emilie", "max", "lea"].indexOf(id) + ".jpg", id, handle: id + "_" , discover, name, hue, bio: "", status, joinedAt: Date.now() - 90 * 864e5, code: "NID-" + id.toUpperCase().slice(0, 5).padEnd(5, "X"), demo: true });
export const seed = (): State => ({
  v: 1, started: false, me: "",
  users: [{ ...U("celine", "Céline", 330, "Toujours partante 🎉", "public"), birthday: (() => { const d = new Date(Date.now() + 864e5); return String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); })() }, U("thomas", "Thomas", 210, "En vadrouille 🚴", "limited"), U("emilie", "Émilie", 28, "Cuisine du dimanche 🍰", "hidden"), U("max", "Max", 150, "Gamer de la famille 🎮", "limited"), U("lea", "Léa", 280, "Nouvelle ici 👋", "public")],
  social: {
    friends: { celine: [], thomas: [], emilie: [], max: [], lea: [] }, blocks: {}, lists: [],
    groups: [
      { id: "g_famille", name: "Famille", emoji: "🏡", description: "Le groupe de toute la famille.", rules: "Soyons bienveillants. Pas de photos sans l'accord des personnes.", adminIds: ["emilie"], memberIds: ["emilie", "celine", "thomas"] },
      { id: "g_amis", name: "Amis du lycée", emoji: "🎓", description: "Les inséparables.", rules: "Ici on se taquine, mais gentiment.", adminIds: ["max"], memberIds: ["max", "thomas"] },
    ],
  },
  posts: [], notifs: [], convs: [], events: [], games: [], reqs: [], reports: [], shares: [], albums: [], scores: {}, settings: {},
});

// Photos et vidéos de démonstration (images abstraites NOTIIF, aucune vraie personne).
const D = (f: string) => "./demo/" + f;
export const DEMO_AVATARS: Record<string, string> = { celine: D("av-0.jpg"), thomas: D("av-1.jpg"), emilie: D("av-2.jpg"), max: D("av-3.jpg"), lea: D("av-4.jpg") };
export function demoPosts(me: ID): Post[] {
  const t = Date.now(); const H = 3600e3; const mk = (a: Partial<Post> & { authorId: ID }): Post => ({ id: "p_" + uid(), kind: "text", text: "", createdAt: t, audience: { mode: "all" }, recipients: ["celine", "thomas", "emilie", "max", me].filter((x) => x !== a.authorId), viewSecs: 0, expiresAt: null, views: {}, reactions: {}, comments: [], ...a });
  return [
    mk({ authorId: "celine", kind: "photo", img: D("p-a.jpg"), text: "Photo éphémère : 5 secondes pour regarder ! 😍", createdAt: t - 40 * 60e3, viewSecs: 5, expiresAt: t + 23 * H, mood: "😍" }),
    mk({ authorId: "max", kind: "video", video: D("v-d.mp4"), text: "Vidéo éphémère : 10 secondes seulement 🎬", createdAt: t - 90 * 60e3, viewSecs: 10, expiresAt: t + 23 * H, mood: "🔥" }),
    mk({ authorId: "emilie", text: "Dimanche : gratin dauphinois et tarte aux pommes. Qui vient ? 🍰", createdAt: t - 2 * H, reactions: { thomas: "❤️" }, comments: [{ id: uid(), authorId: "thomas", text: "J'apporte le dessert !", at: t - H }] }),
    mk({ authorId: "thomas", kind: "photo", img: D("p-b.jpg"), text: "Une photo normale, qui reste visible 📸", createdAt: t - 4 * H }),
    mk({ authorId: "thomas", kind: "video", video: D("v-a.mp4"), text: "Une vidéo normale 🎥", createdAt: t - 6 * H }),
    mk({ authorId: "celine", kind: "photo", img: D("p-c.jpg"), text: "Photo éphémère : 3 secondes ⏱️", createdAt: t - 7 * H, viewSecs: 3, expiresAt: t + 20 * H, mood: "🥳" }),
    mk({ authorId: "max", kind: "text", text: "Qui est chaud pour un Morpion ce soir ? 😎", bg: 2, createdAt: t - 8 * H }),
    mk({ authorId: "celine", kind: "photo", img: D("s-a.jpg"), text: "Ma story du jour ✨", story: true, createdAt: t - 30 * 60e3, expiresAt: t + 23 * H, mood: "😍" }),
    mk({ authorId: "thomas", kind: "video", video: D("v-b.mp4"), text: "Story vidéo 🎞️", story: true, createdAt: t - 50 * 60e3, expiresAt: t + 23 * H }),
    mk({ authorId: "emilie", kind: "photo", img: D("s-c.jpg"), text: "Story éphémère : 5 secondes 🌙", story: true, createdAt: t - 70 * 60e3, viewSecs: 5, expiresAt: t + 23 * H }),
    mk({ authorId: "max", kind: "photo", img: D("s-d.jpg"), text: "Story photo 🎮", story: true, createdAt: t - 100 * 60e3, expiresAt: t + 23 * H }),
    mk({ authorId: "celine", kind: "text", text: "Coucou la famille !", bg: 1, story: true, createdAt: t - H, expiresAt: t + 23 * H }),
  ];
}
