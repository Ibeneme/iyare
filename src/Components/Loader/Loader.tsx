// Loader.js

import styles from "./Loader.module.css"; // Add your styles if needed

const Loader = () => {
  return (
    <div
      className={styles.loader}
      style={{
        minWidth: 250,
        marginLeft: -24
      }}
    >
      <div className={styles.spinner}></div>
    </div>
  );
};

export default Loader;
