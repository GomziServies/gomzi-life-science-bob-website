import { createRoot } from 'react-dom/client';
import JarScene from './site/components/JarScene';
const c = document.createElement('canvas'); c.width = 2400; c.height = 800;
const x = c.getContext('2d')!;
const g = x.createLinearGradient(0,0,0,800); g.addColorStop(0,'#e02020'); g.addColorStop(0.55,'#2a0d0d'); g.addColorStop(1,'#101010');
x.fillStyle = g; x.fillRect(0,0,2400,800);
x.fillStyle='#fff'; x.font='bold 150px sans-serif'; x.fillText('POWER', 1000, 420);
createRoot(document.getElementById('r')!).render(<JarScene wrap={c} mm={{ w: 450, h: 150 }} kind="pouch" jarColor="#101010" panels={[0.25, 0.5, 0.25]} autoTurn={false} className="j" />);
