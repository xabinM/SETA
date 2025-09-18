import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import ChatBackground from '@/assets/ChatBackground.png';
import './Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const particlesRef = useRef<HTMLDivElement[]>([]);
  
  // 더 많은 불용어 목록
  const stopwords = [
    // 한국어 불용어
    '그리고', '하지만', '또한', '그런데', '그러나', '그래서', '따라서', '그리하여',
    '이것', '그것', '저것', '이런', '그런', '저런', '이렇게', '그렇게', '저렇게',
    '여기서', '거기서', '저기서', '이때', '그때', '또는', '혹은', '아니면',
    '매우', '정말', '진짜', '아주', '완전', '너무', '상당히', '꽤', '약간', '좀',
    '아마', '혹시', '만약', '만일', '그럼', '그러면', '그런데', '그러니까',
    '왜냐하면', '때문에', '으로서', '으로써', '에서', '에게', '에게서', '부터',
    '까지', '마저', '조차', '밖에', '뿐만', '아니라', '거나', '든지',
    // 영어 불용어
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'this', 'that', 'these', 'those', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should',
    'very', 'much', 'many', 'most', 'more', 'so', 'just', 'now', 'here', 'there',
    'where', 'when', 'why', 'how', 'what', 'which', 'who', 'whom', 'whose',
    'some', 'any', 'no', 'not', 'only', 'also', 'even', 'still', 'yet', 'already',
    'both', 'either', 'neither', 'each', 'every', 'all', 'none', 'few', 'little',
    'enough', 'quite', 'rather', 'pretty', 'fairly', 'really', 'truly', 'indeed',
    // 특수 문자와 노이즈
    '...', '!!', '??', '***', '###', '@@@', '&&&', '$$$', '%%%', '^^^',
    '~~~', '---', '+++', '===', '|||', '\\\\\\', '>>>', '<<<', '***',
    // 채팅/SNS 노이즈
    'ㅋㅋㅋ', 'ㅎㅎㅎ', 'ㅠㅠ', 'ㅜㅜ', 'ㅡㅡ', 'ㅗㅗ', '흠냠', '헐', '와우',
    'lol', 'omg', 'wtf', 'tbh', 'imo', 'btw', 'fyi', 'asap', 'etc'
  ];

  useEffect(() => {
    // 초기 파티클 떠다니는 애니메이션
    particlesRef.current.forEach((particle, index) => {
      if (particle) {
        // 각 파티클마다 다른 떠다니는 애니메이션
        gsap.to(particle, {
          x: `+=${(Math.random() - 0.5) * 100}`,
          y: `+=${(Math.random() - 0.5) * 80}`,
          rotation: `+=${Math.random() * 360}`,
          duration: 3 + Math.random() * 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: index * 0.01
        });

        // 반짝임 효과
        gsap.to(particle, {
          opacity: 0.3 + Math.random() * 0.7,
          duration: 2 + Math.random() * 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
          delay: Math.random() * 2
        });
      }
    });

    // 메인 시퀀스 시작 (3초 후)
    const mainTimeline = gsap.timeline({ delay: 3 });
    startMainSequence(mainTimeline);

    return () => {
      mainTimeline.kill();
    };
  }, [navigate]);

  const startMainSequence = (tl: gsap.core.Timeline) => {
    // 1단계: HUD 요소들 등장
    tl.to('.hud-elements', {
      opacity: 1,
      duration: 0.5
    })
    
    // 2단계: 로고 등장 및 초기 회전
    .to('.logo-center', {
      opacity: 1,
      scale: 1,
      duration: 1,
      ease: "back.out(1.7)"
    }, 0.5)
    
    // 3단계: 불용어들 하이라이트 (문제 인식)
    .add(() => {
      particlesRef.current.forEach((particle, index) => {
        if (particle) {
          gsap.to(particle, {
            color: '#ff6b6b',
            textShadow: '0 0 15px #ff6b6b, 0 0 25px rgba(255, 107, 107, 0.5)',
            scale: 1.2,
            duration: 0.3,
            delay: index * 0.003,
            ease: "power2.out",
            onComplete: () => {
              gsap.to(particle, {
                color: '#ff6b6b',
                scale: 1,
                duration: 0.2
              });
            }
          });
        }
      });
    }, 1.5)
    
    // 4단계: 로고가 커지면서 강력한 회전 시작 (블랙홀 효과)
    .to('.logo-center', {
      scale: 2,
      rotation: 720,
      duration: 2,
      ease: "power2.in"
    }, 3)
    
    .to('.logo-outer-ring, .logo-inner-ring', {
      scale: 3,
      opacity: 0.8,
      duration: 2,
      ease: "power2.in"
    }, 3)
    
    // 5단계: 토네이도 블랙홀 효과 - 불용어들이 소용돌이치며 빨려들어감
    .add(() => {
      particlesRef.current.forEach((particle, index) => {
        if (particle) {
          const rect = particle.getBoundingClientRect();
          const centerX = window.innerWidth / 2;
          const centerY = window.innerHeight / 2;
          
          // 현재 위치에서 중심까지의 거리와 각도 계산
          const currentX = rect.left + rect.width / 2;
          const currentY = rect.top + rect.height / 2;
          const deltaX = centerX - currentX;
          const deltaY = centerY - currentY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const initialAngle = Math.atan2(deltaY, deltaX);
          
          // 토네이도 매개변수
          const spiralTurns = 2 + (distance / 150); // 거리에 비례한 회전 수
          const spiralRadius = Math.min(distance * 0.6, 250);
          
          // 토네이도 경로를 단계별로 애니메이션
          const tornadoTimeline = gsap.timeline();
          
          // 1단계: 토네이도 외곽으로 이동 (원형 궤도 시작점)
          const outerX = centerX + Math.cos(initialAngle) * spiralRadius;
          const outerY = centerY + Math.sin(initialAngle) * spiralRadius;
          
          tornadoTimeline
            .to(particle, {
              x: outerX - currentX,
              y: outerY - currentY,
              rotation: `+=${180}`,
              scale: 1.1,
              duration: 0.6,
              delay: index * 0.003,
              ease: "power2.out"
            })
            
            // 2단계: 소용돌이치며 안쪽으로 나선 이동
            .to(particle, {
              rotation: `+=${360 * spiralTurns}`,
              scale: 0.8,
              duration: 1.5,
              ease: "power1.inOut",
              onUpdate: function() {
                const progress = this.progress();
                const currentRadius = spiralRadius * (1 - progress * 0.8);
                const currentAngle = initialAngle + (progress * spiralTurns * Math.PI * 2);
                
                const spiralX = centerX + Math.cos(currentAngle) * currentRadius;
                const spiralY = centerY + Math.sin(currentAngle) * currentRadius;
                
                gsap.set(particle, {
                  x: spiralX - currentX,
                  y: spiralY - currentY
                });
              }
            }, 0.2)
            
            // 3단계: 최종 블랙홀로 빨려들어감
            .to(particle, {
              x: centerX - currentX,
              y: centerY - currentY,
              rotation: `+=${720}`,
              scale: 0,
              opacity: 0,
              duration: 0.4,
              ease: "power4.in"
            });
        }
      });
    }, 3.5)
    
    // 6단계: 로고 정리 및 SETA 텍스트 등장
    .to('.logo-center', {
      scale: 1,
      rotation: 0,
      duration: 1,
      ease: "elastic.out(1, 0.3)"
    }, 5)
    
    .to('.seta-text-container', {
      opacity: 1,
      y: -20,
      duration: 1,
      ease: "back.out(1.7)"
    }, 5.5)
    
    .to('.progress-text', {
      opacity: 1,
      y: 0,
      duration: 0.5
    }, 5.5)
    
    // 7단계: 완료 후 페이지 전환
    .add(() => {
      setTimeout(() => {
        // 페이드아웃 효과와 함께 홈으로 이동
        gsap.to(containerRef.current, {
          opacity: 0,
          duration: 1,
          ease: "power2.inOut",
          onComplete: () => {
            navigate('/home');
          }
        });
      }, 1500);
    }, 6.5);
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
      
      {/* 배경 어둠 오버레이 */}
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
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${10 + Math.random() * 10}px`,
                opacity: 0.4 + Math.random() * 0.6,
              }}
            >
              {word}
            </div>
          ))
        )}
      </div>
      
      {/* SETA 로고 (실제 ico 파일 사용) */}
      <div className="logo-center">
        <div className="logo-outer-ring"></div>
        <div className="logo-inner-ring"></div>
        <img 
          ref={logoRef}
          src="/seta.ico" 
          alt="SETA Logo" 
          className="seta-logo-img"
        />
      </div>
      
      {/* SETA 텍스트 */}
      <div className="seta-text-container">
        <div className="seta-text">SETA</div>
      </div>

      {/* HUD 요소들 - 스캔라인 제거 */}
      <div className="hud-elements">
        <div className="hud-corner hud-top-left"></div>
        <div className="hud-corner hud-top-right"></div>
        <div className="hud-corner hud-bottom-left"></div>
        <div className="hud-corner hud-bottom-right"></div>
        
        <div className="data-stream">
          <span>ANALYZING STOPWORDS...</span>
          <span>OPTIMIZING LANGUAGE MODEL...</span>
          <span>REDUCING CARBON FOOTPRINT...</span>
        </div>
      </div>
    </div>
  );
};

export default Landing;