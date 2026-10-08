import type { Metadata, Viewport } from "next";
import { DM_Mono, DM_Serif_Display, Plus_Jakarta_Sans, Tiro_Devanagari_Hindi } from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const dmMono = DM_Mono({ variable: "--font-dm-mono", subsets: ["latin"], weight: ["400", "500"] });
// Editorial serif for headings; its italic is the green accent word (e.g. "your").
const dmSerif = DM_Serif_Display({ variable: "--font-dm-serif", subsets: ["latin"], weight: "400", style: ["normal", "italic"] });
const tiroDeva = Tiro_Devanagari_Hindi({ variable: "--font-tiro-deva", subsets: ["devanagari"], weight: "400", display: "swap", preload: false });

export const metadata: Metadata = {
  title: { default: "Prompters — Learn. Build. Prove. Get Hired.", template: "%s · Prompters" },
  description: "Learn programming deeply in Hinglish, build without AI, explain your code and measure your interview readiness.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbf9f5" },
    { media: "(prefers-color-scheme: dark)", color: "#191817" },
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
      className={`${jakarta.variable} ${dmMono.variable} ${dmSerif.variable} ${tiroDeva.variable} h-full antialiased`}
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
