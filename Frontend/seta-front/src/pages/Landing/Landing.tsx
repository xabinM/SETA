import React, {useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import {gsap} from 'gsap';
import ChatBackground from '@/assets/ChatBackground.png';
import './Landing.css';

const Landing: React.FC = () => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);
    const logoRef = useRef<HTMLImageElement>(null);
    const setaTextRef = useRef<HTMLDivElement>(null);
    const particlesRef = useRef<HTMLDivElement[]>([]);

    const stopwords = [
        "고마워", "고마워요", "감사해요", "감사합니다",
        "도움 고마워", "답변 감사", "수고했어",
        "thanks a lot",
        "thanks for help", "thanks for explaining",
        "잘못했어",
        "늦어서 미안", "바쁜데 미안", "다시 물어봐서 미안",
        "sorry", "apologize",
        "안녕", "안녕하세요", "안녕하십니까", "하이", "헬로", "hello", "hi",
        "오랜만", "오랜만이야",
        "그런데", "근데", "그래서", "그리고나서",
        "있잖아", "내말은", "그니깐", "그러니까", "뭐랄까", "어떻게보면", "사실은",
        "생각해보니", "돌이켜보면", "말하자면",
        "honestly", "frankly", "obviously",
        "therefore", "furthermore", "moreover",


    ];

    useEffect(() => {
        gsap.config({
            force3D: true,
            nullTargetWarn: false
        });

        animateStarfield();

        const mainTimeline = gsap.timeline({delay: 5});
        startMainSequence(mainTimeline);

        return () => {
            mainTimeline.kill();
        };
    }, [navigate]);

    const animateStarfield = () => {
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

                const appearDelay = (index / totalWords) * 4;

                gsap.to(particle, {
                    opacity: 0.6 + Math.random() * 0.4,
                    scale: 0.8 + Math.random() * 0.4,
                    duration: 0.5,
                    delay: appearDelay,
                    ease: "power2.out",
                    onComplete: () => {
                        startTwinkleAnimation(particle);
                    }
                });
            }
        });
    };

    const startTwinkleAnimation = (particle: HTMLDivElement) => {
        gsap.to(particle, {
            opacity: 0.2 + Math.random() * 0.6,
            scale: 0.6 + Math.random() * 0.6,
            duration: 2 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease: "power1.inOut",
            delay: Math.random() * 2
        });

        gsap.to(particle, {
            rotation: `+=${(Math.random() - 0.5) * 30}`,
            duration: 6 + Math.random() * 4,
            repeat: -1,
            yoyo: true,
            ease: "none"
        });
    };

    const startMainSequence = (tl: gsap.core.Timeline) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;

        tl
            .to('.logo-center', {
                opacity: 1,
                scale: 1,
                duration: 1,
                ease: "back.out(1.7)"
            })

            .add(() => {
                particlesRef.current.forEach((particle, index) => {
                    if (particle) {
                        gsap.to(particle, {
                            color: '#dddd',
                            scale: 1.1,
                            duration: 0.5,
                            delay: index * 0.001,
                            ease: "power2.out"
                        });
                    }
                });
            }, 1)

            .to('.logo-center', {
                rotation: 360,
                scale: 1.2,
                duration: 2,
                ease: "power2.inOut"
            }, 2)

            .add(() => {
                particlesRef.current.forEach(particle => {
                    if (particle) {
                        gsap.killTweensOf(particle);
                    }
                });
            }, 3.4)

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
                            duration: 1,
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
                    const centerY = logoRect.top + logoRect.height / 2 - 80;

                    gsap.set(setaTextRef.current, {
                        position: 'absolute',
                        top: centerY,
                        left: centerX,
                        xPercent: -50,
                        yPercent: -50,
                        opacity: 1,
                        scale: 1,
                    });
                }
            }, 5.0)

            .to('.letter', {
                opacity: 1,
                y: 0,
                rotation: 0,
                scale: 1,
                duration: 0.6,
                ease: "back.out(2)",
                stagger: 0.15
            }, 5.2)

            .to('.subtitle', {
                opacity: 1,
                y: 0,
                duration: 1,
                ease: "power2.out"
            }, 6.2)

            .add(() => {
                setTimeout(() => {
                    gsap.to(containerRef.current, {
                        opacity: 0,
                        duration: 0.5,
                        ease: "power2.inOut",
                        onComplete: () => {
                            navigate('/home');
                        }
                    });
                }, 500);
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
            style={{backgroundImage: `url(${ChatBackground})`}}
        >
            <div className="background-overlay"></div>
            <div className="particles-container">
                {[...Array(3)].map((_, groupIndex) =>
                    stopwords.map((word, index) => (
                        <div
                            key={`${groupIndex}-${index}`}
                            ref={addParticleRef}
                            className="stopword"
                            style={{
                                position: 'absolute',
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
            <div className="logo-center">
                <img
                    ref={logoRef}
                    src="/seta.ico"
                    alt="SETA Logo"
                    className="seta-logo-img"
                />
            </div>

            <div ref={setaTextRef} className="seta-text-container">
                <div className="circular-text">
                    <span className="letter">S</span>
                    <span className="letter">E</span>
                    <span className="letter">T</span>
                    <span className="letter">A</span>
                </div>
            </div>
        </div>
    );
};

export default Landing;