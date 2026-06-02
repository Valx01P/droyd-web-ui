import styles from "./FinalTransmission.module.css";

export function FinalTransmission() {
  return (
    <section className={styles.section} id="transmission" aria-labelledby="transmission-title">
      <div className={styles.inner}>
        <div data-reveal>
          <p className={styles.eyebrow}>Final transmission</p>
          <h2 className={styles.heading} id="transmission-title">
            The case opens at midnight.
          </h2>
          <p className={styles.copy}>
            This first cut establishes the tone: noir, mechanical, dangerous, and
            built for motion. The agent workflow can now keep pushing the site toward
            richer story beats, heavier shader work, stronger performance, and a
            polished award-level finish.
          </p>
        </div>

        <div className={styles.terminal} data-reveal aria-label="Droyd transmission log">
          <span className={styles.code}>DROYD://MEMORY_CORE/RETURN_SEQUENCE</span>
          <span className={styles.code}>STATUS: BREACHING_ARCHIVE</span>
          <span className={styles.code}>VOSS_SIGNATURE: DETECTED</span>
          <span className={styles.code}>NEXT_FRAME: UNKNOWN</span>
          <span className={styles.signal} aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
