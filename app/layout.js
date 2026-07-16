import { Prompt, Outfit } from "next/font/google";
import "./globals.css";

const promptFont = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const outfitFont = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata = {
  title: "LottoOracle AI | ระบบวิเคราะห์และทำนายหวยไทยพรีเมียม",
  description: "โปรแกรมวิเคราะห์ข้อมูลสถิติสลากกินแบ่งรัฐบาลไทยย้อนหลัง คำนวณความน่าจะเป็นของงวดถัดไปด้วยระบบคอมพิวเตอร์และสถิติถ่วงน้ำหนัก พร้อมตารางสุ่มนำโชคและเลขเด็ดสำนักดัง",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="th"
      className={`${promptFont.variable} ${outfitFont.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
