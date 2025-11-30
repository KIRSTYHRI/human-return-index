// src/app/layout.js

import "./globals.css";

export const metadata = {
  title: "Human Return Index™",
  description:
    "The KPI for human return. Real-time view of how your people are doing – and what that means for performance, risk and ROI.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#ffffff",
          color: "#111827",
          fontFamily:
            "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {children}
      </body>
    </html>
  );
}
