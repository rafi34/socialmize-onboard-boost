
import { useEffect, useState } from "react";

interface ConfettiProps {
  particleCount?: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  speed: number;
  angle: number;
}

export const Confetti: React.FC<ConfettiProps> = ({ particleCount = 50 }) => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const colors = [
      "#9b87f5", // Purple
      "#E5DEFF", // Light Purple
      "#0EA5E9", // Blue
      "#10B981", // Green
      "#F97316", // Orange
      "#FEF7CD"  // Yellow
    ];

    const newParticles = Array.from({ length: particleCount }).map((_, i) => ({
      id: i,
      x: Math.random() * 100, // percent
      y: -10, // start above screen
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 1.5 + 0.5, // 0.5-2rem
      speed: Math.random() * 3 + 1, // animation speed
      angle: Math.random() * 360 // degrees
    }));

    setParticles(newParticles);

    // Clean up after animation completes
    const timer = setTimeout(() => {
      setParticles([]);
    }, 2000);

    return () => clearTimeout(timer);
  }, [particleCount]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="confetti-particle"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            backgroundColor: particle.color,
            width: `${particle.size}rem`,
            height: `${particle.size}rem`,
            animationDuration: `${particle.speed}s`,
            transform: `rotate(${particle.angle}deg)`
          }}
        />
      ))}
    </div>
  );
};
