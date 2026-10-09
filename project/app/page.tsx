import Link from 'next/link';
import { ContactForm } from '@/components/ContactForm';
import { ServiceBookingForm } from '@/components/ServiceBookingForm';
import { Layout } from '@/components';

const categoryCards = [
  {
    slug: 'electrotherapy',
    name: 'Electrotherapy',
    description: 'Modern electrotherapy equipment for physiotherapy and rehabilitation workflows.',
  },
  {
    slug: 'exercise-rehab',
    name: 'Exercise & Rehab',
    description: 'Equipment designed around movement, exercise and recovery.',
  },
  {
    slug: 'treatment-furniture',
    name: 'Treatment Furniture',
    description: 'Practical furniture and equipment for professional treatment spaces.',
  },
  {
    slug: 'accessories',
    name: 'Accessories & More',
    description: 'Supporting accessories and consumables for physiotherapy setups.',
  },
];

export default function Home() {
  return (
    <Layout>
      <main>
        <section className="hero">
          <div className="container hero-inner">
            <div className="hero-copy">
              <span className="kicker">Physiotherapy equipment · Mumbai, India</span>
              <h1>Equipment that supports <span>better recovery.</span></h1>
              <p className="hero-text">
                Reliable physiotherapy equipment, responsive service and direct support
                for clinics, practitioners and care teams.
              </p>
              <div className="hero-actions">
                <a className="btn btn-primary" href="#products">Explore equipment</a>
                <a className="btn btn-outline" href="tel:+919821875579">Talk to our team</a>
              </div>
              <div className="hero-highlights">
                <span>Equipment sales</span>
                <span>Repair requests</span>
                <span>Direct support</span>
              </div>
            </div>
            <div aria-label="Soham Surgical physiotherapy equipment and support" className="hero-showcase">
              <span className="hero-showcase-label">Soham Surgical / Physiotherapy equipment</span>
              <div aria-hidden="true" className="hero-emblem">
                <svg fill="none" viewBox="0 0 80 80">
                  <path d="M10 42h17l8-18 12 34 8-20h15" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M40 4v12M40 64v12M4 40h12M64 40h12" strokeLinecap="round" />
                </svg>
              </div>
              <div className="hero-showcase-footer">
                <strong>Equipment. Service. Support.</strong>
                <span>One dependable partner for your physiotherapy practice.</span>
              </div>
            </div>
          </div>
        </section>

        <section className="section" id="about">
          <div className="container about-grid">
            <div>
              <span className="kicker">01 / About us</span>
              <h2 className="section-title">
                Equipment is only half the job. <span>Support is the other half.</span>
              </h2>
            </div>
            <div>
              <p className="lead">
                Soham Surgical focuses on the manufacture, sale and servicing of
                physiotherapy equipment. From equipment supply to service support, the
                goal is simple: make the process dependable, professional and easy to deal with.
              </p>
              <p className="signature">
                <strong>Vikram B. Dhanawde</strong> — Soham Surgical
              </p>
            </div>
          </div>
        </section>

        <section className="section section-alt" id="products">
          <div className="container">
            <div className="section-head">
              <span className="kicker">02 / Equipment</span>
              <h2 className="section-title">Our product <span>categories</span></h2>
              <p className="muted">Select a category to see the full range of equipment.</p>
            </div>
            <div className="category-grid">
              {categoryCards.map((category, index) => (
                <Link
                  className="category-card"
                  href={`/products/${category.slug}`}
                  key={category.slug}
                >
                  <span aria-hidden="true" className="category-index">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <h3>{category.name}</h3>
                  <p>{category.description}</p>
                  <span className="card-link">View products →</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="section" id="services">
          <div className="container">
            <div className="section-head">
              <span className="kicker">03 / Services</span>
              <h2 className="section-title">From first enquiry <span>to service call</span></h2>
              <p className="muted">
                One partner for equipment sales and ongoing service support.
              </p>
            </div>
            <div className="service-list">
              <div className="service-item">
                <span className="service-num">01</span>
                <div>
                  <h3>Equipment Sales</h3>
                  <p>Discuss your requirements and choose the right equipment for your setup.</p>
                </div>
              </div>
              <div className="service-item">
                <span className="service-num">02</span>
                <div>
                  <h3>Manufacturer Support</h3>
                  <p>Direct communication with a business focused on physiotherapy equipment.</p>
                </div>
              </div>
              <div className="service-item">
                <span className="service-num">03</span>
                <div>
                  <h3>Repair & Maintenance</h3>
                  <p>
                    Request a repair visit for your physiotherapy equipment. We will contact
                    you to confirm a suitable date and time.
                  </p>
                </div>
              </div>
            </div>
            <a className="btn btn-primary service-booking-link" href="#service-booking">
              Book a repair service
            </a>
          </div>
        </section>

        <section className="section section-alt" id="service-booking">
          <div className="container service-booking-grid">
            <div>
              <span className="kicker">04 / Repair booking</span>
              <h2 className="section-title">Need equipment <span>serviced or repaired?</span></h2>
              <p className="muted">
                Tell us what needs attention and when you would prefer a visit. Your selected
                time is a request; our team will call to confirm availability.
              </p>
              <p className="service-contact">
                Prefer to talk? Call or WhatsApp <a href="tel:+919821875579">98218 75579</a>.
              </p>
            </div>
            <ServiceBookingForm />
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section-head">
              <span className="kicker">05 / Why Soham</span>
              <h2 className="section-title">
                A more human way to buy <span>medical equipment</span>
              </h2>
            </div>
            <div className="why-grid">
              <div className="why-item"><strong>01</strong><span>Direct communication</span></div>
              <div className="why-item"><strong>02</strong><span>Sales + service in one place</span></div>
              <div className="why-item"><strong>03</strong><span>Physiotherapy focused</span></div>
              <div className="why-item"><strong>04</strong><span>Mumbai based</span></div>
            </div>
          </div>
        </section>

        <section className="section section-alt" id="contact">
          <div className="container contact-grid">
            <div>
              <span className="kicker">06 / Contact</span>
              <h2 className="section-title">Let’s set up your <span>next move</span></h2>
              <p className="muted">
                Looking for equipment, servicing or a catalogue? Send an enquiry and the
                Soham Surgical team will get back to you.
              </p>
              <ul className="contact-list">
                <li>
                  <span>Phone & WhatsApp</span>
                  <a href="tel:+919821875579">98218 75579</a>
                </li>
                <li>
                  <span>Email</span>
                  <a href="mailto:soham7surgical@gmail.com">soham7surgical@gmail.com</a>
                </li>
              </ul>
            </div>
            <ContactForm />
          </div>
        </section>
      </main>
    </Layout>
  );
}
