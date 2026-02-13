export const formatLine = (type, text) => {
  let formattedText = text || "";
  let className = "outline-none resize-none bg-transparent font-courier text-[12pt] ";

  switch (type) {
    case 'Scene Heading':
      formattedText = formattedText.toUpperCase();
      className += "slug";
      break;

    case 'Action':
      className += "action";
      break;

    case 'Character':
      formattedText = formattedText.toUpperCase();
      className += "character"; 
      break;

    case 'Dialogue':
      className += "dialogue";
      break;

    case 'Parenthetical':
      className += "parenthetical";
      break;

    default:
      className += "action";
  }

  return { text: formattedText, className };
};
