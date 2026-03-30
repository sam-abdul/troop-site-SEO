import type { Metadata } from "next";
import { IBM_Plex_Mono, Inter, Poppins, Raleway } from "next/font/google";
import NextTopLoader from "nextjs-toploader";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const raleway = Raleway({
  subsets: ["latin"],
  variable: "--font-raleway",
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

const ibmMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-mono",
  weight: ["100", "200", "300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Troop Sites",
  description: "Troop pages",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${poppins.variable} ${raleway.variable} ${ibmMono.variable} h-full`}
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <NextTopLoader
          color="#49DD96"
          height={3}
          showSpinner={false}
          crawlSpeed={180}
          easing="ease"
          speed={220}
          shadow="0 0 10px #49DD96,0 0 5px #49DD96"
        />
        {children}
      </body>
    </html>
  );
}
