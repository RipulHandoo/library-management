let navBar = document.querySelector("#navbar");
let flow = document.querySelector("#flow");

navBar.addEventListener('click',() => flow.classList.toggle("fin"));

function myFunction() {
    var x = document.querySelector("#password");
    if (x.type === "password") {
      x.type = "text";
    } else {
      x.type = "password";
    }
  }