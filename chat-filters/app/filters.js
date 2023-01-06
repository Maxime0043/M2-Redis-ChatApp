module.exports.formatMessage = (message) => {
  message = message.trim();
  message = message.replaceAll("  ", " ");

  return message;
};
