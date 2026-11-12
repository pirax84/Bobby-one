import type { State, User } from "./store";
import type { Post, ID } from "./engine";
import { uid } from "./engine";

const U = (id: string, name: string, hue: number, status: string, discover: "public" | "limited" | "hidden"): User => ({ id, handle: id + "_" , discover, name, hue, bio: "", status, joinedAt: Date.now() - 90 * 864e5, code: "NID-" + id.toUpperCase().slice(0, 5).padEnd(5, "X"), demo: true });
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

// Jolies « photos » de démonstration (dessinées, aucune vraie personne).
export function scene(kind: number): string { return "./demo/scene-" + (kind % 4) + ".jpg"; }
export function demoPosts(me: ID): Post[] {
  const t = Date.now(); const mk = (a: Partial<Post> & { authorId: ID }): Post => ({ id: "p_" + uid(), kind: "text", text: "", createdAt: t, audience: { mode: "all" }, recipients: ["celine", "thomas", "emilie", "max", me].filter((x) => x !== a.authorId), viewSecs: 0, expiresAt: null, views: {}, reactions: {}, comments: [], ...a });
  return [
    mk({ authorId: "celine", kind: "photo", img: scene(0), text: "Soirée d'hier, c'était trop bien ! 🌅", createdAt: t - 40 * 60e3, viewSecs: 5, expiresAt: t + 23 * 3600e3, mood: "😍" }),
    mk({ authorId: "emilie", text: "Dimanche : gratin dauphinois et tarte aux pommes. Qui vient ? 🍰", createdAt: t - 2 * 3600e3, reactions: { thomas: "❤️" }, comments: [{ id: uid(), authorId: "thomas", text: "J'apporte le dessert !", at: t - 3600e3 }] }),
    mk({ authorId: "thomas", kind: "photo", img: scene(1), text: "Balade en vélo ce matin 🚴", createdAt: t - 5 * 3600e3 }),
    mk({ authorId: "thomas", kind: "video", video: "./demo/demo-notiif.mp4", text: "Petite vidéo de démonstration 🎬", createdAt: t - 6 * 3600e3 }),
    mk({ authorId: "max", kind: "text", text: "Qui est chaud pour un Morpion ce soir ? 😎", bg: 2, createdAt: t - 8 * 3600e3 }),
    mk({ authorId: "thomas", kind: "photo", img: scene(2), text: "Ma première story NOTIIF ✨", story: true, createdAt: t - 1800e3, expiresAt: t + 23 * 3600e3 }),
    mk({ authorId: "emilie", kind: "photo", img: scene(3), text: "Bonne soirée à tous 🌙", story: true, createdAt: t - 2400e3, expiresAt: t + 23 * 3600e3 }),
    mk({ authorId: "celine", kind: "text", text: "Coucou la famille !", bg: 1, story: true, createdAt: t - 3600e3, expiresAt: t + 23 * 3600e3 }),
  ];
}
