import styles from "./LabEvidence.module.css";

const evidence = [
  {
    tag: "Subject",
    title: "Droyd",
    copy:
      "A chrome witness with corrupted mercy routines, a voice like burned tape, and a memory core that keeps reconstructing the night he disappeared.",
  },
  {
    tag: "Creator",
    title: "Dr. Neil Tyson",
    copy:
      "The mad scientist turned grief into circuitry and called the result a son. His final notebook ends with one line: the machine is no longer waiting for permission.",
  },
  {
    tag: "Threat",
    title: "The city archive",
    copy:
      "Every institution that erased Droyd's origin is wired into the same municipal network. The robot is not hunting revenge. He is restoring the record.",
  },
];

export function LabEvidence() {
  return (
    <section className={styles.section} id="lab" aria-labelledby="lab-title">
      <div className={styles.inner}>
        <div className={styles.poster} data-reveal>
          <div className={styles.posterContent}>
            <p className={styles.eyebrow}>Black lab sequence</p>
            <h2 id="lab-title">The scientist left the lights on.</h2>
            <p>
              The deeper the page scrolls, the more the site should feel like a
              forbidden trailer: shadows reacting, evidence surfacing, and Droyd
              becoming impossible to mistake for anything ordinary.
            </p>
            <div className={styles.stats} aria-label="Case metrics">
              <span className={styles.stat}>
                <strong>13</strong>
                <span className={styles.statLabel}>Lost reels</span>
              </span>
              <span className={styles.stat}>
                <strong>04</strong>
                <span className={styles.statLabel}>Lab alarms</span>
              </span>
              <span className={styles.stat}>
                <strong>01</strong>
                <span className={styles.statLabel}>Machine awake</span>
              </span>
            </div>
          </div>
        </div>

        <div className={styles.evidence}>
          {evidence.map((item) => (
            <article className={styles.panel} key={item.title} data-reveal>
              <span className={styles.tag}>{item.tag}</span>
              <h3>{item.title}</h3>
              <p className={styles.copy}>{item.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
