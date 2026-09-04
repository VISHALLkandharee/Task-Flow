import Link from "next/link";
import { Check } from "lucide-react";
import { PLANS } from "./landingData";

export default function PricingSection() {
  return (
    <section
      className="max-w-5xl mx-auto px-6 py-16 border-t
      border-gray-100"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-gray-900 mb-3">
          Simple, transparent pricing
        </h2>
        <p className="text-gray-500">
          Start for free, upgrade when your team grows.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {PLANS.map((plan) => (
          <div
            key={plan.name}
            className={`rounded-2xl p-6 border ${
              plan.highlighted
                ? "border-indigo-600 ring-2 ring-indigo-600/20 bg-white"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {plan.badge && (
              <span className="inline-block text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mb-3">
                {plan.badge}
              </span>
            )}
            <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">{plan.description}</p>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-extrabold text-gray-900">
                {plan.price}
              </span>
              <span className="text-xs text-gray-400">/{plan.period}</span>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feat) => (
                <li key={feat} className="flex items-center gap-2 text-xs text-gray-600">
                  <Check size={14} className="text-indigo-600 shrink-0" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              href={plan.href}
              className={`block text-center w-full py-2.5 rounded-xl text-sm font-medium transition-colors ${
                plan.highlighted
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                  : "bg-white text-gray-900 border border-gray-200 hover:bg-gray-100"
              }`}
            >
              {plan.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
