export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-text-primary">Settings</h1>
      </div>
      <div className="glass-panel rounded-xl p-8 min-h-[400px] flex items-center justify-center border-dashed border-2 border-white/[0.1] bg-transparent">
        <p className="text-text-muted">Settings will go here</p>
      </div>
    </div>
  );
}
