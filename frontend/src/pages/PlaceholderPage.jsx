export default function PlaceholderPage({ title, description }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
      {description && <p className="text-slate-500 mb-6">{description}</p>}
      <div className="card text-slate-500">
        🚧 This page is under construction. We'll fill it in step by step.
      </div>
    </div>
  );
}