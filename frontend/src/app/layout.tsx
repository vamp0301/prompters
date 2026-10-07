import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, JetBrains_Mono, Pinyon_Script, Tiro_Devanagari_Hindi } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });
// Editorial display serif (the only font preloaded besides the body font — it carries the hero headline).
const fraunces = Fraunces({ variable: "--font-fraunces", subsets: ["latin"], axes: ["opsz", "SOFT"], display: "swap" });
// Handwritten annotation accent — small, decorative, never for UI labels.
const pinyon = Pinyon_Script({ variable: "--font-pinyon", subsets: ["latin"], weight: "400", display: "swap", preload: false });
const tiroDeva = Tiro_Devanagari_Hindi({ variable: "--font-tiro-deva", subsets: ["devanagari"], weight: "400", display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "Prompters — Learn. Build. Prove. Get Hired.", template: "%s · Prompters" },
  description: "Learn programming deeply in Hinglish, build without AI, explain your code and measure your interview readiness.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f0e1" },
    { media: "(prefers-color-scheme: dark)", color: "#15130f" },
  ],
  width: "device-width",
  initialScale: 1,
};

// Applies the saved theme before paint so there is no flash.
const themeScript = `try{var t=localStorage.getItem("prompters-theme")||"light";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="light"}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      data-theme="light"
      suppressHydrationWarning
      className={`${geist.variable} ${mono.variable} ${fraunces.variable} ${pinyon.variable} ${tiroDeva.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full">
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
