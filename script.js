// Portfolio JavaScript - Max Sun
// Interactive features and animations

document.addEventListener('DOMContentLoaded', function () {
    // Initialize all features
    initCustomCursor();
    initNavbarScroll();
    initSmoothScroll();
    initHamburgerMenu();
    initScrollAnimations();
    initTypeWriter();
    initParallaxEffect();
    initSkillCardInteractions();
    initProjectFilters();
    initContactForm();
    initEasterEggs();
});

// Custom Cursor
function initCustomCursor() {
    const cursor = document.querySelector('.cursor');
    const cursorFollower = document.querySelector('.cursor-follower');

    if (!cursor || !cursorFollower) return;

    let mouseX = 0;
    let mouseY = 0;
    let followerX = 0;
    let followerY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;

        cursor.style.transform = `translate(${mouseX - 10}px, ${mouseY - 10}px)`;
    });

    // Smooth follower animation
    function animateFollower() {
        followerX += (mouseX - followerX) * 0.1;
        followerY += (mouseY - followerY) * 0.1;

        cursorFollower.style.transform = `translate(${followerX - 4}px, ${followerY - 4}px)`;
        requestAnimationFrame(animateFollower);
    }
    animateFollower();

    // Cursor interactions
    const interactiveElements = document.querySelectorAll('a, button, .skill-card, .project-card');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.style.transform += ' scale(1.5)';
            cursor.style.background = 'rgba(99, 102, 241, 0.2)';
        });

        el.addEventListener('mouseleave', () => {
            cursor.style.transform = cursor.style.transform.replace(' scale(1.5)', '');
            cursor.style.background = 'transparent';
        });
    });
}

// Navbar scroll effect
function initNavbarScroll() {
    const navbar = document.querySelector('.navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;

        if (currentScrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide/show navbar on scroll
        if (currentScrollY > lastScrollY && currentScrollY > 500) {
            navbar.style.transform = 'translateY(-100%)';
        } else {
            navbar.style.transform = 'translateY(0)';
        }

        lastScrollY = currentScrollY;
    });
}

// Smooth scroll for navigation links
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));

            if (target) {
                const offsetTop = target.offsetTop - 80;
                window.scrollTo({
                    top: offsetTop,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Hamburger menu
function initHamburgerMenu() {
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');

    if (!hamburger || !navLinks) return;

    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navLinks.classList.toggle('active');

        // Add mobile menu styles dynamically
        if (navLinks.classList.contains('active')) {
            navLinks.style.cssText = `
                display: flex;
                flex-direction: column;
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                padding: 2rem;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                gap: 1rem;
            `;
        } else {
            navLinks.style.cssText = '';
        }
    });

    // Close menu when clicking on a link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navLinks.classList.remove('active');
            navLinks.style.cssText = '';
        });
    });
}

// Scroll animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');

                // Staggered animation for grid items
                if (entry.target.classList.contains('skills-grid') ||
                    entry.target.classList.contains('projects-grid')) {
                    const children = entry.target.children;
                    Array.from(children).forEach((child, index) => {
                        setTimeout(() => {
                            child.style.animation = `fadeInUp 0.8s ease ${index * 0.1}s forwards`;
                            child.style.opacity = '0';
                        }, index * 100);
                    });
                }
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.fade-in-up, .skills-grid, .projects-grid, .about-text').forEach(el => {
        observer.observe(el);
    });
}

// Typewriter effect for hero subtitle
function initTypeWriter() {
    const subtitle = document.querySelector('.hero-subtitle');
    if (!subtitle) return;

    const text = subtitle.textContent;
    subtitle.textContent = '';

    let i = 0;
    const typeSpeed = 100;

    function typeWriter() {
        if (i < text.length) {
            subtitle.textContent += text.charAt(i);
            i++;
            setTimeout(typeWriter, typeSpeed);
        }
    }

    // Start typewriter after a delay
    setTimeout(typeWriter, 1000);
}

// Parallax effect for hero section
function initParallaxEffect() {
    const heroImage = document.querySelector('.hero-image');
    if (!heroImage) return;

    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.3;
        heroImage.style.transform = `translateY(${rate}px)`;
    });
}

// Skill card interactions
function initSkillCardInteractions() {
    const skillCards = document.querySelectorAll('.skill-card');

    skillCards.forEach(card => {
        card.addEventListener('click', () => {
            const skillName = card.dataset.skill;
            showSkillTooltip(card, skillName);
        });

        // Add hover sound effect
        card.addEventListener('mouseenter', () => {
            playHoverSound();
        });
    });
}

function showSkillTooltip(card, skill) {
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'skill-tooltip';
    tooltip.innerHTML = `
        <div class="tooltip-content">
            <h4>${skill}</h4>
            <p>${getSkillDescription(skill)}</p>
        </div>
    `;

    // Style tooltip
    tooltip.style.cssText = `
        position: absolute;
        background: var(--text-primary);
        color: white;
        padding: 1rem;
        border-radius: 8px;
        font-size: 0.9rem;
        max-width: 250px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 1000;
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
    `;

    document.body.appendChild(tooltip);

    // Position tooltip
    const rect = card.getBoundingClientRect();
    tooltip.style.left = rect.left + 'px';
    tooltip.style.top = (rect.bottom + 10) + 'px';

    // Animate in
    requestAnimationFrame(() => {
        tooltip.style.opacity = '1';
        tooltip.style.transform = 'translateY(0)';
    });

    // Remove after delay
    setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.transform = 'translateY(-10px)';
        setTimeout(() => tooltip.remove(), 300);
    }, 3000);
}

