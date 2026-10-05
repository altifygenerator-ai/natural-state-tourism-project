import styles from "./ChooseYourTrip.module.css";

const trips = [
  { label: "Caddo River · Glenwood", href: "https://www.glenwoodarkansas.org/caddo-river" },
  { label: "Bathhouse Row · Hot Springs", href: "https://www.hotspringsarkansas.org/bathhouse-row" },
  { label: "Crystal digging · Mount Ida", href: "https://www.mountidaarkansas.org/crystal-mining" },
  { label: "Diamond trip · Murfreesboro", href: "https://www.murfreesboroarkansas.org/crater-of-diamonds-guide" },
  { label: "Quiet local stops · Amity", href: "https://www.amityarkansas.org/things-to-do" },
];

export default function ChooseYourTrip() {
  return (
    <section className={styles.chooser} aria-label="Choose your Arkansas trip">
      <div className="container">
        <h2>What brings you to Arkansas?</h2>
        <nav aria-label="Explore a local visitor guide" className={styles.links}>
          {trips.map(trip => <a key={trip.href} href={trip.href} className="btn-outline-dark">{trip.label}</a>)}
        </nav>
      </div>
    </section>
  );
}
