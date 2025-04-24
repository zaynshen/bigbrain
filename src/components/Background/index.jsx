import { useEffect, useState } from "react";

const BackgroundLogo = ({ logo = "/logo.png", count = 30 }) => {
  const [position, setPosition] = useState([]);
  useEffect(() => {
    const generateLogos = () => {
      const logos = [];
      for (let i = 0; i < count; i++) {
        logos.push({
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          size: `${40 + Math.random() * 40}px`,
          opacity: 0.05 + Math.random() * 0.15,
          rotate: `${Math.random() * 360}deg`,
        });
      }
      setPosition(logos);
    };
    generateLogos();
  }, [count]);
  return (
    <>
      {position.map((pos, idx) => (
        <img
          key={idx}
          src={logo}
          alt="bg-logo"
          style={{
            position: "absolute",
            top: pos.top,
            left: pos.left,
            width: pos.size,
            height: pos.size,
            opacity: pos.opacity,
            transform: `rotate(${pos.rotate})`,
            pointerEvents: "none",
            zIndex: 0,
          }}
        />
      ))}
    </>
  );
};
export default BackgroundLogo;
