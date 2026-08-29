import Link from "next/link";
import { FAQS } from "./landingData";

export default function LandingFooter() {
  return (
    <>
      {/* ── FAQ ── */}
      <section
        className="max-w-3xl mx-auto px-6 py-16 border-t
        border-gray-100"
      >
        <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">
          Frequently asked questions
        </h2>
        <div className="space-y-6">
          {FAQS.map((faq) => (
            <div
              key={faq.q}
              className="bg-gray-50 rounded-xl p-5 border border-gray-200"
            >
              <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                {faq.q}
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div
          className="bg-indigo-600 rounded-3xl p-10 text-center
          text-white"
        >
          <h2 className="text-3xl font-bold mb-3">
            Ready to streamline your workflow?
          </h2>
          <p className="text-indigo-100 text-sm max-w-md mx-auto mb-6">
            Join developers and founders who manage their projects with TaskFlow.
          </p>
          <Link
            href="/register"
            className="inline-block bg-white text-indigo-600 px-6
            py-3 rounded-xl text-sm font-semibold hover:bg-indigo-50
            transition-colors"
          >
            Get started for free →
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 py-8">
        <div
          className="max-w-5xl mx-auto px-6 flex items-center
          justify-between"
        >
          <span className="text-sm font-semibold text-indigo-600">
            TaskFlow
          </span>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} TaskFlow. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs text-gray-400 hover:text-gray-600
              transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="text-xs text-gray-400 hover:text-gray-600
              transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
}
