import type { Locale } from "@/lib/i18n";
import { seo } from "@/lib/seo";

export function SeoContent({ locale }: { locale: Locale }) {
  const copy = seo[locale];

  return (
    <section className="seo-panel" aria-labelledby="seo-features-title">
      <div className="seo-grid">
        <div>
          <h2 id="seo-features-title" className="seo-heading">
            {copy.featuresTitle}
          </h2>
          <ul className="feature-list">
            {copy.features.map((feature) => (
              <li key={feature.name} className="feature-card">
                <h3>{feature.name}</h3>
                <p>{feature.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="seo-heading">{copy.howTitle}</h2>
          <ol className="how-list">
            {copy.howSteps.map((step, index) => (
              <li key={step.name}>
                <span className="how-index">{index + 1}</span>
                <div>
                  <h3>{step.name}</h3>
                  <p>{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="faq-block">
        <h2 className="seo-heading">{copy.faqTitle}</h2>
        <div className="faq-list">
          {copy.faq.map((item) => (
            <details key={item.question} className="faq-item">
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
