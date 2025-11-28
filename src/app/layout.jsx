import "./globals.css";

export const metadata = {
  title: "Human Return Index™",
  description: "People-first KPI for modern organisations",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          backgroundColor: "#f5f5f5", // light grey background
          color: "#111827",           // dark text (no more white-on-white)
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
