import Image from "next/image";
import garbage from "../assets/obstacles/garbage.svg";
import bricks from "../assets/obstacles/bricks.svg";

const obstacleMap = {
  garbage,
  bricks,
};

const Obstacle = ({ x, type }: { x: number; type: keyof typeof obstacleMap }) => {
  return (
    <div
      className="absolute top-[40rem] obstacle"
      style={{
        transform: `translateX(${x}px)`,
        top: "730px",
        transition: "transform 0.05s linear",
      }}
    >
      <Image src={obstacleMap[type]} width={80} height={80} alt="" />
    </div>
  );
};

export default Obstacle;
