import { useEffect, useRef, useState } from "react";
import char from "../assets/carli.svg";
import scenaryImg from "../assets/scenary.svg";
import Image from "next/image";
import Obstacle from "@/Components/Obstacle";
import moon from "../assets/moon.svg";

const Index = () => {
  const [isJumping, setIsJumping] = useState(false);
  const [jumpHeight, setJumpHeight] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [obstacles, setObstacles] = useState<{ x: number; type: "garbage" | "bricks" }[]>([]);
  const [obstacleSpeed, setObstacleSpeed] = useState(4);
  const [spawnRate, setSpawnRate] = useState(0.005); // Reduced spawn rate for more space between obstacles
  
  const groundOffsetRef = useRef(0);
  const backgroundOffsetRef = useRef(0);
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const groundElementRef = useRef<HTMLDivElement>(null);
  const groundLinesRef = useRef<HTMLDivElement>(null);
  const characterRef = useRef<HTMLDivElement>(null);
  const jumpRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);
  const gameLoopRef = useRef<number | null>(null);
  const lastObstacleTimeRef = useRef(0); // Track when the last obstacle was created

  const groundWidth = 5000;
  const minObstacleSpacing = 500; // Minimum pixel spacing between obstacles

  const handleJump = () => {
    if (gameOver) {
      window.location.reload();
      return;
    }
  
    if (!gameStarted) {
      setGameStarted(true);
      setGameOver(false);
    }
  
    if (isJumping) return;
    setIsJumping(true);
  
    let height = 0;
    let up = true;
  
    jumpRef.current = setInterval(() => {
      setJumpHeight(height);
      if (up) {
        // Going up at normal speed
        height += 5;
        if (height >= 210) up = false; 
      } else {
        // Coming down faster (8px instead of 5px per frame)
        height -= 8;
        if (height <= 0) {
          height = 0;
          setJumpHeight(0);
          setIsJumping(false);
          if (jumpRef.current) clearInterval(jumpRef.current);
        }
      }
    }, 20);
  };
  
  const gameLoop = (timestamp: number) => {
    if (!gameStarted || gameOver) return;

    groundOffsetRef.current -= 4;
    if (groundOffsetRef.current <= -groundWidth) {
      groundOffsetRef.current = 0;
    }
    
    backgroundOffsetRef.current -= 1;
    if (backgroundOffsetRef.current <= -2000) {
      backgroundOffsetRef.current = 0;
    }

    if (groundElementRef.current) {
      groundElementRef.current.style.transform = `translateX(${groundOffsetRef.current}px)`;
    }
    
    if (groundLinesRef.current) {
      groundLinesRef.current.style.transform = `translateX(${groundOffsetRef.current}px)`;
    }
    
    if (gameContainerRef.current) {
      gameContainerRef.current.style.backgroundPosition = `${backgroundOffsetRef.current}px center`;
    }

    const charElem = characterRef.current;
    if (charElem) {
      const charRect = charElem.getBoundingClientRect();
      const allObstacles = document.querySelectorAll(".obstacle");

      for (let i = 0; i < allObstacles.length; i++) {
        const obsRect = allObstacles[i].getBoundingClientRect();
        const isColliding =
          charRect.left < obsRect.right &&
          charRect.right > obsRect.left &&
          charRect.top < obsRect.bottom &&
          charRect.bottom > obsRect.top;

        if (isColliding) {
          console.log("💥 Collision detected with obstacle #" + i);
          setGameOver(true);
          setGameStarted(false);
          return;
        }
      }
    }

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      
      setObstacles((prev) => {
        const moved = prev.map((obs) => ({ ...obs, x: obs.x - obstacleSpeed }));
        const filtered = moved.filter((obs) => obs.x > -100);
        
        // Check if enough time has passed since the last obstacle and if we pass the random chance
        const enoughSpacing = filtered.length === 0 || 
                             filtered.every(obs => obs.x < window.innerWidth - minObstacleSpacing);
        const timeElapsed = currentTime - lastObstacleTimeRef.current > 1000; // At least 1 second between spawns
        
        if (enoughSpacing && timeElapsed && Math.random() < spawnRate) {
          const newType = Math.random() > 0.5 ? "garbage" : "bricks";
          filtered.push({ x: window.innerWidth + 100, type: newType });
          lastObstacleTimeRef.current = currentTime;
        }

        return filtered;
      });
    }, 16);

    const speedIncreaseInterval = setInterval(() => {
      if (obstacleSpeed < 10) {
        setObstacleSpeed((prev) => prev + 0.1);
      }

      // Keep spawn rate lower to maintain spacing
      if (spawnRate > 0.001) {
        setSpawnRate((prev) => prev - 0.0001);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      clearInterval(speedIncreaseInterval);
    };
  }, [gameStarted, gameOver, obstacleSpeed, spawnRate]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else if (gameLoopRef.current) {
      cancelAnimationFrame(gameLoopRef.current);
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameStarted, gameOver]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
        handleJump();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isJumping, gameOver, gameStarted]);

  return (
    <div
      ref={gameContainerRef}
      className="relative w-full h-[950px] overflow-hidden"
      onClick={handleJump}
      style={{
        backgroundImage: `url(${scenaryImg.src})`,
        backgroundRepeat: "repeat-x",
        backgroundSize: "500% auto",
        backgroundPosition: "0px center",
      }}
    >
      <div>
        <Image src={moon} alt="" height={200} className="relative z-[-1] left-[63rem]" />
      </div>

      {!gameStarted && !gameOver && (
        <div className="bg-black h-full absolute top-0 w-full text-center pt-[320px] text-white text-4xl font-bold z-50">
          Click or press jump key to start
        </div>
      )}

      {gameOver && (
        <div className="absolute top-1/3 left-1/2 transform -translate-x-1/2 pl-2 pr-2 py-5 bg-black rounded-md text-white text-4xl font-bold z-50">
          Game Over
        </div>
      )}

      <div className="stars"></div>

      <div
        ref={groundElementRef}
        className="absolute top-[42rem] h-[3rem] bg-black"
        style={{
          width: `${groundWidth * 2}px`,
          transform: `translateX(0px)`,
        }}
      />
      
      <div
        ref={groundLinesRef}
        className="absolute top-[25rem] h-[8rem] flex w-full"
        style={{
          width: `${groundWidth * 2}px`,
          transform: `translateX(0px)`,
        }}
      >
        {Array.from({ length: (groundWidth / 50) * 1 }).map((_, i) => (
          <div
            key={i}
            className="h-[2px] ml-5 w-[30px] relative mt-[18.5rem] bg-white"
          />
        ))}
      </div>

      <div
        ref={characterRef}
        className="absolute top-[39rem] left-10"
        style={{
          transform: `translateY(-${jumpHeight}px)`,
          transition: "transform 0.05s",
        }}
      >
        <Image width={120} height={120} src={char} alt="character" />
      </div>

      {obstacles.map((obs, i) => (
        <Obstacle key={i} x={obs.x} type={obs.type} />
      ))}
    </div>
  );
};

export default Index;
