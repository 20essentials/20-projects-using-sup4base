import { gsap } from 'gsap';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import { supabase } from '@/lib/supabase';

gsap.registerPlugin(MotionPathPlugin);

const svg = document.querySelector<SVGSVGElement>('svg')!;
const arrowsGroup = document.querySelector<SVGGElement>('.arrows')!;
const arrowAngleGroup = document.querySelector<SVGGElement>('.arrow-angle')!;
const bow = document.querySelector<SVGGElement>('#bow')!;
const bowPolyline = document.querySelector<SVGPolylineElement>('#bow polyline')!;
const cursor = svg.createSVGPoint();

async function addHitPoints() {
  const randomName = `User ${Math.floor(Math.random() * 999)}`;
  const { data: userData } = await supabase.auth.getUser();

  let full_name = randomName;
  let avatar_url = '/assets/userDefault.png';

  const identities = userData?.user?.identities ?? [];
  const provider = identities.find(i => i.provider === 'google');
  const idData = provider?.identity_data ?? identities[0]?.identity_data;

  if (idData) {
    full_name = idData.full_name ?? full_name;
    avatar_url = idData.avatar_url ?? avatar_url;
  }

  const userId = userData?.user?.id;
  if (!userId) return;

 // Solo crear la fila si no existía
await supabase
  .from('project_20_leaderboard')
  .upsert(
    {
      id: userId,
      username: full_name,
      profile_image: avatar_url
      // ¡NO ponemos points aquí!
    },
    { onConflict: 'id', ignoreDuplicates: true } // Ignora si ya existe
  )
  .select();

// Luego incrementamos los puntos de forma segura
await supabase.rpc('increment_points', { user_id: userId, increment_by: 1000 });
}

let randomAngle = 0;
const pivot = { x: 100, y: 250 };

window.addEventListener('mousedown', draw);
aim({ clientX: 320, clientY: 300 } as unknown as MouseEvent);

function draw(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (
    target.matches('.am-your-button') ||
    target.matches('dialog *') ||
    target.matches('dialog') ||
    target.matches('.am-your-button *')
  ) {
    return;
  }
  randomAngle = Math.random() * Math.PI * 0.03 - 0.015;
  gsap.to('.arrow-angle use', { opacity: 1, duration: 0.3 });
  window.addEventListener('mousemove', aim);
  window.addEventListener('mouseup', loose);
  aim(e);
}

function aim(e: MouseEvent) {
  const point = getMouseSVG(e);
  point.x = Math.min(point.x, pivot.x - 7);
  point.y = Math.max(point.y, pivot.y + 7);

  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  const angle = Math.atan2(dy, dx) + randomAngle;
  const bowAngle = angle - Math.PI;
  const distance = Math.min(Math.sqrt(dx * dx + dy * dy), 50);
  const scale = Math.min(Math.max(distance / 30, 1), 2);

  gsap.to(bow, {
    scaleX: scale,
    rotation: (bowAngle * 180) / Math.PI,
    transformOrigin: 'right center',
    duration: 0.3
  });
  gsap.to(arrowAngleGroup, {
    rotation: (bowAngle * 180) / Math.PI,
    svgOrigin: '100 250',
    duration: 0.3
  });
  gsap.to(arrowAngleGroup.querySelectorAll('use'), {
    x: -distance,
    duration: 0.3
  });
  gsap.to(bowPolyline, {
    attr: {
      points: `88,200 ${Math.min(
        pivot.x - (1 / scale) * distance,
        88
      )},250 88,300`
    },
    duration: 0.3
  });

  const radius = distance * 9;
  const offsetX = Math.cos(bowAngle) * radius;
  const offsetY = Math.sin(bowAngle) * radius;
  const arcWidth = offsetX * 3;

  const arc = document.querySelector<SVGPathElement>('#arc')!;
  gsap.to(arc, {
    attr: {
      d: `M100,250c${offsetX},${offsetY},${arcWidth - offsetX},${
        offsetY + 50
      },${arcWidth},50`
    },
    autoAlpha: distance / 60,
    duration: 0.3
  });
}

function loose() {
  window.removeEventListener('mousemove', aim);
  window.removeEventListener('mouseup', loose);

  gsap.to(bow, {
    scaleX: 1,
    transformOrigin: 'right center',
    ease: 'elastic.out(1,0.3)',
    duration: 0.4
  });
  gsap.to(bowPolyline, {
    attr: { points: '88,200 88,250 88,300' },
    ease: 'elastic.out(1,0.3)',
    duration: 0.4
  });

  const newArrow = document.createElementNS(
    'http://www.w3.org/2000/svg',
    'use'
  ) as SVGUseElement;
  newArrow.setAttributeNS('http://www.w3.org/1999/xlink', 'href', '#arrow');
  arrowsGroup.appendChild(newArrow);

  gsap.to(newArrow, {
    duration: 0.5,
    motionPath: {
      path: '#arc',
      align: '#arc',
      alignOrigin: [0.5, 0.5],
      autoRotate: true
    },
    onUpdate: () => hitTest(newArrow),
    onComplete: () => showMessage('.missyou'),
    ease: 'none'
  });

  const arc = document.querySelector<SVGPathElement>('#arc')!;
  gsap.to(arc, { opacity: 0, duration: 0.3 });
  gsap.set(arrowAngleGroup.querySelectorAll('use'), { opacity: 0 });
}

// --- hitTest con “winner” si flecha sale del viewport ---
function hitTest(arrow: SVGUseElement) {
  const arrowCTM = arrow.getCTM()!;
  const arrowLength = 60;
  const rotationRad = Math.atan2(arrowCTM.b, arrowCTM.a);

  const tipX = arrowCTM.e + Math.cos(rotationRad) * arrowLength;
  const tipY = arrowCTM.f + Math.sin(rotationRad) * arrowLength;

  // Crear un punto SVG para la punta
  const pt = svg.createSVGPoint();
  pt.x = tipX;
  pt.y = tipY;

  // Revisar si cruzó el viewport derecho
  const svgRect = svg.getBoundingClientRect();
  if (tipX > svgRect.width) {
    gsap.killTweensOf(arrow);
    showMessage('.hit'); // Aquí puedes usar '.winner' si quieres un mensaje distinto
    addHitPoints(); // <-- suma los puntos aquí

    return;
  }

  // Revisar colisión con target
  const targetPaths = document.querySelectorAll<SVGPathElement>('#target path');
  for (const path of targetPaths) {
    if (path.isPointInFill(pt)) {
      gsap.killTweensOf(arrow);
      showMessage('.hit');
      addHitPoints(); // <-- suma los puntos aquí
      return;
    }
  }
}

function showMessage(selector: string) {
  gsap.killTweensOf(selector);
  gsap.set(selector, { autoAlpha: 1 });
  gsap.fromTo(
    `${selector} path`,
    { rotation: -5, scale: 0, transformOrigin: 'center' },
    { scale: 1, ease: 'back.out(1.7)', stagger: 0.05, duration: 0.5 }
  );
  gsap.to(`${selector} path`, {
    delay: 2,
    rotation: 20,
    scale: 0,
    ease: 'back.in(1.7)',
    stagger: 0.03,
    duration: 0.3
  });
}

function getMouseSVG(e: MouseEvent) {
  cursor.x = e.clientX;
  cursor.y = e.clientY;
  return cursor.matrixTransform(svg.getScreenCTM()!.inverse());
}
