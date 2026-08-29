import { FEATURES } from "./landingData";

export default function FeaturesSection() {
  return (
    <section
      className="max-w-5xl mx-auto px-6 py-16 border-t
      border-gray-100"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Everything your team needs
        </h2>
        <p className="text-gray-500">
          All the tools to plan, track, and ship — without the bloat.
        </p>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
        gap-4"
      >
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="bg-gray-50 rounded-xl p-5 border
            border-gray-200 hover:border-indigo-200 hover:bg-indigo-50
            transition-all group"
          >
            <div
              className="w-8 h-8 bg-white rounded-lg border
              border-gray-200 flex items-center justify-center mb-3
              group-hover:border-indigo-200 transition-colors text-base"
            >
              {f.emoji}
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
              {f.title}
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              {f.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
