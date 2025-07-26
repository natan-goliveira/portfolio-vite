// src/main.js

// 1. CORREÇÃO CRÍTICA: Altere de 'input.css' para 'style.css'
// Este é o seu arquivo principal de estilos em src/ que contém o Tailwind e seus estilos personalizados.
import './style.css'; 

// 2. Importa a função de inicialização da sua animação Three.js.
// Certifique-se de que 'threejs_animation.js' está em src/ e exporta a função 'initThreeJS'.
import { initThreeJS } from './threejs_animation.js'; 

// Todo o seu código principal da UI/UX deve estar dentro deste bloco DOMContentLoaded.
document.addEventListener("DOMContentLoaded", () => {
    // 3. ADICIONA A INICIALIZAÇÃO DA ANIMAÇÃO THREE.JS AQUI
    const threejsContainer = document.getElementById('threejs-background-container');
    if (threejsContainer) {
        initThreeJS(); 
    } else {
        console.error('Erro: O container para a animação Three.js (id="threejs-background-container") não foi encontrado no HTML.');
    }

    // --- SEU CÓDIGO EXISTENTE PARA O MENU E NAVEGAÇÃO ---
    const mobileMenuButton = document.getElementById("mobile-menu-button");
    const mobileMenu = document.getElementById("mobile-menu");
    const navLinks = document.querySelectorAll(
        "#mobile-menu .mobile-nav-link, #navbar .nav-link"
    ); 
    const contactButtons = document.querySelectorAll(".contact-btn"); 

    const toggleMobileMenu = () => {
        const isExpanded = mobileMenuButton.getAttribute("aria-expanded") === "true";
        mobileMenuButton.setAttribute("aria-expanded", !isExpanded);

        if (mobileMenu.classList.contains("h-0")) {
            mobileMenu.classList.remove("h-0");
            mobileMenu.classList.add("h-auto", "max-h-screen"); 
            document.getElementById("line1").classList.add("rotate-45", "translate-y-2");
            document.getElementById("line2").classList.add("opacity-0");
            document.getElementById("line3").classList.add("-rotate-45", "-translate-y-2");
        } else {
            mobileMenu.classList.add("h-0");
            mobileMenu.classList.remove("h-auto", "max-h-screen");
            document.getElementById("line1").classList.remove("rotate-45", "translate-y-2");
            document.getElementById("line2").classList.remove("opacity-0");
            document.getElementById("line3").classList.remove("-rotate-45", "-translate-y-2");
        }
    };

    mobileMenuButton.addEventListener("click", toggleMobileMenu);

    navLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            if (link.classList.contains("mobile-nav-link")) {
                if (!mobileMenu.classList.contains("h-0")) {
                    toggleMobileMenu();
                }
            }
            const targetId = link.getAttribute("href").substring(1);
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                event.preventDefault(); 
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
        });
    });

    contactButtons.forEach((button) => {
        button.addEventListener("click", (event) => {
            event.preventDefault();
            const targetId = "contact"; 
            const targetElement = document.getElementById(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: "smooth" });
            }
            if (!mobileMenu.classList.contains("h-0")) {
                toggleMobileMenu();
            }
        });
    });

    const navbar = document.getElementById("navbar");
    const initialNavbarHeight = navbar.offsetHeight; 

    window.addEventListener("scroll", () => {
        if (window.scrollY > initialNavbarHeight) {
            navbar.classList.add(
                "py-2",
                "bg-gray-900/90",
                "border-b-2",
                "border-cyan-400"
            ); 
            navbar.classList.remove(
                "py-3",
                "bg-gray-900/70",
                "border-b",
                "border-cyan-500/30"
            );
        } else {
            navbar.classList.remove(
                "py-2",
                "bg-gray-900/90",
                "border-b-2",
                "border-cyan-400"
            );
            navbar.classList.add(
                "py-3",
                "bg-gray-900/70",
                "border-b",
                "border-cyan-500/30"
            );
        }
    });
});