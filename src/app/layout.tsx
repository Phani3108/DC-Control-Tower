import type { Metadata } from "next";
import { ThemeRegistry } from "@/components/ThemeRegistry";

export const metadata: Metadata = {
  title: "DC Control Tower · DAMAC Digital",
  description:
    "Unified AI command center for DAMAC Digital — site intelligence, capacity matching, ops control, and sovereignty compliance across 4,000+ MW of planned AI data-center capacity.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>{children}</ThemeRegistry>
      </body>
    </html>
  );
}
