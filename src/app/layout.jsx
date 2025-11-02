import "./globals.css";

export const metadata = {
  title: "Human Return Index™",
  description: "People → Performance → Profit",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header style={{background:"#fee000",color:"#000",padding:"1rem 2rem",fontWeight:800,borderBottom:"3px solid #000"}}>
          Human Return Index™
        </header>
        <main style={{padding:"2rem"}}>{children}</main>
      </body>
    </html>
  );
}
