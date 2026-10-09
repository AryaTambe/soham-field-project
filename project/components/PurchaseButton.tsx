'use client';

import { useState, type FormEvent } from 'react';
import type { CategoryKey } from '@/lib/products';

type PurchaseButtonProps = {
  category: CategoryKey;
  productName: string;
  price: number;
};

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  handler: (response: RazorpayResponse) => void;
  modal: { ondismiss: () => void };
};

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => {
      open: () => void;
      on: (event: string, callback: (details: { error?: { description?: string } }) => void) => void;
    };
  }
}

let razorpayScript: Promise<void> | undefined;

function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return Promise.resolve();
  if (razorpayScript) return razorpayScript;

  razorpayScript = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve();
    script.onerror = () => {
      razorpayScript = undefined;
      reject(new Error('Could not load secure checkout. Please try again.'));
    };
    document.body.appendChild(script);
  });

  return razorpayScript;
}

export function PurchaseButton({ category, productName, price }: PurchaseButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState('');

  async function startCheckout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setMessage('');

    const form = event.currentTarget;
    const formData = new FormData(form);
    const customer = Object.fromEntries(formData.entries());

    try {
      const response = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, productName, customer }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Unable to start checkout.');

      await loadRazorpay();
      if (!window.Razorpay) throw new Error('Secure checkout is unavailable. Please try again.');

      const checkout = new window.Razorpay({
        key: result.keyId,
        amount: result.amount,
        currency: 'INR',
        name: 'Soham Surgical',
        description: result.productName,
        order_id: result.orderId,
        prefill: {
          name: result.customer.name,
          email: result.customer.email,
          contact: result.customer.phone,
        },
        theme: { color: '#079b4c' },
        modal: {
          ondismiss: () => {
            setIsBusy(false);
            setMessage('Payment was cancelled. Your order has not been placed.');
          },
        },
        handler: async payment => {
          setMessage('Verifying payment…');
          try {
            const verification = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payment),
            });
            const confirmation = await verification.json();
            if (!verification.ok) {
              throw new Error(confirmation.message || 'Payment verification failed.');
            }
            setMessage(confirmation.message);
            setIsOpen(false);
          } catch (error) {
            setMessage(
              error instanceof Error
                ? error.message
                : 'We could not verify your payment. Please contact us before trying again.',
            );
          } finally {
            setIsBusy(false);
          }
        },
      });

      checkout.on('payment.failed', details => {
        setIsBusy(false);
        setMessage(details.error?.description || 'Payment failed. Please try again.');
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start checkout.');
      setIsBusy(false);
    }
  }

  return (
    <>
      <button className="btn btn-primary product-buy" onClick={() => setIsOpen(true)}>
        Buy now
      </button>
      {message && <p className="purchase-message" aria-live="polite">{message}</p>}
      {isOpen && (
        <div className="checkout-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget && !isBusy) setIsOpen(false);
        }}>
          <section
            aria-labelledby="checkout-title"
            aria-modal="true"
            className="checkout-dialog"
            role="dialog"
          >
            <button
              aria-label="Close checkout"
              className="checkout-close"
              disabled={isBusy}
              onClick={() => setIsOpen(false)}
              type="button"
            >
              ×
            </button>
            <span className="kicker">Secure checkout</span>
            <h2 id="checkout-title">Delivery details</h2>
            <p className="muted">
              {productName} · ₹{price.toLocaleString('en-IN')}
            </p>
            <form className="contact-form checkout-form" onSubmit={startCheckout}>
              <div className="form-row">
                <label>
                  Name
                  <input autoComplete="name" maxLength={120} name="name" required />
                </label>
                <label>
                  Phone
                  <input autoComplete="tel" maxLength={30} name="phone" required />
                </label>
              </div>
              <label>
                Email
                <input autoComplete="email" maxLength={254} name="email" required type="email" />
              </label>
              <label>
                Address
                <input autoComplete="address-line1" maxLength={200} name="addressLine1" required />
              </label>
              <label>
                Apartment, suite, etc. (optional)
                <input autoComplete="address-line2" maxLength={200} name="addressLine2" />
              </label>
              <div className="form-row">
                <label>
                  City
                  <input autoComplete="address-level2" maxLength={100} name="city" required />
                </label>
                <label>
                  State
                  <input autoComplete="address-level1" maxLength={100} name="state" required />
                </label>
              </div>
              <label>
                PIN code
                <input autoComplete="postal-code" inputMode="numeric" maxLength={6} name="pincode" pattern="[0-9]{6}" required />
              </label>
              <button className="btn btn-primary btn-block" disabled={isBusy} type="submit">
                {isBusy ? 'Starting secure checkout…' : `Continue to payment · ₹${price.toLocaleString('en-IN')}`}
              </button>
              <p className="form-note" aria-live="polite">{message}</p>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
