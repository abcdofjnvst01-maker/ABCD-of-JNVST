import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DevRoleSwitcher } from "@/components/layout/DevRoleSwitcher";
import { getCurrentUser } from "@/server/authorization";
import "./globals.css";

export const metadata: Metadata = {
  title: "ABCD of JNVST | Class 6 Navodaya Vidyalaya Entrance Prep",
  description:
    "Dedicated, structured, and affordable ₹500 preparation platform for Jawahar Navodaya Vidyalaya Selection Test (JNVST) Class 6 aspirants.",
  keywords: [
    "JNVST Class 6",
    "Navodaya Vidyalaya entrance",
    "JNVST preparation",
    "Mental Ability Test",
    "Arithmetic Test JNVST",
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-slate-50 text-slate-900 antialiased">
        {process.env.NODE_ENV === "development" && (
          <DevRoleSwitcher currentRole={user?.role} />
        )}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
