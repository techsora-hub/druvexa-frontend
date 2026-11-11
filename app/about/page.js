import LegalPage, { SITE_NAME } from '../../components/LegalPage';

export const metadata = { title: `About — ${SITE_NAME}` };

export default function AboutPage() {
  return (
    <LegalPage title={`About ${SITE_NAME}`}>
      <p>
        {SITE_NAME} is an online video streaming service where you can watch series and movies on your phone, tablet or computer.
      </p>
      <p>
        You can watch one free scene from any title. To unlock full episodes and movies, choose a subscription plan on the Plans page and pay securely online.
      </p>
      <h2>What we offer</h2>
      <ul>
        <li>A growing library of series and movies</li>
        <li>Simple subscription plans with a fixed price and validity</li>
        <li>Secure online payment through an authorised payment gateway</li>
      </ul>
      <p>Have a question? Visit our Contact page.</p>
    </LegalPage>
  );
}