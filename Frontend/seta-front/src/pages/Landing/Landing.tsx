import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import ChatBackground from '@/assets/ChatBackground.png';
import './Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const setaTextRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  
  // 불용어 목록 (기존과 동일)
  const stopwords = [
    // 한국어 불용어
    '안녕하세요', '그런데요', '하지만요', '사실은요', '어쨌든요', '그러므로요', '따라서요', '그리하여요', '왜냐하면요', '때문입니다', '그렇습니다', '그런겁니다', '어디에서든지', '언제든지', '누구든지', '무엇이든지', '어떻게든지', '아무튼간에', '그럼에도불구하고', '그렇기때문에', '어떤경우에든', '사실상으로는', '일반적으로는', '보통의경우', '대부분의경우', '거의모든경우', '어쨌거나간에', '그렇다고하더라도', '그런것치고는', '그런편이긴하지만', '어떻게보면', '생각해보니까', '돌이켜보면', '말하자면요', '다시말해서요', '바꿔말하면요', '요약하자면요',
    // 영어 불용어
    'however', 'therefore', 'furthermore', 'nevertheless', 'nonetheless', 'consequently', 'accordingly', 'specifically', 'particularly', 'especially', 'obviously', 'certainly', 'definitely', 'absolutely', 'completely', 'essentially', 'basically', 'fundamentally', 'generally', 'typically', 'normally', 'usually', 'frequently', 'occasionally', 'sometimes', 'meanwhile', 'otherwise', 'moreover', 'additionally', 'similarly', 'likewise', 'conversely', 'alternatively', 'subsequently', 'previously', 'ultimately', 'eventually', 'immediately', 'simultaneously', 'temporarily', 'permanently', 'approximately', 'relatively', 'significantly'
  ];

  useEffect(() => {
    gsap.config({ 
      force3D: true,
      nullTargetWarn: false 
    });

    // 별 반짝임 애니메이션 (점점 많아지는 효과)
    animateStarfield();

    // 메인 시퀀스 시작 (5초 후 - 별들이 충분히 많아진 후)
    const mainTimeline = gsap.timeline({ delay: 5 });
    startMainSequence(mainTimeline);

    return () => {
      mainTimeline.kill();
    };
  }, [navigate]);

  const animateStarfield = () => {
    // 불용어들을 3개 그룹으로 나누어 순차적으로 등장
    const totalWords = stopwords.length * 3;
    
    particlesRef.current.forEach((particle, index) => {
      if (particle) {
        // 초기 상태: 투명하고 작게
        gsap.set(particle, { 
          opacity: 0,
          scale: 0.3,
          force3D: true,
          transformOrigin: "center center"
        });

        // 순차적 등장 (별이 하나씩 나타나는 효과)
        const appearDelay = (index / totalWords) * 4; // 4초에 걸쳐 모든 별이 등장
        
        gsap.to(particle, {
          opacity: 0.6 + Math.random() * 0.4,
          scale: 0.8 + Math.random() * 0.4,
          duration: 0.8,
          delay: appearDelay,
          ease: "power2.out",
          onComplete: () => {
            // 등장 후 반짝이는 애니메이션
            startTwinkleAnimation(particle);
          }
        });
      }
    });
  };

  const startTwinkleAnimation = (particle: HTMLDivElement) => {
    // 별처럼 반짝이는 애니메이션
    gsap.to(particle, {
      opacity: 0.2 + Math.random() * 0.6,
      scale: 0.6 + Math.random() * 0.6,
      duration: 2 + Math.random() * 2,
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      delay: Math.random() * 2
    });

    // 미세한 회전 효과
    gsap.to(particle, {
      rotation: `+=${(Math.random() - 0.5) * 30}`,
      duration: 8 + Math.random() * 4,
      repeat: -1,
      yoyo: true,
      ease: "none"
    });
  };

  const startMainSequence = (tl: gsap.core.Timeline) => {
    // 로고의 중심 좌표 계산
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    tl
    // 1단계: 로고 등장
    .to('.logo-center', {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: "back.out(1.7)"
    })
    
    // 2단계: 불용어들 색상 변화 (빨간색 = 나쁜 것)
    .add(() => {
      particlesRef.current.forEach((particle, index) => {
        if (particle) {
          gsap.to(particle, {
            color: '#ff6b6b',
            scale: 1.1,
            duration: 0.5,
            delay: index * 0.001,
            ease: "power2.out"
          });
        }
      });
    }, 1)
    
    // 3단계: 로고 회전 시작 (블랙홀 효과 준비)
    .to('.logo-center', {
      rotation: 360,
      scale: 1.2,
      duration: 2,
      ease: "power2.inOut"
    }, 2)
    
    // 4단계 전: 기존 애니메이션 모두 종료
    .add(() => {
      particlesRef.current.forEach(particle => {
        if (particle) {
          gsap.killTweensOf(particle); // 모든 떠다니는 애니메이션 종료
        }
      });
    }, 3.4) // 흡수 애니메이션 시작 0.1초 전에 종료
    
    // 4단계: 깔끔한 흡수 애니메이션
    .add(() => {
      particlesRef.current.forEach((particle, index) => {
        if (particle) {
          const rect = particle.getBoundingClientRect();
          const currentX = rect.left + rect.width / 2;
          const currentY = rect.top + rect.height / 2;
          const deltaX = centerX - currentX;
          const deltaY = centerY - currentY;

          gsap.to(particle, {
            x: deltaX,
            y: deltaY,
            scale: 0,
            opacity: 0,
            duration: 1.5,
            delay: index * 0.003,
            ease: "power2.in"
          });
        }
      });
    }, 3.5)
    
    .add(() => {
  if (setaTextRef.current && logoRef.current) {
    const logoRect = logoRef.current.getBoundingClientRect();

    const centerX = logoRect.left + logoRect.width / 2;
    const centerY = logoRect.top + logoRect.height / 2 - 40;

    // 위치를 절대 위치(px)로 세팅, transform translate 대신 gsap의 xPercent, yPercent로 중앙 정렬
    gsap.set(setaTextRef.current, {
      position: 'absolute',
      top: centerY,
      left: centerX,
      xPercent: -50,
      yPercent: -50,
      opacity: 0,
      y: 0,
      scale: 0.5,
    });

    // 등장 애니메이션
    gsap.to(setaTextRef.current, {
      opacity: 1,
      scale: 1,
      duration: 1.5,
      ease: "back.out(1.7)",
    });
  }
}, 4.5)
    
    // 6단계: SETA 글자들 개별 등장 효과
    .staggerTo('.letter', 0.4, {
      opacity: 1,
      y: 0,
      rotation: 360,
      scale: 1,
      ease: "back.out(2)"
    }, 0.1)
    
    // 7단계: Green AI 부제목 등장
    .to('.subtitle', {
      opacity: 1,
      y: 0,
      duration: 1,
      ease: "power2.out"
    }, 6.2)
    
    // 8단계: 완료 후 페이지 전환
    .add(() => {
      setTimeout(() => {
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 0.6,
          ease: "power2.inOut",
          onComplete: () => {
            navigate('/home');
          }
        });
      }, 2000);
    }, 7.5);
  };

  const addParticleRef = (el: HTMLDivElement | null) => {
    if (el && !particlesRef.current.includes(el)) {
      particlesRef.current.push(el);
    }
  };

  return (
    <div 
      className="landing-container" 
      ref={containerRef}
      style={{ backgroundImage: `url(${ChatBackground})` }}
    >
      <div className="background-overlay"></div>
      
      {/* 불용어 파티클들 */}
      <div className="particles-container">
        {[...Array(3)].map((_, groupIndex) => 
          stopwords.map((word, index) => (
            <div
              key={`${groupIndex}-${index}`}
              ref={addParticleRef}
              className="stopword"
              style={{
                position: 'absolute', // 반드시 absolute 위치 지정
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${10 + Math.random() * 8}px`,
              }}
            >
              {word}
            </div>
          ))
        )}
      </div>
      
      {/* SETA 로고 */}
      <div className="logo-center">
        <img 
          ref={logoRef}
          src="/seta.ico" 
          alt="SETA Logo" 
          className="seta-logo-img"
        />
      </div>
      
      <div 
  ref={setaTextRef}
  className="seta-text-container"
>
  <div className="circular-text">
    <span className="letter" style={{ transform: 'rotate(-35deg) translateY(-60px)' }}>S</span>
    <span className="letter" style={{ transform: 'rotate(-10deg) translateY(-80px)' }}>E</span>
    <span className="letter" style={{ transform: 'rotate(10deg) translateY(-80px)' }}>T</span>
    <span className="letter" style={{ transform: 'rotate(35deg) translateY(-60px)' }}>A</span>
  </div>
</div>



          </div>
        );
      };

export default Landing;