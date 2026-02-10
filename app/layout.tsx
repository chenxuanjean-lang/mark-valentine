import "./globals.css";
import { Inter, Noto_Serif_SC } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });
const serif = Noto_Serif_SC({
  weight: ["400", "600"],
  subsets: ["latin"],
  variable: "--font-serif",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh">
      <body className={`${inter.variable} ${serif.variable} font-sans`}>
        {children}
      </body>
    </html>
  );
}
