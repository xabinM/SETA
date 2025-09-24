import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { gsap } from 'gsap';
import ChatBackground from '@/assets/ChatBackground.png';
import './Landing.css';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const logoContainerRef = useRef<HTMLDivElement>(null); 
  const setaTextRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const [displayText, setDisplayText] = useState('');
  const [isScrambling, setIsScrambling] = useState(true);
  const [isBackspacing, setIsBackspacing] = useState(false);
  
  // 더 확실하고 긴 불용어들
  const koreanWords = ['안녕하세요', '그런데요', '하지만요', '사실은요', '어쨌든요', '그러므로요', '따라서요', '그리하여요', '왜냐하면요', '때문입니다', '그렇습니다', '그런겁니다', '어디에서든지', '언제든지', '누구든지', '무엇이든지', '어떻게든지', '아무튼간에', '그럼에도불구하고', '그렇기때문에', '어떤경우에든', '사실상으로는', '일반적으로는', '보통의경우', '대부분의경우', '거의모든경우', '어쨌거나간에', '그렇다고하더라도', '그런것치고는', '그런편이긴하지만', '어떻게보면', '생각해보니까', '돌이켜보면', '말하자면요', '다시말해서요', '바꿔말하면요', '요약하자면요'];
  
  const englishWords = ['however', 'therefore', 'furthermore', 'nevertheless', 'nonetheless', 'consequently', 'accordingly', 'specifically', 'particularly', 'especially', 'obviously', 'certainly', 'definitely', 'absolutely', 'completely', 'essentially', 'basically', 'fundamentally', 'generally', 'typically', 'normally', 'usually', 'frequently', 'occasionally', 'sometimes', 'meanwhile', 'otherwise', 'moreover', 'additionally', 'similarly', 'likewise', 'conversely', 'alternatively', 'subsequently', 'previously', 'ultimately', 'eventually', 'immediately', 'simultaneously', 'temporarily', 'permanently', 'approximately', 'relatively', 'significantly'];

  const generateLongText = () => {
    const result = [];
    for (let i = 0; i < 30; i++) { 
      if (i % 2 === 0) {
        result.push(koreanWords[Math.floor(Math.random() * koreanWords.length)]);
      } else {
        result.push(englishWords[Math.floor(Math.random() * englishWords.length)]);
      }
    }
    return result.join(' ');
  };

  useEffect(() => {
    gsap.config({ 
      force3D: true,
      nullTargetWarn: false 
    });

    const initialText = generateLongText();
    setDisplayText(initialText);

    const mainTimeline = gsap.timeline({ delay: 0.5 });
    startMainSequence(mainTimeline);

    return () => {
      mainTimeline.kill();
    };
  }, [navigate]);

  // 단어 교체 효과
  useEffect(() => {
    if (!isScrambling) return;

    const scrambleInterval = setInterval(() => {
      setDisplayText(prevText => {
        const words = prevText.split(' ');
        const newWords = words.map(word => {
          if (Math.random() < 0.15) {
            const isKorean = /[가-힣]/.test(word);
            if (isKorean) {
              const availableKorean = koreanWords.filter(w => w !== word);
              return availableKorean[Math.floor(Math.random() * availableKorean.length)];
            } else {
              const availableEnglish = englishWords.filter(w => w !== word);
              return availableEnglish[Math.floor(Math.random() * availableEnglish.length)];
            }
          }
          return word;
        });
        return newWords.join(' ');
      });

      if (Math.random() < 0.1) {
        const newText = generateLongText();
        setDisplayText(newText);
      }
    }, 350);

    return () => clearInterval(scrambleInterval);
  }, [isScrambling]);

  const startMainSequence = (tl: gsap.core.Timeline) => {
    // 1단계: 해킹 스타일 텍스트 변화 
    tl.add(() => {
      setIsScrambling(true);
    })
    
    // 2단계: 텍스트 교체 완전 중단
    .add(() => {
      setIsScrambling(false);
    }, 3)
    
    // 3단계: 백스페이스 시작
    .add(() => {
      startBackspace();
    }, 4.5);
  };

  const startBackspace = () => {
    console.log('백스페이스 함수 실행됨');
    setIsBackspacing(true);
    
    setTimeout(() => {
      let currentText = displayText;
      
      if (!currentText || currentText.trim().length === 0) {
        currentText = generateLongText();
        setDisplayText(currentText);
      }
      
      const deleteSpeed = 20; 
      let remainingText = currentText;
      
      const backspaceInterval = setInterval(() => {
        if (remainingText.length > 0) {
          remainingText = remainingText.slice(0, -1);
          setDisplayText(remainingText);
          
          if (textContainerRef.current) {
            const progress = 1 - remainingText.length / currentText.length;
            gsap.to(textContainerRef.current, {
              scale: 1 + progress * 0.2,
              y: -progress * 30,
              duration: 0.1,
              ease: "power2.out"
            });
          }
        } else {
          clearInterval(backspaceInterval);
          setIsBackspacing(false);
          setDisplayText('');
          
          if (textContainerRef.current) {
            gsap.to(textContainerRef.current, {
              scale: 1,
              y: 0,
              duration: 0.3,
              ease: "power2.out",
              onComplete: () => {
                setTimeout(() => {
                  showLogoAndText();
                }, 500);
              }
            });
          } else {
            setTimeout(() => {
              showLogoAndText();
            }, 500);
          }
        }
      }, deleteSpeed);
    }, 500); 
  };

  const showLogoAndText = () => {
    console.log('로고와 SETA 텍스트 표시 시작');
    
    // 로고와 SETA 텍스트 동시 등장
    if (logoContainerRef.current) {
      gsap.to(logoContainerRef.current, {
        opacity: 1,
        scale: 1,
        rotation: 360,
        duration: 1.5,
        ease: "back.out(1.5)"
      });
    }

    if (setaTextRef.current) {
      gsap.to(setaTextRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.5,
        delay: 0.3,
        ease: "back.out(1.5)",
        onComplete: () => {
          console.log('로고와 텍스트 등장 완료');
          setTimeout(() => {
            gsap.to(containerRef.current, {
              opacity: 0,
              duration: 0.7,
              ease: "power2.inOut",
              onComplete: () => {
                navigate('/home');
              }
            });
          }, 1000);
        }
      });
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
      
      {/* 해킹 스타일 텍스트 */}
      <div 
        ref={textContainerRef}
        className="hacking-text"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '85%',
          textAlign: 'center',
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: 'clamp(14px, 2.5vw, 22px)',
          lineHeight: '1.6',
          wordBreak: 'keep-all',
          fontFamily: '"Space Mono", monospace',
          fontWeight: '400',
          zIndex: 100,
          textShadow: '1px 1px 2px rgba(0, 0, 0, 0.8)',
          letterSpacing: '1px',
        }}
      >
        {displayText}
        {(displayText.length > 0 && !isBackspacing) && (
          <span 
            style={{
              animation: 'hackingBlink 1s infinite',
              marginLeft: '3px',
              color: '#00ffdb',
              textShadow: '0 0 8px #00ffdb'
            }}
          >
            |
          </span>
        )}
        {isBackspacing && (
          <span 
            style={{
              animation: 'hackingBlink 0.3s infinite',
              marginLeft: '3px',
              color: '#00ff41',
              textShadow: '0 0 12px #00ff41'
            }}
          >
            █
          </span>
        )}
      </div>
      
      {/* SETA 로고 */}
      <div className="logo-center" ref={logoContainerRef}>
        <img 
          ref={logoRef}
          src="/seta.ico" 
          alt="SETA Logo" 
          className="seta-logo-img"
        />
      </div>

      {/* SETA 텍스트 - 원형 배치 */}
      <div 
        ref={setaTextRef}
        className="seta-text-container"
        style={{
          position: 'absolute',
          top: '45%',
          left: '51%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center',
          opacity: 0,
          zIndex: 600,
          width: '200px',
          height: '200px'
        }}
      >
        <div className="circular-text">
          <span className="letter letter-s" style={{ transform: 'rotate(-45deg) translateY(-80px)' }}>S</span>
          <span className="letter letter-e" style={{ transform: 'rotate(-15deg) translateY(-80px)' }}>E</span>
          <span className="letter letter-t" style={{ transform: 'rotate(15deg) translateY(-80px)' }}>T</span>
          <span className="letter letter-a" style={{ transform: 'rotate(45deg) translateY(-80px)' }}>A</span>
        </div>
      </div>
      
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=swap');
        
        @keyframes hackingBlink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0.3; }
        }
        
        .hacking-text {
          font-variant-ligatures: none;
          -webkit-font-feature-settings: "liga" 0;
          font-feature-settings: "liga" 0;
        }

        .circular-text {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .letter {
          position: absolute;
          top: 50%;
          left: 50%;
          transform-origin: center;
          font-size: 48px;
          font-weight: 900;
          background: linear-gradient(45deg, #4a9d8e, #7ab8a8, #5eb09f);
          background-size: 200% 200%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          filter: drop-shadow(0 0 15px rgba(122, 184, 168, 0.3));
          animation: gentleGradientShift 4s ease-in-out infinite;
        }

        @keyframes gentleGradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
      
    </div>
  );
};

export default Landing;