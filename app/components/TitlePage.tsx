'use client';

import React from 'react';
import styles from './TitlePage.module.css';

interface TitlePageProps {
  volumeNumber: number;
}

const TitlePage: React.FC<TitlePageProps> = ({ volumeNumber }) => {
  return (
    <div className={styles.container}>
      <div className={styles.triangleBackground}>
        {[...Array(12)].map((_, index) => (
          <div
            key={index}
            className={styles.triangle}
            style={{
              transform: `rotate(${index * 30}deg)`
            }}
          />
        ))}
      </div>
      <div className={styles.content}>
        <h1 className={styles.title}>
          Figgerits
          <span className={styles.volume}>Volume {volumeNumber}</span>
        </h1>
      </div>
    </div>
  );
};

export default TitlePage; 