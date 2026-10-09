import { notFound } from 'next/navigation';
import { Layout } from '@/components';
import { ProductVisual } from '@/components/ProductVisual';
import { PurchaseButton } from '@/components/PurchaseButton';
import { categories, products, type CategoryKey } from '@/lib/products';

export function generateStaticParams() {
  return Object.keys(categories).map(category => ({ category }));
}

export default async function ProductsPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  if (!Object.hasOwn(categories, category)) notFound();

  const key = category as CategoryKey;
  const categoryInfo = categories[key];

  return (
    <Layout>
      <main>
        <section className="page-header">
          <div className="container">
            <a className="back-link" href="/#products">← Back to all categories</a>
            <h1>{categoryInfo.title}</h1>
            <p className="muted">{categoryInfo.description}</p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="product-listing">
              {products[key].map(product => {
                const enquiryMessage = [
                  `Hello Soham Surgical, I would like to enquire about ${product.name} in your ${categoryInfo.title} range.`,
                  `Product: ${product.name}`,
                  `Listed price: ₹${product.price.toLocaleString('en-IN')}`,
                  `Details: ${product.description}`,
                  `Specifications: ${product.specs.join(', ')}`,
                  'Please share current availability, delivery information, and any details I should know before ordering.',
                ].join('\n');
                const contactParams = new URLSearchParams({
                  interest: 'Product enquiry',
                  message: enquiryMessage,
                });
                const contactUrl = `/?${contactParams.toString()}#contact`;

                return (
                  <article className="product-item" key={product.name}>
                    <ProductVisual alt={product.name} src={product.image} />
                    <h3>{product.name}</h3>
                    <p>{product.description}</p>
                    <ul>
                      {product.specs.map(spec => <li key={spec}>{spec}</li>)}
                    </ul>
                    <div className="product-price-row">
                      <span className="product-price">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="product-actions">
                      <a
                        aria-label={`Send an enquiry about ${product.name}`}
                        className="product-enquire"
                        href={contactUrl}
                      >
                        Enquire
                      </a>
                      <PurchaseButton
                        category={key}
                        price={product.price}
                        productName={product.name}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="section section-alt">
          <div className="container contact-grid">
            <div>
              <span className="kicker">Product support</span>
              <h2 className="section-title">Need a quote or <span>more details?</span></h2>
              <p className="muted">
                Send us your requirements and our team will get back to you.
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
            <div className="contact-form">
              <p>
                Every product has a pre-filled WhatsApp enquiry with the product name,
                listed price and specifications.
              </p>
              <a className="btn btn-primary" href="/#contact">Send a general enquiry</a>
            </div>
          </div>
        </section>
      </main>
    </Layout>
  );
}
