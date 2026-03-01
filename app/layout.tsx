import type { Metadata } from "next";
import { DM_Serif_Display, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  weight: ["400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-plex",
  display: "swap",
});

// Using Inter as a close, reliable substitute for Instrument Sans
// Both are clean, contemporary sans-serifs with excellent readability
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-instrument",
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Pulse — Daily AI Intelligence",
  description:
    "Daily intelligence on AI advancement. Clear, honest reporting on how artificial intelligence is getting smarter, faster, and more capable.",
  icons: {
    icon: [
      { url: "/favicon.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "The Pulse",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    title: "The Pulse — Daily AI Intelligence",
    description:
      "Daily intelligence on AI advancement. Clear, honest reporting on how artificial intelligence is getting smarter, faster, and more capable.",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary",
    title: "The Pulse — Daily AI Intelligence",
    description:
      "Daily intelligence on AI advancement. Clear, honest reporting on AI progress.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var mode = localStorage.getItem('theme');
                  if (mode === 'dark' || (!mode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${dmSerif.variable} ${inter.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
