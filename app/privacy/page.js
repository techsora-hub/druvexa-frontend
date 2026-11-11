import LegalPage, { SITE_NAME, SupportLine } from '../../components/LegalPage';

export const metadata = { title: `Privacy Policy — ${SITE_NAME}` };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="October 2026">
      <p>This policy explains what information {SITE_NAME} collects and how it is used.</p>
      <h2>Information we collect</h2>
      <ul>
        <li>Your mobile number (and name, if you provide it) when you log in.</li>
        <li>Subscription and payment records, such as plan, amount and transaction ID. We do not store card, UPI or bank details; payments are handled by our payment gateway.</li>
        <li>Basic usage and device information, such as pages viewed, IP address, browser type and cookies.</li>
      </ul>
      <h2>How we use it</h2>
      <ul>
        <li>To provide your account, activate subscriptions and show content.</li>
        <li>To prevent fraud and support you with payment or account issues.</li>
        <li>To measure and improve our advertising and the service.</li>
      </ul>
      <h2>Cookies and advertising pixels</h2>
      <p>
        We use cookies to keep you logged in. We also use advertising and analytics tools (such as the Meta Pixel and Meta Conversions API) to measure visits and purchases. These tools may receive page-view and purchase events and limited identifiers such as cookie IDs, IP address, browser details and a hashed form of your phone number.
      </p>
      <h2>Sharing</h2>
      <p>We share information only with service providers needed to run the service (payment gateway, hosting, analytics and advertising platforms) or when required by law. We do not sell your personal information.</p>
      <h2>Your choices</h2>
      <p>You can ask us to access, correct or delete your information, and you can block cookies in your browser settings (some features may stop working).</p>
      <SupportLine />
    </LegalPage>
  );
}