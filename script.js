document.addEventListener("DOMContentLoaded", function () {
    const menuToggle = document.getElementById("menuToggle");
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebarOverlay");
    const menuLinks = document.querySelectorAll(".menu-link");
    const sections = document.querySelectorAll(".page-section");
    function openSidebar() {
        sidebar.classList.add("open");
        overlay.classList.add("show");

        menuToggle.setAttribute("aria-expanded", "true");
        menuToggle.setAttribute("aria-label", "إغلاق القائمة");
        menuToggle.textContent = "✕";
    }
    function closeSidebar() {
        sidebar.classList.remove("open");
        overlay.classList.remove("show");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "فتح القائمة");
        menuToggle.textContent = "☰";
    }
    function toggleSidebar() {
        if (sidebar.classList.contains("open")) {
            closeSidebar();
        } else {
            openSidebar();
        }
    }
    menuToggle.addEventListener("click", toggleSidebar);
    overlay.addEventListener("click", closeSidebar);
    document.addEventListener("keydown", function(event) {
        if (event.key === "Escape") {
            closeSidebar();
        }
    });

// Login page - frontend demonstration only

const loginForm = document.getElementById("loginForm");

if (loginForm) {
  loginForm.addEventListener("submit", function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const message = document.getElementById("loginMessage");

    const selectedRole = document.querySelector(
      'input[name="role"]:checked'
    ).value;

    if (!email || !password) {
      message.textContent = "من فضلك أدخلي البريد الإلكتروني وكلمة المرور.";
      return;
    }

    message.textContent =
      "واجهة تسجيل الدخول جاهزة، لكن يلزم ربط الحسابات بقاعدة بيانات لتسجيل الدخول فعليًا.";
  });
}

const signupLink = document.getElementById("signupLink");

if (signupLink) {
  signupLink.addEventListener("click", function(event) {
    event.preventDefault();
    alert("هنجهز صفحة إنشاء الحساب في الخطوة القادمة.");
  });
}

const forgotPassword = document.getElementById("forgotPassword");

if (forgotPassword) {
  forgotPassword.addEventListener("click", function(event) {
    event.preventDefault();
    alert("هنضيف استعادة كلمة المرور عند ربط الحسابات.");
  });
}


    /* =================================
       PAGE NAVIGATION
    ================================= */

    function showPage(pageId) {

        const targetPage = document.getElementById(pageId);

        // التأكد أن القسم موجود
        if (!targetPage || !targetPage.classList.contains("page-section")) {
            return;
        }

        // إخفاء جميع الأقسام
        sections.forEach(section => {
            section.classList.remove("active");
        });

        // إظهار القسم المطلوب
        targetPage.classList.add("active");

        // تحديث الرابط النشط
        menuLinks.forEach(link => {
            link.classList.remove("active");

            if (link.getAttribute("href") === "#" + pageId) {
                link.classList.add("active");
            }
        });

        // إغلاق القائمة
        closeSidebar();

        // الرجوع إلى أعلى الصفحة
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

        // تحديث عنوان الصفحة في الرابط
        if (window.location.hash !== "#" + pageId) {
            history.replaceState(null, "", "#" + pageId);
        }
    }


    /* =================================
       MENU LINKS
    ================================= */

    menuLinks.forEach(link => {

        link.addEventListener("click", function(event) {

            const href = this.getAttribute("href");

            // تجاهل الروابط غير الداخلية
            if (!href || !href.startsWith("#")) {
                return;
            }

            const pageId = href.substring(1);

            const targetPage = document.getElementById(pageId);

            if (!targetPage || !targetPage.classList.contains("page-section")) {
                return;
            }

            event.preventDefault();

            showPage(pageId);

        });

    });


    /* =================================
       INITIAL PAGE
    ================================= */

    // إغلاق القائمة عند بداية الموقع
    closeSidebar();

    // فتح الصفحة المطلوبة من الرابط إن كانت موجودة
    const initialPage = window.location.hash.substring(1);

    const validInitialPage = document.getElementById(initialPage);

    if (
        validInitialPage &&
        validInitialPage.classList.contains("page-section")
    ) {
        showPage(initialPage);
    } else {
        showPage("home");
    }

});

