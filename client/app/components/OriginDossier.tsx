import styles from "./OriginDossier.module.css";

const originFiles = [
  {
    chapter: "01",
    stamp: "Recovered negative",
    title: "A body assembled from stolen midnight.",
    copy:
      "The scientist called it compassion. The police report called it a machine. Droyd woke under a rain of sparks with borrowed hands, a locked memory core, and one name burned into the lab glass.",
  },
  {
    chapter: "02",
    stamp: "Unreleased reel",
    title: "The experiment learned how to dream.",
    copy:
      "Every night the mad doctor projected city crimes across Droyd's optics, teaching him guilt before language. The robot answered with music from a broken speaker and a map of places he had never seen.",
  },
  {
    chapter: "03",
    stamp: "Case file missing",
    title: "The fire was not the ending.",
    copy:
      "When the lab burned, the city buried the machine with the evidence. Years later, the signal came back through dead power lines, and every streetlight on the east side blinked his name.",
  },
];

export function OriginDossier() {
  return (
    <section className={styles.section} id="origin" aria-labelledby="origin-title">
      <div className={styles.inner}>
        <div className={styles.intro} data-reveal>
          <p className={styles.eyebrow}>Origin dossier</p>
          <h2 className={styles.heading} id="origin-title">
            A robot made from regret.
          </h2>
          <p className={styles.dek}>
            Droyd is not introduced as a product. He arrives like evidence: scratched
            celluloid, forbidden lab notes, and a silhouette that keeps stepping out
            of the smoke.
          </p>
        </div>

        <div className={styles.files}>
          {originFiles.map((file) => (
            <article className={styles.card} key={file.chapter} data-reveal>
              <div className={styles.cardHeader}>
                <span className={styles.chapter}>Chapter {file.chapter}</span>
                <span className={styles.stamp}>{file.stamp}</span>
              </div>
              <h3>{file.title}</h3>
              <p>{file.copy}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
