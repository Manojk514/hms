const quotes = [
  "“Wherever the art of Medicine is loved, there is also a love of Humanity.”",
  "“In our job, you will never go home thinking you haven’t done something valuable.”",
  "“The awe of discovering the human body and helping someone heal never grows old.”",
];

const quoteText = document.getElementById("quoteText");
const dots = document.querySelectorAll(".dot");

let index = 0;

setInterval(() => {
  index = (index + 1) % quotes.length;
  quoteText.textContent = quotes[index];

  dots.forEach((d) => d.classList.remove("active"));
  dots[index].classList.add("active");
}, 4000);
