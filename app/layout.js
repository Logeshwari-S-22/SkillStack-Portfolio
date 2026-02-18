import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "SkillStackTN",
  description: "Build, track and showcase your tech skills",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}