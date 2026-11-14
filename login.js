const loginform = document.getElementById("loginForm");
const studentInput =document.getElementById("number");
const rememberBox =document.getElementById("remember");
const loginMessage = document.getElementById("loginMessage");
loginForm.addEventListener("submit",function(event) {
    event.preventDefault();
    const id = studentInput.value.trim();
    if(!id) {
        loginMessage.textContent ="من فضلك ادخل كود الطالب.";
        return;
    }
    const storage = rememberBox.checked ? localStorage : sessionStorage;
storage.setItem("studentId" , id);
window.location.href ="home.html";
});
