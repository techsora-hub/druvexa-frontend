import LegalPage, { SITE_NAME } from '../../components/LegalPage';

export const metadata = { title: `Terms of Use — ${SITE_NAME}` };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Use" updated="October 2026">
      <p>By using {SITE_NAME} you agree to these terms. If you do not agree, please do not use the service.</p>
      <h2>Account</h2>
      <p>You log in with your mobile number. You are responsible for activity on your account and for keeping your login secure.</p>
      <h2>Subscription</h2>
      <ul>
        <li>Paid plans unlock full access to content for the validity period shown on the Plans page.</li>
        <li>Plans are one-time purchases for that period and do not renew automatically.</li>
        <li>Prices are shown in Indian Rupees (INR) at the time of purchase.</li>
      </ul>
      <h2>Acceptable use</h2>
      <ul>
        <li>Content is for your personal, non-commercial viewing only.</li>
        <li>Do not copy, record, redistribute or resell any content.</li>
        <li>Do not attempt to bypass access controls or interfere with the service.</li>
      </ul>
      <h2>Changes and availability</h2>
      <p>We may update content, plans or these terms from time to time. We do not guarantee uninterrupted availability of the service.</p>
      <h2>Termination</h2>
      <p>We may suspend or close accounts that break these terms.</p>
      <p>Payments and refunds are covered in our Refund Policy.</p>
    </LegalPage>
  );
}