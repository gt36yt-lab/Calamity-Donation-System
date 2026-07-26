import { Compass } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center sm:px-6">
      <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-signal-500 text-signal-500">
        <Compass className="h-6 w-6" />
      </span>
      <h1 className="mt-5 font-display text-2xl font-bold text-ink-950">
        Off the map
      </h1>
      <p className="mt-2 text-sm text-khaki-700">
        That page isn't on the manifest. Let's get you back to the dashboard.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-full bg-ink-950 px-5 py-2.5 text-sm font-semibold text-paper-50 hover:bg-ink-800"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
