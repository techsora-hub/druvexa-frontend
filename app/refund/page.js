import LegalPage, { SITE_NAME, SupportLine } from '../../components/LegalPage';

export const metadata = { title: `Refund Policy — ${SITE_NAME}` };

export default function RefundPage() {
  return (
    <LegalPage title="Refund Policy" updated="October 2026">
      <p>{SITE_NAME} subscriptions are digital services that are activated immediately after payment.</p>
      <h2>Not eligible for refund</h2>
      <ul>
        <li>Plans that have been successfully activated and used.</li>
        <li>Change of mind after purchase.</li>
      </ul>
      <h2>Eligible for refund</h2>
      <ul>
        <li>Your account was charged but the subscription was not activated.</li>
        <li>You were charged more than once for the same purchase.</li>
      </ul>
      <h2>How to request</h2>
      <p>Contact support within 7 days of payment with your registered mobile number and transaction ID. Approved refunds are returned to the original payment method, usually within 5–7 working days.</p>
      <SupportLine />
    </LegalPage>
  );
}