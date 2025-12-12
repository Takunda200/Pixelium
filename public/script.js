document.addEventListener('DOMContentLoaded', function() {
    // 1. Initialize Icons
    lucide.createIcons();
    
    // 2. Set current year in footer
    const yearSpan = document.getElementById('current-year');
    if(yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // 3. Mobile Menu Toggle
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if(menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function() {
            mobileMenu.classList.toggle('hidden');
        });
    }

    // 4. Quote Button Logic (Alert for now)
    const quoteBtns = document.querySelectorAll('#nav-quote-btn, .modal-open-btn');
    quoteBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Since we split the pages, you might want to send them to contact.html
            window.location.href = 'contact.html';
        });
    });
});