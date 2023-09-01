const ANSWER_LENGTH = 5;
const ROUNDS = 6;
const letters = document.querySelectorAll("input");
const loadingDiv = document.querySelector(".loading");
const WORD_URL = "https://words.dev-apis.com/word-of-the-day";
const VALIDATE_URL = "https://words.dev-apis.com/validate-word";

async function init() {
  // Declare variables
  let currentRow = 0;
  let currentGuess = "";
  let done = false;
  let isLoading = true;

  // Get the word of the day
  const response = await fetch(WORD_URL);
  const { word: wordRes } = await response.json();
  const word = wordRes;
  const wordParts = word.split("");
  console.log(`The word of the day is ${word}`);
  isLoading = false;
  setLoading(isLoading);

  // User hits Backspace
  // If the the length of the string is 0 then do nothing
  function backspace() {
    currentGuess = currentGuess.substring(0, currentGuess.length - 1);
    letters[currentRow * ANSWER_LENGTH + currentGuess.length].value =
      "";
  }

  function handleLetter(letter) {
    // Transform all letters to lowercase
    letter = letter.toLowerCase();
    if (currentGuess.length < ANSWER_LENGTH) {
      // Add letter on the end
      currentGuess += letter;
    } else {
      // Replace the last letter
      currentGuess =
        currentGuess.substring(0, currentGuess.length - 1) + letter;
    }
    letters[
      ANSWER_LENGTH * currentRow + currentGuess.length - 1
    ].value = letter;
  }

  // Validate the user's current guess
  async function commit() {
    // Do nothing if guess is less than 5 letters long
    if (currentGuess.length !== ANSWER_LENGTH) {
      return;
    }

    // check the API to see if it's a valid word
    // skip this step if you're not checking for valid words
    isLoading = true;
    setLoading(isLoading);
    const res = await fetch(VALIDATE_URL, {
      method: "POST",
      body: JSON.stringify({ word: currentGuess }),
    });
    const { validWord } = await res.json();
    isLoading = false;
    setLoading(isLoading);

    // not valid, mark the word as invalid and return
    if (!validWord) {
      markInvalidWord();
      return;
    }

    const guessParts = currentGuess.split("");
    const map = makeMap(wordParts);
    let allRight = true;
    // First pass just finds correct letters so we can mark those as
    // Correct first
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        // Mark as correct
        letters[currentRow * ANSWER_LENGTH + i].classList.add(
          "correct"
        );
        map[guessParts[i]]--;
      }
    }

    // Second pass finds close and wrong letters
    // We use the map to make sure we mark the correct amount of
    // close letters
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      if (guessParts[i] === wordParts[i]) {
        // do nothing
      } else if (map[guessParts[i]] && map[guessParts[i]] > 0) {
        // mark as close
        allRight = false;
        letters[currentRow * ANSWER_LENGTH + i].classList.add(
          "partially-correct"
        );
        map[guessParts[i]]--;
      } else {
        // wrong
        allRight = false;
        letters[currentRow * ANSWER_LENGTH + i].classList.add(
          "incorrect"
        );
      }
    }

    currentRow++;
    currentGuess = "";
    if (allRight) {
      // win
      alert("you win");
      done = true;
    } else if (currentRow === ROUNDS) {
      // lose
      alert(`you lose, the word was ${word}`);
      done = true;
    }
  }

  // Let the user know that their guess wasn't a real word
  function markInvalidWord() {
    for (let i = 0; i < ANSWER_LENGTH; i++) {
      letters[currentRow * ANSWER_LENGTH + i].classList.remove(
        "invalid"
      );
      // long enough for the browser to repaint without the
      // "invalid class" so we can then add it again
      setTimeout(
        () =>
          letters[currentRow * ANSWER_LENGTH + i].classList.add(
            "invalid"
          ),
        10
      );
    }
  }

  // Set up event listeners
  document.addEventListener("keydown", function (event) {
    console.log(`keydown: ${event.key}`);
    if (done || isLoading) {
      console.log(`done || isLoading`);
      // do nothing;
      return;
    }

    if (event.key === "Enter") {
      commit();
    } else if (event.key === "Backspace") {
      backspace();
    } else if (isLetter(event.key)) {
      // Prevent Shift/Alt/Ctrl modifier keys from being used
      if (!event.altKey && !event.shiftKet && !event.ctrlKey) {
        handleLetter(event.key);
      }
    } else {
      // do nothing
    }
  });
}

function isLetter(letter) {
  return /^[a-zA-Z]$/.test(letter);
}

// Show the loading widget when needed
function setLoading(isLoading) {
  loadingDiv.classList.toggle("hidden", !isLoading);
}

// Takes an array of letters (like ['E', 'L', 'I', 'T', 'E']) and
// creates an object out of it (like {E: 2, L: 1, T: 1}) so we can use
// that to make sure we get the correct amount of letters marked close
// instead of just wrong or correct
function makeMap(array) {
  const obj = {};
  for (let i = 0; i < array.length; i++) {
    if (obj[array[i]]) {
      obj[array[i]]++;
    } else {
      obj[array[i]] = 1;
    }
  }
  return obj;
}

// Initialise the code
init();
