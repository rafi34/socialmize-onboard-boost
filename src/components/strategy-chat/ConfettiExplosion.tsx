
import { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

export function ConfettiExplosion() {
  const [dimensions, setDimensions] = useState({ 
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0, 
  });
  
  const [show, setShow] = useState(true);

  useEffect(() => {
    // Update dimensions on window resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    
    // Hide confetti after 5 seconds
    const timer = setTimeout(() => setShow(false), 5000);

    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, []);

  if (!show) return null;

  return (
    <Confetti
      width={dimensions.width}
      height={dimensions.height}
      recycle={false}
      numberOfPieces={300}
      gravity={0.2}
    />
  );
}
