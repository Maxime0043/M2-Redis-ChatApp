const insults = require("./insults.json");

module.exports.formatMessage = (message) => {
  message = message.trim();
  message = message.replaceAll("  ", " ");

  return message;
};

module.exports.filterInsults = (message) => {
  insults.list.forEach((insult) => {
    const regexVerif = new RegExp(insult, "gi");

    // If the current insult has been found
    if (regexVerif.test(message)) {
      console.log("Insult detected : ", insult);

      if (message.length == 2) {
        const regexReplace = new RegExp(`(${insult[0]})(${insult[1]})`, "gi");
        message = message.replaceAll(regexReplace, "$1*");
      } else {
        const regexReplace = new RegExp(
          `(${insult[0]})(${insult.substr(1, insult.length - 2)})(${
            insult[insult.length - 1]
          })`,
          "gi"
        );
        const replaceText = "*".repeat(insult.length - 2);
        message = message.replaceAll(regexReplace, `$1${replaceText}$3`);
      }
    }
  });

  return message;
};
