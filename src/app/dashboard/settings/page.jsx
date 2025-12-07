// src/app/dashboard/settings/page.jsx

export const metadata = {
  title: "Human Return Index™ – Settings",
};

export default function SettingsPage() {
  return (
    <div
      style={{
        maxWidth: 1120,
        margin: "0 auto",
        padding: "24px 24px 40px",
        fontFamily:
          "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#E5E7EB",
      }}
    >
      <h1
        style={{
          fontSize: 24,
          fontWeight: 800,
          marginBottom: 8,
        }}
      >
        Settings & Organisation Profile
      </h1>

      <p
        style={{
          fontSize: 14,
          color: "#9CA3AF",
          maxWidth: 640,
          marginBottom: 16,
        }}
      >
        This area will let you manage your organisation profile, HRI contact
        details, notification preferences and advanced configuration.
        For the pilot, we’re keeping this simple so you can focus on the
        scores, ROI and live people data.
      </p>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          borderRadius: 12,
          border: "1px solid #1F2937",
          background:
            "radial-gradient(circle at top left, #020617 0%, #020617 45%, #030712 100%)",
        }}
      >
        <h2
          style={{
            fontSize: 16,
            fontWeight: 700,
            marginBottom: 6,
            color: "#F9FAFB",
          }}
        >
          Coming soon
        </h2>
        <p
          style={{
            fontSize: 13,
            color: "#9CA3AF",
          }}
        >
          In the full version of Human Return Index™ you’ll be able to:
        </p>
        <ul
          style={{
            marginTop: 8,
            paddingLeft: 18,
            fontSize: 13,
            color: "#E5E7EB",
            lineHeight: 1.6,
          }}
        >
          <li>Update core organisation details and sectors</li>
          <li>Configure assessment and pulse frequencies</li>
          <li>Manage who receives reports and alerts</li>
          <li>Control data retention, exports and integrations</li>
        </ul>
      </div>
    </div>
  );
}
