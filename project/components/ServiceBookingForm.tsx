'use client';

import { useState, type FormEvent } from 'react';

function localDateToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
}

export function ServiceBookingForm() {
  const [message, setMessage] = useState('');
  const [isBusy, setIsBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setMessage('Sending your service request…');

    const form = event.currentTarget;
    const booking = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/api/service-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(booking),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Unable to send your service request.');

      setMessage(result.message);
      form.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send your service request. Please call 98218 75579.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={submit}>
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
        Email (optional)
        <input autoComplete="email" maxLength={254} name="email" type="email" />
      </label>
      <label>
        Product that needs repair
        <input maxLength={160} name="productName" placeholder="Product name or model" required />
      </label>
      <label>
        What needs attention?
        <textarea maxLength={3000} name="issue" placeholder="Describe the fault or service needed…" required rows={4} />
      </label>
      <div className="form-row">
        <label>
          Preferred date
          <input min={localDateToday()} name="preferredDate" required type="date" />
        </label>
        <label>
          Preferred time
          <input maxLength={40} name="preferredTime" placeholder="e.g. 10:00 AM–1:00 PM" required />
        </label>
      </div>
      <label>
        Service address
        <textarea autoComplete="street-address" maxLength={500} name="address" required rows={3} />
      </label>
      <button className="btn btn-primary btn-block" disabled={isBusy} type="submit">
        {isBusy ? 'Sending request…' : 'Request a repair visit'}
      </button>
      <p aria-live="polite" className="form-note">{message}</p>
      <p className="form-note">Your preferred time is a request. Our team will call to confirm availability.</p>
    </form>
  );
}
