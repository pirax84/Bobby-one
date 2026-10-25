import "./globals.css";
import type { Metadata, Viewport } from "next";
import Pwa from "@/components/Pwa";
export const metadata: Metadata = {
  title: "Bobby One — Bobby veille sur vous.", description: "Votre gardien personnel contre les arnaques.",
  manifest: "/manifest.webmanifest", icons: { icon: "/icon-192.png", apple: "/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "Bobby One", statusBarStyle: "black-translucent" },
};
export const viewport: Viewport = { themeColor: "#070B14", width: "device-width", initialScale: 1, viewportFit: "cover" };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="fr"><body><Pwa />{children}</body></html>);
}
