
const uname = document.querySelector(".uname");
const passw = document.querySelector(".passw");
const btn = document.querySelector("#inbtn");



btn.addEventListener("click", function () {
    //alert("idjjci")
    const unameValue = uname.value;
    console.log(unameValue);
    const passwValue = passw.value;
    console.log(passwValue);

    if (unameValue !== "appclick" || passwValue !== "appclick123") {
alert("incorrect Username/Password ");
return}
});