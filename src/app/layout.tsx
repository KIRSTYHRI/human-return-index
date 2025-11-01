// src/app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "Human Return Index™",
  description: "People → Performance → Profit",
};

export default function RootLayout({
  children,
}: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header
          style={{
            backgroundColor: "#fee000", // HRI yellow
            color: "#000",
            padding: "1.2rem 2rem",
            fontWeight: 800,
            letterSpacing: "0.5px",
            fontSize: "1.2rem",
            borderBottom: "3px solid #000",
            textTransform: "uppercase",
          }}
        >
          Human Return Index™
        </header>
        <main>{children}</main>
        <footer
          style={{
            marginTop: "3rem",
            padding: "1rem 2rem",
            textAlign: "center",
            fontSize: "0.9rem",
            opacity: 0.7,
            borderTop: "1px solid #ddd",
          }}
        >
          © {new Date().getFullYear()} Human Return Index™ · People → Performance → Profit
        </footer>
      </body>
    </html>
  );
}
