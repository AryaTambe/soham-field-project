'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';

export function ContactForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [message, setMessage] = useState('Your enquiry will be sent to our team.');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    const params = new URLSearchParams(window.location.search);
    const interest = params.get('interest');
    const enquiryMessage = params.get('message');

    if (!form) return;

    const interestField = form.elements.namedItem('interest');
    if (interest && interestField instanceof HTMLSelectElement) {
      interestField.value = interest;
    }

    const messageField = form.elements.namedItem('message');
    if (enquiryMessage && messageField instanceof HTMLTextAreaElement) {
      messageField.value = enquiryMessage.slice(0, 3000);
    }
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsBusy(true);
    setMessage('Sending…');

    const form = event.currentTarget;
    const enquiry = Object.fromEntries(new FormData(form).entries());

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(enquiry),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message || 'Unable to send your enquiry.');

      setMessage(result.message);
      form.reset();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : 'Unable to send your enquiry. Please try again or call 98218 75579.',
      );
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <form className="contact-form" onSubmit={submit} ref={formRef}>
      <div className="form-row">
        <label>
          Name
          <input autoComplete="name" maxLength={120} name="name" placeholder="Your name" required />
        </label>
        <label>
          Phone
          <input autoComplete="tel" maxLength={30} name="phone" placeholder="+91" required />
        </label>
      </div>
      <label>
        Email
        <input autoComplete="email" maxLength={254} name="email" placeholder="you@example.com" type="email" />
      </label>
      <label>
        I’m interested in
        <select name="interest">
          <option>Equipment sales</option>
          <option>Equipment servicing</option>
          <option>Product catalogue</option>
          <option>Product enquiry</option>
          <option>General enquiry</option>
        </select>
      </label>
      <label>
        Message
        <textarea maxLength={3000} name="message" placeholder="Tell us what you need…" rows={4} />
      </label>
      <button className="btn btn-primary btn-block" disabled={isBusy} type="submit">
        {isBusy ? 'Sending…' : 'Send enquiry'}
      </button>
      <p aria-live="polite" className="form-note">{message}</p>
    </form>
  );
}
