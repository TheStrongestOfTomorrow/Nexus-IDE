console.log("Welcome to Nexus IDE");

// You can interact with the DOM
setTimeout(() => {
  const app = document.getElementById("app");
  if (app) {
    app.innerHTML += "<p>JavaScript is running!</p>";
  }
}, 1000);