function getSkillDescription(skill) {
    const descriptions = {
        'C#': 'Primary language for Unity game development and desktop applications.',
        'Unity': 'Game engine for creating immersive 2D and 3D experiences.',
        'HTML': 'Markup language for structuring web content.',
        'CSS': 'Styling language for creating beautiful web interfaces.',
        'Java': 'Object-oriented programming for various applications.',
        'C++': 'Low-level programming for performance-critical applications.',
        'Arduino': 'Physical computing platform for hardware projects.',
        'Blender': '3D modeling and animation software.',
        'Lua': 'Lightweight scripting language for game development.'
    };

    return descriptions[skill] || `Skilled in ${skill} development.`;
}

// Project filtering (if we add filter buttons later)
function initProjectFilters() {
    const projects = document.querySelectorAll('.project-card');

    // Add category filter functionality
    const categories = ['all', 'game', 'web', 'hardware', 'vr'];

    // This could be expanded if filter buttons are added to the HTML
    function filterProjects(category) {
        projects.forEach(project => {
            if (category === 'all' || project.dataset.category === category) {
                project.style.display = 'block';
                project.style.animation = 'fadeInUp 0.8s ease forwards';
            } else {
                project.style.display = 'none';
            }
        });
    }
}

// Contact form interactions (even though there's no form, prepare for future)
function initContactForm() {
    const emailLink = document.querySelector('.email-link');

    if (emailLink) {
        emailLink.addEventListener('click', (e) => {
            // Add a nice click effect
            emailLink.style.transform = 'scale(0.95)';
            setTimeout(() => {
                emailLink.style.transform = '';
            }, 150);

            // Show notification
            showNotification('Opening email client...', 'success');
        });
    }
}

// Easter eggs and fun interactions
function initEasterEggs() {
    // Konami code easter egg
    const konamiCode = [
        'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
        'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
        'KeyB', 'KeyA'
    ];
    let userInput = [];

    document.addEventListener('keydown', (e) => {
        userInput.push(e.code);
        userInput = userInput.slice(-10);

        if (userInput.join('') === konamiCode.join('')) {
            activatePartyMode();
        }
    });

    // Click counter for profile image
    const profileImg = document.querySelector('.profile-img');
    let clickCount = 0;

    if (profileImg) {
        profileImg.addEventListener('click', () => {
            clickCount++;
            profileImg.style.transform = `rotate(${clickCount * 45}deg)`;

            if (clickCount === 8) {
                showNotification('You found the spinning easter egg! 🎉', 'success');
                clickCount = 0;
            }
        });
    }

    // Random floating emoji on scroll
    let lastScrollY = 0;
    window.addEventListener('scroll', () => {
        if (Math.random() < 0.001) { // Very rare
            createFloatingEmoji();
        }
        lastScrollY = window.scrollY;
    });
}

function activatePartyMode() {
    document.body.style.animation = 'rainbow 2s infinite';

    // Add rainbow animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes rainbow {
            0% { filter: hue-rotate(0deg); }
            100% { filter: hue-rotate(360deg); }
        }
    `;
    document.head.appendChild(style);

    showNotification('🎉 PARTY MODE ACTIVATED! 🎉', 'success');

    // Deactivate after 10 seconds
    setTimeout(() => {
        document.body.style.animation = '';
        showNotification('Party mode deactivated', 'info');
    }, 10000);
}

function createFloatingEmoji() {
    const emojis = ['✨', '🚀', '💻', '🎮', '⚡', '🎯', '🔥', '💡'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const floatingEmoji = document.createElement('div');
    floatingEmoji.textContent = emoji;
    floatingEmoji.style.cssText = `
        position: fixed;
        font-size: 2rem;
        z-index: 1000;
        pointer-events: none;
        left: ${Math.random() * window.innerWidth}px;
        top: ${window.innerHeight}px;
        animation: floatUp 3s ease-out forwards;
    `;

    document.body.appendChild(floatingEmoji);

    // Add floating animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatUp {
            to {
                transform: translateY(-${window.innerHeight + 100}px) rotate(360deg);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    setTimeout(() => floatingEmoji.remove(), 3000);
}

// Sound effects (optional, for enhanced UX)
function playHoverSound() {
    // Create a subtle hover sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
}

function playChillSound() {
    try {
        // Array of MyInstants sound URLs
        const soundUrls = [
            'https://www.myinstants.com/media/sounds/tuco-get-out.mp3',
            'https://www.myinstants.com/media/sounds/asian-meme-huh.mp3',
            'https://www.myinstants.com/media/sounds/metal-pipe-clang.mp3',
            'https://www.myinstants.com/media/sounds/scream-meme.mp3',
            'https://www.myinstants.com/media/sounds/outro-song.mp3',
            'https://www.myinstants.com/media/sounds/prowler-sound-effect.mp3',
            'https://www.myinstants.com/media/sounds/re-zero-return-by-death.mp3',
            'https://www.myinstants.com/media/sounds/yo-phone-lining.mp3',
            'https://www.myinstants.com/media/sounds/social-credit-music.mp3',
            'https://www.myinstants.com/media/sounds/china-meme.mp3',
            'https://www.myinstants.com/media/sounds/chinese-rapping-dog.mp3'
        ];

        // Pick a random sound
        const randomIndex = Math.floor(Math.random() * soundUrls.length);
        const selectedSound = soundUrls[randomIndex];

        // Create and play the audio
        const audio = new Audio(selectedSound);
        audio.volume = 0.5; // Set volume to 50%
        audio.play().catch(error => {
            console.log('Audio playback failed:', error);
        });

    } catch (error) {
        // Silently fail if audio is not supported
        console.log('Audio not supported:', error);
    }
}