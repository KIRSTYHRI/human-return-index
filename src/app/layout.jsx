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

          // === Global Brand Colours ===
          backgroundColor: "#000000",  // black background
          color: "#FFFFFF",            // white text
          fontFamily:
            'system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif',

          // Ensure consistent text rendering
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "24px",
          }}
        >
          {children}
        </div>
      </body>
    </html>
  );
}
