'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

// Local testing only (USE_MOCK_PAYMENT=true on the backend) — a fake
// gateway that marks the order paid or failed.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export default function MockPaymentPage() {
  return (
    <Suspense fallback={null}>
      <MockPaymentPageContent />
    </Suspense>
  );
}

function MockPaymentPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const merchantTxnId = searchParams.get('merchantTxnId');
  const status = searchParams.get('status') || 'success';
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!merchantTxnId) return;
    fetch(`${API_URL}/payment/mock-callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantTxnId, status }),
    })
      .then((res) => res.json())
      .then((data) => {
        setResult(data);
        // Same URL the real gateways land on, so the success screen and the
        // Purchase pixel behave exactly like a real payment.
        const redirectQs = data.redirectPath ? `&redirect=${encodeURIComponent(data.redirectPath)}` : '';
        const next =
          data.status === 'paid'
            ? `/plans?status=success&amount=${data.amount}&plan=${encodeURIComponent(data.planName || '')}&txn=${encodeURIComponent(data.txn || '')}${redirectQs}`
            : `/plans?status=failed${redirectQs}`;
        setTimeout(() => router.push(next), 1500);
      })
      .catch((err) => setError(err.message));
  }, [merchantTxnId, status, router]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-sm bg-bg-card rounded-2xl p-6 sm:p-8 text-center">
        <h1 className="font-display font-extrabold text-xl mb-3">Mock Payment</h1>
        {!result && !error && <p className="text-text-mid text-sm">Processing…</p>}
        {error && <p className="text-red-400 text-sm">{error}</p>}
        {result && (
          <>
            <p className="text-accent font-semibold text-sm mb-6">
              Payment {result.status} — redirecting…
            </p>
            <Link
              href="/plans"
              className="inline-block bg-accent text-bg font-bold text-sm px-6 py-3 rounded-pill"
            >
              Continue
            </Link>
          </>
        )}
      </div>
    </main>
  );
}