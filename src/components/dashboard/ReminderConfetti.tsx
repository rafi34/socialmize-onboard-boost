
import { useState, useEffect } from 'react';
import Confetti from 'react-confetti';

interface ReminderConfettiProps {
  active: boolean;
  duration?: number;
}

export const ReminderConfetti = ({ active, duration = 3000 }: ReminderConfettiProps) => {
  const [showConfetti, setShowConfetti] = useState(active); // Changed to boolean type
  const [windowDimension, setWindowDimension] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  const detectSize = () => {
    setWindowDimension({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  };

  useEffect(() => {
    window.addEventListener('resize', detectSize);
    return () => {
      window.removeEventListener('resize', detectSize);
    };
  }, []);

  useEffect(() => {
    setShowConfetti(active);
    if (active) {
      const timer = setTimeout(() => {
        setShowConfetti(false);
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  return (
    <>
      {showConfetti && (
        <Confetti
          width={windowDimension.width}
          height={windowDimension.height}
          numberOfPieces={400}
          recycle={false}
          gravity={0.2}
          colors={['#FF5757', '#8C52FF', '#5CE1E6', '#FFD700', '#38b000']}
        />
      )}
    </>
  );
};
