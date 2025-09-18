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
    // GSAP 성능 최적화 설정
    gsap.config({ 
      force3D: true,
      nullTargetWarn: false 
    });

    // 초기 파티클 떠다니는 애니메이션 (성능 최적화)
    particlesRef.current.forEach((particle, index) => {
      if (particle) {
        // GPU 가속을 위한 초기 transform 설정
        gsap.set(particle, { 
          force3D: true,
          transformOrigin: "center center"
        });

        // 더 부드러운 떠다니는 애니메이션
        gsap.to(particle, {
          x: `+=${(Math.random() - 0.5) * 60}`,
          y: `+=${(Math.random() - 0.5) * 40}`,
          rotation: `+=${(Math.random() - 0.5) * 180}`,
          duration: 4 + Math.random() * 3,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: index * 0.005
        });

        // 부드러운 투명도 변화
        gsap.to(particle, {
          opacity: 0.4 + Math.random() * 0.4,
          duration: 3 + Math.random() * 2,
          repeat: -1,
          yoyo: true,
          ease: "power1.inOut",
          delay: Math.random() * 1
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
    
    // 3단계: 불용어들 점진적으로 희미해짐 (부정적 느낌 제거)
    .add(() => {
      particlesRef.current.forEach((particle, index) => {
        if (particle) {
          gsap.to(particle, {
            opacity: 0.2,
            scale: 0.9,
            duration: 0.8,
            delay: index * 0.002,
            ease: "power2.out"
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
    
    // 5단계: 매우 부드러운 토네이도 블랙홀 효과
    .add(() => {
      // 마스터 타임라인으로 모든 파티클을 동시에 제어
      const masterTl = gsap.timeline();
      
      // 로고의 실제 중심 좌표 계산 (로고와 정확히 맞춤)
      const logoElement = logoRef.current;
      let centerX = window.innerWidth / 2;
      let centerY = window.innerHeight / 2;
      
      if (logoElement) {
        const logoRect = logoElement.getBoundingClientRect();
        centerX = logoRect.left + logoRect.width / 2;
        centerY = logoRect.top + logoRect.height / 2;
      }
      
      particlesRef.current.forEach((particle, index) => {
        if (particle) {
          const rect = particle.getBoundingClientRect();
          
          const currentX = rect.left + rect.width / 2;
          const currentY = rect.top + rect.height / 2;
          const deltaX = centerX - currentX;
          const deltaY = centerY - currentY;
          const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
          const angle = Math.atan2(deltaY, deltaX);
          
          // 거리별 그룹핑으로 성능 최적화
          const spiralRadius = Math.min(distance * 0.5, 200);
          const spiralTurns = 1.5 + (distance / 200);
          
          // GPU 가속 토네이도 애니메이션
          const particleTl = gsap.timeline();
          
          particleTl
            // 1단계: 부드러운 궤도 진입
            .to(particle, {
              x: centerX + Math.cos(angle) * spiralRadius - currentX,
              y: centerY + Math.sin(angle) * spiralRadius - currentY,
              rotation: "+=90",
              scale: 1.1,
              duration: 0.8,
              ease: "power2.out",
              force3D: true
            })
            
            // 2단계: 나선 회전 (CustomEase 대신 power 사용)
            .to(particle, {
              rotation: `+=${360 * spiralTurns}`,
              scale: 0.6,
              duration: 1.8,
              ease: "power1.inOut",
              onUpdate: function() {
                const progress = this.progress();
                const currentRadius = spiralRadius * (1 - progress * 0.9);
                const currentAngle = angle + (progress * spiralTurns * Math.PI * 2);
                
                gsap.set(particle, {
                  x: centerX + Math.cos(currentAngle) * currentRadius - currentX,
                  y: centerY + Math.sin(currentAngle) * currentRadius - currentY,
                  force3D: true
                });
              }
            }, 0.3)
            
            // 3단계: 최종 흡수 (로고 중심으로 정확히)
            .to(particle, {
              x: centerX - currentX,
              y: centerY - currentY,
              rotation: "+=180",
              scale: 0,
              opacity: 0,
              duration: 0.6,
              ease: "power3.in",
              force3D: true
            });
          
          // 인덱스별 지연을 줄여서 더 부드럽게
          particleTl.delay(index * 0.002);
          masterTl.add(particleTl, 0);
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
      
      
      
  </div>    
  );
};

export default Landing;