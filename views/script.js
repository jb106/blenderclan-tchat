const msgerForm = get(".msger-inputarea");
const msgerInput = get(".msger-input");
const msgerChat = get(".msger-chat");

const BOT_MSGS = [
"Hi, how are you?",
"Ohh... I can't understand what you trying to say. Sorry!",
"I like to play games... But I don't know how to play!",
"Sorry if my answers are not relevant. :))",
"I feel sleepy! :("];


// Icons made by Freepik from www.flaticon.com
const BOT_IMG = "https://image.flaticon.com/icons/svg/327/327779.svg";
const PERSON_IMG = "https://image.flaticon.com/icons/svg/145/145867.svg";
const BOT_NAME = "BOT";
const PERSON_NAME = "Sajad";

const welcomeSentences = ["Un $username sauvage apparaît !", "Tremblez ! $username est là !", "$username entre dans la danse !", "$username a vu la lumière"]
const goodbyeSentences = ["$username est parti...", "$username a quitté le chat", "$username a filé !", "$username a perdu la lumière"]

/*
msgerForm.addEventListener("submit", event => {
  event.preventDefault();

  const msgText = msgerInput.value;
  if (!msgText) return;

  appendMessage(PERSON_NAME, PERSON_IMG, "right", msgText);
  msgerInput.value = "";

  //botResponse();
});
*/
//<div class="msg-img" style="background-image: url(${img})"></div>
function appendMessage(name, side, text, pseudoColor, date) {
  //   Simple solution for small apps
  const msgHTML = `
    <div class="msg ${side}-msg">
      <div class="msg-bubble">
        <div class="msg-info">
          <div class="msg-info-name" style="color: ${pseudoColor}">${name}</div>
          <div class="msg-info-time">${date}</div>
        </div>

        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
}

function appendUserStatus(side, text) {
  //   Simple solution for small apps
  const msgHTML = `
    <div class="msg ${side}-msg">

      <div class="msg-bubble">
        <div class="msg-text">${text}</div>
      </div>
    </div>
  `;

  msgerChat.insertAdjacentHTML("beforeend", msgHTML);
  msgerChat.scrollTop += 500;
}

function botResponse() {
  const r = random(0, BOT_MSGS.length - 1);
  const msgText = BOT_MSGS[r];
  const delay = msgText.split(" ").length * 100;

  setTimeout(() => {
    appendMessage(BOT_NAME, BOT_IMG, "left", msgText, formatDate(new Date()));
  }, delay);
}

// Utils
function get(selector, root = document) {
  return root.querySelector(selector);
}

function formatDate(date) {
  const h = "0" + date.getHours();
  const m = "0" + date.getMinutes();

  return `${h.slice(-2)}:${m.slice(-2)}`;
}

function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

//Modal here

var modalContainer = document.body.querySelector('#modal-container')
var chatHeaderContainer = document.body.querySelector('#chatHeader')
let usersCount = chatHeaderContainer.querySelector("#usersCount")
let usersDetails = chatHeaderContainer.querySelector("#usersDetails")

function openModal() {
    modalContainer.classList.remove('out')
    document.body.classList.add('modal-active')
}

function closeModal() {
    modalContainer.classList.add('out')
    document.body.classList.remove('modal-active')
}

function updateUsersCount(users, colors)
{
  usersCount.innerHTML = users.length + (users.length == 1 ? " utilisateur connecté" : " utilisateurs connectés")
  usersDetails.innerHTML = ""

  let nameList = []
  users.map((username, index) => {
    usersDetails.innerHTML += ` <nobr style='color: ${colors[index]}'">` + username + "</nobr> |"
  })
}

//Message d'un nouvel utilisateur
function messageNewUser(newUser, _color)
{
  appendUserStatus("left", getStatusMessage(newUser, welcomeSentences, _color));
}
//Message d'un utilisateur qui est parti
function messageLeftUser(leftUser, _color)
{
  appendUserStatus("left", getStatusMessage(leftUser, goodbyeSentences, _color));
}

function getStatusMessage(username, sentences, usernameColor)
{
  let msg = sentences[Math.floor(Math.random() * sentences.length)]
  msg = msg.replace("$username", `<b style="color: ${usernameColor}">`+username+"</b>")
  return msg
}

function addMessagesHistory(history)
{
  history.map(content => {
    let alignement = "left";
    if(username == content.username)
    {
      alignement = "right";
    }

    appendMessage(content.username, alignement, content.messagecontent, content.usercolor, content.messagedate);
  })
}