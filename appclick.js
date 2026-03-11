const loginForm = document.getElementsByClassName("loginForm")
const messageArea = document.getElementsByClassName("message")

loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

const username = document.getElementsByClassName("username").value;
const password = document.getElementsByClassName("password").value;

if (username === "appclick" && password === "appclick123") {
    messageArea.textcontent = "sign-in successful!";
    messageArea.style.color = "green";}

else {
      messageArea.textcontent = "Invalid username or password.";
      messageArea.style.color = "red";

}
})