import LegalPage, { SITE_NAME, SupportLine, SUPPORT_EMAIL } from '../../components/LegalPage';

export const metadata = { title: `Contact — ${SITE_NAME}` };

export default function ContactPage() {
  return (
    <LegalPage title="Contact us">
      <p>
        For help with your account, a payment or a subscription, contact the {SITE_NAME} support team.
      </p>
      <SupportLine />
      {!SUPPORT_EMAIL && <p>Support contact details will be published here shortly.</p>}
      <h2>When writing to us, please include</h2>
      <ul>
        <li>The mobile number you use to log in</li>
        <li>Your transaction ID (for payment queries)</li>
        <li>A short description of the problem</li>
      </ul>
      <p>We aim to reply within 2 working days.</p>
    </LegalPage>
  );
}