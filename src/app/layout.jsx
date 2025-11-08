import "./globals.css";

export const metadata = {
  title: "Human Return Index",
  description: "HRI demo dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
