import LegalPage, { SITE_NAME } from '../../components/LegalPage';

export const metadata = { title: `Disclaimer — ${SITE_NAME}` };

export default function DisclaimerPage() {
  return (
    <LegalPage title="Disclaimer" updated="October 2026">
      <p>The content on {SITE_NAME} is provided for entertainment purposes only.</p>
      <ul>
        <li>The service is provided on an "as is" and "as available" basis.</li>
        <li>Video quality and playback depend on your device and internet connection.</li>
        <li>Titles, availability and plan details may change without notice.</li>
        <li>Views expressed in any content belong to its creators.</li>
        <li>Some content may be intended for mature audiences; viewer discretion is advised.</li>
      </ul>
      <p>{SITE_NAME} is not responsible for any loss arising from use of the service beyond what is required by law.</p>
    </LegalPage>
  );
}