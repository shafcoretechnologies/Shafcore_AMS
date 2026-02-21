import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import AppNavbar from "@/components/app-navbar";
import shellStyles from "@/components/app-shell.module.css";
import { getSessionFromCookieStore } from "@/lib/auth/session";
import Image from "next/image";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  subsets: ["latin"],
});

export const metadata = {
  title: "Shafcore AMS",
  description: "Shafcore AMS - IT asset management with PostgreSQL and approvals",
};

export default async function RootLayout({ children }) {
  const session = await getSessionFromCookieStore();
  const user = session
    ? {
        name: session.user.name,
        role: session.user.role,
      }
    : null;

  return (
    <html lang="en">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable}`}>
        <AppNavbar user={user} />
        {children}
        <footer className={shellStyles.footer}>
          <p className={shellStyles.brandRow}>
            <Image src="/shafcore-logo.png" alt="Shafcore" width={54} height={44} />
            <strong>Shafcore AMS</strong>
          </p>
          <p>Secure IT lifecycle and branch operations tracking.</p>
        </footer>
      </body>
    </html>
  );
}
