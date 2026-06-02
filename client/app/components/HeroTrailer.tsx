import { NoirShader } from "./NoirShader";
import styles from "./HeroTrailer.module.css";

const tickerItems = [
  "Origin file reopened",
  "Subject DROYD recovered",
  "Mad scientist at large",
  "Signal detected under the city",
  "Trailer cut classified",
  "Return sequence unstable",
];

export function HeroTrailer() {
  return (
    <section className={styles.hero} id="trailer" aria-labelledby="hero-title" data-hero>
      <video
        className={styles.video}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        data-hero-video
        aria-label="Cinematic footage of Droyd"
      >
        <source src="/droyd.mp4" type="video/mp4" />
      </video>
      <div className={styles.shade} aria-hidden="true" />
      <NoirShader />

      <nav className={styles.nav} aria-label="Primary">
        <a href="#trailer" className={styles.brand}>
          Droyd
        </a>
        <div className={styles.links}>
          <a href="#origin">Origin</a>
          <a href="#lab">The Lab</a>
          <a href="#transmission">Transmission</a>
        </div>
      </nav>

      <div className={styles.content}>
        <p className={styles.kicker} data-hero-kicker>
          Teaser transmission 00.13
        </p>
        <h1 className={styles.title} id="hero-title" data-hero-title aria-label="He's back.">
          <span>He&apos;s</span>
          <span>back.</span>
        </h1>
        <p className={styles.copy} data-hero-copy>
          They built Droyd in a room without windows, buried the footage, and blamed
          the fire on lightning. Tonight the machine remembers the scientist who gave
          him a soul and the city that tried to erase him.
        </p>
        <div className={styles.actions}>
          <a className={styles.primary} href="#origin" data-hero-action>
            Open the origin file
          </a>
          <a className={styles.secondary} href="#lab" data-hero-action>
            Enter the black lab
          </a>
        </div>
      </div>

      <div className={styles.meter} aria-hidden="true">
        <span className={styles.label}>Signal reconstruction</span>
        <span className={styles.meterTrack}>
          <span className={styles.meterFill} data-hero-meter />
        </span>
        <span className={styles.metaRow}>
          <span className={styles.meta}>Noir cut</span>
          <span className={styles.meta}>OpenGL pass armed</span>
          <span className={styles.meta}>Memory core online</span>
        </span>
      </div>

      <div className={styles.ticker} aria-hidden="true">
        <div className={styles.tickerTrack} data-film-track>
          {[...tickerItems, ...tickerItems].map((item, index) => (
            <span key={`${item}-${index}`}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
