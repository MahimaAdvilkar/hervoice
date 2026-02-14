export const metadata = {
  title: "SheLaunch AI",
  description: "Agentic startup copilot for women entrepreneurs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica, Arial, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
